
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
def test_empty_data_rejected():
    with pytest.raises(ValueError, match="non-empty"):
        evaluate_uplift(
            pd.DataFrame(),
            [],
            treatment_level=10,
            control_level=0,
        )


def test_missing_required_column_rejected():
    data = pd.DataFrame({
        "discount_offered": [0, 10],
    })

    with pytest.raises(ValueError, match="Missing required columns"):
        evaluate_uplift(
            data,
            [0.1, 0.9],
            treatment_level=10,
            control_level=0,
        )


def test_missing_treatment_or_outcome_rejected():
    data = pd.DataFrame({
        "discount_offered": [0, 10],
        "purchased": [0, None],
    })

    with pytest.raises(ValueError, match="missing values"):
        evaluate_uplift(
            data,
            [0.1, 0.9],
            treatment_level=10,
            control_level=0,
        )


def test_non_finite_scores_rejected(sample_data):
    scores = [0.1, 0.9, float("nan"), 0.8, 0.7, 0.3]

    with pytest.raises(ValueError, match="finite"):
        evaluate_uplift(
            sample_data,
            scores,
            treatment_level=10,
            control_level=0,
        )


def test_no_matching_treatment_control_rows_rejected():
    data = pd.DataFrame({
        "discount_offered": [5, 20],
        "purchased": [0, 1],
    })

    with pytest.raises(ValueError, match="No rows found"):
        evaluate_uplift(
            data,
            [0.2, 0.8],
            treatment_level=10,
            control_level=0,
        )


def test_uplift_gain_matches_expected_calculation():
    data = pd.DataFrame({
        "discount_offered": [10, 0, 10, 0],
        "purchased": [1, 0, 0, 1],
    })
    scores = [0.9, 0.8, 0.7, 0.6]

    result = evaluate_uplift(
        data,
        scores,
        treatment_level=10,
        control_level=0,
    )

    # Two treatment and two control customers:
    # gain = cumulative treated purchases - cumulative control purchases

    expected_gain = [1.0, 1.0, 1.0, 0.0]
    assert result["uplift_gain"].tolist() == expected_gain
