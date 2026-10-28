Here is the complete, raw markdown content to paste directly into `docs/api-contract.md`:

```markdown
# EconoCausal — API Contract & Team Integration Specifications
**Status:** Approved Week 2 Baseline & Week 3 Optimization Alignment  
**Base URL:** `/api/`  
**Target Dataset:** `econocausal_enriched_synthetic_dataset.csv` (20,000 rows, 4 discrete treatment levels)

---

## 1. Global Response & Error Conventions

All API responses strictly adhere to uniform envelope schemas.

### Standard Success Envelope
```json
{
  "status": "success",
  "data": {}
}

```

### Standard Error Envelope

Internal exception stack traces and server-side file paths are shielded from client responses.

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description of what failed.",
    "details": []
  }
}

```

#### Standard Error Codes

| HTTP Status | Error Code | Description |
| --- | --- | --- |
| `400` | `INVALID_FILE_FORMAT` | Uploaded file is not a supported CSV file. |
| `400` | `EMPTY_DATASET` | Uploaded CSV has 0 rows or is empty. |
| `400` | `ENCODING_ERROR` | File contents could not be decoded as UTF-8. |
| `400` | `INVALID_COLUMN_SPECIFICATION` | Analysis request contains invalid, overlapping, or non-existent column names. |
| `404` | `NO_DATA_UPLOADED` | Attempted summary, analysis, or reset before uploading data. |
| `404` | `RUN_NOT_FOUND` | The requested `run_id` does not exist in the session store. |
| `422` | `VALIDATION_ERROR` | Request payload failed Pydantic schema validation (e.g., negative budget). |
| `500` | `INTERNAL_SERVER_ERROR` | Unhandled server exception (sanitized and shielded). |

---

## 2. Dataset Ingestion & Profiling Endpoints

### GET /api/health

* **Description:** Application health and diagnostic check.
* **Request:** None.
* **Response (200 OK):**

```json
{
  "status": "ok",
  "service": "EconoCausal API",
  "version": "0.1.0"
}

```

---

### POST /api/data/upload

* **Description:** Upload campaign/customer CSV dataset for schema validation and profile generation. Temporary file handles are closed in `finally` blocks.
* **Request:** `multipart/form-data` (`file`: CSV file).
* **Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "filename": "econocausal_enriched_synthetic_dataset.csv",
    "row_count": 20000,
    "column_count": 31,
    "columns": ["customer_id", "discount_offered", "purchased", "historical_spend", "age", "income_bracket"],
    "validation_status": "VALID",
    "validation_errors": []
  }
}

```

---

### GET /api/data/summary

* **Description:** Retrieve dataset profile, column summary statistics, missingness, eligible confounder detection, and discrete treatment value distributions.
* **Request:** None.
* **Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "row_count": 20000,
    "column_count": 31,
    "columns": [
      {
        "name": "historical_spend",
        "data_type": "float64",
        "null_count": 0,
        "null_percentage": 0.0,
        "is_eligible_confounder": true
      },
      {
        "name": "customer_id",
        "data_type": "object",
        "null_count": 0,
        "null_percentage": 0.0,
        "is_eligible_confounder": false
      }
    ],
    "treatment_coverage": {
      "treatment_column": "discount_offered",
      "unique_values": [0.0, 5.0, 10.0, 20.0],
      "counts": {
        "0.0": 5000,
        "5.0": 5000,
        "10.0": 5000,
        "20.0": 5000
      }
    },
    "preprocessing_status": "READY"
  }
}

```

---

### POST /api/data/reset

* **Description:** Clear active session DataFrames and purge cached causal runs to safely reclaim memory.
* **Request:** None.
* **Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "message": "Active dataset and cached analysis runs have been cleared."
  }
}

```

---

## 3. Causal Analysis & Refutation Endpoints

### POST /api/causal/analyze

* **Description:** Trigger causal DML effect estimation run.
* **Request (JSON):**

```json
{
  "treatment_column": "discount_offered",
  "outcome_column": "purchased",
  "confounders": ["age", "income_bracket", "historical_spend", "browsing_frequency"]
}

