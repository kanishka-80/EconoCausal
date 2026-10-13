import uuid
from typing import Dict, Optional
from fastapi import HTTPException, status
from backend.app.schemas.causal import (
    CausalAnalysisData,
    CausalAnalysisRequest,
    TreatmentEffectSummary,
)


class CausalService:
    def __init__(self):
        # In-memory storage for run records until durable persistence is decided
        self._runs: Dict[str, CausalAnalysisData] = {}

    def run_analysis(self, payload: CausalAnalysisRequest) -> CausalAnalysisData:
        if payload.treatment_column == payload.outcome_column:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_COLUMN_SPECIFICATION",
                    "message": "Treatment column and outcome column cannot be identical.",
                    "details": [],
                },
            )

        run_id = f"run-{uuid.uuid4().hex[:8]}"

        # Explicitly marked mock/scaffold output for Week 1
        record = CausalAnalysisData(
            run_id=run_id,
            status="COMPLETED",
            estimator_used="LinearDML (Mock Scaffold)",
            is_mock=True,
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
        self._runs[run_id] = record
        return record

    def get_run_by_id(self, run_id: str) -> CausalAnalysisData:
        if run_id not in self._runs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "RUN_NOT_FOUND",
                    "message": f"Causal analysis run with id '{run_id}' was not found.",
                    "details": [],
                },
            )
        return self._runs[run_id]


causal_service = CausalService()
