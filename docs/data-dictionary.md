# Data Dictionary — EconoCausal

## 1. Overview

The EconoCausal dataset contains customer-related information for studying the effect of discounts on purchase decisions.

The dataset used in this project is synthetic and is intended for learning and testing causal machine learning methods.

**Dataset file:** `econocausal_enriched_synthetic_dataset.csv`

**Main objective:** Estimate how different discount levels affect the probability of a customer making a purchase.

## 2. Variable Definitions

| Column Name | Data Type (Expected) | Description | Role |
|---|---|---|---|
| `customer_id` | Integer or String | Unique identifier for each customer | Identifier |
| `age` | Integer | Customer's age | Covariate (X) |
| `income_bracket` | String or Category | Customer's income group | Covariate (X) |
| `urbanicity` | String or Category | Type of area where the customer lives | Covariate (X) |
| `region` | String or Category | Customer's geographical region | Covariate (X) |
| `tenure_months` | Integer | Number of months the customer has been associated with the business | Covariate (X) |
| `historical_spend` | Numeric | Customer's historical spending amount | Covariate (X) |
| `discount_offered` | Numeric or Category | Discount level offered to the customer | Treatment (T) |
| `discount_amount` | Numeric | Monetary value of the discount | Treatment-related variable; verify its definition |
| `purchased` | Integer or Boolean | Indicates whether the customer made a purchase | Outcome (Y) |
| `basket_value_before_discount` | Numeric | Value of the shopping basket before applying the discount | Verify timing before using as X |
| `revenue` | Numeric | Revenue associated with the transaction or customer record | Business metric |
| `cost_of_goods` | Numeric | Cost of goods associated with the record | Business metric |
| `marketing_cost` | Numeric | Marketing cost associated with the record | Business metric |
| `net_profit` | Numeric | Net profit associated with the record | Business metric |

## 3. Main Variables for Causal Analysis

### Treatment (T)

`discount_offered`

Represents the discount level offered to a customer. The analysis compares specified discount levels to estimate their effect on purchasing behaviour.

### Outcome (Y)

`purchased`

Represents whether the customer made a purchase. Confirm the actual values in the dataset, such as `0` and `1`, before modelling.

### Covariates (X)

Potential pre-treatment covariates include:

- `age`
- `income_bracket`
- `urbanicity`
- `region`
- `tenure_months`
- `historical_spend`

These variables should only be included if they are measured before the discount is offered and are appropriate for the causal model.

## 4. Data Usage Notes

- `customer