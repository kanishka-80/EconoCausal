
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
    id_col=None,
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

    if id_col is not None:
        if id_col not in data.columns:
            raise ValueError(f"ID column not found: {id_col}")

        if data[id_col].isna().any():
            raise ValueError("ID column must not contain missing values")

        output_columns = {
            "rank",
            "score",
            "treatment",
            "outcome",
            "cumulative_treated",
            "cumulative_control",
            "cumulative_treated_outcomes",
            "cumulative_control_outcomes",
            "uplift_gain",
        }

        if id_col in output_columns:
            raise ValueError("id_col must not conflict with output column names")

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

    result = pd.DataFrame(
        {
            "rank": np.arange(1, len(comparison) + 1),
            "score": comparison["_score"].to_numpy(),
            "treatment": comparison[treatment_col].to_numpy(),
            "outcome": comparison[outcome_col].astype(int).to_numpy(),
            "cumulative_treated": is_treatment.cumsum().to_numpy(),
            "cumulative_control": is_control.cumsum().to_numpy(),
            "cumulative_treated_outcomes": cumulative_treated.to_numpy(),
            "cumulative_control_outcomes": cumulative_control.to_numpy(),
            "uplift_gain": gain.to_numpy(),
        }
    )

    if id_col is not None:
        result.insert(
            1,
            id_col,
            comparison[id_col].to_numpy(),
        )

    return result