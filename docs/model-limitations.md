# Model Limitations — EconoCausal

## 1. Overview

EconoCausal uses Double Machine Learning (DML) and the CausalForestDML estimator to estimate the effect of discounts on customer purchase decisions.

However, the results have some limitations that must be considered when interpreting the model's output.

## 2. Synthetic Dataset

The project uses a synthetic dataset rather than real customer data.

- The dataset may not represent actual customer behaviour.
- The generated relationships may differ from real business conditions.
- Model results cannot directly prove how customers will respond to real discounts.

## 3. Causal Assumptions

Causal estimation depends on assumptions about the relationships between treatment, outcome, and customer characteristics.

- Important confounding variables may be missing.
- The selected covariates may not fully explain how discounts were assigned.
- An incorrect causal structure may lead to misleading estimates.

## 4. Data Quality

The quality of the data affects model performance.

- Missing or invalid values may affect the results.
- Incorrect data types can cause modelling errors.
- Duplicate records or unusual values may influence estimates.
- Incorrect treatment or outcome encoding can produce unreliable results.

## 5. Feature Selection

The model depends on selecting suitable pre-treatment customer features.

- Including post-treatment variables may introduce bias.
- Using customer identifiers as predictive features may create misleading patterns.
- Missing important pre-treatment variables may reduce the reliability of causal estimates.

## 6. Model Limitations

The CausalForestDML estimator uses machine learning to estimate treatment effects, but it has limitations.

- Results depend on the selected models and their configuration.
- Small or unrepresentative samples may produce unstable estimates.
- Model complexity can make results harder to interpret.
- Treatment effects may be estimated inaccurately if the data does not contain enough information.

## 7. Treatment-Level Limitations

The analysis compares specified discount levels, such as 0 and 10.

- The treatment levels must be represented and correctly defined in the dataset.
- Results for one discount comparison do not automatically apply to every other discount level.
- The estimated effect depends on the selected treatment comparison and the customers being analysed.

## 8. Evaluation Limitations

Model outputs must be evaluated before they are used for decisions.

- An estimated treatment effect alone does not establish model reliability.
- Additional diagnostics and uncertainty estimates may be needed.
- Qini analysis or other policy evaluation methods should only be reported as completed if they have actually been implemented and run successfully.

## 9. Real-World Application

The current project is a learning and development prototype.

Before applying it to a real business, the model should be tested using suitable real-world data, checked for data quality, evaluated for causal validity, and reviewed for business risks.

## 10. Conclusion

EconoCausal demonstrates how Double Machine Learning can be used to estimate discount effects. However, its estimates depend on the quality of the synthetic data, feature selection, model configuration, and causal assumptions. Therefore, the results should be treated as experimental estimates rather than proven real-world business outcomes.
