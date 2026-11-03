import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.data_service import DataService
from backend.app.services.causal_service import causal_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_environment():
    DataService.clear()
    causal_service.clear()
    yield
    DataService.clear()
    causal_service.clear()


def test_causal_analysis_fails_without_dataset_upload():
    """Verify triggering causal analysis without uploaded dataset returns 400 NO_DATA_UPLOADED."""
    payload = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["income", "age"],
    }
    res = client.post("/api/causal/analyze", json=payload)
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "NO_DATA_UPLOADED"


def test_causal_analysis_fails_on_missing_columns():
    """Verify specifying non-existent dataset columns returns 400 INVALID_COLUMN_SPECIFICATION."""
    csv_bytes = b"customer_id,discount_offered,purchased\n1,10.0,1\n2,0.0,0\n"
    client.post("/api/data/upload", files={"file": ("test.csv", io.BytesIO(csv_bytes), "text/csv")})

    payload = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["non_existent_feature"],
    }
    res = client.post("/api/causal/analyze", json=payload)
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "INVALID_COLUMN_SPECIFICATION"
    assert "non_existent_feature" in res.json()["error"]["details"]


def test_end_to_end_orchestration_flow():
    """Verify full workflow: Upload -> Analyze -> Diagnostics -> Optimize."""
    csv_rows = ["customer_id,discount_offered,purchased,income,age"]
    for i in range(100001, 100050):
        disc = 10.0 if i % 2 == 0 else 0.0
        purch = 1 if i % 3 == 0 else 0
        csv_rows.append(f"{i},{disc},{purch},{50000 + (i % 1000)},{30 + (i % 20)}")
    csv_bytes = "\n".join(csv_rows).encode("utf-8")

    upload_res = client.post(
        "/api/data/upload",
        files={"file": ("campaign_records.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert upload_res.status_code == 200
    assert upload_res.json()["data"]["row_count"] == 49

    causal_payload = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["income", "age"],
    }
    analysis_res = client.post("/api/causal/analyze", json=causal_payload)
    assert analysis_res.status_code == 200
    c_data = analysis_res.json()["data"]
    assert c_data["is_mock"] is True
    assert len(c_data["segment_effects"]) > 0
    assert len(c_data["diagnostics"]["checks"]) >= 2

    opt_payload = {
        "budget": 100.0,
        "available_discounts": [5.0, 10.0, 20.0],
        "customer_ids": ["100001", "100002", "100003", "100004"],
    }
    opt_res = client.post("/api/optimization/run", json=opt_payload)
    assert opt_res.status_code == 200
    o_data = opt_res.json()["data"]
    assert o_data["status"] == "FEASIBLE"
    assert o_data["is_mock"] is False
    assert len(o_data["allocation"]) == 4
    assert o_data["total_spend"] <= 100.0

