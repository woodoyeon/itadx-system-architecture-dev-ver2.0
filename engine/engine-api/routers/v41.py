"""
V41 마트 적격심사 (Mart Screening)

WHY: 마트 등록 시 사업 안정성 평가
기준: 사업연수, 매출규모, 재무안정성 등 가중합산
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.v41_service import V41Service

router = APIRouter()
service = V41Service()

class V41Request(BaseModel):
    mart_id: str
    business_years: float = 0
    annual_revenue: float = 0
    employee_count: int = 0
    debt_ratio: float = 0
    credit_rating: Optional[str] = None

class V41Response(BaseModel):
    mart_id: str
    total_score: float
    grade: str
    result: str  # PASS / CONDITIONAL / FAIL
    factors: dict

@router.post("/screen", response_model=dict)
async def screen_mart(req: V41Request):
    result = service.evaluate(req.dict())
    return {"success": True, "data": result}
