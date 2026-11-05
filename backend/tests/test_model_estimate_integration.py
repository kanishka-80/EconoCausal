import pytest
import os
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.optimization_service import optimization_service
from backend.app.schemas.optimization import OptimizationRequest

client = TestClient(app)


def test_missing_csv_returns_missing_customer_estimates(monkeypatch):
    """Requirement 1: Verify missing CSV returns MISSING_CUSTOMER_ESTIMATES."""
    monkeypatch.setattr(optimization_service, "UPLIFT_CSV_PATH", "reports/non_existent_matrix.csv")
    payload = {
        "budget": 100.0,
        "available_discounts": [10.0, 20.0, 30.0],
        "customer_ids": ["30000"],
    }
    res = client.post("/api/optimization/run", json=payload)
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "MISSING_CUSTOMER_ESTIMATES"


def test_missing_requested_customer_ids_returns_estimates_not_found():
    """Requirement 2: Verify missing requested customer IDs return ESTIMATES_NOT_FOUND."""
    payload = {
        "budget": 100.0,
        "available_discounts": [10.0, 20.0, 30.0],
        "customer_ids": ["non_existent_customer_999999"],
    }
    res = client.post("/api/optimization/run", json=payload)
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "ESTIMATES_NOT_FOUND"
    assert "non_existent_customer_999999" in res.json()["error"]["details"]


def test_duplicate_customer_ids_in_csv_handled(tmp_path, monkeypatch):
    """Requirement 3: Verify duplicate customer IDs in CSV are detected and deduplicated."""
    temp_csv = tmp_path / "dup_matrix.csv"
    dup_df = pd.DataFrame({
        "customer_id": [30000, 30000, 30001],
        "uplift_10": [0.05, 0.08, 0.04],
        "uplift_30": [0.09, 0.12, 0.07],
        "uplift_20": [0.15, 0.20, 0.10],
    })
    dup_df.to_csv(temp_csv, index=False)
    monkeypatch.setattr(optimization_service, "UPLIFT_CSV_PATH", str(temp_csv))

    req = OptimizationRequest(
        budget=50.0,
        available_discounts=[10.0, 20.0, 30.0],
        customer_ids=["30000", "30001"],
    )
    res = optimization_service.run_optimization(req)
    assert res.status == "FEASIBLE"
    assert len(res.allocation) == 2
    assert res.is_mock is False


def test_is_mock_false_when_actual_estimates_loaded():
    """Requirement 4: Verify is_mock=False is returned when actual DML estimates are loaded."""
    payload = {
        "budget": 50.0,
        "available_discounts": [10.0, 20.0, 30.0],
        "customer_ids": ["30000", "30001"],
    }
    res = client.post("/api/optimization/run", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["is_mock"] is False



