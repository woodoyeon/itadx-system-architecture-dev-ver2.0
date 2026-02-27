## ItaDX 프로젝트 개요 (발표용)

### 1. 프로젝트 한줄 소개

- **ItaDX**는 마트·가맹점의 **입고·정산 데이터를 기반으로 거래처 신용을 평가하고, 은행/본부가 이를 실시간 대시보드로 모니터링하는 B2B DX 플랫폼**입니다.  
- 웹 기반 관리자 화면(`admin-web`)과 4개의 백엔드 API, Python 신용평가 엔진, PostgreSQL/Redis 인프라로 구성된 **풀스택 모노레포**입니다.

---

### 2. 목표 일정 (MVP 기준)

- **1단계 — 아키텍처/프로토타입 (완료)**  
  - 통신 구조, 서비스 분리, DB 스키마 설계  
  - 입고확인·정산·신용평가 전체 플로우가 한 번 이상 end-to-end로 동작하는 상태

- **2단계 — MVP 기능 완성 (목표: 2026년 6월 말)**  
  - 은행/마트 사용자가 실제로 사용할 **대시보드·입고확인·정산·기본 리스크 화면** 완성  
  - 주요 지표:  
    - 테스트 데이터 기준 **입고→신용평가→알림** 전체 처리 시간 5초 이내  
    - 기본 계정(은행/마트/관리자)으로 주요 시나리오(로그인→입고확인→대시보드 확인) 100% 성공

- **3단계 — 고도화/운영 준비 (2026년 하반기 이후)**  
  - 멀티 테넌트(은행/본부별 분리), 모니터링/알람, 리포트/PPT 자동 생성(`generate-ppt.py`) 정비  
  - Kubernetes 배포, 오토스케일링, 실 데이터 연동 PoC

> 위 일정은 발표/계획용 기준이며, 실제 운영 일정에 맞춰 조정 가능합니다.

---

### 3. 전체 기술 스택 요약

- **프론트엔드**: Next.js 14, React 18, TypeScript, React Query, Zustand, Axios, Socket.io Client, Tailwind CSS  
- **백엔드(MSA)**: Nest.js 10 (TypeScript), TypeORM, Passport + JWT, Bull Queue, Socket.io, class-validator  
- **AI 엔진**: Python 3.11, FastAPI, Pandas/NumPy, psycopg2, Pydantic  
- **데이터/인프라**: PostgreSQL 15, Redis 7, Docker / Docker Compose, Nginx, pnpm workspace, Turborepo  
- **공통 라이브러리**: `@itadx/auth`, `@itadx/database`, `@itadx/audit`, `@itadx/websocket`, `@itadx/common`

자세한 스택은 `docs/프로그래밍언어_기술스택.md`에서 서비스별로 정리되어 있습니다.

---

### 4. 모듈 구성 & 이 문서 폴더 구조

이 `project-overview` 폴더는 **발표자료의 “1장: 프로젝트 개요”**에 해당하는 내용을 모아둔 곳입니다.

- **프로젝트 전체 구조**: `docs/아키텍처_전체구조.md`  
- **폴더 구조 상세**: `docs/프로젝트_폴더구조.md`  
- **프론트↔백 통신 상세 흐름**: `docs/프론트↔백 통신가이드.md` (※ 별도 파일, 현재 문서 그대로 유지)

발표에서 사용할 추천 순서는 다음과 같습니다.

1. `project-overview/README.md` (지금 이 문서)  
2. `docs/아키텍처_전체구조.md` — 전체 구조/다이어그램  
3. `docs/프로젝트_폴더구조.md` — 실제 코드 폴더 구조  
4. `docs/프론트↔백 통신가이드.md` — 로그인/입고확인 예시 중심 통신 흐름

---

### 5. 기능별 책임 분리 (발표용 요약)

- **apps/admin-web (관리자 웹)**  
  - 은행/마트/관리자가 사용하는 **웹 UI**  
  - 로그인, 입고확인, 정산, 대시보드, 리스크 화면  
  - React Query + Optimistic Update + WebSocket 으로 **빠르고 자연스러운 UX**

- **services/auth-api (인증)**  
  - 로그인, 토큰 발급/갱신, 로그아웃, 프로필 조회  
  - Access/Refresh Token + Redis 블랙리스트로 **보안/만료 관리**

- **services/admin-api (관리)**  
  - 마트, 지점, 가맹점, 사용자, KPI 대시보드 CRUD  
  - 은행/본부 운영자가 **조직/거래처 마스터 데이터**를 관리하는 영역

- **services/erp-api (입고·정산 핵심)**  
  - 입고 목록/상세/등록, **입고확인 트랜잭션**, 정산 처리  
  - 입고확인 시 Bull Queue로 신용평가 요청 → WebSocket 실시간 알림

- **services/gateway-api (API 게이트웨이)**  
  - `/api/*` 요청을 각 서비스로 라우팅  
  - Redis 기반 Rate Limit 으로 API 남용 방지

- **engine/engine-api (신용평가 엔진)**  
  - 입고/정산 데이터를 분석해 거래처 **신용점수·등급·리스크 지표** 산출  
  - 향후 추가 신용모형(v41, 듀얼트랙 등)을 확장하는 중심 모듈

- **libs/**, **infra/**, **scripts/** 에 대한 상세 설명은 각각 `docs/libs/README.md`, `docs/infra/README.md`, `docs/scripts/README.md`에 정리합니다.

---

### 6. 발표 시 강조 포인트

- **DX 포인트**  
  - 종이/엑셀로 관리되던 입고·정산·신용평가 업무를 **웹 기반·실시간 시스템**으로 전환  
  - 입고확인 한 번으로 **DB 트랜잭션 → 신용점수 재계산 → 대시보드 실시간 반영**까지 자동화

- **아키텍처 포인트**  
  - 프론트/백/AI/인프라가 명확히 분리된 **MSA + 모노레포** 구조  
  - `프론트 ↔ 게이트웨이 ↔ 개별 서비스 ↔ AI 엔진`의 역할이 문서와 코드에서 1:1로 대응

- **일정/로드맵 포인트**  
  - 1단계(아키텍처·프로토타입)는 이미 코드/문서로 구현 완료  
  - 2단계(2026년 6월 말까지 MVP)에는 **은행/마트가 실제로 클릭해서 볼 수 있는 화면** 기준으로 범위를 정의

