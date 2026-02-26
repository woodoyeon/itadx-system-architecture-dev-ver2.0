"""
점포별 위험지수 (Branch Risk Index)

WHY: 같은 마트라도 점포별 거래 패턴이 다름
점포 단위 모니터링으로 세밀한 리스크 관리
"""
from fastapi import APIRouter
from pydantic import BaseModel
from services.branch_risk_service import BranchRiskService

router = APIRouter()
service = BranchRiskService()

class BranchRiskRequest(BaseModel):
    mart_id: str

@router.post("/calculate", response_model=dict)
async def calculate_branch_risk(req: BranchRiskRequest):
    result = service.calculate(req.mart_id)
    return {"success": True, "data": result}
