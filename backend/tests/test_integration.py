import io
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_full_pipeline_mock_workflow():
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
    )
    files = {"file": ("campaign_sample.csv", io.BytesIO(csv_data), "text/csv")}
    upload_resp = client.post("/api/data/upload", files=files)
    assert upload_resp.status_code == 200
    upload_payload = upload_resp.json()["data"]
    assert upload_payload["filename"] == "campaign_sample.csv"
    assert upload_payload["row_count"] == 3
    assert upload_payload["validation_status"] == "VALID"

    # 3. Retrieve dataset profile summary
    summary_resp = client.get("/api/data/summary")
    assert summary_resp.status_code == 200
    summary_payload = summary_resp.json()["data"]
    assert summary_payload["preprocessing_status"] == "READY"
    assert len(summary_payload["columns"]) > 0

    # 4. Trigger causal effect analysis
    causal_req = {
        "treatment_column": "discount_offered",
        "outcome_column": "purchased",
        "confounders": ["income", "age"],
    }
    causal_resp = client.post("/api/causal/analyze", json=causal_req)
    assert causal_resp.status_code == 200
    causal_payload = causal_resp.json()["data"]
    run_id = causal_payload["run_id"]
    assert causal_payload["status"] == "COMPLETED"
    assert causal_payload["is_mock"] is True
    assert causal_payload["ate_summary"]["average_treatment_effect"] > 0

    # 5. Fetch causal analysis run by ID
    fetch_resp = client.get(f"/api/causal/results/{run_id}")
    assert fetch_resp.status_code == 200
    assert fetch_resp.json()["data"]["run_id"] == run_id

    # 6. Execute budget optimization allocation
    opt_req = {
        "budget": 100.0,
        "available_discounts": [10.0, 20.0],
        "customer_ids": ["cust-1", "cust-2", "cust-3"],
        "objective": "maximize_revenue",
    }
    opt_resp = client.post("/api/optimization/run", json=opt_req)
    assert opt_resp.status_code == 200
    opt_payload = opt_resp.json()["data"]
    assert opt_payload["status"] == "SCAFFOLD_MOCK"
    assert opt_payload["is_mock"] is True
    assert opt_payload["total_spend"] <= 100.0
    assert len(opt_payload["allocation"]) == 3


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
