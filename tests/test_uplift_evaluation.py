
import pandas as pd
import pytest

from backend.app.causal.uplift_evaluation import evaluate_uplift


@pytest.fixture
def sample_data():
    return pd.DataFrame(
        {
            "discount_offered": [0, 10, 0, 10, 20, 0],
            "purchased": [0, 1, 1, 1, 0, 0],
        }
    )


def test_evaluate_uplift_returns_expected_columns(sample_data):
    scores = [0.1, 0.9, 0.2, 0.8, 0.7, 0.3]

    result = evaluate_uplift(
        sample_data,
        scores,
        treatment_level=10,
        control_level=0,
    )

    assert len(result) == 5
    assert {
        "rank",
        "score",
        "treatment",
        "outcome",
        "uplift_gain",
    }.issubset(result.columns)
    assert result["score"].is_monotonic_decreasing


def test_same_treatment_and_control_rejected(sample_data):
    with pytest.raises(ValueError):
        evaluate_uplift(
            sample_data,
            [0.1] * len(sample_data),
            treatment_level=10,
            control_level=10,
        )


def test_score_length_must_match_data(sample_data):
    with pytest.raises(ValueError):
        evaluate_uplift(
            sample_data,
            [0.1, 0.2],
            treatment_level=10,
            control_level=0,
        )


def test_non_binary_outcome_rejected():
    data = pd.DataFrame(
        {
            "discount_offered": [0, 10],
            "purchased": [0, 2],
        }
    )

    with pytest.raises(ValueError, match="binary"):
        evaluate_uplift(
            data,
            [0.1, 0.9],
            treatment_level=10,
            control_level=0,
        )


def test_both_groups_must_be_present():
    data = pd.DataFrame(
        {
            "discount_offered": [10, 10],
            "purchased": [0, 1],
        }
    )

    with pytest.raises(ValueError, match="Both treatment and control"):
        evaluate_uplift(
            data,
            [0.2, 0.8],
            treatment_level=10,
            control_level=0,
        )
