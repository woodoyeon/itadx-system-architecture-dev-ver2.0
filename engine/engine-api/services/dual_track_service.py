"""
듀얼트랙 리스크 평가 엔진

WHY: 두 가지 독립적 경로(Track A: 재무, Track B: 운영)로
     마트 위험도를 평가하여 단일 지표의 편향 방지
"""
import numpy as np
from datetime import datetime
from services.db import get_connection

def evaluate_dual_track(mart_id: str) -> dict:
    with get_connection() as conn:
        import pandas as pd
        receivings = pd.read_sql(
            "SELECT total_amount, status FROM receivings WHERE mart_id = %s AND receiving_date >= NOW() - INTERVAL '3 months'",
            conn, params=(mart_id,)
        )
        merchants = pd.read_sql(
            "SELECT score, is_active FROM merchants WHERE mart_id = %s", conn, params=(mart_id,)
        )

    # Track A: 재무 기반 (입고 금액 기반)
    if len(receivings) > 0:
        avg_amount = receivings["total_amount"].astype(float).mean()
        confirm_rate = len(receivings[receivings["status"] == "confirmed"]) / len(receivings)
        track_a_raw = avg_amount / 1_000_000 * confirm_rate
    else:
        track_a_raw = 0

    # Track B: 가맹점 기반 (가맹점 점수 + 활성률)
    if len(merchants) > 0:
        avg_score = merchants["score"].astype(float).mean() if merchants["score"].notna().any() else 0
        active_rate = merchants["is_active"].sum() / len(merchants)
        track_b_raw = (avg_score / 10) * active_rate
    else:
        track_b_raw = 0

    # 레벨 산출 (1=안정, 2=주의, 3=경고, 4=위험)
    def to_level(score):
        if score >= 70: return 1
        if score >= 40: return 2
        if score >= 20: return 3
        return 4

    track_a = to_level(track_a_raw)
    track_b = to_level(track_b_raw)
    final = max(track_a, track_b)  # WHY: 보수적 판단 — 더 나쁜 쪽을 따름

    return {
        "mart_id": mart_id,
        "track_a_level": track_a,
        "track_b_level": track_b,
        "final_level": final,
        "details": {
            "track_a_raw": round(track_a_raw, 2),
            "track_b_raw": round(track_b_raw, 2),
            "method": "max(track_a, track_b)",
        },
    }
