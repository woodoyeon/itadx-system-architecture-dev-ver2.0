# services/erp-api — ★★★ 입고확인/정산 핵심 서비스 상세 가이드

## 이 서비스의 역할

시스템의 **핵심 비즈니스 로직**을 담당합니다.
입고확인이 이루어지면:
1. DB 트랜잭션으로 상태 변경 (PostgreSQL)
2. 비동기 큐로 신용평가 재계산 요청 (Redis Bull Queue → Python 엔진)
3. WebSocket으로 은행 사용자에게 실시간 알림 (socket.io)

**포트:** 4002
**프레임워크:** Nest.js (TypeScript)

---

## 통신 흐름도

```
[프론트 axios]
    → PATCH /api/receivings/:id/confirm
    → [Nginx :80]
    → [gateway-api :4003]  (URL 매칭 → erp-api로 라우팅)
    → [erp-api :4002]
        │
        ├─ [receiving.controller.ts]  JWT 인증 + 역할 체크
        │       ↓
        ├─ [receiving.service.ts]     ★ 8단계 트랜잭션
        │       │
        │       ├─ [PostgreSQL]  SELECT FOR UPDATE → UPDATE → INSERT audit
        │       │
        │       ├─ [Redis Bull Queue]  → credit-score.processor.ts
        │       │                            ↓
        │       │                      HTTP POST → engine-api:8000/api/v10/score
        │       │
        │       └─ [WebSocket]  → notification.gateway.ts
        │                            ↓
        │                      socket.emit('receiving:confirmed') → 은행 브라우저
        │
        └─ JSON 응답 → 프론트
```

---

## 파일별 역할 상세

### 📁 src/receiving/ — 입고확인 (핵심)

#### `src/receiving/receiving.controller.ts` ★ 요청 진입점

**역할:** HTTP 요청을 받아서 Service로 전달하는 라우터

**코드가 하는 일:**
- `@Controller('receivings')` — `/api/receivings/*` 경로 담당
- `@UseGuards(JwtAuthGuard, RolesGuard)` — 모든 엔드포인트에 JWT 인증 필수
- `@Roles('bank', 'mart')` — 해당 역할만 접근 허용 (아니면 403)
- `@Auditable('RECEIVING_CONFIRM')` — 이 API 호출 시 자동 감사 로그 기록
- `@CurrentUser() user` — JWT 토큰에서 사용자 정보 추출

**엔드포인트 목록:**
| 메서드 | 경로 | 역할 | 권한 |
|--------|------|------|------|
| GET | /receivings | 입고 목록 조회 | bank, mart, admin |
| GET | /receivings/:id | 입고 상세 조회 | bank, mart, admin |
| POST | /receivings | 입고 등록 | mart |
| PATCH | /receivings/:id/confirm | ★ 입고확인 | bank, mart |

---

#### `src/receiving/receiving.service.ts` ★★★ 시스템 핵심 로직

**역할:** 입고확인 8단계 트랜잭션 처리

**코드가 하는 일 (confirmReceiving 메서드):**

```
Step 1: queryRunner.startTransaction('SERIALIZABLE')
  → 가장 높은 격리 수준 트랜잭션 시작
  → 다른 트랜잭션과 동시 실행 불가 (금융 데이터 무결성)

Step 2: findOne({ lock: { mode: 'pessimistic_write' } })
  → SQL: SELECT * FROM receivings WHERE id=$1 FOR UPDATE
  → 이 행을 잠금 → 다른 요청이 같은 행을 수정 못함
  → WHY: 두 사람이 동시에 같은 입고를 확인하는 것 방지

Step 3: status === 'confirmed' 체크
  → 이미 확인된 건은 BusinessException 발생 (409 Conflict)
  → WHY: 중복 확인 방지

Step 4: user.role === 'mart' && receiving.martId !== user.martId 체크
  → 마트 사용자가 다른 마트의 입고를 확인하는 것 방지 (403)

Step 5: receiving.status = 'confirmed' + save()
  → pending → confirmed 상태 전환
  → confirmedAt, confirmedBy 기록

Step 6: INSERT INTO audit_logs
  → 감사 로그 기록 (누가, 언제, 무엇을 변경했는지)
  → WHY: 금융 감사 규정 준수

Step 7: queryRunner.commitTransaction()
  → Step 2~6 전체가 성공해야만 DB에 반영
  → 하나라도 실패하면 전체 롤백 (catch에서 rollbackTransaction)

Step 8: creditQueue.add('rescore', { merchantId })
  → Redis Bull Queue에 신용평가 재계산 job 추가
  → attempts: 3, backoff: exponential (5초→10초→20초)
  → WHY: 신용평가 계산은 무거우므로 사용자 응답과 분리

Step 9: wsGateway.notifyBank('receiving:confirmed', { ... })
  → WebSocket으로 은행 사용자에게 실시간 알림
  → WHY: 은행 대시보드가 자동으로 갱신되도록
```

