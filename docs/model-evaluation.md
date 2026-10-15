
# EconoCausal — Model Evaluation Plan

## 1. Objective
Define how the causal analysis and its supporting diagnostics will be evaluated.

## 2. Week 1: Initial Validation
- Confirm treatment and outcome definitions.
- Validate required columns and data types.
- Check missing values and invalid treatment/outcome values.
- Review the causal DAG and pre-treatment covariates.
- Document data limitations and identification assumptions.

## 3. Propensity and Balance Diagnostics
Where appropriate for the selected treatment design:
- Report treatment and control group counts.
- Inspect propensity-score overlap.
- Assess covariate balance between groups.
- Flag extreme propensity scores or insufficient overlap.
- Report unsupported configurations and small-group limitations.

- Report the minimum and maximum estimated propensity probabilities.
- Flag near-zero probabilities and insufficient overlap for review.
- Mark comparisons with small treatment groups as potentially unstable.
- Report standardized mean differences (SMD) for eligible numeric covariates,
  and flag absolute SMD values of 0.1 or greater for review.
- Treat raw imbalance as a diagnostic finding, not evidence of a causal effect.


These diagnostics support the analysis; they do not establish causality.

## 4. DML Evaluation — Week 2 Dependency
The primary DML estimator is planned for Week 2.

Before evaluating it, confirm:
- The selected estimator and treatment representation.
- The outcome and eligible pre-treatment covariates.
- The train/test or cross-fitting strategy.
- The effect estimate and uncertainty outputs to report.

Do not report final treatment-effect estimates before the estimator and data pipeline are ready.

## 5. DoWhy Refutation Checks
Select checks that are appropriate for the chosen causal model and dataset.

For each check, record:
- Check name
- Input/configuration
- Result or status
- Interpretation
- Limitations

Refutation results are diagnostic evidence, not proof that causal assumptions hold.

## 6. Uplift and Qini Evaluation
Before calculating uplift or Qini metrics, verify that the data and model provide the required:
- Treatment indicator
- Observed outcome
- Model scores or ranking
- Suitable evaluation setup

Do not generate uplift curves or claim performance if required inputs are unavailable or the metric is unsupported.

## 7. Tests
Add tests for:
- Missing required columns
- Invalid treatment/outcome values
- Unsupported treatment configurations
- Insufficient data or group sizes
- Consistent diagnostic result formats

Use clearly labelled synthetic fixtures for software tests where needed.

## 8. Reporting and Limitations
Report actual test results and evaluation metrics only after running them.

Document:
- Dataset and evaluation setup
- Metrics and configuration
- Results
- Known limitations
- Pending dependencies

Neither good predictive performance nor passing refutation checks alone proves causal identification.

## 9. Open Questions
- What is the final dataset?
- Which treatment comparison is supported?
- Which evaluation metrics are justified by the available data?
- What output fields are needed by the API and frontend?
