# scripts/ — DB 스키마 + 시드 데이터 상세 가이드

## 이 폴더의 역할

PostgreSQL 데이터베이스의 **테이블 생성(DDL)** 과 **테스트 데이터 삽입(DML)** 을 담당합니다.
개발 환경 세팅 시 가장 먼저 실행해야 합니다.

---

## 파일별 역할 상세

### `init-db.sql` ★ DB 스키마 (테이블 생성)

**역할:** 11개 테이블 CREATE + 28개 인덱스 생성

**실행법:**
```bash
docker exec -i itadx-postgres psql -U itadx -d itadx_mvp < scripts/init-db.sql
```

**생성되는 테이블:**

| 테이블 | 역할 | 사용하는 서비스 |
|--------|------|----------------|
| `users` | 사용자 (은행/마트/관리자) | auth-api |
| `refresh_tokens` | JWT 리프레시 토큰 해시 | auth-api |
| `marts` | 마트 정보 | admin-api |
| `branches` | 마트 지점 | admin-api |
| `merchants` | 가맹점 | admin-api |
| `receivings` | ★ 입고 내역 | erp-api |
| `settlements` | 정산 내역 | erp-api |
| `credit_scores` | 신용점수 결과 | engine-api |
| `risk_assessments` | 리스크 평가 | engine-api |
| `audit_logs` | 감사 로그 | 전체 |
| `notifications` | 알림 이력 | erp-api |

**테이블 관계:**
```
marts (1) ──→ (N) branches (1) ──→ (N) merchants
  │                                        │
  └── (1) → (N) receivings ←── (N) ───────┘
                    │
                    ├── (trigger) → credit_scores
                    └── (trigger) → settlements
```

**인덱스 설명:**
```sql
-- 입고 조회 속도 향상 (마트별, 상태별, 날짜별)
CREATE INDEX idx_receivings_mart_id ON receivings(mart_id);
CREATE INDEX idx_receivings_status ON receivings(status);
CREATE INDEX idx_receivings_date ON receivings(receiving_date);

-- 감사 로그 조회 (사용자별, 날짜별)
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

### `seed.sql` ★ 테스트 데이터

**역할:** 개발/데모용 테스트 데이터 삽입

**실행법:**
```bash
docker exec -i itadx-postgres psql -U itadx -d itadx_mvp < scripts/seed.sql
```

**삽입되는 데이터:**

| 테이블 | 건수 | 내용 |
|--------|------|------|
| `users` | 5 | bank@itadx.com, mart1~2@itadx.com, admin@itadx.com, viewer@itadx.com |
| `marts` | 3 | 롯데마트, 이마트, 홈플러스 |
| `branches` | 6 | 각 마트당 2개 지점 |
| `merchants` | 9 | 각 지점당 1~2개 가맹점 |
| `receivings` | 12 | 다양한 상태 (pending/confirmed/cancelled) |

**테스트 계정:**
| 이메일 | 비밀번호 | 역할 |
|--------|----------|------|
| bank@itadx.com | password123 | 은행 (은행 대시보드) |
| mart1@itadx.com | password123 | 마트 (입고확인 화면) |
| mart2@itadx.com | password123 | 마트 (다른 마트) |
| admin@itadx.com | password123 | 관리자 (전체 접근) |
| viewer@itadx.com | password123 | 뷰어 (읽기만) |

---

### `dev-start.sh` — 개발 서버 시작 스크립트

**역할:** 모든 서비스를 한번에 시작

**코드가 하는 일:**
```bash
# 1. 환경변수 로드
source ./envs/.env.dev

# 2. 각 서비스를 백그라운드로 시작
cd apps/admin-web && pnpm dev &          # 프론트엔드 :3000
cd services/auth-api && pnpm dev &       # 인증 :4001
cd services/admin-api && pnpm dev &      # 관리 :4000
cd services/erp-api && pnpm dev &        # ★ ERP :4002
cd services/gateway-api && pnpm dev &    # Gateway :4003
cd engine/engine-api && uvicorn main:app --port 8000 --reload &  # Python :8000
```

---

### `backup.sh` — DB 백업 스크립트

**역할:** PostgreSQL 데이터를 파일로 백업
```bash
pg_dump -U itadx itadx_mvp > backup_$(date +%Y%m%d).sql
```

---

## DB 통신 구조

```
[Nest.js 서비스들]
    │
    ├─ TypeORM ──→ [PostgreSQL :5432]
    │   (JS 객체 ↔ SQL 자동 변환)
    │   예: receivingRepo.findOne({ where: { id } })
    │       → SELECT * FROM receivings WHERE id = $1
    │
[Python 엔진]
    │
    └─ psycopg2 + Pandas ──→ [PostgreSQL :5432]
        (직접 SQL 실행)
        예: pd.read_sql("SELECT * FROM receivings WHERE ...", conn)
```
