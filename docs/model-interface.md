# Model Interface — EconoCausal

## 1. Overview

The EconoCausal model interface defines how input data is passed to the Double Machine Learning (DML) model and how the estimated causal effects are returned.

The model aims to estimate how different discount levels affect the probability of a customer making a purchase.

## 2. Model Inputs

The model uses three main inputs:

| Input | Variable | Description |
|---|---|---|
| X | Customer features | Selected pre-treatment customer characteristics |
| T | `discount_offered` | Discount level offered to the customer |
| Y | `purchased` | Indicates whether the customer made a purchase |

Potential customer features include `age`, `income_bracket`, `urbanicity`, `region`, `tenure_months`, and `historical_spend`.

The final features must be selected and validated before passing them to the model.

## 3. Model Used

The project uses **CausalForestDML** from the EconML library.

The model combines machine learning with causal inference to estimate how treatment effects may differ across customers.

The implementation requires the `econml` Python package.

```python
from econml.dml import CausalForestDML
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier

model_y = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model_t = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

dml_model = CausalForestDML(
    model_y=model_y,
    model_t=model_t,
    discrete_treatment=True,
    cv=3,
    random_state=42
)
```

**Note:** This is an example configuration. Confirm that it matches your actual notebook and the treatment type before using it.

## 4. Model Training

The model is trained using the covariates (X), treatment (T), and outcome (Y).

```python
dml_model.fit(
    Y_train,
    T_train,
    X=X_train
)
```

Here:

- `Y_train` contains the training outcomes.
- `T_train` contains the training treatment values.
- `X_train` contains the selected training covariates.

The variables must be prepared consistently with the actual dataset and model configuration.

## 5. Treatment Effect Estimation

After training, the model can estimate the effect of changing the discount level for customers in the test dataset.

```python
ite = dml_model.effect(
    X_test,
    T0=0,
    T1=10
)

print("Average estimated treatment effect:", ite.mean())
```

This example estimates the difference in the predicted outcome when moving from treatment level `0` to `10`, for the supplied test customers.

The treatment levels must exist in, or be supported by, the model's treatment definition. The output is an estimate, not proof of a real-world effect.

## 6. Expected Output

The model interface may return:

- **Individual Treatment Effect (ITE):** Estimated treatment effect for each customer.
- **Average Treatment Effect (ATE):** The average of estimated effects across the selected customers, when interpreted appropriately for the model and estimand.
- **Model diagnostics:** Evaluation information used to check model behaviour.

Actual output values should be recorded only after successfully running the model.

## 7. Input Validation

Before training or estimating effects, the pipeline should check:

1. Required columns are available.
2. Treatment and outcome values are valid.
3. Covariates do not contain unexpected missing values.
4. Covariates are measured before treatment.
5. Training and testing data use consistent feature columns and preprocessing.
6. The selected treatment levels are supported by the model.

## 8. Limitations

- The dataset is synthetic.
- Estimates depend on data quality and causal assumptions.
- Incorrect feature selection can introduce bias.
- The model may not generalize to real customer data.
- The interface described here is a design reference; reusable implementation and tests must be verified separately.

## 9. Conclusion

The model interface provides a consistent way to prepare inputs, train the CausalForestDML estimator, and estimate discount effects. It supports the overall goal of EconoCausal: understanding how discount decisions may influence customer purchase behaviour.

