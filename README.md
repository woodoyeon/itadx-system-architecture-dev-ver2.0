# ItaDX 아키텍처


---

## 전체 통신 구조도

```
[브라우저]
    │
    ▼
[Nginx :80]  ─── 리버스 프록시 (모든 요청의 진입점)
    │
    ├─ /           → [admin-web :3000]     Next.js 프론트엔드
    ├─ /api/*      → [gateway-api :4003]   API Gateway (Rate Limit)
    │                    │
    │                    ├─ /api/auth/*        → [auth-api :4001]     JWT 인증
    │                    ├─ /api/marts/*       → [admin-api :4000]    마트/지점/가맹점 CRUD
    │                    ├─ /api/receivings/*  → [erp-api :4002]      ★ 입고확인/정산
    │                    └─ /api/v10/*         → [engine-api :8000]   Python 신용평가
    │
    └─ /socket.io  → [erp-api :4002]       WebSocket 실시간 알림
                         │
                         ├─ [PostgreSQL :5432]  메인 데이터베이스
                         └─ [Redis :6379]       JWT 블랙리스트 + Bull Queue + Rate Limit
```

---

## 3가지 핵심 통신 패턴

### 패턴 ① 프론트엔드 → 백엔드 (REST API + JWT)

```
[브라우저] → axios + JWT 토큰 → [Nginx] → [gateway-api] → [erp-api]
```

| 순서 | 파일 | 역할 |
|------|------|------|
| 1 | `apps/admin-web/src/lib/api.ts` | axios 인스턴스, 모든 요청에 JWT 자동 첨부 |
| 2 | `apps/admin-web/src/hooks/use-receivings.ts` | React Query로 입고 조회/확인, Optimistic Update |
| 3 | `services/gateway-api/src/proxy/proxy.middleware.ts` | URL → 백엔드 서비스 라우팅 |
| 4 | `services/erp-api/src/receiving/receiving.controller.ts` | @Roles 권한체크 후 Service 호출 |
| 5 | `services/erp-api/src/receiving/receiving.service.ts` | ★ 8단계 입고확인 트랜잭션 |

### 패턴 ② 백엔드 → 프론트엔드 (WebSocket 실시간)

```
[erp-api] → socket.io 이벤트 발행 → [브라우저] → React Query 캐시 무효화 → UI 자동 갱신
```

| 순서 | 파일 | 역할 |
|------|------|------|
| 1 | `libs/websocket/src/gateways/notification.gateway.ts` | role별 room에 이벤트 push |
| 2 | `apps/admin-web/src/lib/socket.ts` | WebSocket 연결 + JWT 인증 |
| 3 | `apps/admin-web/src/hooks/use-socket.ts` | 이벤트 수신 → React Query 캐시 무효화 |

### 패턴 ③ 백엔드 → AI 엔진 (Bull Queue 비동기)

```
[erp-api] → Redis Queue에 job 등록 → [Worker가 꺼냄] → HTTP → [engine-api Python]
```

| 순서 | 파일 | 역할 |
|------|------|------|
| 1 | `services/erp-api/src/receiving/receiving.service.ts` | creditQueue.add() 호출 |
| 2 | `services/erp-api/src/queue/credit-score.processor.ts` | Redis에서 job 꺼내서 Python HTTP 호출 |
| 3 | `engine/engine-api/routers/v10_router.py` | FastAPI 엔드포인트 |
| 4 | `engine/engine-api/services/v10_service.py` | Pandas로 신용점수 계산 |

---

## 폴더 구조

```
itadx-final/
├── apps/admin-web/          프론트엔드 (Next.js + React Query + Zustand)
├── services/auth-api/       인증 서비스 (JWT 발급/검증/블랙리스트)
├── services/admin-api/      관리 서비스 (마트/지점/가맹점 CRUD)
├── services/erp-api/        ★ 핵심 서비스 (입고확인/정산 + Queue + WebSocket)
├── services/gateway-api/    API 게이트웨이 (라우팅 + Rate Limit)
├── engine/engine-api/       AI 엔진 (Python 신용평가/심사)
├── libs/                    공통 라이브러리 (Guard, Entity, Audit 등)
├── infra/                   Docker + Nginx 설정
├── scripts/                 DB 스키마 + 시드 데이터
└── envs/                    환경변수
```

