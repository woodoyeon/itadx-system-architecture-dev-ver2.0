# apps/admin-web — 프론트엔드 상세 가이드

## 이 서비스의 역할

Next.js 기반 관리자 웹 애플리케이션입니다.
백엔드와 **3가지 방법**으로 통신합니다:
1. **REST API** (axios) — 데이터 조회/수정
2. **WebSocket** (socket.io) — 실시간 알림 수신
3. **Optimistic Update** — 서버 응답 전 UI 즉시 반영

---

## 파일별 역할 상세

### 📁 src/lib/ — 통신 기반 코드

#### `src/lib/api.ts` ★ REST API 통신의 핵심

**역할:** 백엔드와 HTTP 통신하는 axios 인스턴스

**코드가 하는 일:**
1. `axios.create({ baseURL: '/api' })` — 모든 요청 URL 앞에 `/api` 자동 첨부
2. `interceptors.request` — 모든 요청 헤더에 `Authorization: Bearer {JWT토큰}` 자동 첨부
3. `interceptors.response` — 401 에러 시 refresh 토큰으로 자동 갱신 시도, 실패하면 로그아웃

**통신 흐름:**
```
api.get('/receivings')
  → axios가 JWT 헤더 자동 첨부
  → GET http://localhost/api/receivings (Nginx로 전달)
  → Nginx가 /api/* → gateway-api:4003으로 프록시
  → gateway-api가 /api/receivings → erp-api:4002로 라우팅
  → erp-api가 DB 조회 후 JSON 응답 반환
```

**다른 파일에서 사용하는 방법:**
```typescript
import api from '@/lib/api';
const { data } = await api.get('/receivings');      // 입고 목록
const { data } = await api.patch('/receivings/1/confirm');  // 입고 확인
```

---

#### `src/lib/socket.ts` ★ WebSocket 통신의 핵심

**역할:** 백엔드 WebSocket 서버에 연결하는 소켓 인스턴스

**코드가 하는 일:**
1. `io(window.location.origin, { auth: { token } })` — JWT 토큰으로 인증된 WebSocket 연결
2. `transports: ['websocket']` — 폴링 없이 WebSocket만 사용 (성능 최적)
3. 싱글턴 패턴 — 앱 전체에서 하나의 소켓 연결만 유지

**통신 흐름:**
```
getSocket()
  → socket.io가 ws://localhost/socket.io 연결
  → Nginx가 WebSocket 업그레이드 → erp-api:4002
  → erp-api의 NotificationGateway가 JWT 검증 후 role별 room 배정
  → 이후 이벤트 수신 대기
```

---

#### `src/lib/utils.ts` — 유틸리티 함수

**역할:** Tailwind CSS 클래스 병합 (`cn` 함수)

---

#### `src/lib/format.ts` — 포맷팅 유틸리티

**역할:** 금액, 날짜, 퍼센트 등 표시 형식 변환

---

### 📁 src/hooks/ — React Query 커스텀 훅 (API 호출 계층)

#### `src/hooks/use-receivings.ts` ★★★ 가장 중요한 훅

**역할:** 입고 목록 조회 + 입고확인 API 호출 + Optimistic Update

**코드가 하는 일:**

`useReceivings(filters)`:
1. `useQuery` — 컴포넌트 마운트 시 자동으로 `GET /api/receivings` 호출
2. `queryKey: ['receivings', filters]` — 필터가 바뀌면 자동 재조회
3. 반환값 `{ data, isLoading, error }` — 로딩/에러 상태 자동 관리

`useConfirmReceiving()`:
1. `useMutation` — `PATCH /api/receivings/:id/confirm` 호출
2. `onMutate` ★ Optimistic Update:
   - 서버 응답을 기다리지 않고 **UI를 먼저 'confirmed'로 변경**
   - 사용자는 버튼 클릭 즉시 결과를 봄 (체감 속도 향상)
3. `onError` — 서버 에러 시 원래 상태로 롤백
4. `onSettled` — 성공이든 실패든 캐시 무효화 → 서버 최신 데이터로 교체

**이 패턴으로 확장할 것:**
- `use-settlements.ts` — 정산 목록 조회/완료 처리 (동일 구조)
- `use-merchants.ts` — 가맹점 목록/상세/수정 (동일 구조)

---

#### `src/hooks/use-socket.ts` ★ WebSocket 수신 훅

**역할:** WebSocket 이벤트를 수신하여 React Query 캐시를 자동 무효화

**코드가 하는 일:**
1. `socket.on('receiving:confirmed', ...)` — 다른 사용자가 입고확인하면 수신
2. `queryClient.invalidateQueries(['receivings'])` — 입고 목록 캐시 무효화 → 자동 재조회
3. `queryClient.invalidateQueries(['dashboard'])` — 대시보드 KPI도 갱신

**왜 이렇게 하는가:**
- 마트 사용자가 입고확인 → erp-api가 WebSocket 이벤트 발행
- 은행 사용자 브라우저가 이벤트 수신 → 새로고침 없이 화면 자동 갱신

---

#### `src/hooks/use-dashboard.ts` — 대시보드 KPI 훅

