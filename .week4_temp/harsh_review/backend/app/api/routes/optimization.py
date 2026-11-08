from fastapi import APIRouter
from backend.app.schemas.common import ErrorResponse, StandardResponse
from backend.app.schemas.optimization import OptimizationRequest, OptimizationResultData
from backend.app.services.optimization_service import optimization_service

router = APIRouter(prefix="/optimization", tags=["optimization"])


@router.post(
    "/run",
    response_model=StandardResponse[OptimizationResultData],
    responses={
        400: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
    },
)
async def run_optimization(payload: OptimizationRequest):
    result = optimization_service.run_optimization(payload)
    return StandardResponse(data=result)
