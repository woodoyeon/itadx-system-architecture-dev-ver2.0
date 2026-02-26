# services/auth-api — 인증 서비스 상세 가이드

## 이 서비스의 역할

JWT 기반 로그인/인증/토큰 관리를 담당합니다.
모든 API 요청의 **첫 번째 관문**입니다.

**포트:** 4001
**프레임워크:** Nest.js (TypeScript)

---

## 통신 흐름도

```
[프론트 로그인 버튼]
    → POST /api/auth/login { email, password }
    → [Nginx] → [gateway-api] → [auth-api :4001]
        │
        ├─ [auth.controller.ts]  요청 라우팅
        │       ↓
        ├─ [auth.service.ts]     비밀번호 검증 + JWT 발급
        │       │
        │       ├─ [PostgreSQL]  users 테이블에서 사용자 조회
        │       │                refresh_tokens 테이블에 토큰 해시 저장
        │       │
        │       └─ [Redis]  로그아웃 시 JWT를 블랙리스트에 등록
        │
        └─ { accessToken, refreshToken } 응답
```

---

## 파일별 역할 상세

### `src/auth/auth.controller.ts` — 인증 API 라우터

**엔드포인트 목록:**
| 메서드 | 경로 | 역할 | 인증 필요 |
|--------|------|------|----------|
| POST | /auth/login | 로그인 (JWT 발급) | ❌ |
| POST | /auth/refresh | 토큰 갱신 | ❌ |
| POST | /auth/logout | 로그아웃 (토큰 블랙리스트) | ✅ |
| GET | /auth/profile | 내 정보 조회 | ✅ |

---

### `src/auth/auth.service.ts` ★ 인증 핵심 로직

**코드가 하는 일:**

**login(dto):**
1. `userRepo.findOne({ email })` — DB에서 사용자 조회
2. `bcrypt.compare(password, user.passwordHash)` — 비밀번호 검증 (단방향 암호화)
3. `jwtService.sign(payload)` — Access Token 생성 (15분 만료)
4. `jwtService.sign(payload, { expiresIn: '7d' })` — Refresh Token 생성 (7일 만료)
5. `bcrypt.hash(refreshToken, 10)` — Refresh Token 해시화 후 DB 저장 (탈취 방지)

**refresh(dto):**
1. Refresh Token 검증
2. DB에 저장된 해시와 비교
3. 새 Access Token 발급

**logout(user):**
1. `sessionService.blacklistToken(jti, ttl)` — Redis에 토큰 ID 등록
2. 이후 이 토큰으로 요청하면 "만료된 토큰" 에러

**WHY 토큰 2개인가:**
- Access Token (15분): API 요청마다 사용, 짧은 만료로 보안 강화
- Refresh Token (7일): Access Token 갱신용, DB에 해시 저장

---

### `src/auth/dto/login.dto.ts` — 로그인 요청 검증

**코드가 하는 일:**
- `@IsEmail()` — 이메일 형식 검증
- `@MinLength(8)` — 비밀번호 8자 이상 검증
- 검증 실패 시 400 Bad Request 자동 응답

---

### `src/auth/dto/refresh.dto.ts` — 토큰 갱신 요청 검증

---

### `src/session/session.service.ts` ★ Redis 세션 관리

**역할:** JWT 토큰 블랙리스트를 Redis로 관리

**코드가 하는 일:**
```
blacklistToken(jti, ttlSec):
  → redis.set(`bl:${jti}`, '1', 'EX', ttlSec)
  → Redis에 'bl:토큰ID' = '1' 저장 (TTL 만료 시 자동 삭제)

isBlacklisted(jti):
  → redis.get(`bl:${jti}`)
  → 값이 있으면 블랙리스트된 토큰 (로그아웃됨)
```

**WHY Redis인가:**
- 메모리 기반이라 초고속 조회 (매 API 요청마다 체크)
- TTL(Time-To-Live)로 만료된 토큰 자동 정리
- 서버 재시작해도 데이터 유지

---

### `src/session/session.module.ts` — Redis 연결 설정

### `src/main.ts` — 서버 시작 (포트 4001)

### `src/app.module.ts` — 모듈 조립
- TypeOrmModule — PostgreSQL (users, refresh_tokens 테이블)
- AuthModule — 인증 로직
- SessionModule — Redis 세션

---

### 설정 파일

#### `package.json` 주요 의존성:
- `@nestjs/jwt` — JWT 생성/검증
- `@nestjs/passport`, `passport-jwt` — Passport 인증 전략
- `bcrypt` — 비밀번호 단방향 암호화
- `ioredis` — Redis 클라이언트

#### `test/auth.service.spec.ts` — 유닛 테스트 예시
