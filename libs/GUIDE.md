# libs/ — 공통 라이브러리 상세 가이드

## 이 폴더의 역할

모든 백엔드 서비스(auth-api, admin-api, erp-api, gateway-api)가 **공통으로 사용하는 코드**입니다.
`@itadx/auth`, `@itadx/common` 등의 패키지명으로 import하여 사용합니다.

**사용법:** `import { JwtAuthGuard, Roles, CurrentUser } from '@itadx/auth';`

---

## 라이브러리별 역할 상세

### 📁 libs/auth/ — 인증/권한 라이브러리 (@itadx/auth)

모든 API 엔드포인트에서 JWT 인증과 역할 체크에 사용합니다.

#### `src/guards/jwt-auth.guard.ts` ★ JWT 인증 Guard

**역할:** API 요청에 JWT 토큰이 있는지 검증

**코드가 하는 일:**
```
@UseGuards(JwtAuthGuard)를 Controller에 붙이면:
  → 요청 헤더에서 Authorization: Bearer {token} 추출
  → JWT 토큰 서명 검증 (위변조 확인)
  → 만료 시간 확인
  → Redis 블랙리스트 확인 (로그아웃된 토큰인지)
  → 실패 시 401 Unauthorized 자동 응답
  → 성공 시 req.user에 사용자 정보 저장
```

**사용 예:**
```typescript
@UseGuards(JwtAuthGuard)  // ← 이 한 줄로 인증 필수
@Get('marts')
async findAll() { ... }
```

---

#### `src/guards/roles.guard.ts` ★ 역할 기반 권한 Guard

**역할:** 특정 역할(bank/mart/admin)만 접근 허용

**코드가 하는 일:**
```
@Roles('bank', 'admin')를 Controller에 붙이면:
  → req.user.role 확인 (JWT에서 추출된 역할)
  → 허용 목록에 포함되어 있는지 체크
  → 미포함 시 403 Forbidden 자동 응답
```

**사용 예:**
```typescript
@Roles('bank', 'admin')  // ← bank 또는 admin만 접근 가능
@Get('marts')
async findAll() { ... }
```

---

#### `src/strategies/jwt.strategy.ts` — Passport JWT 전략

**역할:** JWT 토큰을 파싱하여 payload를 추출하는 전략
- `jwtFromRequest` — Authorization 헤더에서 Bearer 토큰 추출
- `validate(payload)` — 토큰 payload를 req.user에 저장

---

#### `src/decorators/roles.decorator.ts` — @Roles 데코레이터

**역할:** Controller 메서드에 허용 역할을 메타데이터로 기록
```typescript
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

---

#### `src/decorators/current-user.decorator.ts` — @CurrentUser 데코레이터

**역할:** JWT에서 추출된 사용자 정보를 파라미터로 주입
```typescript
// Controller에서 사용
async confirm(@CurrentUser() user: UserPayload) {
  // user = { sub: 'uuid', email: 'bank@itadx.com', role: 'bank', ... }
}
```

---

#### `src/interfaces/user-payload.ts` — 사용자 타입 정의

**내용:** JWT payload의 TypeScript 타입
```typescript
export interface UserPayload {
  sub: string;       // 사용자 UUID
  email: string;
  role: 'bank' | 'mart' | 'admin';
  martId?: string;   // mart 역할일 때만
}
```

---

### 📁 libs/common/ — 공통 유틸리티 (@itadx/common)

#### `src/types/api-response.ts` ★ API 응답 형식

**역할:** 모든 API 응답의 공통 형식 정의

```typescript
// 성공 응답
{ success: true, data: { ... } }

// 목록 응답 (페이지네이션)
{ success: true, data: [...], meta: { page: 1, limit: 20, total: 50 } }

