# ItaDX — 프론트↔백 통신 (쉽게 이해하기)

> **아래 파일 이름을 클릭하면 해당 코드로 이동합니다.**

---

## 1. 프론트엔드 → 백엔드 (REST API) 통신

### ① 흐름도 (한눈에 보기)

```
  [화면]          [Next.js]         [Gateway]          [실제 API 서버]
    │                 │                  │                      │
    │  "로그인해줘"     │                  │                      │
    │  api.post(...)   │                  │                      │
    │ ────────────────>│  /api 요청       │                      │
    │                  │  rewrite         │                      │
    │                  │ ────────────────>│  URL 보고 어디로 갈지 결정
    │                  │                  │  /api/auth → 4001     │
    │                  │                  │  /api/receivings→4002 │
    │                  │                  │ ────────────────────>│  auth-api
    │                  │                  │                      │  erp-api 등
    │                  │                  │  <────────────────────│  응답
    │                  │  <───────────────│                      │
    │  <───────────────│  응답 전달       │                      │
    │  화면 갱신        │                  │                      │
```

**한 줄 요약:** 프론트는 항상 `/api/...` 만 부르고, Next가 Gateway(4003)로 넘기고, Gateway가 경로에 따라 auth(4001)·admin(4000)·erp(4002)로 나눠서 보냅니다.

---

### ② 프론트: "API 한 번만 쓰면 돼"

프론트에서는 **axios 인스턴스 하나**로 모든 백엔드 요청을 보냅니다. 주소는 `/api`로 시작하기만 하면 됩니다.

**파일:** [apps/admin-web/src/lib/api.ts](../apps/admin-web/src/lib/api.ts)

```ts
const api = axios.create({
  baseURL: '/api',   // ← 항상 /api 로 시작 (실제 서버 주소는 몰라도 됨)
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 매 요청마다 JWT 자동으로 붙임
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

- **통신 요약:** 브라우저는 `api.get('/auth/profile')`, `api.patch('/receivings/123/confirm')` 처럼 **`/api` + 경로**만 호출합니다. JWT는 위 인터셉터가 자동으로 붙입니다.

---

### ③ Next: "/api 로 오는 건 Gateway로 보낸다"

브라우저가 보낸 `/api/...` 요청을 **그대로** Gateway(4003)로 넘깁니다. 프론트 코드는 localhost:4003을 몰라도 됩니다.

**파일:** [apps/admin-web/next.config.js](../apps/admin-web/next.config.js)

```js
async rewrites() {
  return [
    { source: '/api/:path*', destination: 'http://localhost:4003/api/:path*' },
  ];
}
```

- **통신 요약:** `GET /api/receivings` → 실제로는 `GET http://localhost:4003/api/receivings` 로 전달됩니다.

---

### ④ Gateway: "경로 보고 어느 서버로 보낼지 정한다"

Gateway는 **URL 앞부분**만 보고 auth / admin / erp 중 하나로 요청을 넘깁니다.

**파일:** [services/gateway-api/src/proxy/proxy.middleware.ts](../services/gateway-api/src/proxy/proxy.middleware.ts)

```ts
private readonly routes: Record<string, string> = {
  '/api/auth':       'http://localhost:4001',   // 로그인, 프로필, refresh
  '/api/marts':      'http://localhost:4000',   // 마트/지점/가맹점/대시보드
  '/api/receivings': 'http://localhost:4002',   // 입고 목록, 입고확인
  '/api/settlements': 'http://localhost:4002',  // 정산
  // ...
};

// 요청 경로가 위 prefix 중 하나로 시작하면 → 해당 서버로 프록시
const target = Object.entries(this.routes).find(([prefix]) => path.startsWith(prefix));
// → createProxyMiddleware로 그대로 전달
```

- **통신 요약:**  
  - `/api/auth/login` → **auth-api (4001)**  
  - `/api/receivings` → **erp-api (4002)**  
  - `/api/marts`, `/api/users` 등 → **admin-api (4000)**

---

### ⑤ 예: 로그인 (프론트 → 백 순서)

