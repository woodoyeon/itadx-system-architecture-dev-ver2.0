from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class V41Request(BaseModel):
    mart_id: str
    financial_data: Dict[str, Any]

class V41Response(BaseModel):
    mart_id: str
    screening_result: str  # 적격 / 부적격 / 조건부
    score: float
    factors: Dict[str, float]
    evaluated_at: str

class V10Request(BaseModel):
    merchant_id: str
    triggered_by: Optional[str] = None

class V10Response(BaseModel):
    merchant_id: str
    score: int  # 0-1000
    grade: str  # A-E
    factors: Dict[str, float]
    evaluated_at: str

class DualTrackRequest(BaseModel):
    mart_id: str

class DualTrackResponse(BaseModel):
    mart_id: str
    track_a_level: int  # 1-4
    track_b_level: int  # 1-4
    final_level: int    # 1-4
    details: Dict[str, Any]

class BranchRiskRequest(BaseModel):
    mart_id: str
    branch_id: Optional[str] = None

class BranchRiskResponse(BaseModel):
    branches: List[Dict[str, Any]]
