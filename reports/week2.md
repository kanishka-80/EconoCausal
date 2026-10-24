# EconoCausal — Week 2 Report

## 1. Project Information

- **Project:** EconoCausal — Dynamic Pricing via Double Machine Learning
- **Contributor:** Ritik
- **Area:** Machine Learning, Data Pipeline Integration, and Causal Modeling
- **Week:** Week 2 — DML Estimation and Evaluation
- **Period:** 17 October – 23 October 2026
- **Dataset:** `econocausal_enriched_synthetic_dataset.csv`
- **Main notebook:** `notebooks/EconoCausal_ML_Analysis.ipynb`

## 2. Week 2 Objective

The objective of Week 2 was to build on the Week 1 data-preparation work and develop a primary Double Machine Learning (DML) workflow using EconML.

The work focused on fitting a causal machine learning model, estimating treatment effects for different discount levels, checking model inputs and outputs, and preparing interpretable results for the project's future API and dashboard integration.

The dataset used for development is synthetic. The results are intended for experimentation and workflow validation rather than as evidence of real-world causal effects.

## 3. DML Model Implementation

The notebook contains code to configure and fit an EconML `CausalForestDML` estimator.

The model configuration uses:

- `CausalForestDML` as the primary causal estimator.
- `RandomForestRegressor` as the outcome nuisance model.
- `RandomForestClassifier` as the treatment nuisance model.
- `discrete_treatment=True` for categorical treatment handling.
- Three-fold cross-fitting (`cv=3`).
- A configured number of trees and random seeds for reproducibility.

The model is fitted using:

- **X:** Customer features.
- **T:** `discount_offered`.
- **Y:** `purchased`.

Before interpreting results, the treatment encoding and supported discount values must be verified against the installed EconML version and the actual training data.

## 4. Treatment-Effect Estimation

The notebook includes a treatment-effect estimation step comparing a control discount of 0 with an offered discount of 10:

```python
ite_10 = dml_model.effect(
    X_test_scaled,
    T0=0,
    T1=10
)

print("Average estimated causal effect:", ite_10.mean())
```

The estimated effects represent the model's predicted change in purchase outcome for the specified treatment comparison, for each customer in the test set.

Because `purchased` is a binary outcome, the effect can be interpreted as a change in purchase probability when the model and treatment comparison are correctly specified.

**Result to record:** Add the actual average estimated effect printed by your notebook. Do not invent a value or report the model as successfully fitted unless the relevant cells ran successfully.

## 5. Model Evaluation and Diagnostics

The following checks are relevant to evaluating the model and its results:

- Confirm that training features, treatment, and outcome have matching row counts.
- Check that the training set contains the required treatment groups.
- Verify the outcome values and treatment encoding.
- Check that predicted treatment effects are finite and have the expected shape.
- Review treatment-group sizes and potential overlap