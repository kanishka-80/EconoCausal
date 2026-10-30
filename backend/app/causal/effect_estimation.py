
import numpy as np
from .dml_estimator import DMLEstimator


class EffectEstimator:
    """Calculate individual and average treatment effects."""

    def __init__(self, dml_estimator):
        if not isinstance(dml_estimator, DMLEstimator):
            raise TypeError(
                "dml_estimator must be an instance of DMLEstimator."
            )

        self.dml_estimator = dml_estimator

    def estimate(self, X, T0=0, T1=10):
        """Estimate treatment effects for one treatment comparison."""

        if not self.dml_estimator.is_fitted:
            raise ValueError(
                "DML model is not trained. Call fit() first."
            )

        effects = self.dml_estimator.estimate_effect(
            X=X,
            T0=T0,
            T1=T1
        )

        effects = np.asarray(effects, dtype=float).reshape(-1)

        if effects.size == 0:
            raise ValueError("No treatment effects were estimated.")

        if not np.isfinite(effects).all():
            raise ValueError(
                "Estimated effects contain missing or infinite values."
            )

        return {
            "baseline_treatment": T0,
            "comparison_treatment": T1,
            "number_of_customers": int(len(effects)),
            "individual_effects": effects.tolist(),
            "average_effect": float(np.mean(effects)),
            "positive_effect_count": int(np.sum(effects > 0)),
            "zero_effect_count": int(np.sum(effects == 0)),
            "negative_effect_count": int(np.sum(effects < 0))
        }

    def estimate_for_optimizer(self, X):
        """
        Estimate customer-level uplift for 5%, 10%, and 20% discounts.

        Returns:
            numpy.ndarray: Shape (number_of_customers, 3).
            Columns represent [5%, 10%, 20%] discount uplift
            relative to the 0% baseline.
        """

        if not self.dml_estimator.is_fitted:
            raise ValueError(
                "DML model is not trained. Call fit() first."
            )

        X = np.asarray(X)

        if X.ndim != 2 or X.shape[0] == 0:
            raise ValueError(
                "X must be a non-empty 2D array."
            )

        treatment_options = [5, 10, 20]
        effect_columns = []

        for discount in treatment_options:

            effects = self.dml_estimator.estimate_effect(
                X=X,
                T0=0,
                T1=discount
            )

            effects = np.asarray(
                effects, dtype=float
            ).reshape(-1)

            if len(effects) != len(X):
                raise ValueError(
                    "Effect count does not match customer count."
                )

            if not np.isfinite(effects).all():
                raise ValueError(
                    "Effects contain missing or infinite values."
                )

            effect_columns.append(effects)

        return np.column_stack(effect_columns)
