# EconoCausal — Week 4 Day 6 Integrated Evaluation Summary

**Owner:** Tanishka (Kanshika) — Causal DAG, Diagnostics, Refutation & Evaluation  
**Date:** Thursday, 5 November 2026 (Verified 8 November 2026)  
**Status:** Integrated & Verified  

---

## 1. Executive Summary

This document combines the four pillars of the causal evaluation workstream into a unified, reproducible summary for the final project demo and integration:

1. **Causal DAG & Assumptions:** Minimal directed acyclic graph connecting 31 candidate covariates to treatment and outcome.
2. **Propensity & Overlap Diagnostics:** Multi-treatment logistic regression probability modeling, positivity indicators, and pairwise standardized mean difference (SMD) diagnostics.
3. **Refutation Robustness Architecture:** Standardized reporting format for random common cause, placebo treatment, and data subset refuters.
4. **Uplift Evaluation:** Cumulative Qini-style gain curves with customer ID preservation for downstream optimization.

---

## 2. Integrated Architecture Overview

```
                      +----------------------------------+
                      | Candidate Covariates (31 feats)  |
                      +-----------------+----------------+
                                        |
                  +---------------------+---------------------+
                  v                                           v
       +--------------------+                       +-------------------+
       | Treatment (T)      |---------------------->| Outcome (Y)       |
       | discount_offered   |   Causal Effect       | purchased (0/1)   |
       | (0, 5, 10, 20)     |                       +-------------------+
       +---------+----------+
                 |
        +--------+--------+------------------------+
        |                 |                        |
        v                 v                        v
+---------------+ +------------------+   +-------------------+
| Propensity &  | | DoWhy Refutation |   | Uplift Evaluation |
| Overlap Diag  | | Checks (3 types) |   | & Qini Curves     |
+---------------+ +------------------+   +---------+---------+
        |                 |                        |
        +--------+--------+------------------------+
                 |
                 v
   +-----------------------------+
   | Integrated Evaluation JSON  |
   | (Harsh API / Khushi UI)     |
   +-----------------------------+
```

---

## 3. Component Synthesis & Findings

### Component 1: DAG & Identification
- **Module:** `backend/app/causal/dag.py`
- **Specification:** $N = 33$ nodes, $E = 63$ edges.
- **Acyclicity:** Verified cycle-free (`is_acyclic() == True`).
- **Limitation:** The graph represents provisional assumptions. Unmeasured confounding cannot be ruled out by graph tests alone.

### Component 2: Overlap & Balance
- **Module:** `backend/app/causal/propensity.py`
- **Dataset:** 20,000 observations (5,000 per discount tier).
- **Diagnostics:** Min propensity `0.00058`, Max propensity `0.93442`. 308 records display thin overlap ($P < 0.01$).
- **Balance:** Numeric SMD < 0.1 in 81% of comparisons; categorical proportion differences all < 0.08.

### Component 3: Refutation Sensitivity
- **Module:** `backend/app/causal/refutation.py`
- **Supported Methods:** `random_common_cause`, `placebo_treatment_refuter`, `data_subset_refuter`.
- **Status Reporting:** Transparent reporting when optional DoWhy dependency is unavailable, returning serializable diagnostic payloads with `causal_claim_proven = False`.

### Component 4: Uplift Evaluation
- **Module:** `backend/app/causal/uplift_evaluation.py`
- **Output:** Descending rank order, cumulative treated/control counts, and scaled Qini uplift gains.
- **Customer Alignment:** Unique customer IDs (`customer_id`) preserved end-to-end to support Harsh's SciPy budget allocator.

---

## 4. Teammate Handoff & Interface Alignment

| Teammate | Workstream | Integration Touchpoint | Status |
|---|---|---|---|
| **Ritik** | DML Estimation | 31 feature names, discount levels (0, 5, 10, 20), binary outcome (`purchased`) | **Aligned** |
| **Harsh** | API / Optimizer | JSON evaluation schemas, status flags (`ready`, `completed`, `unsupported`), `customer_id` ranking output | **Aligned** |
| **Khushi** | Frontend UI | Labeling guidelines, warning flags for thin overlap (< 0.01), diagnostic caveat banners | **Aligned** |

---

## 5. Regression Test Results

Complete causal evaluation test suite executed on Python 3.12:

```text
tests/test_dag.py .........                               [ 17%]  (9 passed)
tests/test_propensity.py ............                     [ 40%]  (12 passed)
tests/test_refutation.py ............                     [ 63%]  (12 passed)
tests/test_uplift_evaluation.py ................          [ 94%]  (16 passed)
tests/test_uplift_integration.py ...                      [100%]  (3 passed)
============================= 52 passed in 35.91s =============================
```

- **Failures:** 0
- **Errors:** 0
- **Regressions:** 0
