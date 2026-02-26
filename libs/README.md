# 📦 libs/ — 공유 라이브러리 (@itadx/*)

> 모든 서비스가 공통으로 사용하는 코드를 여기에 모아놨습니다.

## 실제 코드 예시

### @itadx/auth — JWT 인증 Guard
```typescript
// libs/auth/src/guards/jwt-auth.guard.ts
// → 이걸 Controller에 @UseGuards(JwtAuthGuard) 붙이면 인증 필수가 됨
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);  // 토큰 없으면 401 에러
  }
}
```

### @itadx/auth — 역할 기반 접근 제어
```typescript
// libs/auth/src/guards/roles.guard.ts
// → @Roles('bank') 붙이면 은행 사용자만 접근 가능
canActivate(context): boolean {
  const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, ...);
  const { user } = context.switchToHttp().getRequest();
  return requiredRoles.includes(user.role);  // 역할 불일치 → 403
}
```

### @itadx/database — 입고 Entity (DB 테이블 매핑)
```typescript
// libs/database/src/entities/receiving.entity.ts
@Entity('receivings')
export class ReceivingEntity extends BaseEntity {
  @Column({ type: 'uuid' }) merchantId: string;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) totalAmount: number;
  @Column({ default: 'pending' }) status: 'pending' | 'confirmed' | 'cancelled';
  @Column({ nullable: true }) confirmedAt: Date | null;
}
```

### @itadx/audit — 감사 로그 자동 기록
```typescript
// libs/audit/src/interceptors/audit.interceptor.ts
// → @Auditable('RECEIVING_CONFIRM') 붙이면 API 호출 시 자동 로그 저장
intercept(context, next) {
  return next.handle().pipe(
    tap(async (response) => {
      await this.dataSource.query(
        'INSERT INTO audit_logs (user_id, action, ...) VALUES ($1,$2,...)', [...]
      );
    }),
  );
}
```

## 📁 전체 구조
```
libs/common/     ← ApiResponse 타입, 에러코드, 유틸 함수
libs/auth/       ← JwtAuthGuard, RolesGuard, @Roles, @CurrentUser
libs/audit/      ← AuditInterceptor, @Auditable
libs/database/   ← 11개 Entity (DB 테이블 매핑)
libs/config/     ← 환경변수 검증 (Joi)
libs/websocket/  ← WebSocket Gateway (실시간 알림)
```
