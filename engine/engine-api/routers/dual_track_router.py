from fastapi import APIRouter
from models.schemas import DualTrackRequest, DualTrackResponse
from services.dual_track_service import evaluate_dual_track

router = APIRouter()

@router.post("/assess", response_model=DualTrackResponse)
async def assess_risk(req: DualTrackRequest):
    """듀얼트랙 리스크 평가"""
    return evaluate_dual_track(req.mart_id)
