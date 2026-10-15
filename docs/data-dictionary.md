
# EconoCausal - Data Dictionary

## 1. Dataset Overview

- **Dataset type:** Synthetic dataset
- **Number of observations:** 20,000
- **Number of treatment levels:** 4
- **Treatment column:** `discount_offered`
- **Outcome column:** `purchased`

The dataset is intended to support analysis of the relationship between
discount offers and customer purchases. The data-generation process and
treatment assignment mechanism still require verification.

## 2. Treatment and Outcome Variables

| Column | Type | Description |
|---|---|---|
| `discount_offered` | Categorical / numeric | Discount level offered to a customer: 0, 5, 10, or 20 |
| `purchased` | Binary | Purchase outcome: 0 = no purchase, 1 = purchase |

### Observed Counts

| Variable | Value | Count |
|---|---:|---:|
| `discount_offered` | 0 | 5,000 |
| `discount_offered` | 5 | 5,000 |
| `discount_offered` | 10 | 5,000 |
| `discount_offered` | 20 | 5,000 |
| `purchased` | 0 | 14,311 |
| `purchased` | 1 | 5,689 |

## 3. Candidate Covariates

The following variables are documented as candidate features in the
current causal assumptions file:

- **Customer profile:** `age`, `income_bracket`, `urbanicity`, `region`
- **Customer history:** `tenure_months`, `historical_spend`, `recency_days`,
  `previous_purchases_12m`, `avg_order_value`, `return_rate`
- **Engagement:** `browsing_frequency`, `avg_session_duration_sec`,
  `cart_abandonment_rate`, `email_open_rate`, `website_visits_30d`
- **Customer relationship:** `support_tickets_count`,
  `previous_discounts_accepted`, `mobile_app_user`, `loyalty_member`,
  `subscription_status`, `customer_satisfaction`
- **Campaign and context:** `preferred_channel`, `product_category`,
  `campaign_type`, `day_of_week`, `device_type`,
  `competitor_price_index`, `stock_availability`, `seasonality_index`,
  `days_since_last_campaign`, `marketing_contact_count_30d`

These are provisional candidate covariates. Their availability and timing
relative to treatment must be verified before causal adjustment.

## 4. Variables Requiring Special Review

The following variables must not automatically be used as pre-treatment
covariates:

- `discount_amount`
- `revenue`
- `cost_of_goods`
- `marketing_cost`
- `net_profit`
- `basket_value_before_discount`

Their definitions and measurement timing must be checked for potential
post-treatment information or data leakage.

## 5. Data Quality and Validation

Before causal estimation:

- Validate required columns and data types.
- Check missing values and invalid treatment/outcome values.
- Verify the meaning and assignment mechanism of each discount level.
- Confirm the purchase observation window.
- Review treatment overlap and covariate balance.
- Check feature timing and potential outcome leakage.

## 6. Limitations

- The dataset is synthetic.
- The treatment assignment mechanism is undocumented.
- Candidate covariate timing has not been independently verified.
- Observed counts do not establish a causal relationship.
- Passing software tests or diagnostic checks does not prove causal
  identification.

## 7. Open Questions

1. How were discount levels assigned?
2. Which features were measured before treatment?
3. What is the purchase observation window?
4. Which treatment comparisons will the team estimate?
5. Is this the final dataset approved for causal analysis?