**★ 각 폴더에 GUIDE.md 파일이 있습니다** — 파일별 역할과 코드 설명이 상세히 기록되어 있습니다.

---

## 개발 모드 빠른 시작 (pnpm 설치부터 작동까지)

**Docker는 Postgres + Redis만 사용**하고, 나머지(프론트/API/엔진)는 로컬에서 실행합니다.

### 필요 사항

- **Node.js** LTS (18+ 권장) — [nodejs.org](https://nodejs.org)
- **Docker Desktop** — Postgres·Redis만 띄우기 위해
- **Python 3.10+** (선택) — 엔진 API용, 없으면 입고확인·REST는 동작하고 v10 호출만 실패

### 1) 1회 셋업 (pnpm·Docker·DB·의존성)

PowerShell에서 프로젝트 루트로 이동 후:

```powershell
.\scripts\setup.ps1
```

- Node 확인 → **pnpm** 없으면 corepack 또는 `npm install -g pnpm`으로 설치
- **Docker**로 Postgres(:5432) + Redis(:6379)만 기동 (`docker-compose.dev.yaml`)
- DB 스키마·시드 적용
- `pnpm install` 실행
- Python 있으면 엔진 패키지 설치

### 2) 개발 서버 실행

```powershell
.\scripts\dev.ps1
```

- Postgres/Redis 안 떠 있으면 Docker만 띄울지 물어봄
- **Python 엔진**은 별도 PowerShell 창에서 자동 실행
- **Turbo**로 프론트(:3000) + Gateway(:4003) + Auth/Admin/ERP API 동시 실행

### 3) 접속

| 항목 | 주소 |
|------|------|
| 프론트 | http://localhost:3000 |
| 로그인 (간단) | **`test@test.com`** / **`1234`** |
| 로그인 (기본) | `admin@itadx.com` 또는 `bank@itadx.com` / `password123` |

※ `test@test.com` 계정이 없으면 아래 **로그인 안 될 때** 중 "테스트 계정만 추가" 실행.

### 수동 실행 (스크립트 없이)

```powershell
# Docker만 (개발용 최소)
docker compose -f docker-compose.dev.yaml up -d

# DB 초기화 (최초 1회)
Get-Content scripts\init-db.sql | docker exec -i itadx-postgres psql -U itadx -d itadx_mvp
Get-Content scripts\seed.sql | docker exec -i itadx-postgres psql -U itadx -d itadx_mvp

pnpm install
pnpm run build:libs   # 최초 1회 — @itadx/database 빌드 (admin-api/erp-api 로딩에 필요)
pnpm dev          # 프론트 + API (엔진은 별도 터미널에서 uvicorn)
# 또는
pnpm dev:all      # Turbo + Python 엔진 한 번에 (Python이 PATH에 있을 때)
```

### 로그인이 안 될 때

1. **서버 연결 실패** (ERR_CONNECTION_REFUSED / 404)
   - `pnpm run build:libs` 실행 후 `pnpm dev` 다시 실행 (gateway·auth-api가 떠야 함).
   - Docker Postgres/Redis: `docker compose -f docker-compose.dev.yaml up -d`
2. **테스트 계정만 추가** (test@test.com / 1234)
   ```powershell
   Get-Content scripts\seed-test-user.sql | docker exec -i itadx-postgres psql -U itadx -d itadx_mvp
   ```
3. **500 오류** — 터미널에서 auth-api·gateway 로그 확인. DB 연결·환경변수(`envs/.env.dev`) 확인.

---

## 개발자 작업 방법

1. **이 README 읽기** → 전체 통신 구조 이해
2. **담당 폴더의 GUIDE.md 읽기** → 파일별 역할 + 코드 설명
3. **예시 코드 분석** → 실제 작동하는 핵심 코드 파악
4. **동일 패턴으로 확장** → GPT에 "이 패턴으로 OO도 만들어줘" 요청 가능
