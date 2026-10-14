import pytest
from fastapi import HTTPException
from backend.app.schemas.causal import CausalAnalysisRequest
from backend.app.services.data_service import DataService
from backend.app.services.causal_service import CausalService


def test_data_service_csv_validation():
    csv_bytes = b"id,discount,sales\n1,10.0,100\n2,0.0,50\n"
    res = DataService.parse_and_validate_csv(csv_bytes, "valid.csv")
    assert res.validation_status == "VALID"
    assert res.row_count == 2
    assert "discount" in res.columns


def test_data_service_rejects_non_csv():
    with pytest.raises(HTTPException) as exc_info:
        DataService.parse_and_validate_csv(b"sample", "file.txt")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "INVALID_FILE_FORMAT"


def test_causal_service_run_and_lookup():
    service = CausalService()
    req = CausalAnalysisRequest(
        treatment_column="discount",
        outcome_column="sales",
        confounders=["age", "income"],
    )
    result = service.run_analysis(req)
    assert result.is_mock is True
    assert result.status == "COMPLETED"
    assert result.ate_summary.average_treatment_effect > 0

    # Test lookup
    lookup = service.get_run_by_id(result.run_id)
    assert lookup.run_id == result.run_id


def test_causal_service_missing_run():
    service = CausalService()
    with pytest.raises(HTTPException) as exc_info:
        service.get_run_by_id("non-existent-run")
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail["code"] == "RUN_NOT_FOUND"
from backend.app.schemas.optimization import OptimizationRequest
from backend.app.services.optimization_service import OptimizationService


def test_optimization_service_mock_run():
    service = OptimizationService()
    req = OptimizationRequest(
        budget=100.0,
        available_discounts=[10.0, 20.0],
        customer_ids=["c1", "c2", "c3"],
    )
    result = service.run_optimization(req)
    assert result.is_mock is True
    assert result.status == "SCAFFOLD_MOCK"
    assert result.total_spend <= 100.0
    assert len(result.allocation) == 3
