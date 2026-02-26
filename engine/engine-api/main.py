"""
ItaDX Engine API — v41 마트심사 / v10 신용평가 / 듀얼트랙 / 지점위험지수

WHY: 평가 엔진은 Python(Pandas/NumPy)으로 구현하여
     복잡한 수치 연산과 통계 처리를 효율적으로 수행
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import v41_router, v10_router, dual_track_router, branch_risk_router

app = FastAPI(
    title="ItaDX Engine API",
    version="1.0.0",
    docs_url="/api/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v41_router.router, prefix="/api/v41", tags=["V41 마트심사"])
app.include_router(v10_router.router, prefix="/api/v10", tags=["V10 신용평가"])
app.include_router(dual_track_router.router, prefix="/api/dual-track", tags=["듀얼트랙"])
app.include_router(branch_risk_router.router, prefix="/api/branch-risk", tags=["지점위험지수"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "engine-api"}