**다른 기능을 만들 때 이 패턴 복사:**
- 정산 완료 처리 → 동일한 트랜잭션 + 큐 + WebSocket 패턴
- 마트 등록 승인 → 동일한 비관적 잠금 + 감사 로그 패턴

---

#### `src/receiving/receiving.module.ts`

**역할:** Receiving 관련 의존성 조립

**코드가 하는 일:**
- `TypeOrmModule.forFeature([ReceivingEntity])` — DB 테이블 연결
- `BullModule.registerQueue({ name: 'credit-score' })` — Redis 큐 등록
- `providers: [ReceivingService]` — Service를 DI 컨테이너에 등록
- `controllers: [ReceivingController]` — Controller 등록

---

#### `src/receiving/dto/create-receiving.dto.ts`

**역할:** 입고 등록 요청의 데이터 검증

**코드가 하는 일:**
- `@IsUUID()` — martId, merchantId가 UUID 형식인지 검증
- `@IsNumber()` — totalAmount가 숫자인지 검증
- `@IsDateString()` — receivingDate가 날짜 형식인지 검증
- 검증 실패 시 자동으로 400 Bad Request 응답

---

### 📁 src/queue/ — Bull Queue 비동기 처리

#### `src/queue/credit-score.processor.ts` ★ Redis Queue Worker

**역할:** Redis 큐에서 job을 꺼내서 Python 엔진 API를 HTTP로 호출

**코드가 하는 일:**
1. `@Processor('credit-score')` — 'credit-score' 큐를 감시
2. `@Process('rescore')` — 'rescore' 타입 job 처리
3. `axios.post('http://engine-api:8000/api/v10/score', { merchant_id })` — Python API 호출
4. 실패 시 throw → Bull이 자동 재시도 (최대 3회)

**통신 흐름:**
```
receiving.service.ts에서 creditQueue.add('rescore', { merchantId })
  → Redis에 job 저장
  → credit-score.processor.ts가 job 감지하여 꺼냄
  → HTTP POST → engine-api:8000/api/v10/score
  → Python이 Pandas로 신용점수 계산
  → 결과를 credit_scores 테이블에 저장
```

**WHY Bull Queue를 쓰는가:**
- 신용평가 계산은 2~5초 걸림 → 사용자가 기다리면 안 됨
- 입고확인 API 응답은 즉시 반환 (200ms 이내)
- 계산은 백그라운드에서 비동기 처리
- 실패 시 자동 재시도로 안정성 보장

---

#### `src/queue/queue.module.ts`

**역할:** Bull Queue 모듈 설정
- Redis 연결 설정 (host, port)
- CreditScoreProcessor를 provider로 등록

---

### 📁 src/settlement/ — 정산 처리

#### `src/settlement/settlement.service.ts`

**역할:** 정산 완료 처리 로직
**패턴:** receiving.service.ts와 동일한 트랜잭션 패턴
**확장 시:** 정산 완료 → 감사 로그 + WebSocket 알림 추가

#### `src/settlement/settlement.controller.ts`

**역할:** 정산 API 라우터
**패턴:** receiving.controller.ts와 동일

---

### 📁 루트 파일

#### `src/main.ts` — 서버 시작 파일

**코드가 하는 일:**
1. `NestFactory.create(AppModule)` — Nest.js 앱 생성
2. `app.listen(4002)` — 4002번 포트에서 HTTP 요청 수신 시작
3. Swagger 문서 설정 — `/docs`에서 API 문서 확인 가능
4. CORS 설정 — 프론트엔드 도메인 허용
5. ValidationPipe — DTO 자동 검증 활성화

---

#### `src/app.module.ts` — 모듈 조립

**코드가 하는 일:**
- `TypeOrmModule.forRoot(...)` — PostgreSQL DB 연결
- `BullModule.forRoot(...)` — Redis 연결 (Bull Queue용)
- `ReceivingModule` — 입고확인 기능 등록
- `SettlementModule` — 정산 기능 등록
- `NotificationGateway` — WebSocket 서버 등록

---

### 📁 설정 파일

#### `package.json` — 의존성
주요 패키지:
- `@nestjs/core`, `@nestjs/common` — Nest.js 프레임워크
- `@nestjs/typeorm`, `typeorm`, `pg` — PostgreSQL ORM
- `@nestjs/bull`, `bull` — Redis 기반 비동기 큐
- `@nestjs/websockets`, `socket.io` — WebSocket
- `axios` — HTTP 클라이언트 (Python 엔진 호출)
- `@itadx/auth`, `@itadx/audit`, `@itadx/database` — 공통 라이브러리

#### `Dockerfile` — Docker 이미지 빌드
#### `tsconfig.json` — TypeScript 설정
#### `nest-cli.json` — Nest.js CLI 설정
