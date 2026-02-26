from fastapi import APIRouter
from models.schemas import V10Request, V10Response
from services.v10_service import score_merchant

router = APIRouter()

@router.post("/score", response_model=V10Response)
async def credit_score(req: V10Request):
    """V10 가맹점 신용평가 (★ 입고확인 후 Bull Queue에서 호출)"""
    return score_merchant(req.merchant_id, req.triggered_by)
