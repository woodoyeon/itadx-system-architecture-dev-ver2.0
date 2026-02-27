# ItaDX 설치 가이드

GitHub 또는 GitLab에서 저장소를 받은 후 **개발 모드**와 **Docker 배포 모드**로 설치·실행하는 방법을 안내합니다.

---

## 목차

1. [저장소 다운로드 (Git Clone)](#1-저장소-다운로드-git-clone)
2. [사전 요구사항](#2-사전-요구사항)
3. [개발 모드 — 수동 설치 (스크립트 없이)](#3-개발-모드--수동-설치-스크립트-없이)
4. [개발 모드 — 자동 설치 (스크립트 사용)](#4-개발-모드--자동-설치-스크립트-사용)
5. [배포 모드 — 전부 Docker로 실행](#5-배포-모드--전부-docker로-실행)
6. [환경변수 설정](#6-환경변수-설정)
7. [문제 해결 (트러블슈팅)](#7-문제-해결-트러블슈팅)

---

## 1. 저장소 다운로드 (Git Clone)

### GitHub에서 받기

```bash
# HTTPS
git clone https://github.com/woodoyeon/itadx-system-architecture-dev-ver2.0.git

# SSH (키 설정된 경우)
git clone git@github.com:woodoyeon/itadx-system-architecture-dev-ver2.0.git
```

### GitLab에서 받기

GitLab 저장소 URL이 있다면 동일한 방식으로 클론합니다.

```bash
# HTTPS 예시
git clone https://gitlab.com/your-group/itadx-system-architecture-dev-ver2.0.git

# SSH 예시
git clone git@gitlab.com:your-group/itadx-system-architecture-dev-ver2.0.git
```

### 받은 후 폴더로 이동

```powershell
# Windows PowerShell
cd itadx-system-architecture-dev-ver2.0
```

```bash
# macOS / Linux
cd itadx-system-architecture-dev-ver2.0
```

---

## 2. 사전 요구사항

| 구분 | 개발 모드 | Docker 배포 모드 |
|------|-----------|-------------------|
| **Git** | 필요 | 필요 (이미 클론했다면 사용 완료) |
| **Node.js** | LTS 18+ 권장 ([nodejs.org](https://nodejs.org)) | 없어도 됨 (이미지 내 포함) |
| **pnpm** | 필요 (스크립트에서 자동 설치 시도) | 없어도 됨 |
| **Docker** | Docker Desktop (Postgres·Redis용) | Docker + Docker Compose 필수 |
| **Python** | 3.10+ 선택 (엔진 API 사용 시) | 없어도 됨 (이미지 내 포함) |

- **개발 모드**: Docker는 **Postgres + Redis만** 사용하고, 프론트/API/엔진은 로컬에서 실행합니다.
- **Docker 배포 모드**: 모든 서비스가 Docker 컨테이너로 실행됩니다.

---

## 3. 개발 모드 — 수동 설치 (스크립트 없이)

스크립트 없이 **직접** Node·pnpm 설치 → **DB·Redis만 Docker** → `pnpm install` → `pnpm dev` 순서로 진행하는 방법입니다.

### 3-1. Node.js 설치

- [nodejs.org](https://nodejs.org) 에서 **LTS(18 이상)** 다운로드 후 설치.
- 설치 확인:
  ```bash
  node -v   # v18.x.x 이상
  npm -v
  ```

### 3-2. pnpm 설치

```bash
npm install -g pnpm
```

또는 Node 16.13+ 이면:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

확인: `pnpm -v`

### 3-3. Docker로 Postgres + Redis만 띄우기

프로젝트 **루트**에서 실행합니다.

```bash
docker compose -f docker-compose.dev.yaml up -d
```

- Postgres: 호스트에서는 **5433** (컨테이너 내부 5432)
- Redis: 호스트에서는 **6380** (컨테이너 내부 6379)  
  → 포트가 5432/6379면 `docker-compose.yaml` 사용해도 됩니다. (`docker-compose.dev.yaml`은 충돌 방지용 5433/6380)

### 3-4. DB 스키마·시드 적용 (최초 1회)

**Windows PowerShell:**

```powershell
Get-Content scripts\init-db.sql -Encoding UTF8 -Raw | docker exec -i itadx-postgres psql -U itadx -d itadx_mvp
Get-Content scripts\seed.sql -Encoding UTF8 -Raw | docker exec -i itadx-postgres psql -U itadx -d itadx_mvp
```

**macOS / Linux:**

```bash
docker exec -i itadx-postgres psql -U itadx -d itadx_mvp < scripts/init-db.sql
docker exec -i itadx-postgres psql -U itadx -d itadx_mvp < scripts/seed.sql
```

### 3-5. 환경변수 파일 만들기

```bash
# Windows
copy envs\.env.example envs\.env.dev

# macOS / Linux
cp envs/.env.example envs/.env.dev
```

`envs/.env.dev`에서 수정:

- `DB_PORT=5433`, `REDIS_PORT=6380` (docker-compose.dev.yaml 사용 시)
- 또는 `DB_PORT=5432`, `REDIS_PORT=6379` (기본 포트 사용 시)
- `JWT_SECRET` 은 32자 이상으로 설정

### 3-6. 의존성 설치 및 라이브러리 빌드

프로젝트 루트에서:

```bash
pnpm install
pnpm run build:libs
```

`build:libs`는 **최초 1회 필수**입니다. (admin-api, erp-api 등이 `@itadx/database` 를 쓰기 때문)

### 3-7. 개발 서버 실행 (pnpm dev)

```bash
pnpm dev
```

- 프론트: http://localhost:3000  
- API는 Turbo가 auth-api, admin-api, erp-api, gateway-api 를 같이 띄웁니다.

**Python 엔진(신용평가)** 쓰려면 터미널 하나 더 열어서:

```bash
cd engine/engine-api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

또는 루트에서 `pnpm dev:all` 하면 Turbo + 엔진을 한 번에 띄울 수 있습니다 (Python PATH 필요).

### 3-8. 접속

| 항목 | 주소/정보 |
|------|-----------|
| 프론트 | http://localhost:3000 |
| 로그인 (테스트) | **test@test.com** / **1234** |
| 로그인 (시드) | admin@itadx.com 또는 bank@itadx.com / password123 |

---

## 4. 개발 모드 — 자동 설치 (스크립트 사용)

스크립트 한 번에 셋업하고 싶을 때 사용합니다.

### 4-1. Windows (PowerShell)

프로젝트 **루트**에서:

```powershell
.\scripts\setup.ps1
```

- Node / pnpm 확인 후 없으면 pnpm 설치 시도
- Docker로 Postgres + Redis만 기동
- DB 스키마·시드 적용, `pnpm install`, `pnpm run build:libs`
- Python 있으면 엔진 의존성 설치

환경변수: `copy envs\.env.example envs\.env.dev` 후 `envs\.env.dev` 에서 `DB_PORT`, `REDIS_PORT` 등 수정.

실행:

```powershell
.\scripts\dev.ps1
```

- Python 엔진은 별도 창에서 자동 실행됨.

### 4-2. macOS / Linux

```bash
chmod +x scripts/*.sh
docker compose -f docker-compose.dev.yaml up -d
docker exec -i itadx-postgres psql -U itadx -d itadx_mvp < scripts/init-db.sql
docker exec -i itadx-postgres psql -U itadx -d itadx_mvp < scripts/seed.sql
pnpm install
pnpm run build:libs
# env: cp envs/.env.example envs/.env.dev 후 수정
pnpm dev    # 또는 pnpm dev:all (엔진 포함)
```

---

## 5. 배포 모드 — 전부 Docker로 실행

**전부 Docker**로 띄우는 방식입니다. Node·pnpm·Python 없이 **Docker만** 있으면 됩니다. (Nginx, admin-web, gateway-api, auth-api, admin-api, erp-api, engine-api, Postgres, Redis 전부 컨테이너)

### 5-1. 사전 준비

- Docker 및 Docker Compose 설치
- 프로젝트 루트에 `envs/.env.dev` 또는 `envs/.env.prod` 등 환경별 env 파일 준비 (없으면 `envs/.env.example` 복사 후 수정)

### 5-2. 환경변수 파일

```powershell
# Windows
copy envs\.env.example envs\.env.dev

# macOS / Linux
cp envs/.env.example envs/.env.dev
```

`envs/.env.dev`에서 최소한 다음을 확인·수정합니다.

- `DB_PASS`: DB 비밀번호 (기본값 itadx_dev 등)
- `JWT_SECRET`: 32자 이상 시크릿
- Docker 배포 시에는 서비스 간 통신이므로 `DB_HOST=postgres`, `REDIS_HOST=redis` 등으로 두는 경우가 많습니다. (이미지/스크립트에서 호스트명 사용 시)

실제 프로젝트에서 Docker 배포 시 사용하는 env 파일명(`.env.dev`, `.env.prod` 등)은 `docker-compose.yaml`의 `env_file` 설정을 따릅니다.

### 5-3. 이미지 빌드 및 컨테이너 실행

프로젝트 **루트**에서:

```bash
# 이미지 빌드 + 전체 서비스 기동 (백그라운드)
docker compose up -d

# 또는 빌드만 먼저
docker compose build
docker compose up -d
```

기본적으로 다음이 기동합니다.

- **postgres** (5432)
- **redis** (6379)
- **auth-api** (4001)
- **admin-api** (4000)
- **erp-api** (4002)
- **gateway-api** (4003)
- **engine-api** (8000)
- **admin-web** (3000)
- **nginx** (80)

### 5-4. DB 초기화 (최초 1회)

컨테이너가 모두 올라온 뒤, DB 스키마와 시드를 넣습니다.

```powershell
# Windows PowerShell
Get-Content scripts\init-db.sql -Encoding UTF8 -Raw | docker exec -i itadx-postgres psql -U itadx -d itadx_mvp
Get-Content scripts\seed.sql -Encoding UTF8 -Raw | docker exec -i itadx-postgres psql -U itadx -d itadx_mvp
```

```bash
# macOS / Linux
docker exec -i itadx-postgres psql -U itadx -d itadx_mvp < scripts/init-db.sql
docker exec -i itadx-postgres psql -U itadx -d itadx_mvp < scripts/seed.sql
```

### 5-5. 접속

| 항목 | 주소 |
|------|------|
| 웹 앱 (Nginx 경유) | http://localhost |
| 직접 프론트 | http://localhost:3000 |
| 로그인 | admin@itadx.com / password123 등 (시드 데이터 기준) |

### 5-6. 로그 확인 및 중지

```bash
# 로그 보기
docker compose logs -f erp-api   # 특정 서비스
docker compose logs -f          # 전체

# 중지
docker compose down
```

---

## 6. 환경변수 설정

- **예시 파일**: `envs/.env.example`
- **개발**: `envs/.env.dev` (또는 스크립트/도커에서 참조하는 파일명)
- **운영**: `envs/.env.prod` 등 별도 파일 사용 권장

주요 변수:

| 변수 | 설명 | 예시 |
|------|------|------|
| NODE_ENV | development / production | development |
| DB_HOST | DB 호스트 | localhost 또는 postgres |
| DB_PORT | DB 포트 | 5432 또는 5433 |
| DB_USER | DB 사용자 | itadx |
| DB_PASS | DB 비밀번호 | (비밀번호 설정) |
| REDIS_HOST | Redis 호스트 | localhost 또는 redis |
| REDIS_PORT | Redis 포트 | 6379 또는 6380 |
| JWT_SECRET | JWT 서명용 시크릿 (32자 이상) | (안전한 랜덤 문자열) |
| ENGINE_API_URL | 엔진 API URL | http://localhost:8000 |

---

## 7. 문제 해결 (트러블슈팅)

### 로그인/연결 실패 (ERR_CONNECTION_REFUSED, 404)

1. **개발 모드**
   - `pnpm run build:libs` 실행 후 `pnpm dev` 다시 실행
   - Postgres/Redis: `docker compose -f docker-compose.dev.yaml up -d` 로 확인

2. **Docker 배포 모드**
   - `docker compose ps`로 모든 컨테이너가 Up 인지 확인
   - `docker compose logs gateway-api auth-api` 로 에러 로그 확인

### 테스트 계정 추가 (test@test.com / 1234)

```powershell
# Windows
Get-Content scripts\seed-test-user.sql -Encoding UTF8 -Raw | docker exec -i itadx-postgres psql -U itadx -d itadx_mvp
```

```bash
# macOS / Linux
docker exec -i itadx-postgres psql -U itadx -d itadx_mvp < scripts/seed-test-user.sql
```

### 500 오류

- auth-api, gateway-api 터미널/로그에서 에러 메시지 확인
- `envs/.env.dev` 의 DB_HOST, DB_PORT, REDIS_HOST, REDIS_PORT, JWT_SECRET 확인
- Docker 사용 시: `DB_HOST=postgres`, `REDIS_HOST=redis` 등 서비스 이름 사용 여부 확인

### 포트 충돌 (이미 사용 중)

- **개발용 Docker** (`docker-compose.dev.yaml`): 기본이 호스트 5433/6380 이므로, 로컬 env 에 `DB_PORT=5433`, `REDIS_PORT=6380` 설정
- 다른 포트를 쓰려면 `docker-compose.dev.yaml`의 `ports`와 env 의 포트를 맞춰서 변경

### pnpm을 찾을 수 없음

```bash
npm install -g pnpm
# 또는 (Node 16.13+)
corepack enable
corepack prepare pnpm@latest --activate
```

### Python 엔진이 없을 때

- 개발 모드: 입고확인·REST API는 동작하고, **v10 신용평가** 호출만 실패합니다.
- 엔진 사용하려면: `engine/engine-api`에서 `pip install -r requirements.txt` 후 `uvicorn main:app --reload --port 8000` 실행

---

이 가이드는 **GitHub**([woodoyeon/itadx-system-architecture-dev-ver2.0](https://github.com/woodoyeon/itadx-system-architecture-dev-ver2.0)) 또는 **GitLab**에서 클론한 저장소 기준으로 작성되었습니다. 저장소 URL만 해당 환경에 맞게 바꿔서 사용하면 됩니다.
