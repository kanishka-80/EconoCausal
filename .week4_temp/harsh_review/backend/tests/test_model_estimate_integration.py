import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.optimization_service import optimization_service
from backend.app.schemas.optimization import OptimizationRequest

client = TestClient(app)


def test_real_model_estimates_integration_from_csv():
    """Verify optimization consumes real CATE estimates from Ritik's customer_uplift_matrix.csv."""
    # Real customer IDs from customer_uplift_matrix.csv
    real_customer_ids = ["100001", "100002", "100003", "100004"]
    req = OptimizationRequest(
        budget=35.0,
        available_discounts=[5.0, 10.0, 20.0],
        customer_ids=real_customer_ids,
    )
    result = optimization_service.run_optimization(req)

    assert result.is_mock is False
    assert result.status == "FEASIBLE"
    assert result.total_spend <= 35.0
    assert len(result.allocation) == 4
    # Ensure expected uplifts are populated from real estimates
    for alloc in result.allocation:
        if alloc.assigned_discount > 0:
            assert alloc.expected_uplift != 0.0


def test_reject_unsupported_treatment_discounts():
    """Verify service rejects treatment discounts that do not have model estimates."""
    response = client.post(
        "/api/optimization/run",
        json={
            "budget": 50.0,
            "available_discounts": [15.0],  # 15% is not in [5, 10, 20]
            "customer_ids": ["100001"],
        },
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "UNSUPPORTED_DISCOUNT"


def test_diagnostics_caveats_and_limitations_attached():
    """Verify team-approved causal and optimization caveats are present in response."""
    response = client.post(
        "/api/optimization/run",
        json={
            "budget": 50.0,
            "available_discounts": [5.0, 10.0, 20.0],
            "customer_ids": ["100001", "100002"],
        },
    )
    assert response.status_code == 200
    limitations = response.json()["data"]["limitations"]

    assert any("unconfoundedness" in lim for lim in limitations)
    assert any("Refutation checks are descriptive" in lim for lim in limitations)
    assert any("not guaranteed business outcomes" in lim for lim in limitations)