| 단계 | 어디서 | 하는 일 |
|------|--------|---------|
| 1 | [apps/admin-web/src/app/login/page.tsx](../apps/admin-web/src/app/login/page.tsx) | `api.post('/auth/login', { email, password })` 호출 |
| 2 | [apps/admin-web/src/lib/api.ts](../apps/admin-web/src/lib/api.ts) | `POST /api/auth/login` + (로그인 후) JWT 자동 첨부 |
| 3 | [apps/admin-web/next.config.js](../apps/admin-web/next.config.js) | `/api/*` → Gateway(4003)로 rewrite |
| 4 | [services/gateway-api/src/proxy/proxy.middleware.ts](../services/gateway-api/src/proxy/proxy.middleware.ts) | `/api/auth` → auth-api(4001)로 프록시 |
| 5 | [services/auth-api/src/auth/auth.controller.ts](../services/auth-api/src/auth/auth.controller.ts) | `@Post('login')` → 토큰 발급 후 응답 |

**로그인 시 핵심 코드 (프론트):**

```ts
// login/page.tsx
const { data } = await api.post('/auth/login', { email, password });
setTokens(data.data.accessToken, data.data.refreshToken);
const profile = await api.get('/auth/profile');  // JWT가 자동으로 붙음
```

**로그인 시 핵심 코드 (백):**

```ts
// auth.controller.ts
@Post('login')
async login(@Body() dto: LoginDto) {
  const tokens = await this.authService.login(dto);
  return createResponse(tokens);
}
```

---

### ⑥ 예: 입고 목록·입고확인 (프론트 → 백 순서)

| 단계 | 어디서 | 하는 일 |
|------|--------|---------|
| 1 | [apps/admin-web/src/hooks/use-receivings.ts](../apps/admin-web/src/hooks/use-receivings.ts) | `api.get('/receivings')`, `api.patch('/receivings/:id/confirm')` |
| 2 | Next → Gateway | `/api/receivings` → Gateway(4003) |
| 3 | Gateway | `/api/receivings` → erp-api(4002) |
| 4 | [services/erp-api/src/receiving/receiving.controller.ts](../services/erp-api/src/receiving/receiving.controller.ts) | `@Get()`, `@Patch(':id/confirm')` → Service 호출 |

**입고 조회 (프론트):**

```ts
// use-receivings.ts
const { data } = await api.get('/receivings', { params: filters });
```

**입고확인 (백 컨트롤러):**

```ts
// receiving.controller.ts
@Patch(':id/confirm')
async confirm(@Param('id') id: string, @CurrentUser() user: UserPayload) {
  return createResponse(await this.receivingService.confirmReceiving(id, user));
}
```

---

## 2. 백엔드 → 프론트엔드 (WebSocket) 통신

### ① 흐름도 (한눈에 보기)

```
  [erp-api 등]         [NotificationGateway]      [브라우저]
       │                        │                       │
       │  입고확인 완료!         │                       │
       │  wsGateway.notifyBank()│                       │
       │ ──────────────────────>│  server.to('bank')    │
       │                        │  .emit('receiving:confirmed', data)
       │                        │ ─────────────────────>│  socket.on('receiving:confirmed')
       │                        │                       │  → React Query 캐시 무효화
       │                        │                       │  → 화면 자동 갱신
```

**한 줄 요약:** 백엔드에서 이벤트를 보내면, 프론트는 WebSocket으로 받아서 해당 데이터 캐시만 무효화하고 화면이 자동으로 최신으로 갱신됩니다.

---

### ② 백: "이벤트 이름 정해서 보내기"

역할별 room(은행/마트/관리자)에 **이벤트 이름 + 데이터**를 보냅니다.

**파일:** [libs/websocket/src/gateways/notification.gateway.ts](../libs/websocket/src/gateways/notification.gateway.ts)

```ts
// 은행 쪽 연결된 클라이언트들에게만 보냄
notifyBank(event: string, data: unknown): void {
  this.server.to('bank').emit(event, data);
}

// 예: notifyBank('receiving:confirmed', { receivingId, amount, ... })
```

- **통신 요약:** 백엔드가 `notifyBank('receiving:confirmed', data)` 를 호출하면, 'bank' room에 연결된 브라우저들만 해당 이벤트를 받습니다.

---

### ③ 프론트: "연결하고, 이벤트 이름 맞춰서 듣기"

한 번 연결해 두고, **이벤트 이름**에 맞춰 React Query 캐시를 무효화합니다.

**연결:** [apps/admin-web/src/lib/socket.ts](../apps/admin-web/src/lib/socket.ts)

```ts
socket = io(window.location.origin, {
  auth: { token: useAuthStore.getState().accessToken },  // JWT로 인증
  transports: ['websocket'],
});
```

**이벤트 수신 → 캐시 무효화:** [apps/admin-web/src/hooks/use-socket.ts](../apps/admin-web/src/hooks/use-socket.ts)

