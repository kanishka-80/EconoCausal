# EconoCausal — Dynamic Pricing via Double Machine Learning

## 1. Project Overview

EconoCausal is a machine learning project focused on estimating the causal effect of customer discounts on purchase probability.

The project aims to help businesses understand which customers may respond to discounts, estimate individual treatment effects (ITE), and support more informed discount-budget decisions.

**Domain:** Economics and Causal AI

**Core technologies:** Python, Pandas, NumPy, Scikit-learn, EconML, DoWhy, React, and Plotly.

**Dataset:** Synthetic customer data created for project development and experimentation.

> **Note:** Results from synthetic data are experimental and do not establish real-world causal effects.

## 2. Project Objectives

- Audit and explore customer data.
- Identify treatment, outcome, and pre-treatment features.
- Build a causal model to estimate discount effects.
- Estimate individual treatment effects (ITE).
- Evaluate model results using uplift and Qini analysis.
- Validate causal assumptions using DoWhy refutation tests.
- Support discount-budget planning through a user interface and later optimization.

## 3. Project Structure

```text
EconoCausal/
│
├── data/
│   └── raw/
│       └── econocausal_enriched_synthetic_dataset.csv
│
├── notebooks/
│   └── EconoCausal_ML_Analysis.ipynb
│
├── docs/
│   ├── data-dictionary.md
│   ├── feature_definitions.md
│   ├── causal_dag.md
│   ├── model-interface.md
│   └── model-limitations.md
│
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── data_pipeline/
│   │   │   ├── validation.py
│   │   │   ├── cleaning.py
│   │   │   └── features.py
│   │   └── causal/
│   │       ├── dml_estimator.py
│   │       └── effect_estimation.py
│   └── tests/
│       ├── test_data_pipeline.py
│       └── test_dml_estimator.py
│
├── frontend/
│
├── reports/
│   ├── week1.md
│   └── week2.md
│
└── README.md
```

*The tree describes the intended project organization. Keep existing folders and files as they are, and create the listed files as the work progresses.*

## 4. Weekly Development Plan

### Week 1 — Data Understanding and Preparation

- **Day 1:** Dataset audit — inspect dataset shape, columns, data types, sample records, and descriptive statistics.
- **Day 2:** Data quality checks — inspect missing values, duplicates, invalid values, and treatment-group distributions.
- **Day 3:** Define features (X), treatment (T), and outcome (Y).
- **Day 4:** Exploratory data analysis (EDA) and visualizations.
- **Day 5:** Define the causal directed acyclic graph (DAG) and discuss causal assumptions.
- **Day 6:** Prepare reusable data cleaning and feature-processing modules.
- **Day 7:** Validate the data pipeline, run tests, and document Week 1 findings.

**Expected deliverables:** Dataset audit, data dictionary, feature definitions, causal DAG documentation, data-processing code, and Week 1 report.

### Week 2 — Causal Modeling and Evaluation

- **Day 1:** Define the Double Machine Learning (DML) estimator interface.
- **Day 2:** Train the EconML causal model.
- **Day 3:** Estimate treatment effects and individual treatment effects (ITE).
- **Day 4:** Test model inputs, outputs, and error handling.
- **Day 5:** Evaluate uplift/Qini performance and run DoWhy refutation checks.
- **Day 6:** Integrate the data pipeline and causal-model workflow.
- **Day 7:** Validate the complete workflow, document limitations, and prepare a demonstration.

**Expected deliverables:** DML estimator, treatment-effect estimates, evaluation results, refutation checks, tests, and Week 2 report.

## 5. Model Workflow

1. Load the synthetic customer dataset.
2. Validate and prepare the data.
3. Define customer features (X), discount treatment (T), and purchase outcome (Y).
4. Train a causal machine learning model.
5. Estimate the effect of a selected discount compared with a control discount.
6. Evaluate the estimates and causal assumptions.
7. Present relevant results for discount-targeting and budget-planning workflows.

## 6. Current Development Status

### Week 1
- [ ] Complete dataset audit.
- [ ] Complete data quality checks.
- [ ] Document X, T, and Y.
- [ ] Complete EDA and causal DAG.
- [ ] Implement and test reusable data-processing modules.
- [ ] Complete `reports/week1.md`.

### Week 2
- [ ] Implement the reusable DML estimator.
- [ ] Generate and summarize ITE estimates.
- [ ] Complete uplift/Qini evaluation.
- [ ] Run DoWhy refutation tests.
- [ ] Complete integration tests and `reports/week2.md`.

Update these checkboxes only after the corresponding tasks are completed and verified.

## 7. Limitations

- The dataset is synthetic and may not represent real customer behavior.
- Causal estimates depend on assumptions about confounding, overlap, and treatment assignment.
- Post-treatment variables must not be used as ordinary pre-treatment features.
- Model evaluation and refutation tests do not, by themselves, prove causality.

## 8. Future Work

- Budget optimization and discount recommendations.
- REST API integration.
- Interactive dashboard with customer-level ITE filtering.
- Model monitoring and drift detection.
- Improved testing, documentation, and deployment.

## 9. Team Contributions

The project is developed collaboratively, with responsibilities divided across machine learning, causal analysis, backend, and frontend development.

Specific contributions and completed tasks should be recorded in the weekly reports and project history.
