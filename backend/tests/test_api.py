import io
from unittest.mock import patch
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
    assert data["status"] == "error"
    assert data["error"]["code"] == "NO_DATA_UPLOADED"


def test_data_upload_missing_file_returns_422():
    response = client.post("/api/data/upload")
    assert response.status_code == 422
    data = response.json()
    assert data["status"] == "error"
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_data_upload_rejects_non_csv():
    txt_content = b"Just some plain text content"
    files = {"file": ("sample.txt", io.BytesIO(txt_content), "text/plain")}
    response = client.post("/api/data/upload", files=files)
    assert response.status_code == 400
    data = response.json()
    assert data["status"] == "error"
    assert data["error"]["code"] == "INVALID_FILE_FORMAT"


def test_data_upload_rejects_empty_csv():
    files = {"file": ("empty.csv", io.BytesIO(b""), "text/csv")}
    response = client.post("/api/data/upload", files=files)
    assert response.status_code == 400
    data = response.json()
    assert data["status"] == "error"
    assert data["error"]["code"] == "EMPTY_DATASET"


def test_data_upload_rejects_encoding_error():
    invalid_bytes = b"customer_id,discount\n1,\xff\xfe"
    files = {"file": ("corrupt.csv", io.BytesIO(invalid_bytes), "text/csv")}
    response = client.post("/api/data/upload", files=files)
    assert response.status_code == 400
    data = response.json()
    assert data["status"] == "error"
    assert data["error"]["code"] == "ENCODING_ERROR"


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
    # Seed data explicitly for test isolation
    csv_text = (
        "customer_id,discount_offered,purchased,historical_spend,age,income\n"
        "1001,10.0,1,250.5,29,50000\n"
        "1002,20.0,0,100.0,45,75000\n"
        "1003,10.0,1,,34,62000\n"
    )
    files = {"file": ("test_dataset.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    upload_res = client.post("/api/data/upload", files=files)
    assert upload_res.status_code == 200

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


def test_data_reset_clears_memory_resource():
    # Seed an isolated CSV to guarantee test independence
    csv_text = (
        "customer_id,discount_offered,purchased,historical_spend,age,income\n"
        "1001,10.0,1,250.5,29,50000\n"
        "1002,20.0,0,100.0,45,75000\n"
    )
    files = {"file": ("reset_seed.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    upload_res = client.post("/api/data/upload", files=files)
    assert upload_res.status_code == 200

    # Ensure dataset is present
    summary_before = client.get("/api/data/summary")
    assert summary_before.status_code == 200

    # Call reset
    reset_res = client.post("/api/data/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["status"] == "success"

    # Confirm data is cleared
    summary_after = client.get("/api/data/summary")
    assert summary_after.status_code == 404
    assert summary_after.json()["error"]["code"] == "NO_DATA_UPLOADED"


def test_causal_analyze_rejects_missing_dataset():
    DataService.clear()
    payload = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["age"],
    }
    response = client.post("/api/causal/analyze", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert data["status"] == "error"
    assert data["error"]["code"] == "NO_DATA_UPLOADED"


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
    data = response.json()
    assert data["status"] == "error"
    assert data["error"]["code"] == "INVALID_COLUMN_SPECIFICATION"


def test_causal_analyze_rejects_identical_treatment_and_outcome():
    payload = {
        "treatment_column": "discount_offered",
        "outcome_column": "discount_offered",
        "confounders": ["age"],
    }
    response = client.post("/api/causal/analyze", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert data["status"] == "error"
    assert data["error"]["code"] == "INVALID_COLUMN_SPECIFICATION"


def test_causal_analyze_rejects_confounder_overlapping_treatment_or_outcome():
    payload = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["discount_offered", "age"],
    }
    response = client.post("/api/causal/analyze", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert data["status"] == "error"
    assert data["error"]["code"] == "INVALID_COLUMN_SPECIFICATION"


def test_causal_analyze_valid_payload_and_structured_results():
    csv_text = (
        "customer_id,discount_offered,purchased,age,income\n"
        "1,10.0,0,25,50000\n"
        "2,20.0,1,32,60000\n"
        "3,10.0,0,45,70000\n"
        "4,20.0,1,55,80000\n"
    )
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
    data = res_json["data"]

    # Verify structured treatment effects and metadata
    assert "run_id" in data
    assert data["status"] == "COMPLETED"
    assert data["is_mock"] is True
    assert data["ate_summary"]["average_treatment_effect"] is not None
    assert data["ate_summary"]["unit"] == "percentage_points"
    assert "confidence_interval_lower" in data["ate_summary"]
    assert "confidence_interval_upper" in data["ate_summary"]

    # Verify CATE segment effects
    assert isinstance(data["segment_effects"], list)
    assert len(data["segment_effects"]) >= 1
    assert "estimated_effect" in data["segment_effects"][0]
    assert "sample_size" in data["segment_effects"][0]

    # Verify metadata and diagnostics
    assert data["metadata"]["sample_size"] == 4
    assert data["metadata"]["treatment_column"] == "discount_offered"
    assert data["diagnostics"]["refutation_status"] == "PENDING_INTEGRATION"
    assert len(data["diagnostics"]["warnings"]) > 0
    assert len(data["diagnostics"]["checks"]) == 2
    assert data["diagnostics"]["checks"][0]["check_name"] == "random_common_cause"
    assert data["diagnostics"]["checks"][0]["status"] == "PENDING_INTEGRATION"


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
    fetch_data = fetch_res.json()["data"]
    assert fetch_data["run_id"] == run_id
    assert fetch_data["is_mock"] is True
    assert "segment_effects" in fetch_data
    assert "metadata" in fetch_data
    assert "diagnostics" in fetch_data

    missing_res = client.get("/api/causal/results/run-doesnotexist")
    assert missing_res.status_code == 404
    missing_data = missing_res.json()
    assert missing_data["status"] == "error"
    assert missing_data["error"]["code"] == "RUN_NOT_FOUND"


def test_unexpected_server_error_shields_stack_traces():
    # Pass raise_server_exceptions=False so TestClient captures the 500 JSONResponse
    unhandled_client = TestClient(app, raise_server_exceptions=False)
    with patch(
        "backend.app.services.data_service.DataService.get_dataset_summary",
        side_effect=RuntimeError("Secret database path failure"),
    ):
        response = unhandled_client.get("/api/data/summary")
        assert response.status_code == 500
        data = response.json()
        assert data["status"] == "error"
        assert data["error"]["code"] == "INTERNAL_SERVER_ERROR"
        # Shielded: internal runtime error message must NOT leak into client response
        assert "Secret database path failure" not in str(data)


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
    data = response.json()
    assert data["status"] == "error"
    assert data["error"]["code"] == "VALIDATION_ERROR"