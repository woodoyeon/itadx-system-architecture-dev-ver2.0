"""
V41 마트 안정성 심사 엔진

WHY: 마트의 재무·운영 데이터를 종합 평가하여 적격/부적격/조건부 판정
평가 항목: 재무안정성(40%), 운영실적(30%), 거래이력(20%), 외부신용(10%)
"""
import pandas as pd
import numpy as np
from datetime import datetime
from services.db import get_connection

WEIGHTS = {
    "financial_stability": 0.40,
    "operation_performance": 0.30,
    "transaction_history": 0.20,
    "external_credit": 0.10,
}

def evaluate_mart(mart_id: str, financial_data: dict) -> dict:
    """마트 심사 실행"""

    # 1. 재무 안정성 평가 (부채비율, 유동비율, 자본금)
    debt_ratio = financial_data.get("debt_ratio", 50)
    current_ratio = financial_data.get("current_ratio", 150)
    capital = financial_data.get("capital", 100_000_000)

    financial_score = min(100, max(0,
        (200 - debt_ratio) * 0.3 +           # 부채비율 낮을수록 높은 점수
        min(current_ratio, 300) * 0.2 +       # 유동비율 (300% 캡)
        min(capital / 50_000_000, 2) * 25     # 자본금 (10억 캡)
    ))

    # 2. 운영 실적 평가 (DB에서 입고 데이터 조회)
    with get_connection() as conn:
        df = pd.read_sql(
            "SELECT total_amount, status, receiving_date FROM receivings WHERE mart_id = %s AND receiving_date >= NOW() - INTERVAL '6 months'",
            conn, params=(mart_id,)
        )

    if len(df) > 0:
        confirmed = df[df["status"] == "confirmed"]
        confirm_rate = len(confirmed) / len(df) * 100
        avg_amount = confirmed["total_amount"].astype(float).mean() if len(confirmed) > 0 else 0
        operation_score = min(100, confirm_rate * 0.6 + min(avg_amount / 1_000_000, 40))
    else:
        operation_score = 50  # 데이터 없으면 기본값

    # 3. 거래 이력 (가맹점 수, 활성 가맹점 비율)
    with get_connection() as conn:
        merchants = pd.read_sql(
            "SELECT is_active FROM merchants WHERE mart_id = %s", conn, params=(mart_id,)
        )
    active_rate = merchants["is_active"].sum() / max(len(merchants), 1) * 100
    transaction_score = min(100, active_rate * 0.5 + min(len(merchants), 50))

    # 4. 외부 신용 (입력 데이터 활용)
    external_score = financial_data.get("external_credit_score", 70)

    # 가중합산
    factors = {
        "financial_stability": round(financial_score, 2),
        "operation_performance": round(operation_score, 2),
        "transaction_history": round(transaction_score, 2),
        "external_credit": round(external_score, 2),
    }

    total = sum(factors[k] * WEIGHTS[k] for k in WEIGHTS)

    # 판정
    if total >= 70:
        result = "적격"
    elif total >= 50:
        result = "조건부"
    else:
        result = "부적격"

    return {
        "mart_id": mart_id,
        "screening_result": result,
        "score": round(total, 2),
        "factors": factors,
        "evaluated_at": datetime.now().isoformat(),
    }
