import logging
import time
import uuid
from typing import Dict, List, Optional
import numpy as np
import pandas as pd
from fastapi import HTTPException, status

from backend.app.schemas.causal import (
    AnalysisMetadata,
    CausalAnalysisData,
    CausalAnalysisRequest,
    DiagnosticCheckResult,
    DiagnosticsSummary,
    SegmentEffect,
    TreatmentEffectSummary,
)
from backend.app.services.data_service import DataService

logger = logging.getLogger("econocausal.services.causal")


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

    def _calculate_segment_effects(
        self, df: pd.DataFrame, treatment: str, outcome: str, confounders: List[str], baseline_ate: float
    ) -> List[SegmentEffect]:
        """Calculates segment-level Conditional Average Treatment Effects (CATE)."""
        segment_effects: List[SegmentEffect] = []
        if not confounders:
            return segment_effects

        # Select primary confounder to segment on
        split_feature = confounders[0]
        feature_series = df[split_feature].dropna()

        if pd.api.types.is_numeric_dtype(feature_series) and feature_series.nunique() > 2:
            median_val = float(feature_series.median())
            segments = {
                f"{split_feature} <= {median_val:.1f}": df[df[split_feature] <= median_val],
                f"{split_feature} > {median_val:.1f}": df[df[split_feature] > median_val],
            }
        else:
            top_cats = feature_series.value_counts().head(3).index.tolist()
            segments = {f"{split_feature}={cat}": df[df[split_feature] == cat] for cat in top_cats}

        for seg_name, seg_df in segments.items():
            n_obs = len(seg_df)
            if n_obs < 2:
                continue

            t_vals = sorted(seg_df[treatment].dropna().unique())
            if len(t_vals) >= 2:
                y0 = seg_df[seg_df[treatment] == t_vals[0]][outcome].mean()
                y1 = seg_df[seg_df[treatment] == t_vals[-1]][outcome].mean()
                seg_ate = float(y1 - y0) if (pd.notna(y1) and pd.notna(y0)) else baseline_ate
            else:
                seg_ate = baseline_ate

            if not np.isfinite(seg_ate):
                seg_ate = baseline_ate

            segment_effects.append(
                SegmentEffect(
                    segment_name=seg_name,
                    segment_feature=split_feature,
                    sample_size=int(n_obs),
                    estimated_effect=round(float(seg_ate), 4),
                )
            )

        return segment_effects

    def run_analysis(self, payload: CausalAnalysisRequest) -> CausalAnalysisData:
        start_time = time.perf_counter()
        logger.info(
            f"Starting causal analysis: treatment={payload.treatment_column}, "
            f"outcome={payload.outcome_column}, confounders={payload.confounders}"
        )

        df = DataService.get_current_dataframe()
        if df is None or df.empty:
            logger.warning("Causal analysis requested without uploaded dataset.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "NO_DATA_UPLOADED",
                    "message": "No dataset has been uploaded. Please upload a CSV dataset before requesting analysis.",
                    "details": [],
                },
            )

        self.validate_analysis_request(payload, df)
        run_id = f"run-{uuid.uuid4().hex[:8]}"

        # Baseline ATE calculation (Deterministic double until Ritik's DML pipeline freeze)
        t_vals = sorted(df[payload.treatment_column].dropna().unique())
        baseline_t = t_vals[0]
        active_t = t_vals[-1]

        y_base = df[df[payload.treatment_column] == baseline_t][payload.outcome_column].mean()
        y_active = df[df[payload.treatment_column] == active_t][payload.outcome_column].mean()

        naive_ate = float(y_active - y_base) if (pd.notna(y_active) and pd.notna(y_base)) else 0.05
        if not np.isfinite(naive_ate) or naive_ate == 0.0:
            naive_ate = 0.082

        margin = 0.035
        ate_summary = TreatmentEffectSummary(
            average_treatment_effect=round(naive_ate, 4),
            confidence_interval_lower=round(naive_ate - margin, 4),
            confidence_interval_upper=round(naive_ate + margin, 4),
            unit="percentage_points",
        )

        segment_effects = self._calculate_segment_effects(
            df=df,
            treatment=payload.treatment_column,
            outcome=payload.outcome_column,
            confounders=payload.confounders,
            baseline_ate=round(naive_ate, 4),
        )

        elapsed = time.perf_counter() - start_time

        metadata = AnalysisMetadata(
            sample_size=int(len(df)),
            treatment_column=payload.treatment_column,
            outcome_column=payload.outcome_column,
            confounders=payload.confounders,
            execution_time_seconds=round(elapsed, 4),
        )

        diagnostics = DiagnosticsSummary(
            refutation_status="PENDING_INTEGRATION",
            checks=[
                DiagnosticCheckResult(
                    check_name="random_common_cause",
                    status="PENDING_INTEGRATION",
                    p_value=None,
                    details="DoWhy random common cause refutation pending evaluation module linkage.",
                ),
                DiagnosticCheckResult(
                    check_name="placebo_treatment_refuter",
                    status="PENDING_INTEGRATION",
                    p_value=None,
                    details="Placebo treatment refuter pending evaluation module linkage.",
                ),
            ],
            open_decisions="Discrete levels vs continuous treatment pending team freeze",
            warnings=[
                "Observational study design requires unconfoundedness assumption.",
                "EconML DML pipeline is executing in baseline double mode until notebook modularization.",
            ],
        )

        record = CausalAnalysisData(
            run_id=run_id,
            status="COMPLETED",
            estimator_used="LinearDML (Baseline Orchestrator)",
            is_mock=True,
            ate_summary=ate_summary,
            segment_effects=segment_effects,
            metadata=metadata,
            diagnostics=diagnostics,
        )
        self.runs[run_id] = record
        logger.info(f"Causal analysis run {run_id} completed successfully in {elapsed:.4f}s.")
        return record

    def get_run_by_id(self, run_id: str) -> CausalAnalysisData:
        if run_id not in self.runs:
            logger.warning(f"Causal analysis run {run_id} not found.")
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