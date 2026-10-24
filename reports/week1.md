# EconoCausal — Week 1 Report

## 1. Project Information

- **Project:** EconoCausal — Dynamic Pricing via Double Machine Learning
- **Contributor:** Ritik
- **Area:** Machine Learning and Data Pipeline
- **Week:** Week 1 — Data Understanding and Preparation
- **Dataset:** `econocausal_enriched_synthetic_dataset.csv`
- **Dataset type:** Synthetic customer data
- **Main notebook:** `notebooks/EconoCausal_ML_Analysis.ipynb`

## 2. Week 1 Objective

The objective of Week 1 was to understand the customer dataset, inspect its quality, identify the treatment and outcome variables, explore customer and discount patterns, and prepare the input features for causal machine learning.

The work also aimed to identify data-quality issues, avoid target leakage, and establish a reproducible starting point for the Double Machine Learning (DML) model.

## 3. Dataset Audit

The synthetic dataset used for the project contains 20,000 rows and 40 columns.

The dataset was loaded into a Pandas DataFrame for inspection and analysis.

The audit covered:

- Dataset shape and column names.
- Column data types and non-null values.
- Sample records using `head()` and `tail()`.
- Descriptive statistics using `describe()`.
- Inspection of categorical values and their unique labels.
- Missing-value and duplicate-row checks.

### Key Variables

| Variable | Role | Description |
|---|---|---|
| `customer_id` | Identifier | Identifies a customer record; not a normal model feature |
| `discount_offered` | Treatment (T) | Discount level assigned to the customer |
| `purchased` | Outcome (Y) | Indicates whether a purchase occurred |
| Customer characteristics | Features (X) | Pre-treatment customer attributes and historical behaviour |

The expected treatment levels are 0, 5, 10, and 20. The treatment values and binary outcome values must be confirmed from the dataset's actual inspection results.

**Data source limitation:** The dataset is synthetic. It is useful for developing and testing the workflow but does not establish real-world customer behaviour.

## 4. Data Quality Checks

The notebook includes data-inspection steps for examining missing values, data types, categorical values, and descriptive statistics.

The following checks are relevant before model training:

- Identify missing values and duplicate rows.
- Verify the valid values of `discount_offered`.
- Verify that `purchased` contains only the expected outcome values.
- Inspect unusual or impossible values and potential outliers.
- Check the number of records in each treatment group.
- Identify columns that may contain information generated after the discount or purchase.

**Results:** Record the actual missing-value count, duplicate count, treatment-group counts, and any invalid values from the notebook output. Do not report that the dataset is completely clean unless these results confirm it.

## 5. Treatment, Outcome, and Features (X, T, Y)

The notebook defines the main variables as follows:

- **X — Features:** Customer characteristics and historical behaviour measured before treatment.
- **T — Treatment:** `discount_offered`.
- **Y — Outcome:** `purchased`.

Candidate features include demographic information, historical spending, customer engagement, loyalty, previous purchases, and campaign context.

The feature-selection process must ensure that each selected variable is available before the discount is offered. Identifiers and post-treatment information should not be used as ordinary input features.

Examples of columns to exclude from X when estimating the effect on purchase are `customer_id`, `revenue`, and `net_profit`. Other candidate features should also be checked for their timing and causal relevance.

The definitions of X, T, and Y provide the input structure for the subsequent causal-modeling stage.

## 6. Exploratory Data Analysis (EDA)

The notebook contains exploratory analysis and visualizations, including:

- Distribution of customer ages.
- Net-profit distribution by discount group.
- Average revenue by discount level.
- Correlation heatmap for numerical variables.
- Relationship between revenue and net profit.

These visualizations help describe customer characteristics and differences between discount groups.

**Interpretation limitation:** Differences and correlations observed in EDA are descriptive. They do not, by themselves, prove that a discount caused a change in purchase behaviour or profit.

Record the main findings from the actual plots here before submitting the report.

## 7. Preprocessing and Data Preparation

The notebook includes the following preparation steps:

- Selection of candidate customer features.
- One-hot encoding of categorical variables.
- An 80/20 training and test split.
- A fixed random seed for reproducibility.
- Feature scaling using `StandardScaler`, fitted on the training data and applied to the test data.

The preparation code establishes the feature matrix required for the next modeling stage.

**Implementation note:** The current notebook uses one-hot encoding before the train/test split. For a more robust reusable pipeline, fit preprocessing transformations on the training data only and apply the fitted transformations to the test data.

## 8. Week 1 Deliverables and Verification

| Deliverable | Status |
|---|---|
| Dataset loading and initial inspection | Present in notebook |
| Missing values, duplicates, and invalid-value checks | Verify actual outputs and documented findings |
| X, T, and Y preparation | Present in notebook |
| EDA charts | Present in notebook |
| Feature encoding and train/test split | Present in notebook |
| Data dictionary and feature definitions | Confirm that documentation files are saved and updated |
| Causal DAG and assumptions | Confirm that `docs/causal_dag.md` exists and contains the agreed diagram and explanation |
| Reusable validation, cleaning, and feature modules | Confirm implementation in `backend/app/data_pipeline/` |
| Automated data-pipeline tests | Confirm that tests exist and have been run |
| Week 1 report and handoff | This report; update with verified findings |

## 9. Limitations and Outstanding Items

- The data is synthetic and cannot establish real-world causal effects.
- The timing of candidate features must be checked to prevent post-treatment leakage.
- Treatment-group counts, overlap, and outcome values must be verified before interpreting causal estimates.
- Preprocessing should be made reproducible and fitted without using test-set information.
- Reusable modules, automated tests, the causal DAG, and supporting documentation should be checked against the actual repository before marking them complete.
- The notebook's exploratory findings should be documented using actual outputs rather than assumed results.

## 10. Week 2 Handoff

Week 1 established the dataset-inspection, feature-preparation, and exploratory-analysis foundation for causal modeling.

Week 2 builds on that work by implementing and fitting the EconML DML estimator, estimating treatment effects, checking model outputs, and evaluating the reliability and limitations of the results.

The Week 2 report should record the actual model configuration, treatment comparison, effect estimates, diagnostic results, tests, and any remaining limitations.

## 11. Conclusion

Week 1 focused on understanding the synthetic customer dataset, exploring its characteristics, preparing candidate features, and defining the treatment and outcome inputs for EconoCausal.

The resulting notebook provides a starting point for the causal-modeling workflow. Final completion of the Week 1 handoff depends on recording the actual data-quality findings and verifying the supporting documentation, reusable modules, and tests in the repository.
