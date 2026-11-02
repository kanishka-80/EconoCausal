import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_reject_whitespace_column_names_in_causal_request():
    """Verify whitespace-only treatment or outcome column names are rejected with 422."""
    res = client.post(
        "/api/causal/analyze",
        json={
            "treatment_column": "   ",
            "outcome_column": "purchased",
            "confounders": ["age"],
        },
    )
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_reject_blank_confounders_in_causal_request():
    """Verify empty/blank strings in confounders list are rejected with 422."""
    res = client.post(
        "/api/causal/analyze",
        json={
            "treatment_column": "discount_offered",
            "outcome_column": "purchased",
            "confounders": ["age", "  "],
        },
    )
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_reject_negative_or_zero_discounts_in_optimization_request():
    """Verify non-positive discount treatments in request schema are rejected with 422."""
    res = client.post(
        "/api/optimization/run",
        json={
            "budget": 100.0,
            "available_discounts": [5.0, 0.0],  # 0.0 is baseline, not positive treatment
        },
    )
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_reject_empty_customer_ids_list_if_provided():
    """Verify empty customer_ids array is rejected with 422."""
    res = client.post(
        "/api/optimization/run",
        json={
            "budget": 100.0,
            "available_discounts": [5.0, 10.0],
            "customer_ids": [],
        },
    )
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_deduplicate_customer_ids_in_optimization():
    """Verify duplicate customer_ids are automatically deduplicated by schema validator."""
    res = client.post(
        "/api/optimization/run",
        json={
            "budget": 100.0,
            "available_discounts": [5.0, 10.0, 20.0],
            "customer_ids": ["100001", "100002", "100001"],
        },
    )
    assert res.status_code == 200
    data = res.json()["data"]
    # 2 unique customers instead of 3
    assert len(data["allocation"]) == 2
    assert data["summary"]["total_customers"] == 2
