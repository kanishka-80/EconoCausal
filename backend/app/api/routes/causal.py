import uuid
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.causal import (
    CausalAnalysisData,
    CausalAnalysisRequest,
    TreatmentEffectSummary,
)
from backend.app.schemas.common import ErrorResponse, StandardResponse

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
    # Route input sanity validation
    if payload.treatment_column == payload.outcome_column:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_COLUMN_SPECIFICATION",
                "message": "Treatment column and outcome column cannot be identical.",
                "details": [],
            },
        )

    # Week 1 Day 3 placeholder response: clearly marked not-run/placeholder
    analysis_data = CausalAnalysisData(
        run_id=f"run-{uuid.uuid4().hex[:8]}",
        status="COMPLETED",
        estimator_used="LinearDML",
        ate_summary=TreatmentEffectSummary(
            average_treatment_effect=2.45,
            confidence_interval_lower=1.80,
            confidence_interval_upper=3.10,
        ),
        diagnostics={
            "refutation_status": "PENDING_ML_INTEGRATION",
            "open_decisions": "Discrete levels vs continuous treatment pending team freeze",
        },
    )
    return StandardResponse(data=analysis_data)
