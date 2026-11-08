# EconoCausal — Week 4 Final Evaluation Handover & Demo Notes

**Owner:** Tanishka (Kanshika) — Causal DAG, Diagnostics, Refutation & Evaluation  
**Date:** Friday, 6 November 2026 (Verified 8 November 2026)  
**Branch:** `feature/kanshika-causal-foundation-week1`  
**Deliverable Status:** Complete, Verified, Ready for Merge  

---

## 1. Handover Summary

This document concludes the 4-week causal evaluation workstream for the EconoCausal project. All deliverables owned by Tanishka/Kanshika have been implemented, tested, documented, and aligned with team members (Ritik, Harsh, and Khushi).

### Core Modules Delivered:
1. `backend/app/causal/dag.py`: Structural causal DAG, cycle detection, 31 candidate covariates.
2. `backend/app/causal/propensity.py`: Multi-treatment propensity score estimator, positivity checks, SMD & categorical balance.
3. `backend/app/causal/refutation.py`: Standardized DoWhy refutation check harness and error handling.
4. `backend/app/causal/uplift_evaluation.py`: Qini-style cumulative uplift curve generation and customer identifier preservation.
5. `tests/`: 52 unit and integration tests passing with 100% success rate.

---

## 2. Integrated Demo Talking Points & Notes

When presenting the causal evaluation workstream in the integrated project demo:

### A. The Business Question & Causal Formulation
- **Target Question:** "How does the offered discount level (0%, 5%, 10%, 20%) causally affect a customer's purchase probability?"
- **The Challenge:** In observational e-commerce data, discounts are often offered selectively to high-intent or frequent shoppers, creating confounding.
- **Our Solution:** An explicit causal DAG and Double Machine Learning (DML) adjustment to isolate the discount's incremental impact.

### B. Causal DAG (Structure & Assumptions)
- We explicitly modeled 31 pre-treatment covariates influencing both discount assignment and purchase outcomes.
- Cycle detection guarantees structural consistency (`is_acyclic() == True`).
- *Key Demo Note:* The DAG represents structural domain assumptions, not automated proof of truth.

### C. Overlap & Balance Diagnostics
- **Propensity Overlap:** Range is 0.00058 to 0.93442. 98.46% of customers have healthy overlap across all 4 discount tiers.
- **Balance Checks:** 81% of numeric comparisons have standardized mean differences < 0.1, and all categorical differences are < 0.08.
- *Key Demo Note:* Highlight that diagnostics identify where estimates are reliable and warn where data is thin.

### D. Uplift Evaluation & Customer Targeting
- Evaluates individual-level effect predictions against realized outcomes to produce Qini gain curves.
- Customer IDs are preserved directly in ranking tables to directly feed Harsh's SciPy budget optimization engine.

### E. The Critical Caveat (Diagnostic Evidence != Causal Proof)
- *Emphasize to stakeholders:* Passing balance tests, acyclic DAG structures, or high uplift gains are diagnostic evidence of model behavior. They do not constitute mathematical certainty of zero unobserved confounding.

---

## 3. Week 4 Completion Checklist

- [x] DAG reflects the approved treatment (`discount_offered`), outcome (`purchased`), and 31 pre-treatment covariates.
- [x] Identification assumptions and unverified assumptions are documented (`docs/causal-assumptions.md`).
- [x] Appropriate overlap/propensity diagnostics are run and documented (`docs/week4-day3-diagnostics.md`).
- [x] Refutation checks are reproducible, robust to missing dependencies, and interpreted cautiously (`docs/week4-day4-refutation.md`).
- [x] Uplift evaluation is reported with Qini gain and customer ID preservation (`docs/week4-day5-uplift.md`).
- [x] Evaluation summary matches Ritik's DML run and configuration (`docs/week4-day6-evaluation-summary.md`).
- [x] Harsh's API schemas and Khushi's dashboard caveats are represented consistently.
- [x] Relevant tests run with 52 passed, 0 failed, and 0 regressions.
- [x] PR and handover notes are complete and ready for merge into `develop`.

---

## 4. Deferred Work & Future Directions

1. **Production DoWhy Execution:** Once the production environment includes compatible DoWhy wheel binaries, execute live refuter checks against the fitted CausalForestDML instance.
2. **Confidence Bounds for Qini Curves:** Add bootstrap confidence bands for cumulative uplift gain curves in post-demo releases.
3. **Temporal Validation:** When real-world transaction timestamps become available, enforce automated pre/post treatment date filtering at data ingestion.
