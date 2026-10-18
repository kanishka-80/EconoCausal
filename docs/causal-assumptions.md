# EconoCausal — Causal Assumptions

## 1. Target Question
How does the offered discount level affect the probability of purchase?

## 2. Treatment (T)
Column: `discount_offered`
Observed levels: 0, 5, 10, 20.
Each level has 5,000 observations in the current 20,000-row synthetic dataset.

This is a multi-level treatment, not a binary treatment.
The meaning of each level and the assignment mechanism must be confirmed.

## 3. Outcome (Y)
Column: `purchased`
Binary outcome: 0 = no purchase, 1 = purchase.
Observed counts: 14,311 non-purchases and 5,689 purchases.

The observation window and data-generation logic are not yet independently verified.

## 4. Candidate Pre-treatment Covariates
Candidate columns include:
`age`, `income_bracket`, `urbanicity`, `region`, `tenure_months`,
`historical_spend`, `recency_days`, `browsing_frequency`,
`avg_session_duration_sec`, `cart_abandonment_rate`,
`support_tickets_count`, `email_open_rate`,
`previous_discounts_accepted`, `previous_purchases_12m`,
`avg_order_value`, `website_visits_30d`, `mobile_app_user`,
`loyalty_member`, `subscription_status`, `preferred_channel`,
`product_category`, `campaign_type`, `day_of_week`, `device_type`,
`competitor_price_index`, `stock_availability`, `seasonality_index`,
`customer_satisfaction`, `return_rate`, `days_since_last_campaign`,
`marketing_contact_count_30d`.

These are provisional candidates only. Their timing relative to treatment
must be verified before causal adjustment.

## 5. Identification Assumptions

### Measured Confounding
Relevant common causes of treatment assignment and purchase must be
measured and appropriately adjusted for.

### Treatment Overlap (Positivity)
Each compared discount level must have sufficient probability across
the covariate profiles in the target population.

### Consistency
Discount levels and the purchase outcome must have clear, stable meanings.

### Temporal Ordering and Leakage
Only justified pre-treatment variables should be used for adjustment.
`discount_amount`, `revenue`, `cost_of_goods`, `marketing_cost`, and
`net_profit` require special review and must not automatically be treated
as pre-treatment confounders.

## 6. Known Limitations
- The dataset is synthetic.
- The treatment assignment mechanism is undocumented.
- Feature timing has not been independently verified.
- Diagnostics and refutation tests do not prove causality.

## 7. Open Questions
- What process assigned discount levels?
- Which candidate features were measured before treatment?
- What is the purchase observation window?
- Which treatment comparisons will the team estimate?

## 8. DAG Implementation and Validation Status

The current implementation in `backend/app/causal/dag.py`
builds a provisional graph using `discount_offered` as the
treatment and `purchased` as the outcome.

Each candidate covariate is currently connected to both
the treatment and the outcome. These edges represent
hypothesized relationships and are not independently
verified causal relationships.

The `CausalDAG` class provides:
- `has_edge(source, target)` to check whether an edge exists.
- `number_of_nodes()` and `number_of_edges()` to inspect graph size.
- `has_cycle()` to detect directed cycles.
- `is_acyclic()` to check whether the graph is acyclic.

Automated tests cover the expected graph structure, treatment
and outcome presence, self-loops, cycle detection, and a
disconnected acyclic graph.

### Interpretation and limitations

- An acyclic graph satisfies a structural DAG requirement;
  it does not establish that the causal assumptions are correct.
- Candidate covariates must be reviewed for availability,
  timing before treatment, and causal justification.
- The treatment assignment mechanism and purchase observation
  window remain unresolved.
- The dataset is synthetic, and its balanced treatment counts
  do not establish covariate overlap or causal validity.
- The graph must be reviewed against the approved causal design
  before its edges are treated as an agreed causal model.


## 9. Propensity Score and Covariate Balance Diagnostics

### Dataset and Treatment Groups
- Dataset: `econocausal_enriched_synthetic_dataset.csv`
- Observations: 20,000
- Treatment: `discount_offered`
- Outcome: `purchased`
- Treatment levels: 0, 5, 10, and 20
- Observations per treatment group: 5,000

### Propensity Score Diagnostics
- Multinomial logistic regression estimated one propensity score per treatment level.
- Probability rows summed to approximately 1.
- Minimum estimated probability across all treatment-probability columns: approximately 0.000578.
- Maximum estimated probability across all treatment-probability columns: approximately 0.934422.
- Probability values below 0.01 across all treatment columns: 308.
- For the observed treatment, 3 observations in the discount-0 group had estimated probabilities below 0.01; no such observations were found in the other groups.

### Raw Numeric Covariate Balance
- Pairwise comparisons: 126.
- Comparisons with absolute SMD >= 0.1: 24.
- Comparisons with absolute SMD < 0.1: 102.
- Missing SMD values: 0.
- Largest observed imbalance: `recency_days`, discount 0 versus discount 20, absolute SMD approximately 0.948468.

### Output Artifact
The diagnostic report was generated as `covariate_balance_report.csv`. It contains treatment-pair comparisons, covariate names, absolute standardized mean differences, and imbalance flags.

### Limitations and Follow-up
These are preliminary, unadjusted diagnostics on synthetic data. They do not establish a causal effect or demonstrate adequate overlap. Covariate timing, categorical balance, treatment-assignment assumptions, and balance after any justified adjustment remain to be reviewed. Do not automatically treat all candidate covariates as valid pre-treatment confounders.

### Categorical Covariate Balance

- Implemented `categorical_balance_diagnostics()` in `backend/app/causal/propensity.py`.
- The function compares category proportions between each pair of treatment groups and reports the maximum absolute proportion difference for each categorical covariate.
- Eight categorical covariates were explored in the enriched synthetic dataset.
- The standalone diagnostic script generated 48 pairwise comparisons across the eight categorical covariates and four treatment groups.
- The largest observed maximum absolute proportion difference was 0.0226 for `product_category`, comparing discount levels 0 and 20.
- The generated output was saved as `categorical_balance_report.csv`.
- Automated tests cover successful pairwise comparison generation and rejection of a missing treatment column or missing covariate.

### Interpretation and limitations

- Category-level proportion differences are descriptive diagnostics; they are not standardized mean differences and should not be judged using the numeric SMD threshold of 0.1.
- These results are unadjusted and do not establish adequate overlap, causal validity, or a treatment effect.
- Categorical and numeric balance should be interpreted alongside verified pre-treatment feature timing and the approved causal design.
