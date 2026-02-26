from fastapi import APIRouter
from models.schemas import V41Request, V41Response
from services.v41_service import evaluate_mart

router = APIRouter()

@router.post("/screen", response_model=V41Response)
async def screen_mart(req: V41Request):
    """V41 마트 안정성 심사"""
    return evaluate_mart(req.mart_id, req.financial_data)
