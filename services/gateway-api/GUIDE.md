# services/gateway-api — API 게이트웨이 상세 가이드

## 이 서비스의 역할

프론트엔드의 모든 `/api/*` 요청을 받아서 **URL 기반으로 적절한 백엔드 서비스로 라우팅**합니다.
추가로 **Rate Limiting**(요청 횟수 제한)을 처리합니다.

**포트:** 4003
**프레임워크:** Nest.js (TypeScript)

---

## 통신 흐름도

```
[프론트 axios]
    → /api/receivings/1/confirm
    → [Nginx :80] → /api/* → [gateway-api :4003]
        │
        ├─ [rate-limit.middleware.ts]  IP당 100req/분 제한
        │       ↓
        ├─ [proxy.middleware.ts]  URL 매칭 → 백엔드 라우팅
        │       │
        │       ├─ /api/auth/*        → http://auth-api:4001
        │       ├─ /api/marts/*       → http://admin-api:4000
        │       ├─ /api/receivings/*  → http://erp-api:4002    ★
        │       ├─ /api/settlements/* → http://erp-api:4002
        │       ├─ /api/v10/*         → http://engine-api:8000
        │       └─ /api/v41/*         → http://engine-api:8000
        │
        └─ 백엔드 응답을 그대로 프론트에 전달
```

---

## 파일별 역할 상세

### `src/proxy/proxy.middleware.ts` ★ 라우팅 핵심

**역할:** URL 경로 앞부분을 보고 어떤 백엔드로 보낼지 결정

**코드가 하는 일:**
1. `this.routes` 객체에 URL prefix → 백엔드 주소 매핑
2. `req.path.startsWith(prefix)` — 요청 URL이 어디에 해당하는지 찾기
3. `createProxyMiddleware({ target })` — 해당 백엔드로 HTTP 프록시

**라우팅 규칙 (12개 경로 → 4개 서비스):**
```
/api/auth/*         → auth-api:4001     (인증)
/api/marts/*        → admin-api:4000    (마트 관리)
/api/branches/*     → admin-api:4000    (지점 관리)
/api/merchants/*    → admin-api:4000    (가맹점 관리)
/api/dashboard/*    → admin-api:4000    (대시보드)
/api/users/*        → admin-api:4000    (사용자 관리)
/api/receivings/*   → erp-api:4002      (★ 입고확인)
/api/settlements/*  → erp-api:4002      (정산)
/api/v10/*          → engine-api:8000   (신용평가)
/api/v41/*          → engine-api:8000   (마트 심사)
/api/dual-track/*   → engine-api:8000   (듀얼트랙)
/api/branch-risk/*  → engine-api:8000   (지점 리스크)
```

**새 서비스 추가 시:** routes 객체에 경로 추가만 하면 됨

---

### `src/proxy/rate-limit.middleware.ts` ★ 요청 횟수 제한

**역할:** IP 주소당 분당 100회 요청 제한 (DDoS/남용 방지)

**코드가 하는 일:**
```
1. redis.incr(`rl:${req.ip}`)  → IP별 카운터 +1
2. if (current === 1) redis.expire(key, 60)  → 첫 요청이면 60초 TTL 설정
3. if (current > 100) throw 429  → 100회 초과 시 "Too Many Requests" 에러
```

**WHY Redis인가:**
- 여러 gateway 인스턴스가 있어도 Redis가 중앙에서 카운트
- 60초 TTL로 자동 초기화 (메모리 관리 불필요)

---

### `src/main.ts` — 서버 시작 (포트 4003)

### `src/app.module.ts` — 모듈 조립
- ProxyMiddleware — 라우팅 미들웨어 등록
- RateLimitMiddleware — Rate Limit 미들웨어 등록

---

### 설정 파일

#### `package.json` 주요 의존성:
- `http-proxy-middleware` — HTTP 프록시 (요청 전달)
- `ioredis` — Redis 클라이언트 (Rate Limit)
