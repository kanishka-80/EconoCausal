# EconoCausal — Week 4 Day 4 Refutation Report

**Owner:** Tanishka (Kanshika) — Causal DAG, Diagnostics, Refutation & Evaluation  
**Date:** Tuesday, 3 November 2026 (Verified 8 November 2026)  
**Status:** Completed & Verified  

---

## 1. Objective

Finalize the refutation checks architecture, test error handling and unsupported dependency states, and document the methodological interpretation of sensitivity checks. Ensure that refutation results are never overstated as proof of causal validity.

---

## 2. Refutation Architecture

Implemented in: `backend/app/causal/refutation.py`

### Supported Check Methods:
1. **`random_common_cause`:**
   - Adds an artificially generated random confounder to the dataset.
   - *Expected Behavior:* The estimated treatment effect should remain relatively stable if the original adjustment set adequately captured confounding.
2. **`placebo_treatment_refuter`:**
   - Replaces the true treatment assignment with a synthetic random placebo.
   - *Expected Behavior:* The estimated treatment effect under placebo assignment should drop to approximately zero.
3. **`data_subset_refuter`:**
   - Evaluates the effect on randomly sampled subsets of the data (e.g. 80-90% data subsets).
   - *Expected Behavior:* Effect estimates should exhibit numerical stability across subsets.

---

## 3. Execution Status & Environment Transparency

In the current demo environment:
- DoWhy dependency status: `_dowhy_available() -> False`
- `get_refutation_plan()` output:
  ```json
  {
    "status": "dependency_missing",
    "dependency_available": false,
    "methods": [
      "random_common_cause",
      "placebo_treatment_refuter",
      "data_subset_refuter"
    ],
    "checks": [
      {"check_name": "random_common_cause", "status": "unsupported"},
      {"check_name": "placebo_treatment_refuter", "status": "unsupported"},
      {"check_name": "data_subset_refuter", "status": "unsupported"}
    ],
    "causal_claim_proven": false
  }
  ```

### Design Principle: Honest Status Reporting
The module does **not** simulate fake results or crash. When DoWhy is absent or an estimator raises an error:
- Each check is marked with its exact status (`unsupported`, `error`, `failed`, or `completed`).
- An informative error message (`Missing optional dependency: dowhy`) is returned.
- `causal_claim_proven` is hard-coded to `False` across all return shapes.

---

## 4. Automated Test Verification

Module: `tests/test_refutation.py`
- `test_get_refutation_plan_returns_supported_methods`: PASSED
- `test_format_refutation_result_enforces_supported_check_names`: PASSED
- `test_format_refutation_result_enforces_allowed_statuses`: PASSED
- `test_run_refutation_checks_handles_missing_dowhy_gracefully`: PASSED
- `test_run_refutation_checks_handles_estimator_exceptions`: PASSED
- `test_refutation_never_claims_causality_proven`: PASSED
- **Total Test Result:** 12 passed out of 12.

---

## 5. Methodological Interpretation & Limitations

> [!WARNING]
> Refutation checks test model sensitivity to specific simulated perturbations. They **cannot** verify unconfoundedness, rule out unmeasured common causes, or prove that an estimated treatment effect is true.
