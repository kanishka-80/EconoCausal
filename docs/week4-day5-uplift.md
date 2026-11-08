# EconoCausal — Week 4 Day 5 Uplift Evaluation Report

**Owner:** Tanishka (Kanshika) — Causal DAG, Diagnostics, Refutation & Evaluation  
**Date:** Wednesday, 4 November 2026 (Verified 8 November 2026)  
**Status:** Completed & Verified  

---

## 1. Objective

Validate the uplift evaluation framework against the approved dataset, ensure strict input validation (preventing leakage or corrupt scores), preserve customer identifiers for downstream targeting/optimization, and interpret cumulative gain metrics responsibly.

---

## 2. Methodology & Formulation

Implemented in: `backend/app/causal/uplift_evaluation.py`

### Supported Setup
- **Outcome ($Y$):** Binary purchase indicator (`purchased` $\in \{0, 1\}$).
- **Treatment ($T$):** Discrete discount tiers ($T \in \{5, 10, 20\}$ vs Control $T = 0$).
- **Uplift Score ($S$):** Model-predicted conditional average treatment effect (CATE) or uplift score.

### Metric: Qini-style Cumulative Uplift Gain
Given a descending ranking of customers by predicted uplift score, for the top $k$ customers:
$$\text{Uplift Gain}(k) = \sum_{i=1}^k Y_{i} \cdot \mathbb{I}(T_i = t) - \left(\sum_{i=1}^k Y_{i} \cdot \mathbb{I}(T_i = c)\right) \times \frac{N_t}{N_c}$$
where:
- $N_t$ is total observations in the treatment group.
- $N_c$ is total observations in the control group.
- Scaling by $\frac{N_t}{N_c}$ accounts for sample size differences between groups.

---

## 3. Customer Identifier Preservation

To enable seamless integration with Harsh's budget optimizer and Khushi's customer-targeting UI:
- Passing `id_col="customer_id"` preserves unique customer identifiers in the ranked output.
- Missing IDs, duplicate ID column name conflicts, and non-aligned records are strictly validated and rejected.

```python
result = evaluate_uplift(
    data=df,
    scores=predicted_effects,
    treatment_level=20,
    control_level=0,
    id_col="customer_id",
)
```

Output DataFrame Schema:
- `rank`: Integer rank (1 to $N$)
- `customer_id`: Customer identifier
- `score`: Predicted uplift score
- `treatment`: Assigned treatment level
- `outcome`: Observed purchase outcome
- `cumulative_treated`: Count of treated units in top $k$
- `cumulative_control`: Count of control units in top $k$
- `cumulative_treated_outcomes`: Sum of positive outcomes among treated
- `cumulative_control_outcomes`: Sum of positive outcomes among control
- `uplift_gain`: Computed cumulative uplift gain

---

## 4. Automated Test Verification

Modules: `tests/test_uplift_evaluation.py` and `tests/test_uplift_integration.py`

### Test Suite Highlights:
- `test_evaluate_uplift_returns_expected_columns`: PASSED
- `test_evaluate_uplift_preserves_customer_id`: PASSED
- `test_evaluate_uplift_rejects_missing_customer_id`: PASSED
- `test_evaluate_uplift_rejects_conflicting_id_col`: PASSED
- `test_evaluate_uplift_rejects_non_binary_outcome`: PASSED
- `test_evaluate_uplift_rejects_non_numeric_scores`: PASSED
- `test_evaluate_uplift_rejects_infinite_or_nan_scores`: PASSED
- `test_evaluate_uplift_rejects_mismatched_score_length`: PASSED
- `test_uplift_integration_with_dml_output`: PASSED
- **Total Test Result:** 19 passed out of 19.

---

## 5. Practical Interpretation & Limitations

> [!NOTE]
> Cumulative uplift gain is a **descriptive ranking diagnostic** reflecting whether customers ranked higher by the model showed higher empirical outcome differences. 
> 
> It depends heavily on unconfoundedness and the assumption that treatment assignment was independent of potential outcomes conditional on measured covariates. A high Qini score does not independently validate that unmeasured confounding is absent.
