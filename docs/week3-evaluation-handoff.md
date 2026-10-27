# EconoCausal — Week 3 Causal Evaluation Handoff

**Project:** EconoCausal  
**Week:** 3  
**Handoff date:** 30 October 2026  
**Branch:** `feature/kanshika-causal-foundation-week1`  
**Latest verified commit:** `32f0f70`

## 1. Executive Summary

Week 3 focused on strengthening causal evaluation, validating uplift calculations, verifying actual Double Machine Learning (DML) integration, preserving customer identifiers, and preparing the evaluation components for team integration.

The current branch's automated test suite completed successfully with **49 passed and 0 failed**.

Actual EconML-based DML training and uplift integration were successfully executed using Ritik's estimator code loaded temporarily from the `origin/Ritik` branch.

However, Ritik's DML implementation has not yet been integrated into the current development branch. Actual DoWhy refutation execution and the final API/frontend integration contract remain pending.

## 2. Dataset and Evaluation Configuration

| Property | Verified configuration |
|---|---|
| Dataset | `econocausal_enriched_synthetic_dataset.csv` |
| Dataset type | Synthetic |
| Observations | 20,000 |
| Columns | 40 |
| Treatment | `discount_offered` |
| Treatment levels | 0, 5, 10, 20 |
| Outcome | `purchased` |
| Outcome type | Binary |
| Customer identifier | `customer_id` |
| Candidate features | 31 |
| Encoded DML features | 51 |
| Training observations | 16,000 |
| Test observations | 4,000 |

The treatment assignment mechanism and pre-treatment timing of candidate covariates remain unverified.

## 3. Propensity Diagnostics

Week 3 propensity diagnostics were documented in `docs/model-evaluation.md` and `docs/causal-assumptions.md`.

Key observations:

- Minimum estimated propensity probability: approximately 0.000578.
- Maximum estimated propensity probability: approximately 0.934422.
- Probability entries below 0.01: 308.
- Numeric covariate comparisons: 126.
- Numeric comparisons with absolute standardized mean difference at least 0.1: 24.
- Maximum absolute SMD: approximately 0.948468 for `recency_days`, comparing discount levels 0 and 20.

The propensity diagnostics were performed in-sample. They are not cross-fitted estimates.

These results indicate potential overlap and covariate-balance concerns requiring further investigation.

## 4. Causal DAG and Refutation

The causal DAG implementation is available in `backend/app/causal/dag.py`.

The refutation implementation in `backend/app/causal/refutation.py` defines:

- Random common cause.
- Placebo treatment refuter.
- Data subset refuter.

Automated tests cover supported result handling and failure scenarios.

**Execution limitation:** DoWhy was not installed in the checked `econocausal` environment on 30 October 2026. Therefore, actual DoWhy refutation checks have not been verified as executed.

Passing refutation utility tests does not demonstrate that causal identification assumptions are valid.

## 5. Actual DML Integration Verification

The DML implementation was inspected on `origin/Ritik`.

The estimator uses EconML `CausalForestDML` with random forest nuisance models, discrete treatment handling, and three-fold cross-fitting.

Environment verification confirmed EconML version `0.17.0`.

A prior actual DML execution using Ritik's code produced:

| Metric | Observed result |
|---|---:|
| Training observations | 16,000 |
| Test observations | 4,000 |
| Treatment comparison | 10 versus 0 |
| Estimated individual effects | 4,000 |
| Average estimated effect | 0.064503 |
| Positive estimated effects | 3,511 |
| Negative estimated effects | 489 |
| Zero estimated effects | 0 |

These are model-estimated treatment effects on the synthetic dataset, not independently verified ground-truth causal effects.

The DML estimator and effect-estimation wrapper are present on `origin/Ritik`, but the estimator is not present in the current feature branch.

## 6. Uplift Evaluation

The uplift evaluator is implemented in:

`backend/app/causal/uplift_evaluation.py`

It supports:

- Pairwise treatment/control comparisons.
- Positionally aligned model scores.
- Descending score ranking.
- Cumulative treated and control counts.
- Cumulative observed positive outcomes.
- Descriptive Qini-style uplift gain.

Actual DML and uplift integration was previously verified with:

| Metric | Result |
|---|---:|
| Test observations scored | 4,000 |
| Selected treatment/control observations | 2,001 |
| Treatment 10 observations | 1,059 |
| Control 0 observations | 942 |
| Customer IDs preserved | Yes |
| Unique ranked customer IDs | 2,001 |
| Missing ranked customer IDs | 0 |
| Descending score order | Verified |

The uplift gain is a descriptive ranking diagnostic. It is not proof of a causal effect or validated policy value.

## 7. Customer ID Preservation

Commit `32f0f70` introduced optional customer identifier support through `id_col=None`.

When `id_col="customer_id"` is supplied:

- Customer IDs are preserved in the ranked output.
- IDs remain aligned with the corresponding scores and outcomes.
- Missing identifier columns raise `ValueError`.
- Missing identifier values raise `ValueError`.
- Identifier names conflicting with generated output fields are rejected.

Existing callers remain supported without supplying `id_col`.

The evaluator does not independently enforce identifier uniqueness.

## 8. Automated Testing and Git Verification

The latest reported full test suite result is:

**49 passed, 0 failed.**

The uplift evaluation test module reported:

**15 passed.**

The latest `git diff --check` reported no whitespace errors.

Git working tree was clean after commit `32f0f70`.

### Relevant commits

| Commit | Description |
|---|---|
| `abc1b62` | Document Week 3 propensity diagnostics |
| `73012c1` | Cover refutation failure edge cases |
| `a92011c` | Verify expected uplift gain calculation |
| `c0a408e` | Verify DML-style uplift score alignment |
| `32f0f70` | Preserve customer IDs in uplift evaluation |

## 9. API and Frontend Handoff Requirements

Before connecting the causal pipeline to the backend API and frontend dashboard, the team must agree on:

- Treatment comparison inputs.
- Customer ID and individual-effect alignment.
- Field names and response structure.
- Model status, validation errors, and warnings.
- Uplift ranking output and visualization semantics.
- Clear labeling of estimated effects and descriptive diagnostics.

The `EffectEstimator` wrapper currently returns individual effects but does not include customer identifiers. Customer ID mapping must be preserved separately or incorporated through an agreed integration contract.

## 10. Known Limitations

1. The dataset is synthetic.
2. Treatment assignment and covariate timing require verification.
3. Propensity diagnostics indicate potential overlap and imbalance concerns.
4. Actual DoWhy refutation execution remains unverified.
5. Ritik's estimator is not yet integrated into the current branch.
6. The API/frontend output contract has not been finalized.
7. Automated test success does not establish causal validity.
8. No confidence interval or independently validated causal-effect estimate is claimed.

## 11. Pending Work and Ownership

| Task | Responsible workstream | Status |
|---|---|---|
| Finalize causal documentation and handoff | Causal evaluation | In progress |
| Execute valid DoWhy refutation checks | Causal evaluation | Pending |
| Integrate DML estimator through agreed team workflow | DML / Team integration | Pending |
| Confirm customer-wise effect output contract | DML + Backend | Pending |
| Connect causal results to API | Backend | Pending |
| Display correctly labeled evaluation results | Frontend | Pending |
| Review and merge through team PR process | Team | Pending |

## 12. Final Handoff Status

**Causal evaluation implementation and local testing: Verified.**

**Actual DML integration in a temporary test setup: Verified.**

**Complete shared-branch integration and DoWhy execution: Pending.**

Week 3 can be handed off for team review with the limitations and remaining dependencies explicitly recorded. It should not yet be described as fully integrated or production-ready.