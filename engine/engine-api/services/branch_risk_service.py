"""
지점 위험지수 엔진

WHY: 마트 내 개별 지점의 위험도를 산출하여
     은행이 지점 단위로 리스크를 모니터링
"""
import pandas as pd
from datetime import datetime
from services.db import get_connection

def calculate_branch_risk(mart_id: str, branch_id: str = None) -> list:
    with get_connection() as conn:
        query = "SELECT id, name, risk_index FROM branches WHERE mart_id = %s AND is_active = true"
        params = [mart_id]
        if branch_id:
            query += " AND id = %s"
            params.append(branch_id)
        branches = pd.read_sql(query, conn, params=params)

    results = []
    for _, branch in branches.iterrows():
        with get_connection() as conn:
            receivings = pd.read_sql(
                """SELECT total_amount, status FROM receivings
                   WHERE branch_id = %s AND receiving_date >= NOW() - INTERVAL '3 months'""",
                conn, params=(branch["id"],)
            )

        if len(receivings) > 0:
            confirm_rate = len(receivings[receivings["status"] == "confirmed"]) / len(receivings) * 100
            avg_amount = receivings["total_amount"].astype(float).mean()
            risk_score = max(0, 100 - confirm_rate * 0.5 - min(avg_amount / 500_000, 50))
        else:
            risk_score = 50  # 데이터 없으면 중간값

        old_index = float(branch["risk_index"]) if branch["risk_index"] else 50
        change = round(risk_score - old_index, 2)

        # DB 업데이트
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE branches SET risk_index = %s, risk_change = %s WHERE id = %s",
                    (round(risk_score, 2), change, branch["id"])
                )
                conn.commit()

        results.append({
            "branch_id": branch["id"],
            "branch_name": branch["name"],
            "risk_index": round(risk_score, 2),
            "risk_change": change,
            "calculated_at": datetime.now().isoformat(),
        })

    return results
