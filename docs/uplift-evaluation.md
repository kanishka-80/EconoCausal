# Uplift Evaluation — Week 2

## Purpose

The uplift evaluator ranks observations using predicted treatment-effect
scores and calculates cumulative treated-versus-control outcome gain.
It is a descriptive ranking diagnostic, not proof of a causal effect.

## Python Interface

```python
evaluate_uplift(
    data,
    scores,
    treatment_level=10,
    control_level=0,
    treatment_col="discount_offered",
    outcome_col="purchased",
)
```

### Inputs

- `data`: Non-empty pandas DataFrame containing treatment and outcome columns.
- `scores`: One finite numeric score per row, aligned positionally with `data`.
  Higher scores should indicate customers predicted to benefit more.
- `treatment_level`: Treatment value to evaluate, for example `10`.
- `control_level`: Comparison group, normally `0`.
- `treatment_col`: Treatment column name; defaults to `discount_offered`.
- `outcome_col`: Outcome column name; defaults to `purchased`.

The outcome must be binary (`0` or `1`). Both selected groups must be present.

## Output Fields

| Field | Description |
|---|---|
| `rank` | Row rank after sorting scores from highest to lowest. |
| `score` | Predicted treatment-effect score for that row. |
| `treatment` | Treatment value for the row. |
| `outcome` | Observed binary outcome. |
| `cumulative_treated` | Number of treatment-group rows encountered so far. |
| `cumulative_control` | Number of control-group rows encountered so far. |
| `cumulative_treated_outcomes` | Cumulative positive outcomes in the treatment group. |
| `cumulative_control_outcomes` | Cumulative positive outcomes in the control group. |
| `uplift_gain` | Cumulative treated positives minus control positives scaled by the overall treatment/control sample-size ratio. |

## Example

```python
import pandas as pd
from backend.app.causal.uplift_evaluation import evaluate_uplift

data = pd.DataFrame({
    "discount_offered": [0, 10, 0, 10, 20, 0],
    "purchased": [0, 1, 1, 1, 0, 0],
})

scores = [0.1, 0.9, 0.2, 0.8, 0.7, 0.3]

result = evaluate_uplift(
    data,
    scores,
    treatment_level=10,
    control_level=0,
)
print(result)
```

The evaluator includes only rows belonging to the selected treatment and
control groups. In this example, rows with `discount_offered = 20` are excluded.

## Integration Requirements

- Scores and data rows must have the same length and the same row order.
- When scores come from a test split, pass only the matching test rows.
- Do not pass full-dataset rows with test-only scores.
- Keep treatment, outcome, and score alignment unchanged through preprocessing.
- The output is a ranking diagnostic. It does not establish causal validity.
- The current implementation does not calculate a validated causal metric
  or confidence interval.

## Limitations

This evaluator does not itself fit a treatment-effect model. Its usefulness
depends on the quality of the supplied scores and the assumptions behind the
treatment/control comparison. Validate the score source and treatment
assignment design before interpreting the gain causally.
