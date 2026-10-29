
import numpy as np
import pytest

from app.causal.effect_estimation import EffectEstimator


class FakeDMLEstimator:
    is_fitted = True

    def __init__(self, effects):
        self.effects = effects

    def estimate_effect(self, X, T0=0, T1=10):
        return self.effects


def test_empty_effects_are_rejected():
    estimator = EffectEstimator.__new__(EffectEstimator)
    estimator.dml_estimator = FakeDMLEstimator([])

    with pytest.raises(ValueError, match="No treatment effects"):
        estimator.estimate(X=[[1, 2]])


@pytest.mark.parametrize("effects", [
    [np.nan],
    [np.inf],
    [-np.inf],
])
def test_non_finite_effects_are_rejected(effects):
    estimator = EffectEstimator.__new__(EffectEstimator)
    estimator.dml_estimator = FakeDMLEstimator(effects)

    with pytest.raises(ValueError, match="missing or infinite"):
        estimator.estimate(X=[[1, 2]])
