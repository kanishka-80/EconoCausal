# EconoCausal — API Contract (Week 1 Baseline)
**Status:** Draft for Team Alignment (Khushi, Ritik, Kanshika, Harsh)
**Base URL:** \/api\

---

## 1. Global Response & Error Conventions

### Standard Success Envelope
All JSON responses follow a predictable structure:
\\\json
{
  "status": "success",
  "data": {}
}
\\\

### Standard Error Envelope
Error responses return meaningful HTTP status codes (400, 404, 422, 500) and this body:
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
- **Request:** \multipart/form-data\
  - \ile\: CSV file (required, max size to be agreed with team).
- **Response (200 OK):**
\\\json
{
  "status": "success",
  "data": {
    "filename": "campaign_data.csv",
    "row_count": 10000,
    "column_count": 8,
    "columns": ["customer_id", "discount_offered", "purchased", "spend", "age", "income", "loyalty_score", "prior_orders"],
    "validation_status": "VALID",
    "validation_errors": []
  }
}
\\\
- **Response (400 Bad Request / 422 Unprocessable):**
\\\json
{
  "status": "error",
  "error": {
    "code": "INVALID_FILE_FORMAT",
    "message": "Uploaded file must be a valid CSV file.",
    "details": []
  }
}
\\\

---

### GET /api/data/summary
- **Description:** Retrieve the dataset profile, column summary statistics, missingness, and pre-treatment feature readiness.
- **Request:** None (or \?dataset_id={id}\ when persistence is configured).
- **Response (200 OK):**
\\\json
{
  "status": "success",
  "data": {
    "row_count": 10000,
    "column_count": 8,
    "columns": [
      {
        "name": "customer_id",
        "data_type": "string",
        "null_count": 0,
        "null_percentage": 0.0,
        "is_eligible_confounder": false
      },
      {
        "name": "discount_offered",
        "data_type": "float",
        "null_count": 0,
        "null_percentage": 0.0,
        "is_eligible_confounder": false
      },
      {
        "name": "purchased",
        "data_type": "integer",
        "null_count": 0,
        "null_percentage": 0.0,
        "is_eligible_confounder": false
      }
    ],
    "treatment_coverage": {
      "treatment_column": "discount_offered",
      "unique_values": [0, 10, 20],
      "counts": {
        "0": 3400,
        "10": 3300,
        "20": 3300
      }
    },
    "preprocessing_status": "READY"
  }
}
\\\

---

## 3. Open Team Decisions (Pending Review)
1. **Treatment Specification (Ritik/Kanshika):** Are discounts modeled as continuous amounts or discrete levels (e.g., control vs  vs )?
2. **Outcome Metric (Team Decision):** Binary conversion (\purchased\) vs continuous revenue (\spend\).
3. **Optimizer Objective (Harsh/Team):** Maximize predicted revenue vs maximize incremental profit (requires contribution margin and offer cost).
