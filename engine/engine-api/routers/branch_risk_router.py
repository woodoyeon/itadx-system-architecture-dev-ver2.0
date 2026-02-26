from fastapi import APIRouter
from models.schemas import BranchRiskRequest, BranchRiskResponse
from services.branch_risk_service import calculate_branch_risk

router = APIRouter()

@router.post("/calculate", response_model=BranchRiskResponse)
async def calc_branch_risk(req: BranchRiskRequest):
    """지점 위험지수 산출"""
    return {"branches": calculate_branch_risk(req.mart_id, req.branch_id)}