```ts
socket.on('receiving:confirmed', () => {
  queryClient.invalidateQueries({ queryKey: ['receivings'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
});
socket.on('credit:score-updated', () => {
  queryClient.invalidateQueries({ queryKey: ['merchants'] });
});
```

- **통신 요약:** 백이 `receiving:confirmed` 를 보내면 → 입고/대시보드 쿼리만 무효화 → 해당 화면이 다시 fetch 하면서 최신 데이터로 갱신됩니다.

---

### ④ 예: 입고확인 시 백이 프론트에 알림

입고확인 처리 직후, 백이 WebSocket으로 "입고 확인됐어"라고 보내는 부분입니다.

**파일:** [services/erp-api/src/receiving/receiving.service.ts](../services/erp-api/src/receiving/receiving.service.ts)

```ts
// DB 저장, Queue 처리 후
this.wsGateway.notifyBank(WsEvents.RECEIVING_CONFIRMED, {
  receivingId: id,
  merchantId: receiving.merchantId,
  martId: receiving.martId,
  amount: receiving.totalAmount,
  confirmedBy: user.email,
  confirmedAt: receiving.confirmedAt,
});
```

- **통신 요약:** erp-api가 입고확인을 끝내고 나서 `notifyBank('receiving:confirmed', ...)` 를 호출 → 은행 로그인한 브라우저의 [use-socket.ts](../apps/admin-web/src/hooks/use-socket.ts) 가 받아서 입고/대시보드 캐시만 무효화 → 화면이 자동으로 최신 목록으로 갱신됩니다.

---

### ⑤ 이벤트 ↔ 무효화할 데이터 정리

| 백엔드가 보내는 이벤트 | 프론트에서 무효화하는 데이터 |
|------------------------|-----------------------------|
| `receiving:confirmed`  | 입고 목록, 대시보드         |
| `credit:score-updated` | 가맹점(merchants)          |
| `risk:level-changed`   | 마트, 지점                  |

---

## 3. 요청/응답 JSON — 프론트가 보내는 것, 백이 받고 돌려주는 것

**프론트 개발자는 이 규칙만 지키면 됩니다.**  
새 API를 만들 때도 **같은 형식**으로 요청을 보내고, 응답도 **같은 형식**으로 처리하면 됩니다.

### ① 전체 규칙 (모든 API 공통)

| 구분 | 형식 | 설명 |
|------|------|------|
| **성공 응답** | `{ "success": true, "data": ... }` | 실제 데이터는 항상 `data` 안에 있음 |
| **목록+페이지** | `{ "success": true, "data": [...], "meta": { "page", "limit", "total", "totalPages" } }` | 목록 API는 `meta`로 페이지 정보 |
| **실패 응답** | `{ "success": false, "error": { "code": "에러코드", "message": "메시지" } }` | 4xx/5xx 시 이 구조 |

- 백엔드 공통 타입: [libs/common/src/types/api-response.ts](../libs/common/src/types/api-response.ts)  
- 프론트 타입(같은 구조): [apps/admin-web/src/types/index.ts](../apps/admin-web/src/types/index.ts)

---

### ② 예시 1: 로그인 — 프론트가 JSON 보내고, 백이 JSON 돌려줌

**프론트 → 백 (요청)**

- **메서드/URL:** `POST /api/auth/login`
- **헤더:** `Content-Type: application/json` (로그인은 JWT 없음)
- **바디 (JSON):**

```json
{
  "email": "admin@itadx.com",
  "password": "password123"
}
```

- **프론트 코드:** [apps/admin-web/src/app/login/page.tsx](../apps/admin-web/src/app/login/page.tsx)  
  `api.post('/auth/login', { email, password })`
- **백이 받는 DTO:** [services/auth-api/src/auth/dto/login.dto.ts](../services/auth-api/src/auth/dto/login.dto.ts)  
  `email`, `password` 검증 후 Service로 전달

**백 → 프론트 (응답)**

