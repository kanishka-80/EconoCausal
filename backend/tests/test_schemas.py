import pytest
from pydantic import ValidationError
from backend.app.schemas.causal import (
    AnalysisMetadata,
    CausalAnalysisData,
    CausalAnalysisRequest,
    DiagnosticsSummary,
    SegmentEffect,
    TreatmentEffectSummary,
)
from backend.app.schemas.data import DatasetSummaryData, UploadValidationData
from backend.app.schemas.optimization import OptimizationRequest, OptimizationResultData


def test_causal_request_schema_validation():
    valid = CausalAnalysisRequest(
        treatment_column="discount_offered",
        outcome_column="purchased",
        confounders=["age", "income"],
    )
    assert valid.treatment_column == "discount_offered"

    with pytest.raises(ValidationError):
        # Confounders cannot be empty
        CausalAnalysisRequest(
            treatment_column="discount_offered",
            outcome_column="purchased",
            confounders=[],
        )


def test_causal_analysis_data_schema_and_metadata():
    ate = TreatmentEffectSummary(
        average_treatment_effect=0.082,
        confidence_interval_lower=0.047,
        confidence_interval_upper=0.117,
        unit="percentage_points",
    )
    seg = SegmentEffect(
        segment_name="age <= 35.0",
        segment_feature="age",
        sample_size=50,
        estimated_effect=0.091,
    )
    meta = AnalysisMetadata(
        sample_size=100,
        treatment_column="discount_offered",
        outcome_column="purchased",
        confounders=["age"],
        execution_time_seconds=0.015,
    )
    diag = DiagnosticsSummary(
        refutation_status="PENDING_INTEGRATION",
        open_decisions="Pending freeze",
        warnings=["Observational assumption required."],
    )

    data = CausalAnalysisData(
        run_id="run-test1234",
        status="COMPLETED",
        estimator_used="LinearDML",
        is_mock=True,
        ate_summary=ate,
        segment_effects=[seg],
        metadata=meta,
        diagnostics=diag,
    )
    assert data.run_id == "run-test1234"
    assert data.ate_summary.unit == "percentage_points"
    assert len(data.segment_effects) == 1
    assert data.segment_effects[0].segment_name == "age <= 35.0"
    assert data.metadata.sample_size == 100
    assert len(data.diagnostics.warnings) == 1


def test_data_summary_schema():
    summary = DatasetSummaryData(
        row_count=100,
        column_count=2,
        columns=[],
        preprocessing_status="READY",
    )
    assert summary.row_count == 100
    assert summary.preprocessing_status == "READY"


def test_optimization_request_schema():
    req = OptimizationRequest(
        budget=500.0,
        available_discounts=[10.0, 20.0],
        customer_ids=["c1", "c2"],
    )
    assert req.budget == 500.0

    with pytest.raises(ValidationError):
        OptimizationRequest(
            budget=-10.0,
            available_discounts=[10.0],
            customer_ids=["c1"],
        )