import io
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_check_returns_200():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_data_upload_valid_csv():
    csv_content = b"customer_id,discount_offered,purchased\n1,10.0,1\n2,0.0,0\n"
    files = {"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}
    response = client.post("/api/data/upload", files=files)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["status"] == "success"
    assert res_json["data"]["filename"] == "test.csv"
    assert res_json["data"]["row_count"] == 2
    assert "discount_offered" in res_json["data"]["columns"]


def test_data_upload_rejects_non_csv():
    txt_content = b"Just some plain text content"
    files = {"file": ("sample.txt", io.BytesIO(txt_content), "text/plain")}
    response = client.post("/api/data/upload", files=files)
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "INVALID_FILE_FORMAT"


def test_data_upload_rejects_empty_csv():
    files = {"file": ("empty.csv", io.BytesIO(b""), "text/csv")}
    response = client.post("/api/data/upload", files=files)
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "EMPTY_DATASET"


def test_data_summary_returns_contract_shape():
    response = client.get("/api/data/summary")
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["status"] == "success"
    assert res_json["data"]["preprocessing_status"] == "READY"
    assert len(res_json["data"]["columns"]) > 0


def test_causal_analyze_valid_payload():
    payload = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["income", "age", "prior_orders"],
    }
    response = client.post("/api/causal/analyze", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["status"] == "success"
    assert "run_id" in res_json["data"]
    assert res_json["data"]["ate_summary"]["average_treatment_effect"] > 0


def test_causal_analyze_rejects_identical_treatment_and_outcome():
    payload = {
        "treatment_column": "discount_offered",
        "outcome_column": "discount_offered",
        "confounders": ["income"],
    }
    response = client.post("/api/causal/analyze", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "INVALID_COLUMN_SPECIFICATION"
def test_causal_results_lookup_and_not_found():
    # 1. Create a run
    payload = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["income", "age"],
    }
    create_res = client.post("/api/causal/analyze", json=payload)
    assert create_res.status_code == 200
    run_id = create_res.json()["data"]["run_id"]

    # 2. Retrieve existing run
    fetch_res = client.get(f"/api/causal/results/{run_id}")
    assert fetch_res.status_code == 200
    assert fetch_res.json()["data"]["run_id"] == run_id
    assert fetch_res.json()["data"]["is_mock"] is True

    # 3. Retrieve non-existent run
    missing_res = client.get("/api/causal/results/run-doesnotexist")
    assert missing_res.status_code == 404
    assert missing_res.json()["detail"]["code"] == "RUN_NOT_FOUND"
