# ★ erp-api — 입고/정산 서비스 (시스템 핵심!)

> **담당**: ERP 개발자
> **WAS**: Nest.js 10
> **포트**: 4002
> **특수 기술**: Bull Queue (비동기), WebSocket (실시간), 비관적 락 (동시성)

## 📡 ★★★ 입고확인 — 가장 중요한 통신 흐름

### 실제 코드: `src/receiving/receiving.service.ts`
```typescript
async confirmReceiving(id: string, user: UserPayload) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.startTransaction('SERIALIZABLE');

  try {
    // ① 비관적 락 — 동시에 같은 입고를 확인하는 것 방지
    const receiving = await queryRunner.manager.findOne(ReceivingEntity, {
      where: { id },
      lock: { mode: 'pessimistic_write' },  // SELECT ... FOR UPDATE
    });

    // ② 상태 검증
    if (receiving.status === 'confirmed')
      throw new BusinessException('ALREADY_CONFIRMED', '이미 확인됨', 409);

    // ③ 상태 변경
    receiving.status = 'confirmed';
    receiving.confirmedAt = new Date();
    receiving.confirmedBy = user.sub;
    await queryRunner.manager.save(receiving);

    // ④ 감사 로그 저장 (누가 언제 무엇을)
    await queryRunner.query(
      `INSERT INTO audit_logs (user_id, action, entity_id, changes) VALUES ($1,$2,$3,$4)`,
      [user.sub, 'RECEIVING_CONFIRM', id, JSON.stringify({...})]
    );

    // ⑤ 커밋
    await queryRunner.commitTransaction();

    // ⑥ Bull Queue → 신용점수 재산출 (비동기, Redis 통해)
    await this.creditQueue.add('rescore', {
      merchantId: receiving.merchantId,
    }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });

    // ⑦ WebSocket → 은행 화면에 실시간 알림
    this.wsGateway.notifyBank('receiving:confirmed', {
      receivingId: id,
      amount: receiving.totalAmount,
      confirmedBy: user.email,
    });

  } catch (error) {
    await queryRunner.rollbackTransaction();  // 실패 시 원복
    throw error;
  }
}
```

### Bull Queue 워커 — `src/queue/credit-score.processor.ts`
```typescript
// Redis 큐에서 작업을 꺼내서 Engine API 호출
@Process('rescore')
async handleRescore(job: Job) {
  const response = await axios.post('http://engine-api:8000/api/v10/score', {
    merchant_id: job.data.merchantId,
  });
  // 실패 시 3회 재시도 (5초→10초→20초 간격)
}
```

### Controller — `src/receiving/receiving.controller.ts`
```typescript
@Patch(':id/confirm')           // PATCH /api/receivings/:id/confirm
@Roles('bank', 'mart')         // 은행 또는 마트만 가능
@Auditable('RECEIVING_CONFIRM') // 감사 로그 자동 기록
async confirm(@Param('id') id: string, @CurrentUser() user: UserPayload) {
  return createResponse(await this.receivingService.confirmReceiving(id, user));
}
```

## 📁 실제 코드 파일 위치
```
src/receiving/receiving.service.ts     ← ★★★ 입고확인 핵심 (위 코드)
src/receiving/receiving.controller.ts  ← API 라우팅
src/receiving/dto/create-receiving.dto.ts ← 입고 등록 검증
src/queue/credit-score.processor.ts    ← Bull Queue → Engine API 호출
src/settlement/settlement.service.ts   ← 정산 완료 처리
src/app.module.ts                      ← WebSocket + Bull Queue 설정
```

## 📦 주요 라이브러리
| 라이브러리 | 역할 | 왜? |
|-----------|------|-----|
| `@nestjs/bull` + `bull` | Redis 작업 큐 | 신용점수 재산출을 비동기 처리 (API 응답 안 기다림) |
| `socket.io` | WebSocket 서버 | 입고확인 → 은행 화면 실시간 반영 |
| `axios` | HTTP 클라이언트 | Engine API 호출 (서비스 간 통신) |
| `typeorm` | DB ORM | 비관적 락 + 트랜잭션 지원 |
