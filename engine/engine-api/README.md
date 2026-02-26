# 🧠 engine-api — Python 평가 엔진

> **WAS**: FastAPI (Python)
> **포트**: 8000
> **DB 통신**: psycopg2 (PostgreSQL 직접 연결)

## 📡 통신 흐름 + 실제 코드

### v10 신용평가 — `services/v10_service.py`
```python
def score_merchant(merchant_id, triggered_by=None):
    # ① DB에서 최근 6개월 입고 데이터 조회 (Pandas로 읽기)
    with get_connection() as conn:
        receivings = pd.read_sql(
            "SELECT total_amount, status FROM receivings WHERE merchant_id = %s",
            conn, params=(merchant_id,)
        )

    # ② 4가지 요소로 점수 산출 (총 1000점)
    volume_score    = min(300, total_amount / 1_000_000 * 30)  # 거래규모 300점
    confirm_score   = confirm_rate * 250                        # 입고확인률 250점
    settle_score    = settle_rate * 250                         # 정산이행률 250점
    stability_score = max(0, 200 * (1 - cv))                   # 거래안정성 200점

    total = int(volume_score + confirm_score + settle_score + stability_score)

    # ③ 등급 산출
    grade = 'A' if total >= 800 else 'B' if total >= 600 else 'C' ...

    # ④ DB에 결과 저장
    with get_connection() as conn:
        cur.execute("INSERT INTO credit_scores (...) VALUES (%s,%s,...)", ...)

    return { "score": total, "grade": grade, "factors": {...} }
```

### 실제 API 라우터 — `routers/v10_router.py`
```python
@router.post("/score")
async def credit_score(req: V10Request):
    """★ 입고확인 후 Bull Queue에서 이 API를 호출함"""
    return score_merchant(req.merchant_id, req.triggered_by)
```

## 📁 실제 코드 파일
```
main.py                          ← FastAPI 앱 + 라우터 등록
routers/v41_router.py            ← POST /api/v41/screen (마트심사)
routers/v10_router.py            ← POST /api/v10/score (신용평가)
services/v41_service.py          ← 마트 안정성 평가 (4개 요소 가중합산)
services/v10_service.py          ← ★ 가맹점 신용평가 (Pandas)
services/dual_track_service.py   ← 듀얼트랙 리스크 (Track A/B)
services/branch_risk_service.py  ← 지점 위험지수 산출
services/db.py                   ← PostgreSQL 연결 (psycopg2)
```
