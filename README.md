# EconoCausal — Causal Inference & Uplift Modeling Platform

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Tests](https://img.shields.io/badge/Tests-52%20Passed-brightgreen.svg)]()
[![Workstream](https://img.shields.io/badge/Workstream-Causal%20Evaluation-orange.svg)]()
[![Status](https://img.shields.io/badge/Status-Week%204%20Complete-success.svg)]()

> **EconoCausal** is an enterprise-grade causal machine learning and uplift modeling platform designed to estimate the incremental impact of discount offers on customer purchasing behavior, enabling budget-constrained marketing optimization.

---

## 📌 Workstream Ownership

**Owner:** **Tanishka (Kanshika)**  
**Core Responsibilities:**
- **Causal DAG & Graph Construction:** Formulate structural assumptions and cycle-free causal graphs connecting 31 pre-treatment covariates to treatments and outcomes.
- **Propensity & Overlap Diagnostics:** Multi-treatment logistic regression probability modeling, positivity checks, and standardized mean difference (SMD) balance reports.
- **Refutation & Sensitivity Testing:** Standardized DoWhy sensitivity harness covering random common cause, placebo treatment, and data subset refuters.
- **Uplift Evaluation & Customer Targeting:** Cumulative Qini-style gain metric calculation with unique customer identifier (`customer_id`) preservation for downstream budget allocation.
- **Verification & Documentation:** Comprehensive unit and integration test suite (52 tests, 100% passing) and reproducible weekly handoff documentation.

**Cross-Functional Team Collaboration:**
- **Ritik (Data Pipeline & DML):** Aligned on 31 candidate covariates, 4 discount tiers (0, 5, 10, 20), binary purchase outcome, and `CausalForestDML` predictions.
- **Harsh (Backend API & SciPy Optimizer):** Aligned on serializable JSON evaluation schemas, status flags, and customer-aligned effect vectors for budget allocation.
- **Khushi (Frontend UI & Dashboard):** Provided plain-language metric definitions, overlap warning thresholds ($P < 0.01$), and clear diagnostic caveat banners.

---

## 📂 Repository Structure

```text
EconoCausal/
├── README.md                                  # Project overview, architecture & documentation index
├── .gitignore                                 # Git ignore rules (virtualenvs, cache, temp folders)
├── econocausal_enriched_synthetic_dataset.csv # Approved project dataset (20,000 rows, 40 columns)
├── check_categorical_balance.py               # Utility script for categorical proportion differences
├── categorical_balance_report.csv             # Pairwise categorical balance diagnostic report
├── covariate_balance_report.csv               # Pairwise numeric standardized mean difference report
├── propensity_balance_diagnostics.csv         # Summary diagnostic table of propensity overlap
│
├── backend/
│   └── app/
│       └── causal/                            # Primary Causal Evaluation Modules (Owned)
│           ├── __init__.py
│           ├── dag.py                         # Structural DAG & cycle detection
│           ├── propensity.py                  # Multi-treatment propensity & balance diagnostics
│           ├── refutation.py                  # DoWhy refutation harness & error handling
│           └── uplift_evaluation.py           # Qini gain curve & customer ID preservation
│
├── tests/                                     # Automated Test Suite (52/52 Passing)
│   ├── test_dag.py                            # DAG construction, edges, and acyclicity tests (9 tests)
│   ├── test_propensity.py                     # Propensity scores, overlap, and balance tests (12 tests)
│   ├── test_refutation.py                     # Refutation reporting and error handling (12 tests)
│   ├── test_uplift_evaluation.py              # Uplift metrics, validation & ID checks (16 tests)
│   └── test_uplift_integration.py             # DML output & customer ID integration tests (3 tests)
│
└── docs/                                      # Project Documentation & Evaluation Handoffs
    ├── causal-assumptions.md                  # Target question, DAG structure, & identification rules
    ├── data-dictionary.md                     # Covariate definitions & pre-treatment timing notes
    ├── model-evaluation.md                    # Model evaluation specifications & metric requirements
    ├── uplift-evaluation.md                   # Uplift & Qini curve formulation and prerequisites
    │
    ├── plans/                                 # Complete Day-by-Day Work Plans
    │   ├── week1-daily-plan.md                # Week 1: Foundations, initial DAG & assumptions
    │   ├── week2-daily-plan.md                # Week 2: First end-to-end evaluation & initial refutation
    │   ├── week3-daily-plan.md                # Week 3: Uplift integration & customer ID preservation
    │   └── week4-daily-plan.md                # Week 4: Final evaluation, regression tests & demo handover
    │
    └── handoffs/
        ├── week2-evaluation-handoff.md        # Week 2 milestone handoff
        ├── week3-evaluation-handoff.md        # Week 3 milestone handoff
        ├── week4-day1-handoff.md              # Week 4 Day 1: Input & interface confirmation
        ├── week4-day2-handoff.md              # Week 4 Day 2: DAG and DML input alignment
        ├── week4-day3-diagnostics.md          # Week 4 Day 3: Propensity overlap & balance report
        ├── week4-day4-refutation.md           # Week 4 Day 4: Refutation checks & robustness
        ├── week4-day5-uplift.md               # Week 4 Day 5: Uplift evaluation validation
        ├── week4-day6-evaluation-summary.md   # Week 4 Day 6: Integrated evaluation summary
        └── week4-final-handover.md            # Week 4 Day 7: Final evaluation handover & demo notes
```

---

## 🔬 Core Causal Modules

### 1. Causal DAG (`backend/app/causal/dag.py`)
- Defines the treatment (`discount_offered`), outcome (`purchased`), and 31 candidate pre-treatment covariates.
- Implements depth-first search cycle detection to ensure structural acyclicity (`is_acyclic() == True`).
- Validates edge uniqueness and rejects malformed graph operations.

### 2. Multi-Treatment Propensity Analysis (`backend/app/causal/propensity.py`)
- Multi-class regularized logistic regression probability estimation for discrete treatment levels (0%, 5%, 10%, 20%).
- Automated positivity diagnostics detecting extreme propensities ($P < 0.01$).
- Standardized Mean Difference (SMD) diagnostics across 126 numeric pairs and maximum proportion differences across 60 categorical pairs.

### 3. Refutation Harness (`backend/app/causal/refutation.py`)
- Standardized sensitivity testing supporting:
  1. `random_common_cause`: Confounds simulation with an unobserved random variable.
  2. `placebo_treatment_refuter`: Simulates placebo treatment; verifies effect vanishes.
  3. `data_subset_refuter`: Tests effect stability across randomly sampled data subsets.
- Transparent dependency fallback when optional DoWhy libraries are absent in lightweight environments.
- Enforces strict scientific integrity: `causal_claim_proven` is permanently hardcoded to `False`.

### 4. Uplift & Qini Evaluation (`backend/app/causal/uplift_evaluation.py`)
- Computes cumulative Qini-style gain curves comparing each discount tier against zero-discount control.
- Scales cumulative gains by treatment-to-control sample ratio:
  $$\text{Uplift Gain}(k) = \sum_{i=1}^k Y_{i} \cdot \mathbb{I}(T_i = t) - \left(\sum_{i=1}^k Y_{i} \cdot \mathbb{I}(T_i = c)\right) \times \frac{N_t}{N_c}$$
- Preserves customer identifiers (`customer_id`) end-to-end to feed downstream budget allocation algorithms.

---

## 🧪 Testing & Verification

The suite contains **52 automated unit and integration tests** verifying structural logic, numerical stability, edge cases, and cross-module integration.

### Run Tests:
```bash
# Run the complete test suite
pytest tests/ -v
```

### Test Suite Summary:
| Test File | Focus Area | Passing | Failing |
|---|---|:---:|:---:|
| `tests/test_dag.py` | DAG nodes, edges, cycle detection & duplicate handling | 9 | 0 |
| `tests/test_propensity.py` | Probabilities, overlap checks, numeric & categorical balance | 12 | 0 |
| `tests/test_refutation.py` | Refutation schemas, error handling, status transitions | 12 | 0 |
| `tests/test_uplift_evaluation.py` | Uplift gain, ranking, score validation & ID preservation | 16 | 0 |
| `tests/test_uplift_integration.py` | End-to-end DML scoring and uplift pipeline integration | 3 | 0 |
| **Total** | **Comprehensive Causal Evaluation Suite** | **52** | **0** |

---

## 📑 4-Week Documentation Index

### Work Plans
- [Week 1 Daily Plan](docs/plans/week1-daily-plan.md) — Initial assumptions, DAG, and propensity foundation.
- [Week 2 Daily Plan](docs/plans/week2-daily-plan.md) — First end-to-end evaluation & initial refutation design.
- [Week 3 Daily Plan](docs/plans/week3-daily-plan.md) — DML integration, uplift validation & customer ID preservation.
- [Week 4 Daily Plan](docs/plans/week4-daily-plan.md) — Final diagnostics, regression checks & demo handover.

### Milestone Handoffs & Technical Reports
- [Week 4 Final Handover & Demo Notes](docs/week4-final-handover.md) ⭐ **Final Deliverable**
- [Week 4 Day 6 Integrated Evaluation Summary](docs/week4-day6-evaluation-summary.md)
- [Week 4 Day 5 Uplift Evaluation Validation](docs/week4-day5-uplift.md)
- [Week 4 Day 4 Refutation & Robustness Report](docs/week4-day4-refutation.md)
- [Week 4 Day 3 Propensity & Overlap Diagnostics](docs/week4-day3-diagnostics.md)
- [Week 4 Day 2 DAG & DML Input Alignment Review](docs/week4-day2-handoff.md)
- [Week 4 Day 1 Integration & Interface Confirmation](docs/week4-day1-handoff.md)
- [Week 3 Causal Evaluation Handoff](docs/week3-evaluation-handoff.md)
- [Week 2 Causal Evaluation Handoff](docs/week2-evaluation-handoff.md)
- [Causal Assumptions & Identification Specification](docs/causal-assumptions.md)

---

## ⚠️ Important Scientific & Business Caveats

1. **Synthetic Data Context:** The 20,000-row dataset is synthetic. While suitable for algorithm validation and interface demo, results must not be represented as verified real-world consumer behavior.
2. **Diagnostic Evidence vs. Causal Proof:** A passing refutation test, an acyclic DAG, or balanced propensity scores demonstrate empirical plausibility under stated assumptions. They **do not prove** that unmeasured confounding is absent.
3. **Observational Bounds:** In real-world deployments, treatment assignment mechanisms, customer communication timing, and observation windows must be audited before drawing policy conclusions.