// 에러 응답
{ success: false, error: { code: 'ALREADY_CONFIRMED', message: '...' } }
```

**createResponse(data)** — 성공 응답 래핑
**createPaginatedResponse(items, total, page, limit)** — 페이지네이션 응답

---

#### `src/errors/error-codes.ts` — 에러 코드 상수

```typescript
export const ErrorCodes = {
  ALREADY_CONFIRMED: 'ALREADY_CONFIRMED',
  RECEIVING_NOT_FOUND: 'RECEIVING_NOT_FOUND',
  RECEIVING_CANCELLED: 'RECEIVING_CANCELLED',
  MART_MISMATCH: 'MART_MISMATCH',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ...
};
```

---

#### `src/errors/business.exception.ts` — 비즈니스 예외

**역할:** 커스텀 에러 (HTTP 상태코드 + 에러코드)
```typescript
throw new BusinessException('ALREADY_CONFIRMED', '이미 확인된 입고입니다.', 409);
// → { success: false, error: { code: 'ALREADY_CONFIRMED', message: '...' } }
```

---

#### `src/dto/pagination.dto.ts` — 페이지네이션 DTO

#### `src/utils/trace.ts` — 요청 추적 ID 생성
#### `src/utils/format.ts` — 포맷팅 유틸리티

---

### 📁 libs/database/ — DB 엔티티 (@itadx/database)

TypeORM Entity = **DB 테이블을 TypeScript 클래스로 매핑**한 것입니다.

#### `src/entities/receiving.entity.ts` ★ 입고 엔티티

```typescript
@Entity('receivings')  // receivings 테이블과 매핑
export class ReceivingEntity extends BaseEntity {
  @Column({ type: 'uuid' }) martId: string;
  @Column({ type: 'uuid' }) merchantId: string;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) totalAmount: number;
  @Column({ default: 'pending' }) status: 'pending' | 'confirmed' | 'cancelled';
  @Column({ nullable: true }) confirmedAt: Date | null;
  @Column({ nullable: true }) confirmedBy: string | null;
}
// → 이 클래스 = receivings 테이블의 각 행
// → this.receivingRepo.findOne({ where: { id } })
//   = SELECT * FROM receivings WHERE id = $1
```

#### `src/entities/mart.entity.ts` — 마트 엔티티
#### `src/entities/branch.entity.ts` — 지점 엔티티
#### `src/entities/merchant.entity.ts` — 가맹점 엔티티
#### `src/entities/user.entity.ts` — 사용자 엔티티
#### `src/entities/credit-score.entity.ts` — 신용점수 엔티티
#### `src/entities/settlement.entity.ts` — 정산 엔티티
#### `src/entities/audit-log.entity.ts` — 감사 로그 엔티티
#### `src/entities/refresh-token.entity.ts` — 리프레시 토큰 엔티티
#### `src/entities/risk-assessment.entity.ts` — 리스크 평가 엔티티
#### `src/entities/notification.entity.ts` — 알림 엔티티
#### `src/entities/base.entity.ts` — 공통 필드 (id, createdAt, updatedAt)

---

### 📁 libs/audit/ — 감사 로그 (@itadx/audit)

#### `src/interceptors/audit.interceptor.ts` ★ 자동 감사 로그

**역할:** API 호출 시 자동으로 감사 로그를 DB에 기록

**코드가 하는 일:**
```
@Auditable('RECEIVING_CONFIRM')을 Controller에 붙이면:
  → API 호출 성공 후 자동으로 실행
  → INSERT INTO audit_logs (user_id, action, entity_id, ...) VALUES (...)
  → 누가(user_id), 무엇을(action), 언제(timestamp) 기록
```

#### `src/decorators/auditable.decorator.ts` — @Auditable 데코레이터

---

### 📁 libs/websocket/ — WebSocket (@itadx/websocket)

#### `src/gateways/notification.gateway.ts` ★ 실시간 알림

**역할:** WebSocket 서버 — 역할별 room에 이벤트 push

**코드가 하는 일:**
- `handleConnection` — 클라이언트 연결 시 JWT 검증 → role별 room 배정
- `notifyBank(event, data)` — 은행 사용자 room에 이벤트 발행
- `notifyMart(martId, event, data)` — 특정 마트 room에 이벤트 발행
- `notifyAdmin(event, data)` — 관리자 room에 이벤트 발행

#### `src/events.ts` — WebSocket 이벤트 상수
```typescript
export const WsEvents = {
  RECEIVING_CONFIRMED: 'receiving:confirmed',
  CREDIT_SCORE_UPDATED: 'credit:score-updated',
  RISK_LEVEL_CHANGED: 'risk:level-changed',
};
```

---

### 📁 libs/config/ — 환경변수 (@itadx/config)

#### `src/config.module.ts` — 환경변수 검증 (Joi)
- DB_HOST, DB_PORT 등 필수 환경변수 누락 시 서버 시작 차단
