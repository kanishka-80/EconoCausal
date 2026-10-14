# EconoCausal — API Contract (Week 1 Baseline)
**Status:** Draft for Team Alignment (Khushi, Ritik, Kanshika, Harsh)
**Base URL:** \/api\

---

## 1. Global Response & Error Conventions

### Standard Success Envelope
\\\json
{
  "status": "success",
  "data": {}
}
\\\

### Standard Error Envelope
\\\json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description of what failed.",
    "details": []
  }
}
\\\

---

## 2. Endpoints (Week 1 Scope)

### GET /api/health
- **Description:** Application health and diagnostic check.
- **Request:** None.
- **Response (200 OK):**
\\\json
{
  "status": "ok",
  "service": "EconoCausal API",
  "version": "0.1.0"
}
\\\

---

### POST /api/data/upload
- **Description:** Upload campaign/customer CSV dataset for schema validation and profile generation.
- **Request:** \multipart/form-data\ (\ile\: CSV file).
- **Response (200 OK):**
\\\json
{
  "status": "success",
  "data": {
    "filename": "campaign_data.csv",
    "row_count": 10000,
    "column_count": 8,
    "columns": ["customer_id", "discount_offered", "purchased", "spend", "age", "income"],
    "validation_status": "VALID",
    "validation_errors": []
  }
}
\\\

---

### GET /api/data/summary
- **Description:** Retrieve dataset profile, column summary statistics, missingness, and pre-treatment feature readiness.
- **Request:** None.
- **Response (200 OK):**
\\\json
{
  "status": "success",
  "data": {
    "row_count": 1000,
    "column_count": 4,
    "columns": [],
    "treatment_coverage": {},
    "preprocessing_status": "READY"
  }
}
\\\

---

### POST /api/causal/analyze
- **Description:** Trigger causal DML effect estimation run.
- **Request:** JSON
\\\json
{
  "treatment_column": "discount_offered",
  "outcome_column": "purchased",
  "confounders": ["income", "age"]
}
\\\
- **Response (200 OK):** Returns run ID, execution status, and estimated ATE.

---

### GET /api/causal/results/{run_id}
- **Description:** Retrieve results of an existing causal analysis run.
- **Response (200 OK / 404 Not Found):** Returns result record or \RUN_NOT_FOUND\.

---

### POST /api/optimization/run
- **Description:** Run budget-constrained discount allocation optimization.
- **Request:** JSON
\\\json
{
  "budget": 5000.0,
  "available_discounts": [10.0, 20.0],
  "customer_ids": ["cust-1", "cust-2", "cust-3"],
  "objective": "maximize_revenue"
}
\\\
- **Response (200 OK):**
\\\json
{
  "status": "success",
  "data": {
    "optimization_id": "opt-12345678",
    "status": "SCAFFOLD_MOCK",
    "is_mock": true,
    "total_spend": 3500.0,
    "unused_budget": 1500.0,
    "objective_value": 8500.0,
    "allocated_customers_count": 3,
    "allocation": [
      {"customer_id": "cust-1", "assigned_discount": 10.0, "cost": 10.0},
      {"customer_id": "cust-2", "assigned_discount": 20.0, "cost": 20.0},
      {"customer_id": "cust-3", "assigned_discount": 10.0, "cost": 10.0}
    ]
  }
}
\\\
- **Response (400 Bad Request / 422 Unprocessable):**
\\\json
{
  "status": "error",
  "error": {
    "code": "INVALID_BUDGET",
    "message": "Budget must be greater than zero.",
    "details": []
  }
}
\\\

---

## 3. Open Team Decisions (Pending Review)
1. **Treatment Specification (Ritik/Kanshika):** Discrete discount levels vs continuous pricing treatment.
2. **Outcome Metric (Team Decision):** Binary conversion (\purchased\) vs continuous revenue (\spend\).
3. **Optimizer Objective (Harsh/Team):** Maximize predicted revenue vs maximize incremental profit (requires contribution margin and offer cost).
4. **Offer Constraint (Team Decision):** Enforce exactly at most one offer per customer vs multiple offer combinations.
