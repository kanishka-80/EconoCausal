from fastapi import APIRouter
from backend.app.schemas.causal import CausalAnalysisData, CausalAnalysisRequest
from backend.app.schemas.common import ErrorResponse, StandardResponse
from backend.app.services.causal_service import causal_service

router = APIRouter(prefix="/causal", tags=["causal"])


@router.post(
    "/analyze",
    response_model=StandardResponse[CausalAnalysisData],
    responses={
        400: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
    },
)
async def analyze_treatment_effects(payload: CausalAnalysisRequest):
    result = causal_service.run_analysis(payload)
    return StandardResponse(data=result)


@router.get(
    "/results/{run_id}",
    response_model=StandardResponse[CausalAnalysisData],
    responses={
        404: {"model": ErrorResponse},
    },
)
async def get_causal_results(run_id: str):
    result = causal_service.get_run_by_id(run_id)
    return StandardResponse(data=result)
