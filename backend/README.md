# EconoCausal — Backend Architecture & Developer Handover (Week 1)

## 1. Overview
This module hosts the FastAPI backend for **EconoCausal**, providing schema-validated endpoints, service orchestration, and integration contracts for causal ML and budget optimization.

---

## 2. Directory Layout
\\\	ext
backend/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.py        # Health check endpoint
│   │   │   ├── data.py          # CSV upload and summary endpoints
│   │   │   ├── causal.py        # Causal analysis trigger and results retrieval
│   │   │   └── optimization.py  # Budget optimization endpoint
│   │   └── router.py            # Central router mounting all routes under /api
│   ├── schemas/
│   │   ├── common.py            # StandardResponse and ErrorResponse envelopes
│   │   ├── data.py              # UploadValidationData & DatasetSummaryData
│   │   ├── causal.py            # CausalAnalysisRequest & CausalAnalysisData
│   │   └── optimization.py      # OptimizationRequest & OptimizationResultData
│   ├── services/
│   │   ├── data_service.py      # CSV validation & profiling logic
│   │   ├── causal_service.py    # Run execution & in-memory tracking
│   │   └── optimization_service.py # Budget allocation scaffold logic
│   ├── optimization/            # SciPy optimization package (Week 3 integration)
│   │   ├── objective.py
│   │   ├── constraints.py
│   │   ├── solver.py
│   │   └── allocation.py
│   ├── config.py                # Environment and app settings
│   └── main.py                  # App factory and CORS middleware configuration
├── tests/
│   ├── test_api.py              # Route integration and client error tests
│   ├── test_schemas.py          # Pydantic schema validation tests
│   ├── test_services.py         # Unit tests for service classes
│   └── test_integration.py     # End-to-end full user workflow smoke test
├── requirements.txt             # Backend dependencies
└── pytest.ini                   # Pytest test discovery configuration
\\\

---

## 3. Local Setup & Running the Server

### Activate Virtual Environment
\\\powershell
.venv\Scripts\activate
\\\

### Install Dependencies
\\\powershell
pip install -r backend/requirements.txt
\\\

### Start the API Development Server
\\\powershell
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
\\\
- Interactive API Docs (Swagger): \http://127.0.0.1:8000/docs\
- Alternative API Docs (ReDoc): \http://127.0.0.1:8000/redoc\

---

## 4. Running Tests
Run the complete regression suite (21 tests):
\\\powershell
pytest
\\\

---

## 5. Teammate Integration Status & Open Decisions

### For Khushi (Frontend)
- **CORS Allowed Origins:** \http://localhost:3000\, \http://localhost:5173\, \http://127.0.0.1:3000\, \http://127.0.0.1:5173\
- **Response Format:** All responses follow the unified envelope:
  - Success: \{"status": "success", "data": {...}}\
  - Client Errors (400/404/422): \{"status": "error", "error": {"code": "...", "message": "...", "details": []}}\
- **Mock Notice:** Responses from \/api/causal/analyze\ and \/api/optimization/run\ have \"is_mock": true\ to prevent confusing test scaffolds with real analysis.

### For Ritik & Kanshika (ML & Diagnostics)
- **Causal Interface:** \/api/causal/analyze\ accepts \	reatment_column\, \outcome_column\, and \confounders\.
- **Open Decision 1:** Support discrete discount treatment levels vs continuous pricing treatment.
- **Open Decision 2:** Outcome specification (binary conversion rate vs continuous customer spend).
- **Open Decision 3:** DoWhy refutation metrics structure to be exposed in the frontend.

### For Optimization (Week 3 Scope)
- **Placeholders Established:** Modular structure created in \ackend/app/optimization/\.
- **Open Decision 4:** Objective formulation: Maximize predicted revenue vs maximize incremental profit.
