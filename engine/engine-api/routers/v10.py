"""
V10 거래처 신용점수 (Credit Scoring)

WHY: 입고확인 시 거래처 신용 재평가 트리거
핵심 지표: 거래빈도, 입금적시성, 거래규모, 거래기간
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.v10_service import V10Service

router = APIRouter()
service = V10Service()

class V10Request(BaseModel):
    merchant_id: str
    triggered_by: Optional[str] = None

@router.post("/score", response_model=dict)
async def calculate_score(req: V10Request):
    """★ 입고확인 후 Bull Queue에서 호출되는 핵심 엔드포인트"""
    result = service.calculate(req.merchant_id, req.triggered_by)
    return {"success": True, "data": result}

@router.get("/score/{merchant_id}", response_model=dict)
async def get_score(merchant_id: str):
    result = service.get_latest(merchant_id)
    return {"success": True, "data": result}
