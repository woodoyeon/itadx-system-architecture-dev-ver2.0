## admin-api — 관리(마트/지점/가맹점/사용자) 서비스

### 1. 이 폴더의 목적

- `services/admin-api`의 주요 기능을 **발표용으로 한 눈에 보이게 정리**합니다.  
- 상세 코드는 `services/admin-api/GUIDE.md` 및 각 모듈 내부에서 확인합니다.

---

### 2. 서비스 역할

- **포트 4000**, Nest.js 기반 **관리(Administration) 서비스**  
- ItaDX 전체에서 **마스터 데이터**를 담당:
  - 마트, 지점, 가맹점, 사용자, 대시보드 KPI
- 은행/본부 운영자가 이 서비스를 통해 **조직 구조와 사용자·거래처 정보를 관리**합니다.

---

### 3. 도메인별 책임 (발표용 표)

| 도메인      | 예시 엔드포인트         | 설명                            |
|-------------|-------------------------|---------------------------------|
| 마트(Mart)  | `GET /marts`, `POST /marts` | 마트 목록·등록·수정·삭제 (검색/페이지네이션 포함) |
| 지점(Branch)| `GET /branches`        | 마트별 지점 관리                |
| 가맹점(Merchant)| `GET /merchants`   | 가맹점 CRUD, 사업자번호 중복 체크    |
| 사용자(User)| `GET /users`           | 사용자 계정/역할 관리             |
| 대시보드(KPI)| `GET /dashboard/kpi`  | 활성 마트 수, 입고합계, 확인률 등 집계 |

모든 응답은 `libs/common`의 공통 응답 형식을 따릅니다.

---

### 4. 핵심 기술 포인트

- **TypeORM 기반 CRUD 패턴**
  - `findAndCount` + 검색/정렬/페이지네이션을 이용해 **표준화된 목록 API** 제공
  - 예: 마트 목록 조회 시 `search`, `page`, `limit`, `sortBy`, `sortOrder` 파라미터 처리

- **역할 기반 접근 제어**
  - `@Roles('bank', 'admin')` 등으로 각 엔드포인트 접근 권한을 제한
  - `@itadx/auth` 라이브러리의 `RolesGuard` 사용

- **MSA 규칙 준수**
  - **다른 서비스의 테이블을 직접 SELECT 하지 않음**
  - 필요한 경우 HTTP로 `erp-api`, `engine-api` 등에 요청

---

### 5. 코드 구조 (요약)

- `src/mart/*` : 마트 CRUD 컨트롤러/서비스/DTO  
- `src/branch/*` : 지점 관리  
- `src/merchant/*` : 가맹점 관리  
- `src/user/*` : 사용자 관리 (비밀번호 해싱, 역할 변경 등)  
- `src/dashboard/*` : KPI 집계 서비스  
- 공통으로 `JwtAuthGuard`, `RolesGuard`, `createPaginatedResponse`를 사용

---

### 6. 발표에서 어떻게 보여줄지

- **은행/관리자 관점**에서 다음 흐름으로 설명하면 자연스럽습니다.
  1. admin-web의 은행/관리자 메뉴 (`/bank/marts`, `/admin/users`)에서 목록 조회  
  2. `GET /api/marts`, `GET /api/users` 요청 → Gateway → `admin-api`  
  3. `mart.service.ts`, `user.service.ts`에서 TypeORM으로 DB 조회  
  4. `{ success: true, data: [...], meta: { page, total } }` 형태로 응답  
  5. 대시보드(`GET /api/dashboard/kpi`)는 동일한 패턴으로 합계·비율을 계산하여 전달

