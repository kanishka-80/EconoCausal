import numpy as np
import pandas as pd
import pytest
from sklearn.model_selection import train_test_split

from backend.app.causal.uplift_evaluation import evaluate_uplift


def test_uplift_evaluation_uses_aligned_test_split_rows():
    df = pd.DataFrame({
        "discount_offered": [0, 10, 0, 10, 20, 0, 10, 20, 0, 10],
        "purchased":        [0, 1, 1, 1, 0, 0, 1, 0, 1, 1],
        "feature":          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    })

    X = df[["feature"]]
    T = df["discount_offered"]
    y = df["purchased"]

    X_train, X_test, T_train, T_test, y_train, y_test = train_test_split(
        X, T, y,
        test_size=0.4,
        random_state=42,
        stratify=y,
    )

    # Synthetic stand-in for predicted effects; this is NOT a real DML fit.
    scores = X_test["feature"].to_numpy(dtype=float) / 10

    evaluation_data = pd.DataFrame({
        "discount_offered": T_test.to_numpy(),
        "purchased": y_test.to_numpy(),
    })

    assert len(scores) == len(evaluation_data)
    assert len(T_test) == len(y_test)

    result = evaluate_uplift(
        evaluation_data,
        scores,
        treatment_level=10,
        control_level=0,
    )

    assert set(result["treatment"].unique()).issubset({0, 10})
    assert 20 not in result["treatment"].values
    assert result["score"].is_monotonic_decreasing
    assert len(result) == int(T_test.isin([0, 10]).sum())


def test_uplift_evaluation_rejects_test_scores_with_wrong_length():
    data = pd.DataFrame({
        "discount_offered": [0, 10, 0, 10],
        "purchased": [0, 1, 1, 0],
    })

    with pytest.raises(ValueError, match="scores length"):
        evaluate_uplift(
            data,
            np.array([0.1, 0.9]),
            treatment_level=10,
            control_level=0,
        )