- **성공 시 (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

- **백 코드:** [services/auth-api/src/auth/auth.controller.ts](../services/auth-api/src/auth/auth.controller.ts)  
  `return createResponse(tokens);` → 위 형식으로 자동 래핑
- **프론트 사용:** `data.data.accessToken`, `data.data.refreshToken` 저장 후 이후 요청에 JWT 첨부

**실패 시 (401):**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다."
  }
}
```

→ 프론트는 `data.success` / `data.error` 로 분기하면 됨.

---

### ③ 예시 2: 입고 목록 조회 — query로 조건 보내고, 목록+meta 받음

**프론트 → 백 (요청)**

- **메서드/URL:** `GET /api/receivings?martId=xxx&status=pending&page=1&limit=20`
- **헤더:** `Authorization: Bearer <accessToken>` (api 인스턴스가 자동 첨부)
- **바디:** 없음 (GET)

- **프론트 코드:** [apps/admin-web/src/hooks/use-receivings.ts](../apps/admin-web/src/hooks/use-receivings.ts)  
  `api.get('/receivings', { params: filters })`  
  → `filters`가 query string으로 붙음

**백 → 프론트 (응답)**

- **성공 시 (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "merchantId": "uuid-m",
      "martId": "uuid-mart",
      "receivingDate": "2025-02-26",
      "totalAmount": 1000000,
      "items": [],
      "status": "pending",
      "confirmedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

- **백 코드:** [services/erp-api/src/receiving/receiving.controller.ts](../services/erp-api/src/receiving/receiving.controller.ts)  
  `createPaginatedResponse(result.items, result.total, result.page, result.limit)`  
  → [libs/common/src/types/api-response.ts](../libs/common/src/types/api-response.ts) 의 공통 형식

- **프론트 사용:** `data.data` = 목록 배열, `data.meta` = 페이지 정보 (무한 스크롤/페이지네이션)

---

### ④ 예시 3: 입고확인 — URL로 id 보내고, 갱신된 한 건 받음

**프론트 → 백 (요청)**

- **메서드/URL:** `PATCH /api/receivings/:id/confirm` (예: `PATCH /api/receivings/uuid-123/confirm`)
- **헤더:** `Authorization: Bearer <accessToken>`
- **바디:** 없음 (또는 `{}`)

- **프론트 코드:** [apps/admin-web/src/hooks/use-receivings.ts](../apps/admin-web/src/hooks/use-receivings.ts)  
  `api.patch(\`/receivings/${id}/confirm\`)`

**백 → 프론트 (응답)**

- **성공 시 (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "merchantId": "uuid-m",
    "martId": "uuid-mart",
    "status": "confirmed",
    "confirmedAt": "2025-02-26T10:30:00.000Z",
    "confirmedBy": "user-uuid",
    "totalAmount": 1000000
  }
}
```

- **백 코드:** [services/erp-api/src/receiving/receiving.controller.ts](../services/erp-api/src/receiving/receiving.controller.ts)  
  `return createResponse(await this.receivingService.confirmReceiving(id, user));`

→ 프론트는 `data.data` 에 갱신된 입고 한 건이 들어온다고 보면 됨.

---

### ⑤ 정리: 프론트 개발자가 할 일

| 할 일 | 참고 |
|-------|------|
| **요청** | 메서드(GET/POST/PATCH 등) + URL + 필요 시 **body JSON** 또는 **params(query)** |
| **응답** | 항상 `{ success, data }` 또는 `{ success, error }` 라고 보고, `data` / `error` 만 쓰면 됨 |
| **인증** | 로그인 외에는 `api` 쓰면 JWT 자동 첨부 (별도 처리 불필요) |
| **새 기능** | 백엔드에서 `createResponse(결과)` / `createPaginatedResponse(목록, total, page, limit)` 쓰면 위와 같은 형식으로 옴 → 프론트는 **이 구조 안에서** 요청/응답 타입만 맞추면 됨 |

---

## 4. 읽기 순서 요약 (처음 볼 때 추천)

- **전체 구조:** [README.md](../README.md) → [CLAUDE.md](../CLAUDE.md)
- **실행 흐름:** 루트 [package.json](../package.json) → [turbo.json](../turbo.json) → 각 앱/서비스 `package.json`
- **프론트 → 백 (REST):** [api.ts](../apps/admin-web/src/lib/api.ts) → [next.config.js](../apps/admin-web/next.config.js) → [proxy.middleware.ts](../services/gateway-api/src/proxy/proxy.middleware.ts) → [auth.controller.ts](../services/auth-api/src/auth/auth.controller.ts) / [receiving.controller.ts](../services/erp-api/src/receiving/receiving.controller.ts)
- **백 → 프론트 (WebSocket):** [notification.gateway.ts](../libs/websocket/src/gateways/notification.gateway.ts) → [socket.ts](../apps/admin-web/src/lib/socket.ts) → [use-socket.ts](../apps/admin-web/src/hooks/use-socket.ts) → (호출 위치) [receiving.service.ts](../services/erp-api/src/receiving/receiving.service.ts)

---

**위에서 파일 경로/이름을 클릭하면 해당 파일로 이동합니다.**
