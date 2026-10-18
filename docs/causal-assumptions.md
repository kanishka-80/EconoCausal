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
