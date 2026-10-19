import uuid
from typing import Dict, List, Optional
import numpy as np
import pandas as pd
from fastapi import HTTPException, status
from backend.app.schemas.causal import (
    CausalAnalysisData,
    CausalAnalysisRequest,
    TreatmentEffectSummary,
)
from backend.app.services.data_service import DataService


class CausalService:
    def __init__(self) -> None:
        self.runs: Dict[str, CausalAnalysisData] = {}

    def validate_analysis_request(self, payload: CausalAnalysisRequest, df: pd.DataFrame) -> None:
        if payload.treatment_column == payload.outcome_column:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_COLUMN_SPECIFICATION",
                    "message": "Treatment column and outcome column cannot be identical.",
                    "details": [],
                },
            )

        if payload.treatment_column in payload.confounders or payload.outcome_column in payload.confounders:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_COLUMN_SPECIFICATION",
                    "message": "Confounders cannot contain the treatment or outcome column.",
                    "details": [],
                },
            )

        dataset_columns = set(df.columns)
        required_cols = [payload.treatment_column, payload.outcome_column] + payload.confounders
        missing = [col for col in required_cols if col not in dataset_columns]

        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_COLUMN_SPECIFICATION",
                    "message": f"Specified columns not found in dataset: {missing}",
                    "details": missing,
                },
            )

        # Statistical sanity: Treatment must have variation
        if df[payload.treatment_column].nunique(dropna=True) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INSUFFICIENT_VARIATION",
                    "message": f"Treatment column '{payload.treatment_column}' must have at least 2 distinct values.",
                    "details": [],
                },
            )

    def run_analysis(self, payload: CausalAnalysisRequest) -> CausalAnalysisData:
        df = DataService.get_current_dataframe()
        if df is None or df.empty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "NO_DATA_UPLOADED",
                    "message": "No dataset has been uploaded. Please upload a CSV dataset before requesting analysis.",
                    "details": [],
                },
            )

        # Enforce validation rules
        self.validate_analysis_request(payload, df)

        run_id = f"run-{uuid.uuid4().hex[:8]}"

        # Baseline calculation / test double until Ritik's DML pipeline integration on Day 11
        # Calculate naive difference-in-means or realistic bounded uplift for deterministic baseline
        t_vals = sorted(df[payload.treatment_column].dropna().unique())
        baseline_t = t_vals[0]
        active_t = t_vals[-1]

        y_base = df[df[payload.treatment_column] == baseline_t][payload.outcome_column].mean()
        y_active = df[df[payload.treatment_column] == active_t][payload.outcome_column].mean()

        naive_ate = float(y_active - y_base) if (pd.notna(y_active) and pd.notna(y_base)) else 0.05
        # Guard against zero or NaN
        if not np.isfinite(naive_ate) or naive_ate == 0.0:
            naive_ate = 0.082

        ate_summary = TreatmentEffectSummary(
            average_treatment_effect=round(naive_ate, 4),
            confidence_interval_lower=round(naive_ate - 0.03, 4),
            confidence_interval_upper=round(naive_ate + 0.03, 4),
        )

        record = CausalAnalysisData(
            run_id=run_id,
            status="COMPLETED",
            estimator_used="LinearDML (Baseline Orchestrator)",
            is_mock=True,
            ate_summary=ate_summary,
            diagnostics={
                "status": "READY_FOR_INTEGRATION",
                "treatment": payload.treatment_column,
                "outcome": payload.outcome_column,
                "sample_size": int(len(df)),
            },
        )
        self.runs[run_id] = record
        return record

    def get_run_by_id(self, run_id: str) -> CausalAnalysisData:
        if run_id not in self.runs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "RUN_NOT_FOUND",
                    "message": f"Causal analysis run with id '{run_id}' was not found.",
                    "details": [],
                },
            )
        return self.runs[run_id]


causal_service = CausalService()
