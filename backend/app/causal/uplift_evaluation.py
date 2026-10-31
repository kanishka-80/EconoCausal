
"""Uplift evaluation utilities for EconoCausal."""

import numpy as np
import pandas as pd


def evaluate_uplift(
    data: pd.DataFrame,
    scores,
    treatment_level,
    control_level=0,
    treatment_col="discount_offered",
    outcome_col="purchased",
) -> pd.DataFrame:
    """Calculate cumulative uplift gain for one treatment vs control.

    Higher scores should indicate customers predicted to benefit more
    from the treatment. The output is a descriptive ranking diagnostic,
    not proof of a causal effect.
    """
    if not isinstance(data, pd.DataFrame) or data.empty:
        raise ValueError("data must be a non-empty pandas DataFrame")

    if treatment_level == control_level:
        raise ValueError("treatment_level and control_level must differ")

    required = {treatment_col, outcome_col}
    missing = required - set(data.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    if data[[treatment_col, outcome_col]].isna().any().any():
        raise ValueError("Treatment and outcome columns must not contain missing values")

    if not data[outcome_col].isin([0, 1]).all():
        raise ValueError("Outcome must be binary (0/1)")

    scores = np.asarray(scores, dtype=float)
    if len(scores) != len(data):
        raise ValueError("scores length must match data length")

    if not np.isfinite(scores).all():
        raise ValueError("scores must contain only finite values")

    # Compare only the requested treatment and control groups.
    selected = data[treatment_col].isin([treatment_level, control_level])
    positions = np.flatnonzero(selected.to_numpy())

    if len(positions) == 0:
        raise ValueError("No rows found for the selected treatment/control groups")

    comparison = data.iloc[positions].copy()
    comparison["_score"] = scores[positions]

    treatment_mask = comparison[treatment_col] == treatment_level
    control_mask = comparison[treatment_col] == control_level

    n_treatment = int(treatment_mask.sum())
    n_control = int(control_mask.sum())

    if n_treatment == 0 or n_control == 0:
        raise ValueError("Both treatment and control groups must be present")

    comparison = comparison.sort_values("_score", ascending=False).reset_index(drop=True)

    is_treatment = (
        comparison[treatment_col] == treatment_level
    ).astype(int)
    is_control = (
        comparison[treatment_col] == control_level
    ).astype(int)

    treatment_outcomes = (
        is_treatment * comparison[outcome_col].astype(int)
    )
    control_outcomes = (
        is_control * comparison[outcome_col].astype(int)
    )

    cumulative_treated = treatment_outcomes.cumsum()
    cumulative_control = control_outcomes.cumsum()

    # Descriptive Qini-style gain relative to the observed control rate.
    gain = (
        cumulative_treated
        - cumulative_control * (n_treatment / n_control)
    )

    return pd.DataFrame(
        {
            "rank": np.arange(1, len(comparison) + 1),
            "score": comparison["_score"],
            "treatment": comparison[treatment_col],
            "outcome": comparison[outcome_col].astype(int),
            "cumulative_treated": is_treatment.cumsum(),
            "cumulative_control": is_control.cumsum(),
            "cumulative_treated_outcomes": cumulative_treated,
            "cumulative_control_outcomes": cumulative_control,
            "uplift_gain": gain,
        }
    )
