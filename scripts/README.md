# 🗃 scripts/ — DB 스키마 + 시드 데이터

## DB 통신 구조
```
[Nest.js] ←── TypeORM ──→ [PostgreSQL :5432]
[FastAPI] ←── psycopg2 ──→ [PostgreSQL :5432]
```

## 실행
```bash
docker exec -i itadx-postgres psql -U itadx -d itadx_mvp < scripts/init-db.sql  # 테이블 생성
docker exec -i itadx-postgres psql -U itadx -d itadx_mvp < scripts/seed.sql     # 테스트 데이터
```

## 테스트 계정 (seed.sql에 포함)
| Email | Password | Role |
|-------|----------|------|
| bank@itadx.com | password123 | 은행 |
| mart1@itadx.com | password123 | 마트 |
| admin@itadx.com | password123 | 관리자 |

## 실제 파일
- `init-db.sql` — 11 테이블 CREATE + 28 인덱스
- `seed.sql` — 마트 3개, 지점 6개, 가맹점 9개, 입고 12건
