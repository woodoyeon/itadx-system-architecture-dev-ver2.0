"""
Dual-Track 위험도 평가

WHY: Track A (재무지표) + Track B (비재무지표) 이중 평가로
한쪽 지표만으로는 발견 못하는 리스크 포착

최종 위험도 = max(Track A, Track B) → 보수적 접근
"""
from fastapi import APIRouter
from pydantic import BaseModel
from services.dual_track_service import DualTrackService

router = APIRouter()
service = DualTrackService()

class DualTrackRequest(BaseModel):
    mart_id: str

@router.post("/assess", response_model=dict)
async def assess_risk(req: DualTrackRequest):
    result = service.assess(req.mart_id)
    return {"success": True, "data": result}
