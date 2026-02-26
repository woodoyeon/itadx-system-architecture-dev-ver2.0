# 🔐 auth-api — 인증 서비스 (Nest.js)

> **담당**: OAuth 개발자
> **WAS**: Nest.js 10 (Node.js 런타임)
> **포트**: 4001
> **DB 통신**: TypeORM → PostgreSQL

## 📡 통신 흐름 + 실제 코드 위치

### ① 로그인 — `src/auth/auth.service.ts`
```
[브라우저] ── POST /api/auth/login ──→ [이 서비스 :4001]
             { email, password }
```
```typescript
// 실제 코드 (auth.service.ts의 login 메서드)
async login(dto: LoginDto) {
  const user = await this.userRepo.findOne({ where: { email: dto.email } });
  const isValid = await bcrypt.compare(dto.password, user.passwordHash);
  // → JWT 토큰 2개 생성 (accessToken 15분, refreshToken 7일)
  const accessToken = this.jwtService.sign(payload);
  const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
  // → refreshToken 해시하여 DB 저장 (탈취 방지)
  const tokenHash = await bcrypt.hash(refreshToken, 10);
  await this.tokenRepo.save({ userId: user.id, tokenHash, ... });
  return { accessToken, refreshToken };
}
```

### ② 토큰 갱신 — `src/auth/auth.service.ts`
```
[브라우저] ── POST /api/auth/refresh ──→ [이 서비스]
             { refreshToken }
→ DB에서 해시 비교 → 새 accessToken 발급
```

### ③ Redis 세션 관리 — `src/session/session.service.ts`
```typescript
// 실제 코드: 로그아웃 시 토큰 블랙리스트에 등록
async blacklistToken(jti: string, ttlSec: number) {
  await this.redis.set(`bl:${jti}`, '1', 'EX', ttlSec);
  // → 이후 이 토큰으로 요청 시 → "만료된 토큰" 에러
}
```

## 📁 실제 코드 파일 위치
```
src/main.ts               ← 서버 부팅 (포트 4001, Swagger 문서)
src/app.module.ts          ← 모듈 조립 (TypeORM + Auth + Session)
src/auth/auth.controller.ts ← API 라우팅 (POST /login, /refresh, /logout, GET /profile)
src/auth/auth.service.ts    ← ★ 핵심 로직 (로그인, 토큰 생성, 검증)
src/auth/dto/login.dto.ts   ← 요청 검증 (email 필수, password 8자 이상)
src/session/session.service.ts ← Redis 블랙리스트 관리
```

## 📦 주요 라이브러리 (package.json 참고)
| 라이브러리 | 역할 |
|-----------|------|
| `@nestjs/passport` + `passport-jwt` | JWT 토큰 검증 |
| `bcrypt` | 비밀번호 해싱 (단방향 암호화) |
| `ioredis` | Redis 연결 (토큰 블랙리스트) |
| `typeorm` + `pg` | PostgreSQL ORM |
| `class-validator` | DTO 자동 유효성 검사 |