```

* **Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "run_id": "run-f19b84a9-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "status": "COMPLETED",
    "is_mock": true,
    "ate_summary": {
      "average_treatment_effect": 0.0842,
      "confidence_interval_lower": 0.0621,
      "confidence_interval_upper": 0.1063,
      "unit": "percentage_points"
    },
    "segment_effects": [
      {
        "segment_name": "high_spend",
        "estimated_effect": 0.125,
        "sample_size": 4200
      },
      {
        "segment_name": "low_spend",
        "estimated_effect": 0.041,
        "sample_size": 5800
      }
    ],
    "metadata": {
      "sample_size": 20000,
      "treatment_column": "discount_offered",
      "outcome_column": "purchased",
      "confounders_count": 4,
      "algorithm": "CausalForestDML"
    },
    "diagnostics": {
      "refutation_status": "PENDING_INTEGRATION",
      "warnings": [
        "Estimates rely on conditional unconfoundedness; unobserved confounding cannot be ruled out.",
        "Refutation checks are descriptive and do not prove causal identification."
      ],
      "checks": [
        {
          "check_name": "random_common_cause",
          "status": "PENDING_INTEGRATION",
          "p_value": null
        },
        {
          "check_name": "placebo_treatment_refuter",
          "status": "PENDING_INTEGRATION",
          "p_value": null
        }
      ]
    }
  }
}

```

---

### GET /api/causal/results/{run_id}

* **Description:** Retrieve results of an existing causal analysis run by ID.
* **Request:** Path parameter `run_id`.
* **Response (200 OK / 404 Not Found):** Returns the analysis record or `{"status": "error", "error": {"code": "RUN_NOT_FOUND", ...}}`.

---

## 4. Optimization Engine (`/api/optimization/run`)

### 4.1 Optimization Contract Status

* **Status**: Prototype Specification & Contract Alignment (Week 3, Day 15).
* **Solver**: SciPy (`scipy.optimize.milp` / `scipy.optimize.linprog` for discrete allocation; `scipy.optimize.minimize(method='SLSQP')` for continuous relaxation).
* **Estimator Integration**: Individual Treatment Effects ($\hat{\tau}_i$) derived from Ritik's `CausalForestDML` predictions ($T \in \{0, 5, 10, 20\}$, $Y \in \{0, 1\}$).
* **Uplift Evaluation Coupling**: Uses Kanshika's `evaluate_uplift(data, scores, ...)` for Qini and cumulative gain ranking diagnostics.

### 4.2 Endpoint Specification

* **Path**: `POST /api/optimization/run`
* **Content-Type**: `application/json`

#### Request Schema (`OptimizationRequest`)

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `budget` | `float` | Yes | `gt=0` | Total financial subsidy / discount budget available. |
| `available_discounts` | `list[float]` | Yes | Elements in `[0.0, 5.0, 10.0, 20.0]` | Eligible treatment discount percentages to evaluate. |
| `customer_ids` | `list[str]` | Optional | Non-empty if provided | Target cohort identifiers. Defaults to all active rows if omitted. |
| `objective` | `str` | Optional | Default `"MAXIMIZE_UPLIFT"` | Target metric: `"MAXIMIZE_UPLIFT"` (incremental buyers) or `"MAXIMIZE_REVENUE"`. |

#### Response Schema (`OptimizationResponse`)

```json
{
  "status": "success",
  "data": {
    "optimization_id": "opt-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "status": "FEASIBLE",
    "solver_message": "Optimization converged successfully via SciPy.",
    "total_budget": 5000.0,
    "total_spend": 4980.0,
    "unallocated_budget": 20.0,
    "total_expected_uplift": 342.5,
    "is_mock": false,
    "allocations": [
      {
        "customer_id": "cust-1001",
        "assigned_discount": 10.0,
        "expected_uplift": 0.084,
        "subsidy_cost": 10.0
      }
    ],
    "summary": {
      "total_customers": 1000,
      "treated_customers": 450,
      "control_customers": 550,
      "discount_breakdown": {
        "0.0": 550,
        "5.0": 150,
        "10.0": 200,
        "20.0": 100
      }
    },
    "limitations": [
      "Optimized allocations represent model-guided recommendations under unconfoundedness, not guaranteed business outcomes.",
      "Cost estimations assume fixed unit discount subsidies per treated individual."
    ]
  }
}

```