**역할:** `GET /api/dashboard/kpi` 호출하여 대시보드 수치 조회
**패턴:** useReceivings와 동일한 useQuery 구조

---

#### `src/hooks/use-marts.ts` — 마트 목록 훅

**역할:** `GET /api/marts` 호출하여 마트 목록 조회
**패턴:** useReceivings와 동일한 useQuery 구조

---

### 📁 src/stores/ — 상태 관리 (Zustand)

#### `src/stores/auth-store.ts` ★ 로그인 상태 관리

**역할:** JWT 토큰, 사용자 정보를 전역 상태로 관리

**코드가 하는 일:**
1. `accessToken / refreshToken` — JWT 토큰 저장
2. `user` — 이메일, 역할(bank/mart/admin) 등 사용자 정보
3. `login(email, password)` — `POST /api/auth/login` 호출 → 토큰 저장
4. `logout()` — 토큰 삭제 + 로그인 화면으로 이동
5. `persist` — 브라우저 localStorage에 저장 (새로고침해도 유지)

**api.ts와의 관계:**
```
auth-store에 토큰 저장 → api.ts의 interceptor가 매 요청마다 꺼내서 헤더에 첨부
```

---

### 📁 src/app/ — Next.js 페이지 (라우팅)

#### `src/app/login/page.tsx` ★ 로그인 화면

**역할:** 이메일/비밀번호 입력 → auth-store.login() 호출 → 대시보드로 이동

**통신 흐름:**
```
로그인 버튼 클릭
  → auth-store.login(email, password)
  → api.post('/auth/login', { email, password })
  → gateway-api → auth-api:4001
  → auth-api가 bcrypt로 비밀번호 검증 → JWT 발급
  → auth-store에 토큰 저장
  → role에 따라 /bank/dashboard 또는 /mart/receiving으로 이동
```

---

#### `src/app/mart/receiving/page.tsx` ★★★ 입고확인 화면 (핵심)

**역할:** 입고 목록 표시 + 확인 버튼 → 입고확인 API 호출

**코드가 하는 일:**
1. `useReceivings(filters)` — 입고 목록 자동 조회
2. `useConfirmReceiving()` — 확인 버튼 클릭 시 API 호출
3. `useSocket()` — 실시간 이벤트 수신으로 UI 자동 갱신
4. 필터링 — status, martId로 목록 필터
5. 페이지네이션 — page, limit으로 페이지 이동

**이 페이지가 보여주는 통신 패턴:**
- REST API (목록 조회, 확인 요청)
- Optimistic Update (즉시 UI 반영)
- WebSocket (다른 사용자의 확인 실시간 수신)

---

#### `src/app/bank/dashboard/page.tsx` — 은행 대시보드

**역할:** KPI 카드 + 차트 표시 (입고 건수, 총 금액, 확인율 등)

#### `src/app/bank/marts/page.tsx` — 마트 목록 화면

#### `src/app/bank/merchants/page.tsx` — 가맹점 목록 화면

#### `src/app/bank/risk/page.tsx` — 리스크 모니터링 화면

#### `src/app/mart/branches/page.tsx` — 지점 관리 화면

#### `src/app/mart/settlements/page.tsx` — 정산 목록 화면

#### `src/app/admin/users/page.tsx` — 사용자 관리 화면

#### `src/app/admin/audit/page.tsx` — 감사 로그 화면

---

### 📁 src/components/ — UI 컴포넌트

#### `src/components/ui/button.tsx` — 버튼 컴포넌트
#### `src/components/ui/card.tsx` — 카드 컴포넌트
#### `src/components/ui/table.tsx` — 테이블 컴포넌트
#### `src/components/ui/badge.tsx` — 뱃지 컴포넌트
#### `src/components/ui/input.tsx` — 인풋 컴포넌트
#### `src/components/ui/status-badge.tsx` — 상태 뱃지 (pending/confirmed/cancelled 색상)
#### `src/components/ui/kpi-card.tsx` — KPI 카드 (숫자 + 증감률)
#### `src/components/layout/header.tsx` — 상단 헤더 (사용자 정보 + 로그아웃)
#### `src/components/layout/sidebar.tsx` — 좌측 메뉴 (role별 메뉴 필터링)
#### `src/components/layout/dashboard-layout.tsx` — 대시보드 레이아웃 (헤더+사이드바+컨텐츠)

---

### 📁 설정 파일

#### `package.json` — 의존성 정의
주요 패키지:
- `next` — SSR 프레임워크
- `react`, `react-dom` — UI 라이브러리
- `@tanstack/react-query` — 서버 상태 관리 (API 캐싱)
- `zustand` — 클라이언트 상태 관리 (로그인 정보)
- `axios` — HTTP 클라이언트
- `socket.io-client` — WebSocket 클라이언트
- `tailwindcss` — CSS 유틸리티

#### `next.config.js` — Next.js 설정 (API 프록시 등)
#### `tailwind.config.ts` — Tailwind 색상/폰트 커스텀
#### `tsconfig.json` — TypeScript 경로 별칭 (`@/` → `src/`)
