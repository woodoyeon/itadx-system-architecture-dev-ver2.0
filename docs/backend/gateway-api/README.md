## gateway-api — API 게이트웨이 & Rate Limit

### 1. 이 폴더의 목적

- `services/gateway-api`가 하는 일을 **발표용으로 간단히 설명**하기 위한 README입니다.  
- 코드 상세 설명은 `services/gateway-api/GUIDE.md`를 참고합니다.

---

### 2. 서비스 역할

- **포트 4003**, Nest.js 기반 **API 게이트웨이 서비스**  
- 모든 `/api/*` 요청이 **반드시 거쳐 가는 관문**입니다.

주요 책임:
- URL prefix에 따라 **각 백엔드 서비스로 프록시**  
- Redis를 이용한 **Rate Limiting (IP당 요청 횟수 제한)**  
- 프론트엔드에서는 실제 백엔드 주소를 몰라도, 항상 `/api/...`만 호출하면 됩니다.

---

### 3. 라우팅 규칙 (발표용 표)

| URL Prefix         | 대상 서비스    | 포트  | 설명                 |
|--------------------|---------------|-------|----------------------|
| `/api/auth/*`      | `auth-api`    | 4001  | 로그인/프로필/토큰   |
| `/api/marts/*`     | `admin-api`   | 4000  | 마트/조직 관리        |
| `/api/branches/*`  | `admin-api`   | 4000  | 지점 관리             |
| `/api/merchants/*` | `admin-api`   | 4000  | 가맹점 관리           |
| `/api/dashboard/*` | `admin-api`   | 4000  | KPI 대시보드          |
| `/api/receivings/*`| `erp-api`     | 4002  | 입고 목록/확인        |
| `/api/settlements/*`| `erp-api`    | 4002  | 정산                  |
| `/api/v10/*`       | `engine-api`  | 8000  | 신용평가              |
| `/api/v41/*`       | `engine-api`  | 8000  | 마트심사              |

---

### 4. Rate Limit 개념

- **왜 필요한가?**
  - 같은 IP에서 과도한 호출(버그/악의적 공격)이 발생했을 때,  
    전체 백엔드가 영향을 받지 않도록 **앞단에서 차단**하기 위해 사용합니다.

- **어떻게 동작하는가?** (개념)
  - 요청이 들어올 때마다 `redis.incr('rl:<IP>')` 로 카운트 +1  
  - 첫 요청이면 `expire 60초` 설정 → 60초 동안 카운트 유지  
  - 카운트가 설정값(예: 분당 100회)을 넘으면 **HTTP 429 (Too Many Requests)** 응답

---

### 5. 발표에서 어떻게 보여줄지

- **큰 그림**:  
  - Next.js → Gateway → (auth/admin/erp/engine) 로 이어지는 **단일 진입점**  
  - \"프론트는 `/api`만 알고, 뒤에 어떤 서비스가 있는지는 Gateway가 책임진다\"는 메시지를 강조

- **보안/안정성 포인트**:  
  - JWT 검사는 각 서비스에서 담당하지만,  
  - 트래픽 폭주/남용 방지는 Gateway + Redis에서 먼저 처리한다는 점을 함께 설명하면 좋습니다.

