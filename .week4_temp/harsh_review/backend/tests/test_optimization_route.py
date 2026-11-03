from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_optimization_route_feasible_request():
    """Verify POST /api/optimization/run executes real solver and returns 200 OK."""
    payload = {
        "budget": 50.0,
        "available_discounts": [5.0, 10.0, 20.0],
        "customer_ids": ["c1", "c2", "c3", "c4"],
        "objective": "MAXIMIZE_UPLIFT",
    }
    response = client.post("/api/optimization/run", json=payload)
    assert response.status_code == 200

    body = response.json()
    assert body["status"] == "success"
    data = body["data"]
    assert data["status"] == "FEASIBLE"
    assert data["is_mock"] is False
    assert data["total_spend"] <= 50.0
    assert data["total_budget"] == 50.0
    assert len(data["allocation"]) == 4
    assert "summary" in data
    assert data["summary"]["total_customers"] == 4
    assert len(data["limitations"]) > 0


def test_optimization_route_insufficient_budget():
    """Verify route returns FEASIBLE with zero allocation or INFEASIBLE_INSUFFICIENT_BUDGET on small budget."""
    payload = {
        "budget": 2.0,
        "available_discounts": [10.0, 20.0],
        "customer_ids": ["c1"],
    }
    response = client.post("/api/optimization/run", json=payload)
    assert response.status_code == 200

    data = response.json()["data"]
    assert data["status"] == "INFEASIBLE_INSUFFICIENT_BUDGET"
    assert data["total_spend"] == 0.0
    assert data["allocated_customers_count"] == 0


def test_optimization_route_validation_error_on_negative_budget():
    """Verify route returns 422 Unprocessable Entity on negative budget."""
    payload = {
        "budget": -10.0,
        "available_discounts": [10.0],
        "customer_ids": ["c1"],
    }
    response = client.post("/api/optimization/run", json=payload)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_optimization_route_bad_request_on_empty_discounts():
    """Verify route returns 422 or 400 when available_discounts is empty."""
    payload = {
        "budget": 100.0,
        "available_discounts": [],
        "customer_ids": ["c1"],
    }
    response = client.post("/api/optimization/run", json=payload)
    assert response.status_code in [400, 422]
