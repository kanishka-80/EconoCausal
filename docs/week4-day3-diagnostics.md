# EconoCausal — Week 4 Day 3 Diagnostics Report

**Owner:** Tanishka (Kanshika) — Causal DAG, Diagnostics, Refutation & Evaluation  
**Date:** Monday, 2 November 2026 (Verified 8 November 2026)  
**Status:** Completed & Verified  

---

## 1. Objective

Run and document the agreed multi-treatment propensity and overlap diagnostics on the final approved dataset (`econocausal_enriched_synthetic_dataset.csv`). Check for missing values, extreme propensity estimates, limited overlap, and groups with insufficient observations.

---

## 2. Dataset & Treatment Configuration

| Parameter | Configuration |
|---|---|
| Dataset | `econocausal_enriched_synthetic_dataset.csv` |
| Observations | 20,000 |
| Total Features | 40 |
| Treatment Variable | `discount_offered` |
| Observed Treatment Levels | 0, 5, 10, 20 (5,000 observations per level) |
| Outcome Variable | `purchased` (Binary: 0 or 1) |
| Candidate Covariates | 31 features (from DAG specification) |

---

## 3. Multi-Treatment Propensity Diagnostics

Multi-treatment propensity scores were estimated using regularized multi-class logistic regression with standard preprocessing (`SimpleImputer`, `StandardScaler`, `OneHotEncoder`).

```json
{
  "n_observations": 20000,
  "n_treatment_groups": 4,
  "probabilities_sum_to_one": true,
  "min_propensity": 0.000578,
  "max_propensity": 0.934422,
  "near_zero_probability_count": 308
}
```

### Findings & Overlap Assessment
1. **Probability Consistency:** All 20,000 rows have predicted probabilities across the 4 levels summing to exactly 1.0.
2. **Positivity & Overlap:** Estimated propensity scores span from `0.00058` to `0.93442`. 
3. **Thin Overlap Warning:** 308 entries (1.54%) have propensity scores `< 0.01`, indicating that a small fraction of customers has covariate values that make receiving certain discount tiers extremely unlikely.
4. **Diagnostic Meaning:** While general overlap is present across the four groups, extreme propensity regions indicate that treatment effect estimation for those customer subsets should be interpreted with caution.

---

## 4. Covariate Balance Diagnostics

### A. Numeric Covariates (Standardized Mean Difference)
- **Total Pairwise Comparisons:** 126 comparisons (across all pairs of treatment levels: 0 vs 5, 0 vs 10, 0 vs 20, 5 vs 10, 5 vs 20, 10 vs 20).
- **Balanced (SMD < 0.1):** 102 comparisons (81.0%).
- **Imbalanced (SMD >= 0.1):** 24 comparisons (19.0%).
- **Primary Imbalance Source:** `recency_days` displays the highest standardized mean difference (~0.95 between 0% and 20% discount), indicating that customers with different recency profiles were assigned discounts differentially in the synthetic data generator.

### B. Categorical Covariates (Maximum Absolute Proportion Difference)
- **Features Tested:** `income_bracket`, `region`, `subscription_status`, `preferred_channel`, `product_category`, `campaign_type`, `day_of_week`, `device_type`.
- **Total Pairwise Comparisons:** 60.
- **Comparisons with Difference > 0.1:** 0 (0.0%).
- **Conclusion:** Categorical distributions are well-balanced across all discount tiers.

---

## 5. Automated Test Verification

Module: `tests/test_propensity.py`
- `test_estimate_propensity_scores_returns_valid_probabilities`: PASSED
- `test_estimate_propensity_scores_rejects_missing_treatment`: PASSED
- `test_estimate_propensity_scores_rejects_single_treatment_group`: PASSED
- `test_propensity_diagnostics_detects_near_zero_probabilities`: PASSED
- `test_propensity_diagnostics_rejects_non_numeric_values`: PASSED
- `test_propensity_diagnostics_rejects_non_finite_values`: PASSED
- `test_numeric_covariate_balance_returns_pairwise_results`: PASSED
- `test_categorical_balance_returns_pairwise_results`: PASSED
- **Total Test Result:** 12 passed out of 12.

---

## 6. Caveats & Interpretation

> **Important:** Propensity score overlap and covariate balance diagnostics are descriptive checks of empirical data support. Satisfactory balance or overlap does **not** prove unconfoundedness or guarantee that estimated causal effects are unconfounded.
