"""
V10 신용평가 엔진

WHY: 가맹점의 입고확인·정산 데이터를 기반으로 신용등급 산출
★ 입고확인(confirmReceiving) 후 Bull Queue에서 비동기 호출됨
"""
import pandas as pd
import numpy as np
from datetime import datetime
from services.db import get_connection

def score_merchant(merchant_id: str, triggered_by: str = None) -> dict:
    """가맹점 신용점수 산출 (0-1000)"""

    with get_connection() as conn:
        # 최근 6개월 입고 데이터
        receivings = pd.read_sql(
            """SELECT total_amount, status, receiving_date, confirmed_at
               FROM receivings WHERE merchant_id = %s
               AND receiving_date >= NOW() - INTERVAL '6 months'
               ORDER BY receiving_date""",
            conn, params=(merchant_id,)
        )

        # 정산 데이터
        settlements = pd.read_sql(
            """SELECT amount, status, settled_at
               FROM settlements WHERE merchant_id = %s
               AND created_at >= NOW() - INTERVAL '6 months'""",
            conn, params=(merchant_id,)
        )

    # Factor 1: 거래 규모 (300점 만점)
    if len(receivings) > 0:
        total_amount = receivings["total_amount"].astype(float).sum()
        volume_score = min(300, total_amount / 1_000_000 * 30)
    else:
        volume_score = 0

    # Factor 2: 입고확인률 (250점 만점)
    if len(receivings) > 0:
        confirmed = receivings[receivings["status"] == "confirmed"]
        confirm_rate = len(confirmed) / len(receivings)
        confirm_score = confirm_rate * 250
    else:
        confirm_score = 0

    # Factor 3: 정산 이행률 (250점 만점)
    if len(settlements) > 0:
        completed = settlements[settlements["status"] == "completed"]
        settle_rate = len(completed) / len(settlements)
        settle_score = settle_rate * 250
    else:
        settle_score = 125  # 데이터 없으면 중간값

    # Factor 4: 거래 안정성 (200점 만점)
    if len(receivings) >= 3:
        amounts = receivings["total_amount"].astype(float)
        cv = amounts.std() / amounts.mean() if amounts.mean() > 0 else 1
        stability_score = max(0, 200 * (1 - min(cv, 1)))
    else:
        stability_score = 100

    total = int(volume_score + confirm_score + settle_score + stability_score)
    total = max(0, min(1000, total))

    # 등급 산출
    if total >= 800: grade = "A"
    elif total >= 600: grade = "B"
    elif total >= 400: grade = "C"
    elif total >= 200: grade = "D"
    else: grade = "E"

    result = {
        "merchant_id": merchant_id,
        "score": total,
        "grade": grade,
        "factors": {
            "volume": round(volume_score, 2),
            "confirm_rate": round(confirm_score, 2),
            "settlement_rate": round(settle_score, 2),
            "stability": round(stability_score, 2),
        },
        "evaluated_at": datetime.now().isoformat(),
    }

    # DB에 점수 저장
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO credit_scores (merchant_id, score, grade, factors, evaluated_at, triggered_by)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (merchant_id, total, grade, str(result["factors"]), result["evaluated_at"], triggered_by)
            )
            conn.commit()

    return result