### 4.3 Infeasible & Edge Case Behavior

* **Budget Insufficient**: If `budget` is less than the minimum positive allocation cost across all candidates, the solver returns `status: "INFEASIBLE_INSUFFICIENT_BUDGET"`, assigning `0.0` discount to all candidates with `total_spend: 0.0`.
* **Zero Available Discounts**: If `available_discounts == [0.0]`, solver allocates baseline control ($0\%$) to everyone with `total_spend: 0.0`.
* **Invalid Input**: A non-positive budget or discount values outside `{0, 5, 10, 20}` raise a standard `422 Unprocessable Entity` validation error.

---

## 5. Diagnostics & Uplift Interfaces (`backend/app/causal/`)

### 5.1 Uplift Evaluation Interface (`uplift_evaluation.py`)

```python
def evaluate_uplift(
    data: pd.DataFrame,
    scores: np.ndarray,
    treatment_level: float,
    control_level: float = 0.0,
    treatment_col: str = "discount_offered",
    outcome_col: str = "purchased"
) -> pd.DataFrame:
    """Calculate cumulative uplift gain for one treatment vs control."""

```

* **Output columns:** `rank`, `score`, `treatment`, `outcome`, `cumulative_treated`, `cumulative_control`, `cumulative_treated_outcomes`, `cumulative_control_outcomes`, `uplift_gain`.
* **Caveat:** Returns descriptive ranking diagnostics; does not prove causality.

### 5.2 Refutation Interface (`refutation.py`)

```python
def format_refutation_result(
    check_name: str,
    status: str,
    result: dict | None = None,
    configuration: dict | None = None,
    interpretation: str = "",
    limitations: str = ""
) -> dict:
    """Format a refutation check result consistently."""

```

* **Supported Methods:** `random_common_cause`, `placebo_treatment_refuter`, `data_subset_refuter`.
* **Allowed Statuses:** `{"planned", "passed", "failed", "skipped", "error"}`.
* **Caveat:** Returns explicit field `causal_claim_proven: False`.

---

## 6. Active Team Blockers & Handoff Matrix

| Blocker ID | Affected Module | Description | Owner | Status |
| --- | --- | --- | --- | --- |
| `BLK-01` | `backend/app/causal/estimator.py` | Port `CausalForestDML` fit/predict routines from `EconoCausal_project.ipynb` into a callable service module to replace mock baseline effects. | Ritik / Harsh | In Progress |
| `BLK-02` | `backend/app/causal/refutation.py` | Upstream diagnostics files merged into `origin/develop`. Backend integration pending safe sync to preserve backend code structure. | Kanshika / Harsh | Code Available |
| `BLK-03` | `backend/app/services/optimization_service.py` | Implement core SciPy optimization solver to replace `SCAFFOLD_MOCK`. | Harsh | Scheduled (Day 16) |

---

## 7. Frontend Integration & CORS

* **CORS Allowed Origins:** `http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:3000`, `http://127.0.0.1:5173`
* **Interactive Documentation:** Available at `/docs` (Swagger UI) and `/redoc`
* **Pipeline Workflow Sequence:**
1. `GET /api/health` — Connectivity check
2. `POST /api/data/upload` — Ingest CSV file
3. `GET /api/data/summary` — Profile statistics & treatment counts
4. `POST /api/causal/analyze` — Trigger DML causal run
5. `GET /api/causal/results/{run_id}` — Fetch structured results & diagnostics
6. `POST /api/optimization/run` — Run SciPy budget allocation
7. `POST /api/data/reset` — Flush session memory



```

```