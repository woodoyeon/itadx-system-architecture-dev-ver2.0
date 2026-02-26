# engine/engine-api — AI 엔진 상세 가이드

## 이 서비스의 역할

Python(FastAPI) 기반 신용평가/심사 엔진입니다.
**Pandas/NumPy**로 입고·정산 데이터를 분석하여 점수를 계산합니다.
Nest.js 백엔드에서 **HTTP 또는 Bull Queue**를 통해 호출됩니다.

**포트:** 8000
**프레임워크:** FastAPI (Python)

---

## 통신 흐름도

```
호출 방법 1: Bull Queue (비동기)
[erp-api] → creditQueue.add() → [Redis] → [credit-score.processor.ts]
    → HTTP POST http://engine-api:8000/api/v10/score

호출 방법 2: 직접 HTTP (동기)
[프론트] → [gateway-api] → /api/v41/* → [engine-api:8000]
    → Python이 직접 응답
```

---

## 파일별 역할 상세

### 📁 routers/ — FastAPI 라우터 (API 엔드포인트)

#### `routers/v10_router.py` ★ 신용평가 API

**엔드포인트:**
| 메서드 | 경로 | 역할 | 호출자 |
|--------|------|------|--------|
| POST | /api/v10/score | 가맹점 신용점수 산출 | Bull Queue Worker |

**코드가 하는 일:**
1. `V10Request` — Pydantic 모델로 요청 검증 (merchant_id 필수)
2. `score_merchant(req.merchant_id)` — 서비스 호출
3. JSON 응답 반환

**통신 흐름:**
```
credit-score.processor.ts (Nest.js)
    → axios.post('http://engine-api:8000/api/v10/score', { merchant_id: 'xxx' })
    → v10_router.py가 요청 수신
    → v10_service.py의 score_merchant() 호출
    → { success: true, data: { score: 750, grade: 'B', factors: {...} } }
```

---

#### `routers/v41_router.py` — 마트 심사 API

**엔드포인트:** POST /api/v41/screen
**역할:** 마트의 안정성 종합 평가
**패턴:** v10_router.py와 동일

---

#### `routers/dual_track_router.py` — 듀얼트랙 리스크 API

**엔드포인트:** POST /api/dual-track/assess
**패턴:** v10_router.py와 동일

---

#### `routers/branch_risk_router.py` — 지점 리스크 API

**엔드포인트:** POST /api/branch-risk/calculate
**패턴:** v10_router.py와 동일

---

#### `routers/health.py` — 헬스체크

**엔드포인트:** GET /health
**역할:** 서버 정상 작동 확인 (Docker 헬스체크용)

---

### 📁 services/ — 핵심 계산 로직

#### `services/v10_service.py` ★★★ 신용평가 핵심

**역할:** 가맹점의 입고/정산 데이터를 분석하여 신용점수(0~1000) 산출

**코드가 하는 일 (score_merchant 함수):**

```
Step 1: PostgreSQL에서 데이터 조회 (Pandas)
  → pd.read_sql("SELECT ... FROM receivings WHERE merchant_id = %s", conn)
  → 최근 6개월 입고 데이터를 DataFrame으로 가져옴
  → pd.read_sql("SELECT ... FROM settlements WHERE ...", conn)
  → 최근 6개월 정산 데이터

Step 2: Factor 1 — 거래 규모 (300점 만점)
  → total_amount = receivings['total_amount'].sum()
  → volume_score = min(300, total_amount / 1,000,000 * 30)
  → 1억원이면 300점 만점

Step 3: Factor 2 — 입고확인률 (250점 만점)
  → confirmed 건수 / 전체 건수
  → confirm_score = confirm_rate * 250
  → 100% 확인이면 250점 만점

Step 4: Factor 3 — 정산 이행률 (250점 만점)
  → completed 건수 / 전체 건수
  → settle_score = settle_rate * 250

Step 5: Factor 4 — 거래 안정성 (200점 만점)
  → cv = std(금액) / mean(금액)  ← 변동계수
  → stability_score = max(0, 200 * (1 - cv))
  → 변동이 적을수록 높은 점수

Step 6: 총점 → 등급
  → total = volume + confirm + settle + stability (0~1000)
  → A: 800+, B: 600+, C: 400+, D: 200+, E: 200 미만

Step 7: 결과 DB 저장
  → INSERT INTO credit_scores (merchant_id, score, grade, factors, ...)
```

**이 패턴으로 확장:**
- v41_service.py — 마트 심사 (동일한 Pandas 조회 + 점수 계산 구조)
- dual_track_service.py — 듀얼트랙 리스크 (동일 구조)

---

#### `services/v41_service.py` — 마트 심사 (v41)

**역할:** 마트의 전체 안정성 평가 (4개 항목 가중 합산)
**패턴:** v10_service.py와 동일 (Pandas 조회 → 점수 계산 → DB 저장)

---

#### `services/dual_track_service.py` — 듀얼트랙 리스크

**역할:** Track A(성장) / Track B(안정) 이중 리스크 평가
**패턴:** v10_service.py와 동일

---

#### `services/branch_risk_service.py` — 지점 리스크

**역할:** 지점별 리스크 지수 계산
**패턴:** v10_service.py와 동일

---

#### `services/db.py` ★ PostgreSQL 연결

**역할:** psycopg2로 PostgreSQL 연결 관리

**코드가 하는 일:**
```python
def get_connection():
    return psycopg2.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        port=os.environ.get('DB_PORT', 5432),
        database=os.environ.get('DB_NAME', 'itadx_mvp'),
        user=os.environ.get('DB_USER', 'itadx'),
        password=os.environ.get('DB_PASSWORD', 'itadx1234'),
    )
```

**WHY psycopg2인가 (TypeORM이 아니라):**
- Python에서 PostgreSQL 접근하는 표준 라이브러리
- Pandas의 `pd.read_sql()`이 psycopg2 connection을 직접 사용
- 읽기 위주 작업이라 ORM 불필요

---

### 📁 models/ — Pydantic 스키마

#### `models/schemas.py`

**역할:** API 요청/응답의 데이터 구조 정의
- `V10Request` — merchant_id (필수), triggered_by (선택)
- `V41Request` — mart_id (필수)
- `ScoreResponse` — score, grade, factors

---

### 📁 utils/ — 유틸리티

#### `utils/helpers.py` — 공통 계산 함수
#### `utils/db.py` — DB 헬퍼 (services/db.py의 대안)

---

### 📁 tests/ — 테스트

#### `tests/test_v10.py` — 신용평가 테스트
#### `tests/test_v41.py` — 마트 심사 테스트

---

### 루트 파일

#### `main.py` — FastAPI 앱 시작

**코드가 하는 일:**
1. `FastAPI()` — 앱 생성
2. `app.include_router(v10_router)` — 각 라우터 등록
3. `uvicorn.run(app, host='0.0.0.0', port=8000)` — 8000번 포트 시작

---

#### `requirements.txt` — Python 의존성
```
fastapi==0.104.1
uvicorn==0.24.0
pandas==2.1.4
numpy==1.26.2
psycopg2-binary==2.9.9
pydantic==2.5.2
```

#### `Dockerfile` — Docker 이미지 빌드
