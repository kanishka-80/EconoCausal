# Feature Definitions — EconoCausal

## 1. Overview

This document defines the main features used in the EconoCausal project. These features help prepare customer data for Double Machine Learning (DML) to estimate the causal effect of discounts on customer purchase decisions.

The dataset used in this project is synthetic.

## 2. Customer Features

| Feature | Definition | Usage |
|---|---|---|
| `customer_id` | Unique identifier assigned to each customer | Identification only |
| `age` | Age of the customer | Potential covariate (X) |
| `income_bracket` | Income category of the customer | Potential covariate (X) |
| `urbanicity` | Indicates the type of area where the customer lives | Potential covariate (X) |
| `region` | Geographical region associated with the customer | Potential covariate (X) |
| `tenure_months` | Number of months the customer has been associated with the business | Potential covariate (X) |
| `historical_spend` | Customer's historical spending amount | Potential covariate (X) |

## 3. Treatment Feature

| Feature | Definition | Usage |
|---|---|---|
| `discount_offered` | Discount level offered to a customer | Treatment (T) |
| `discount_amount` | Monetary amount of the discount | Treatment-related feature; verify whether it duplicates `discount_offered` |

The treatment represents the discount level whose effect on purchasing behaviour is being studied.

## 4. Outcome Feature

| Feature | Definition | Usage |
|---|---|---|
| `purchased` | Indicates whether a customer made a purchase | Outcome (Y) |

Confirm the actual values used in the dataset, such as `0` for no purchase and `1` for purchase, before modelling.

## 5. Business and Financial Features

| Feature | Definition | Usage |
|---|---|---|
| `basket_value_before_discount` | Value of the shopping basket before the discount | Verify timing before using as a covariate |
| `revenue` | Revenue associated with the customer record | Business metric |
| `cost_of_goods` | Cost of goods associated with the record | Business metric |
| `marketing_cost` | Marketing cost associated with the record | Business metric |
| `net_profit` | Net profit associated with the record | Business metric |

Financial features should not automatically be used as model inputs. If they are affected by the discount or purchase outcome, including them as covariates could introduce bias.

## 6. Feature Selection for DML

The DML model separates the data into three main components:

- **X — Covariates:** Selected customer characteristics measured before the discount is offered.
- **T — Treatment:** `discount_offered`.
- **Y — Outcome:** `purchased`.

Potential covariates include `age`, `income_bracket`, `urbanicity`, `region`, `tenure_months`, and `historical_spend`, subject to verification.

The `customer_id` column should generally be excluded from model inputs because it is an identifier rather than a meaningful customer characteristic.

## 7. Feature Preprocessing

The following preprocessing steps may be required:

1. Check for missing and invalid values.
2. Encode categorical features such as `income_bracket`, `urbanicity`, and `region`.
3. Check numeric features for unexpected values and outliers.
4. Exclude identifiers and inappropriate post-treatment variables.
5. Split the data into training and testing sets.
6. Fit preprocessing steps using training data and apply the fitted transformations to testing data.

## 8. Important Assumptions

- Covariates used for adjustment should be measured before treatment.
- Treatment and outcome definitions must match the actual dataset.
- Features should not be selected only because they correlate with the outcome.
- The dataset is synthetic, so model estimates do not prove real-world causal effects.
- Feature meanings and relationships should be verified against the dataset-generation process.

## 9. Conclusion

Feature definitions provide a clear reference for understanding the dataset and selecting appropriate variables for causal analysis. Correct feature selection and preprocessing help reduce avoidable errors when estimating discount effects using Double Machine Learning.
