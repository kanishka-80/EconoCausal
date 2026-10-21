import io
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.data_service import DataService

client = TestClient(app)


def test_full_pipeline_mock_workflow():
    # 0. Ensure clean state
    DataService.clear()

    # 1. Health check
    health_resp = client.get("/api/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "ok"

    # 2. Upload dataset CSV
    csv_data = (
        b"customer_id,discount_offered,purchased,income,age\n"
        b"cust-1,10.0,1,55000.0,32\n"
        b"cust-2,0.0,0,48000.0,45\n"
        b"cust-3,20.0,1,72000.0,29\n"
        b"cust-4,0.0,0,34000.0,52\n"
    )
    files = {"file": ("campaign_sample.csv", io.BytesIO(csv_data), "text/csv")}
    upload_resp = client.post("/api/data/upload", files=files)
    assert upload_resp.status_code == 200
    upload_json = upload_resp.json()
    assert upload_json["status"] == "success"
    upload_payload = upload_json["data"]
    assert upload_payload["filename"] == "campaign_sample.csv"
    assert upload_payload["row_count"] == 4
    assert upload_payload["column_count"] == 5
    assert upload_payload["validation_status"] == "VALID"

    # 3. Retrieve dataset profile summary
    summary_resp = client.get("/api/data/summary")
    assert summary_resp.status_code == 200
    summary_json = summary_resp.json()
    assert summary_json["status"] == "success"
    summary_payload = summary_json["data"]
    assert summary_payload["preprocessing_status"] == "READY"
    assert summary_payload["row_count"] == 4
    assert len(summary_payload["columns"]) == 5

    # 4. Trigger causal effect analysis
    causal_req = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["income", "age"],
    }
    causal_resp = client.post("/api/causal/analyze", json=causal_req)
    assert causal_resp.status_code == 200
    causal_json = causal_resp.json()
    assert causal_json["status"] == "success"
    causal_payload = causal_json["data"]
    run_id = causal_payload["run_id"]
    assert causal_payload["status"] == "COMPLETED"
    assert causal_payload["is_mock"] is True

    # Validate ATE & CATE details
    assert causal_payload["ate_summary"]["average_treatment_effect"] is not None
    assert causal_payload["ate_summary"]["unit"] == "percentage_points"
    assert "confidence_interval_lower" in causal_payload["ate_summary"]
    assert "confidence_interval_upper" in causal_payload["ate_summary"]
    assert len(causal_payload["segment_effects"]) > 0

    # Validate Metadata & Diagnostics
    assert causal_payload["metadata"]["sample_size"] == 4
    assert causal_payload["metadata"]["execution_time_seconds"] >= 0.0
    assert causal_payload["diagnostics"]["refutation_status"] == "PENDING_INTEGRATION"
    assert len(causal_payload["diagnostics"]["checks"]) == 2
    assert causal_payload["diagnostics"]["checks"][0]["status"] == "PENDING_INTEGRATION"

    # 5. Fetch causal analysis run by ID
    fetch_resp = client.get(f"/api/causal/results/{run_id}")
    assert fetch_resp.status_code == 200
    fetch_json = fetch_resp.json()
    assert fetch_json["status"] == "success"
    assert fetch_json["data"]["run_id"] == run_id
    assert fetch_json["data"]["status"] == "COMPLETED"

    # 6. Execute budget optimization allocation
    opt_req = {
        "budget": 100.0,
        "available_discounts": [10.0, 20.0],
        "customer_ids": ["cust-1", "cust-2", "cust-3"],
        "objective": "maximize_revenue",
    }
    opt_resp = client.post("/api/optimization/run", json=opt_req)
    assert opt_resp.status_code == 200
    opt_json = opt_resp.json()
    assert opt_json["status"] == "success"
    opt_payload = opt_json["data"]
    assert opt_payload["status"] == "SCAFFOLD_MOCK"
    assert opt_payload["is_mock"] is True
    assert opt_payload["total_spend"] <= 100.0
    assert len(opt_payload["allocation"]) == 3

    # 7. Safe cleanup and state invalidation
    reset_resp = client.post("/api/data/reset")
    assert reset_resp.status_code == 200
    assert reset_resp.json()["status"] == "success"

    # Verify state is cleared: summary should now return 404
    post_reset_summary = client.get("/api/data/summary")
    assert post_reset_summary.status_code == 404
    assert post_reset_summary.json()["error"]["code"] == "NO_DATA_UPLOADED"


def test_integration_sequence_after_reset_fails_predictably():
    # Start with cleared state
    DataService.clear()

    # Attempting to analyze without upload must fail with 400 NO_DATA_UPLOADED
    causal_req = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["age"],
    }
    resp = client.post("/api/causal/analyze", json=causal_req)
    assert resp.status_code == 400
    res_json = resp.json()
    assert res_json["status"] == "error"
    assert res_json["error"]["code"] == "NO_DATA_UPLOADED"

    # Upload valid CSV
    csv_data = b"customer_id,discount_offered,purchased,age\nc1,10.0,1,25\nc2,20.0,0,40\n"
    files = {"file": ("data.csv", io.BytesIO(csv_data), "text/csv")}
    upload_res = client.post("/api/data/upload", files=files)
    assert upload_res.status_code == 200

    # Attempting to analyze with nonexistent columns must fail with 400 INVALID_COLUMN_SPECIFICATION
    bad_req = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["salary"],
    }
    bad_resp = client.post("/api/causal/analyze", json=bad_req)
    assert bad_resp.status_code == 400
    assert bad_resp.json()["error"]["code"] == "INVALID_COLUMN_SPECIFICATION"

    # Reset cleans up
    client.post("/api/data/reset")


def test_cors_preflight_headers():
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"