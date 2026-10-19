import io
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.data_service import DataService

client = TestClient(app)


def test_health_check_returns_200():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_data_summary_before_upload_returns_404():
    DataService.clear()
    response = client.get("/api/data/summary")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"]["code"] == "NO_DATA_UPLOADED"


def test_data_upload_missing_file_returns_422():
    response = client.post("/api/data/upload")
    assert response.status_code == 422


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


def test_data_upload_rejects_encoding_error():
    invalid_bytes = b"customer_id,discount\n1,\xff\xfe"
    files = {"file": ("corrupt.csv", io.BytesIO(invalid_bytes), "text/csv")}
    response = client.post("/api/data/upload", files=files)
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "ENCODING_ERROR"


def test_data_upload_valid_csv():
    csv_text = (
        "customer_id,discount_offered,purchased,historical_spend,age,income\n"
        "1001,10.0,1,250.5,29,50000\n"
        "1002,20.0,0,100.0,45,75000\n"
        "1003,10.0,1,,34,62000\n"
    )
    files = {"file": ("test_dataset.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    response = client.post("/api/data/upload", files=files)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["status"] == "success"
    data = res_json["data"]
    assert data["filename"] == "test_dataset.csv"
    assert data["row_count"] == 3
    assert data["column_count"] == 6
    assert data["validation_status"] == "VALID"
    assert "discount_offered" in data["columns"]


def test_data_summary_returns_contract_shape_and_dynamic_stats():
    response = client.get("/api/data/summary")
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["status"] == "success"
    data = res_json["data"]
    assert data["row_count"] == 3
    assert data["column_count"] == 6
    assert data["preprocessing_status"] == "READY"

    cols = {c["name"]: c for c in data["columns"]}
    assert "historical_spend" in cols
    assert cols["historical_spend"]["null_count"] == 1
    assert cols["historical_spend"]["null_percentage"] > 0.0
    assert cols["historical_spend"]["is_eligible_confounder"] is True
    assert cols["customer_id"]["is_eligible_confounder"] is False

    assert data["treatment_coverage"] is not None
    assert data["treatment_coverage"]["treatment_column"] == "discount_offered"
    assert data["treatment_coverage"]["unique_values"] == [10.0, 20.0]
    assert data["treatment_coverage"]["counts"]["10.0"] == 2
    assert data["treatment_coverage"]["counts"]["20.0"] == 1


def test_causal_analyze_rejects_missing_dataset():
    DataService.clear()
    payload = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["age"],
    }
    response = client.post("/api/causal/analyze", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "NO_DATA_UPLOADED"


def test_causal_analyze_rejects_columns_not_in_dataset():
    csv_text = "customer_id,discount_offered,purchased,age\n1,10.0,1,30\n2,20.0,0,40\n"
    files = {"file": ("data.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    client.post("/api/data/upload", files=files)

    payload = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["non_existent_column"],
    }
    response = client.post("/api/causal/analyze", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "INVALID_COLUMN_SPECIFICATION"


def test_causal_analyze_rejects_identical_treatment_and_outcome():
    payload = {
        "treatment_column": "discount_offered",
        "outcome_column": "discount_offered",
        "confounders": ["age"],
    }
    response = client.post("/api/causal/analyze", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "INVALID_COLUMN_SPECIFICATION"


def test_causal_analyze_rejects_confounder_overlapping_treatment_or_outcome():
    payload = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["discount_offered", "age"],
    }
    response = client.post("/api/causal/analyze", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "INVALID_COLUMN_SPECIFICATION"


def test_causal_analyze_valid_payload():
    csv_text = "customer_id,discount_offered,purchased,age,income\n1,10.0,1,30,50000\n2,20.0,0,40,60000\n"
    files = {"file": ("data.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    client.post("/api/data/upload", files=files)

    payload = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["age", "income"],
    }
    response = client.post("/api/causal/analyze", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["status"] == "success"
    assert "run_id" in res_json["data"]
    assert res_json["data"]["status"] == "COMPLETED"
    assert res_json["data"]["is_mock"] is True
    assert res_json["data"]["ate_summary"]["average_treatment_effect"] is not None


def test_causal_results_lookup_and_not_found():
    csv_text = "customer_id,discount_offered,purchased,age,income\n1,10.0,1,30,50000\n2,20.0,0,40,60000\n"
    files = {"file": ("data.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    client.post("/api/data/upload", files=files)

    payload = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["income", "age"],
    }
    create_res = client.post("/api/causal/analyze", json=payload)
    assert create_res.status_code == 200
    run_id = create_res.json()["data"]["run_id"]

    fetch_res = client.get(f"/api/causal/results/{run_id}")
    assert fetch_res.status_code == 200
    assert fetch_res.json()["data"]["run_id"] == run_id
    assert fetch_res.json()["data"]["is_mock"] is True

    missing_res = client.get("/api/causal/results/run-doesnotexist")
    assert missing_res.status_code == 404
    assert missing_res.json()["detail"]["code"] == "RUN_NOT_FOUND"


def test_optimization_run_valid_payload():
    payload = {
        "budget": 50.0,
        "available_discounts": [10.0],
        "customer_ids": ["c1", "c2"],
    }
    response = client.post("/api/optimization/run", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["status"] == "success"
    assert res_json["data"]["is_mock"] is True
    assert res_json["data"]["total_spend"] == 20.0


def test_optimization_run_rejects_non_positive_budget():
    payload = {
        "budget": 0.0,
        "available_discounts": [10.0],
        "customer_ids": ["c1"],
    }
    response = client.post("/api/optimization/run", json=payload)
    assert response.status_code == 422
