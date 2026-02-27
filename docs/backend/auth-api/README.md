## auth-api — 인증 서비스 (JWT)

### 1. 이 폴더의 목적

- `services/auth-api`의 기능을 **발표자료용으로 요약**합니다.  
- 상세한 코드는 `services/auth-api/GUIDE.md` 및 각 소스 파일에서 확인할 수 있습니다.

---

### 2. 서비스 역할

- **포트 4001**, Nest.js 기반 **인증 서비스**  
- 모든 로그인·토큰 관리의 **첫 관문** 역할을 담당합니다.
- 주요 책임
  - 이메일/비밀번호 로그인
  - Access / Refresh Token 발급·갱신
  - 로그아웃 시 토큰 **Redis 블랙리스트 등록**
  - `GET /auth/profile` 로 현재 사용자 정보 제공

---

### 3. 대표 API (발표용 표)

| 메서드 | 경로            | 요약           | 인증 |
|--------|-----------------|----------------|------|
| POST   | `/auth/login`   | 로그인, 토큰 발급 | ❌   |
| POST   | `/auth/refresh` | 토큰 갱신        | ❌   |
| POST   | `/auth/logout`  | 로그아웃         | ✅   |
| GET    | `/auth/profile` | 내 프로필 조회     | ✅   |

- 성공 시 응답은 공통 포맷(`libs/common`의 `createResponse`)을 사용:
  - `{ success: true, data: { ... } }`

---

### 4. 핵심 기술 포인트

- **JWT 기반 인증**
  - Access Token(짧은 수명) + Refresh Token(긴 수명) 2단 구조
  - Refresh Token 원문은 DB에 저장하지 않고 **bcrypt 해시**만 저장

- **Redis 블랙리스트**
  - 로그아웃 시 해당 토큰의 JTI를 Redis에 `TTL`과 함께 저장  
  - 이후 같은 토큰을 사용하면 \"만료된 토큰\"으로 처리 (즉시 무효화 효과)

- **Nest.js + Passport**
  - `JwtStrategy`, `JwtAuthGuard` 를 통해 컨트롤러 단에서 인증을 강제
  - 다른 서비스(`admin-api`, `erp-api`)에서도 동일한 Guard를 재사용

---

### 5. 코드 구조 (요약)

- `src/main.ts` : 서버 부팅, Swagger, 전역 파이프 설정  
- `src/app.module.ts` : TypeORM, AuthModule, SessionModule 조립  
- `src/auth/auth.controller.ts` : `/auth/*` 라우팅  
- `src/auth/auth.service.ts` : 로그인, 토큰 발급/검증 로직  
- `src/auth/dto/login.dto.ts` : `email`, `password` 유효성 검사 (`@IsEmail`, `@MinLength(8)`)  
- `src/session/session.service.ts` : Redis 블랙리스트 관리

---

### 6. 발표에서 어떻게 보여줄지

- **로그인 시나리오**를 기준으로 설명하면 이해가 쉽습니다.
  1. `admin-web` 로그인 화면에서 `POST /api/auth/login` 호출  
  2. Gateway → `auth-api`로 라우팅  
  3. `auth.service.login()`에서 사용자 조회 + 비밀번호 검증 + JWT 발급  
  4. 성공 시 `{ accessToken, refreshToken }` 반환 → 프론트에서 저장  
  5. 이후 모든 API는 Authorization 헤더에 Access Token을 포함하여 호출

