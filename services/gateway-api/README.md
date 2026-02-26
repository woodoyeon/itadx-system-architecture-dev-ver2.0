# 🌐 gateway-api — API 라우팅 + Rate Limiting

> **포트**: 4003
> **역할**: 프론트엔드의 모든 /api/* 요청을 적절한 백엔드 서비스로 전달

## 📡 라우팅 규칙 — 실제 코드: `src/proxy/proxy.middleware.ts`
```typescript
// URL 경로 → 백엔드 서비스 매핑
private readonly routes = {
  '/api/auth':        'http://auth-api:4001',    // 인증
  '/api/marts':       'http://admin-api:4000',   // 마트 CRUD
  '/api/branches':    'http://admin-api:4000',   // 지점
  '/api/merchants':   'http://admin-api:4000',   // 가맹점
  '/api/dashboard':   'http://admin-api:4000',   // 대시보드
  '/api/receivings':  'http://erp-api:4002',     // ★ 입고
  '/api/settlements': 'http://erp-api:4002',     // 정산
  '/api/v41':         'http://engine-api:8000',  // 마트심사
  '/api/v10':         'http://engine-api:8000',  // 신용평가
};
```

## Rate Limiting — 실제 코드: `src/proxy/rate-limit.middleware.ts`
```typescript
// Redis INCR로 IP당 요청 수 카운트 (분당 100회 제한)
const current = await this.redis.incr(`rl:${req.ip}`);
if (current === 1) await this.redis.expire(key, 60); // 60초 윈도우
if (current > 100) throw 429; // Too Many Requests
```
