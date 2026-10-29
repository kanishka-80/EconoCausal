
import numpy as np
import pytest

from app.causal.dml_estimator import DMLEstimator


def create_sample_data():
    np.random.seed(42)

    X = np.random.rand(120, 4)
    T = np.array([0, 10] * 60)

    probability = 1 / (1 + np.exp(-(X[:, 0] + 0.02 * T - 0.5)))
    Y = np.random.binomial(1, probability)

    return X, T, Y


def test_model_is_not_fitted_initially():
    dml_model = DMLEstimator()

    assert dml_model.is_fitted is False


def test_estimate_before_training():
    dml_model = DMLEstimator()
    X, T, Y = create_sample_data()

    with pytest.raises(ValueError):
        dml_model.estimate_effect(X, T0=0, T1=10)


def test_dml_model_training_and_effect_estimation():
    X, T, Y = create_sample_data()

    dml_model = DMLEstimator()
    dml_model.fit(X, T, Y)

    assert dml_model.is_fitted is True

    effects = dml_model.estimate_effect(X[:10], T0=0, T1=10)

    assert len(effects) == 10
    assert np.isfinite(effects).all()

    average_effect = dml_model.average_effect(
        X[:10], T0=0, T1=10
    )

    assert isinstance(average_effect, float)
    assert np.isfinite(average_effect)


def test_invalid_feature_data():
    dml_model = DMLEstimator()
    X = np.array([[1, 2], [3, np.nan]])

    with pytest.raises(ValueError):
        dml_model.fit(X, [0, 10], [0, 1])


def test_different_number_of_rows():
    X, T, Y = create_sample_data()

    dml_model = DMLEstimator()

    with pytest.raises(ValueError):
        dml_model.fit(X, T[:-1], Y)


def test_invalid_treatment_groups():
    X, T, Y = create_sample_data()
    T = np.zeros(len(T))

    dml_model = DMLEstimator()

    with pytest.raises(ValueError, match="at least two treatment groups"):
        dml_model.fit(X, T, Y)


def test_invalid_outcome_values():
    X, T, Y = create_sample_data()
    Y = Y.astype(float)
    Y[0] = np.nan

    dml_model = DMLEstimator()

    with pytest.raises(ValueError, match="Y contains missing or infinite values"):
        dml_model.fit(X, T, Y)


def test_wrong_number_of_features_during_estimation():
    X, T, Y = create_sample_data()

    dml_model = DMLEstimator()
    dml_model.fit(X, T, Y)

    X_wrong = np.random.rand(5, 3)

    with pytest.raises(ValueError, match="different number of features"):
        dml_model.estimate_effect(X_wrong, T0=0, T1=10)


def test_missing_treatment_values():
    X, T, Y = create_sample_data()
    T = T.astype(float)
    T[0] = np.nan

    dml_model = DMLEstimator()

    with pytest.raises(ValueError, match="T contains missing or infinite values"):
        dml_model.fit(X, T, Y)
