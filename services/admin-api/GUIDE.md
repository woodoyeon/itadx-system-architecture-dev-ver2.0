# services/admin-api — 관리 서비스 상세 가이드

## 이 서비스의 역할

마트/지점/가맹점/사용자의 **CRUD(생성/조회/수정/삭제)** 를 담당합니다.
대시보드 KPI 집계도 이 서비스에서 처리합니다.

**포트:** 4000
**프레임워크:** Nest.js (TypeScript)

---

## 통신 흐름도

```
[프론트 api.get('/marts')]
    → [Nginx] → [gateway-api] → [admin-api :4000]
        │
        ├─ [mart.controller.ts]  JWT 인증 + 역할 체크
        │       ↓
        ├─ [mart.service.ts]     TypeORM으로 DB 조회
        │       ↓
        └─ [PostgreSQL]  SELECT * FROM marts WHERE ...
```

---

## 파일별 역할 상세

### 📁 src/mart/ — 마트 관리 (CRUD 예시 패턴)

#### `src/mart/mart.controller.ts` — 마트 API 라우터

**엔드포인트 목록:**
| 메서드 | 경로 | 역할 | 권한 |
|--------|------|------|------|
| GET | /marts | 마트 목록 (페이지네이션+검색) | bank, admin |
| GET | /marts/:id | 마트 상세 | bank, admin |
| POST | /marts | 마트 등록 | admin |
| PATCH | /marts/:id | 마트 수정 | admin |
| DELETE | /marts/:id | 마트 삭제 | admin |

---

#### `src/mart/mart.service.ts` ★ TypeORM CRUD 패턴 예시

**코드가 하는 일:**

`findAll(query)`:
```
입력: { search: '롯데', page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'DESC' }
  ↓
TypeORM 코드:
  this.martRepo.findAndCount({
    where: search ? { name: Like(`%${search}%`) } : {},
    order: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  })
  ↓
자동 변환된 SQL:
  SELECT * FROM marts WHERE name LIKE '%롯데%'
  ORDER BY created_at DESC LIMIT 20 OFFSET 0
  ↓
반환: { items: [...], total: 50, page: 1, limit: 20 }
```

**이 패턴으로 확장:**
- `branch.service.ts` — 지점 CRUD (동일 구조)
- `merchant.service.ts` — 가맹점 CRUD (동일 구조)
- `user.service.ts` — 사용자 CRUD (동일 구조)

---

#### `src/mart/dto/create-mart.dto.ts` — 마트 등록 검증

**코드가 하는 일:**
- `@IsString()` name — 마트명 필수
- `@Matches(/^\d{3}-\d{2}-\d{5}$/)` businessNumber — 사업자번호 형식 (123-45-67890)
- `@IsOptional()` address — 주소 선택

#### `src/mart/dto/update-mart.dto.ts` — 마트 수정 검증 (PartialType)

---

### 📁 src/branch/ — 지점 관리

#### `src/branch/branch.controller.ts` — 지점 API (GET/POST)
#### `src/branch/branch.service.ts` — 지점 CRUD (mart.service.ts와 동일 패턴)
#### `src/branch/dto/create-branch.dto.ts` — 지점 등록 검증

---

### 📁 src/merchant/ — 가맹점 관리

#### `src/merchant/merchant.controller.ts` — 가맹점 API
#### `src/merchant/merchant.service.ts` — 가맹점 CRUD + 사업자번호 중복 체크
#### `src/merchant/dto/create-merchant.dto.ts` — 가맹점 등록 검증

---

### 📁 src/dashboard/ — 대시보드 KPI

#### `src/dashboard/dashboard.service.ts` ★ KPI 집계

**코드가 하는 일:**
```sql
-- 활성 마트 수
SELECT COUNT(*) FROM marts WHERE status = 'active'

-- 이번 달 입고 총액
SELECT COALESCE(SUM(total_amount), 0) FROM receivings
WHERE receiving_date >= DATE_TRUNC('month', NOW())

-- 입고 확인률
SELECT COUNT(CASE WHEN status='confirmed') / COUNT(*) FROM receivings
```

#### `src/dashboard/dashboard.controller.ts` — GET /api/dashboard/kpi

---

### 📁 src/user/ — 사용자 관리

#### `src/user/user.service.ts` — 사용자 CRUD + bcrypt 해싱
#### `src/user/user.controller.ts` — 사용자 API (admin 전용)
#### `src/user/dto/create-user.dto.ts` — 사용자 등록 검증

---

### MSA 규칙 (중요!)

**❌ 하면 안 되는 것:**
```typescript
// admin-api에서 erp-api의 receivings 테이블 직접 조회
this.dataSource.query('SELECT * FROM receivings WHERE mart_id = $1', [martId]);
```

**✅ 올바른 방법:**
```typescript
// HTTP로 erp-api에 요청
const { data } = await axios.get('http://erp-api:4002/api/receivings', {
  params: { martId },
  headers: { Authorization: `Bearer ${internalToken}` }
});
```

WHY: 각 서비스는 자기 테이블만 직접 접근. 다른 서비스 데이터는 HTTP API로 요청.
