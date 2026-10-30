import pytest
from fastapi import HTTPException
from backend.app.schemas.causal import CausalAnalysisRequest
from backend.app.services.data_service import DataService
from backend.app.services.causal_service import CausalService
from backend.app.schemas.optimization import OptimizationRequest
from backend.app.services.optimization_service import OptimizationService


def test_data_service_csv_validation():
    csv_bytes = "id,discount_offered,sales\n1,10.0,100\n2,20.0,50\n".encode("utf-8")
    res = DataService.parse_and_validate_csv(csv_bytes, "valid.csv")
    assert res.validation_status == "VALID"
    assert res.row_count == 2
    assert "discount_offered" in res.columns


def test_data_service_rejects_non_csv():
    with pytest.raises(HTTPException) as exc_info:
        DataService.parse_and_validate_csv(b"sample", "file.txt")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "INVALID_FILE_FORMAT"


def test_data_service_rejects_empty_csv():
    with pytest.raises(HTTPException) as exc_info:
        DataService.parse_and_validate_csv(b"   ", "empty.csv")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "EMPTY_DATASET"


def test_data_service_summary_no_data():
    DataService.clear()
    with pytest.raises(HTTPException) as exc_info:
        DataService.get_dataset_summary()
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail["code"] == "NO_DATA_UPLOADED"


def test_data_service_summary_dynamic_computation():
    csv_bytes = "customer_id,discount_offered,purchased,age\n1,10.0,1,25\n2,10.0,0,30\n3,20.0,1,\n".encode("utf-8")
    DataService.parse_and_validate_csv(csv_bytes, "data.csv")
    summary = DataService.get_dataset_summary()
    assert summary.row_count == 3
    assert summary.column_count == 4
    assert summary.treatment_coverage is not None
    assert summary.treatment_coverage.treatment_column == "discount_offered"
    assert summary.treatment_coverage.counts["10.0"] == 2
    assert summary.treatment_coverage.counts["20.0"] == 1

    col_map = {c.name: c for c in summary.columns}
    assert col_map["age"].is_eligible_confounder is True
    assert col_map["age"].null_count == 1
    assert col_map["purchased"].is_eligible_confounder is False


def test_causal_service_rejects_missing_dataset():
    DataService.clear()
    service = CausalService()
    req = CausalAnalysisRequest(
        treatment_column="discount_offered",
        outcome_column="purchased",
        confounders=["age"],
    )
    with pytest.raises(HTTPException) as exc_info:
        service.run_analysis(req)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "NO_DATA_UPLOADED"


def test_causal_service_rejects_missing_columns():
    csv_bytes = "customer_id,discount_offered,purchased\n1,10.0,1\n2,20.0,0\n".encode("utf-8")
    DataService.parse_and_validate_csv(csv_bytes, "test.csv")
    service = CausalService()
    req = CausalAnalysisRequest(
        treatment_column="discount_offered",
        outcome_column="purchased",
        confounders=["non_existent_column"],
    )
    with pytest.raises(HTTPException) as exc_info:
        service.run_analysis(req)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "INVALID_COLUMN_SPECIFICATION"


def test_causal_service_rejects_insufficient_treatment_variation():
    csv_bytes = "customer_id,discount_offered,purchased,age\n1,10.0,1,25\n2,10.0,0,30\n".encode("utf-8")
    DataService.parse_and_validate_csv(csv_bytes, "test.csv")
    service = CausalService()
    req = CausalAnalysisRequest(
        treatment_column="discount_offered",
        outcome_column="purchased",
        confounders=["age"],
    )
    with pytest.raises(HTTPException) as exc_info:
        service.run_analysis(req)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "INSUFFICIENT_VARIATION"


def test_causal_service_run_and_structured_results():
    csv_bytes = (
        "customer_id,discount_offered,purchased,age\n"
        "1,10.0,0,25\n"
        "2,20.0,1,28\n"
        "3,10.0,0,45\n"
        "4,20.0,1,50\n"
    ).encode("utf-8")
    DataService.parse_and_validate_csv(csv_bytes, "test.csv")
    service = CausalService()
    req = CausalAnalysisRequest(
        treatment_column="discount_offered",
        outcome_column="purchased",
        confounders=["age"],
    )
    result = service.run_analysis(req)
    assert result.is_mock is True
    assert result.status == "COMPLETED"
    assert result.ate_summary.average_treatment_effect is not None
    assert result.ate_summary.unit == "percentage_points"
    assert result.ate_summary.confidence_interval_lower is not None
    assert result.ate_summary.confidence_interval_upper is not None

    # Check segment effects and metadata
    assert len(result.segment_effects) >= 1
    assert result.segment_effects[0].segment_feature == "age"
    assert result.metadata.sample_size == 4
    assert result.metadata.treatment_column == "discount_offered"
    assert result.diagnostics.refutation_status == "PENDING_INTEGRATION"
    assert len(result.diagnostics.warnings) > 0

    # Test run lookup
    lookup = service.get_run_by_id(result.run_id)
    assert lookup.run_id == result.run_id
    assert len(lookup.segment_effects) == len(result.segment_effects)


def test_causal_service_missing_run():
    service = CausalService()
    with pytest.raises(HTTPException) as exc_info:
        service.get_run_by_id("non-existent-run")
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail["code"] == "RUN_NOT_FOUND"


def test_optimization_service_mock_run():
    service = OptimizationService()
    req = OptimizationRequest(
        budget=100.0,
        available_discounts=[10.0, 20.0],
        customer_ids=["c1", "c2", "c3"],
    )
    result = service.run_optimization(req)
    assert result.is_mock is False
    assert result.status == "FEASIBLE"
    assert result.total_spend <= 100.0
    assert len(result.allocation) == 3

