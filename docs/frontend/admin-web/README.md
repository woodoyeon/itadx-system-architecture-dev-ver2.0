## admin-web (프론트엔드) — 화면·기술 개요

### 1. 이 폴더의 목적

- `apps/admin-web`의 내용을 **발표·문서용으로 요약**한 README입니다.  
- 실제 코드 설명은 `apps/admin-web/GUIDE.md`를, 발표용 핵요약은 이 문서를 사용하면 됩니다.

---

### 2. 서비스 역할

- Next.js 기반 **관리자 웹 애플리케이션**  
- 은행 / 마트 / 관리자 세 역할이 **하나의 웹에서 다른 메뉴**만 보는 구조  
- 백엔드와의 통신은 세 가지 패턴으로 정리됩니다.
  - **REST API (Axios)**: `/api/*` → Gateway → 각 서비스
  - **WebSocket (Socket.io)**: 입고확인·신용평가 결과를 은행 대시보드에 실시간 푸시
  - **Optimistic Update (React Query)**: 서버 응답 전 UI 먼저 반영 → 체감 속도 향상

---

### 3. 주요 화면 (라우트 기준)

- **공통**
  - `/login` : 이메일·비밀번호 로그인, JWT 발급 후 역할별 대시보드로 이동

- **은행(Bank)**
  - `/bank/dashboard` : KPI 카드, 입고/정산 현황, 신용점수 요약
  - `/bank/marts` : 마트 목록·검색, 상세 정보
  - `/bank/merchants` : 가맹점 목록, 점수/리스크 확인
  - `/bank/risk` : 리스크 이벤트/경고(확장 포인트)

- **마트(Mart)**
  - `/mart/receiving` : ★ 핵심 — 입고 목록 + 입고확인 버튼 + 실시간 상태 갱신
  - `/mart/branches` : 지점 관리
  - `/mart/settlements` : 정산 내역 확인

- **관리자(Admin)**
  - `/admin/users` : 사용자/권한 관리
  - `/admin/audit` : 감사 로그 조회

발표 데모 순서 예시:
1) `login` → 2) `mart/receiving`에서 입고확인 → 3) `bank/dashboard`에서 실시간 반영 확인

---

### 4. admin-web 기술 스택

- **프레임워크**: Next.js 14(App Router), React 18, TypeScript  
- **상태 관리**
  - Zustand (`src/stores/auth-store.ts`) — 로그인·사용자 상태
  - React Query (`src/hooks/use-*.ts`) — 서버 상태·캐싱·Optimistic Update
- **통신**
  - Axios (`src/lib/api.ts`) — `/api` 기반 REST API, JWT 인터셉터
  - Socket.io Client (`src/lib/socket.ts`) — WebSocket 연결
- **UI/스타일**
  - Tailwind CSS, 공통 UI 컴포넌트(`src/components/ui/*`)
  - 레이아웃 컴포넌트(`layout/header.tsx`, `layout/sidebar.tsx`, `layout/dashboard-layout.tsx`)

---

### 5. 디렉터리 구조 요약

- `src/app` : 페이지/라우팅 (로그인, 대시보드, 입고확인 등)
- `src/lib` : `api.ts`, `socket.ts`, 포맷/유틸 함수
- `src/hooks` : `use-receivings`, `use-dashboard`, `use-marts`, `use-socket` 등 React Query 훅
- `src/stores` : `auth-store` (JWT·사용자 정보 저장)
- `src/components` : UI·레이아웃 컴포넌트
- `src/types` : API 응답/공통 타입

자세한 함수/파일별 설명은 `apps/admin-web/GUIDE.md`를 참고하세요.

