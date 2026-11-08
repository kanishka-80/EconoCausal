
import numpy as np
from econml.dml import CausalForestDML
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier


class DMLEstimator:
    def __init__(self, random_state=42):
        self.model = CausalForestDML(
            model_y=RandomForestRegressor(
                n_estimators=100,
                min_samples_leaf=10,
                random_state=random_state
            ),
            model_t=RandomForestClassifier(
                n_estimators=100,
                min_samples_leaf=10,
                random_state=random_state
            ),
            discrete_treatment=True,
            categories="auto",
            cv=3,
            n_estimators=100,
            random_state=random_state
        )

        self.is_fitted = False
        self.treatment_values_ = None
        self.n_features_in_ = None

    def _validate_X(self, X):
        try:
            X_array = np.asarray(X, dtype=float)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "X must contain numeric, encoded features."
            ) from exc

        if X_array.ndim != 2 or X_array.shape[0] == 0:
            raise ValueError("X must be a non-empty 2D feature matrix.")

        if not np.isfinite(X_array).all():
            raise ValueError("X contains missing or infinite values.")

        return X_array

    def fit(self, X, T, Y):
        X_array = self._validate_X(X)

        try:
            T_array = np.asarray(T).reshape(-1)
            Y_array = np.asarray(Y, dtype=float).reshape(-1)
        except (TypeError, ValueError) as exc:
            raise ValueError("T and Y must contain valid values.") from exc

        if not np.isfinite(T_array).all():
            raise ValueError("T contains missing or infinite values.")

        if len(X_array) != len(T_array) or len(X_array) != len(Y_array):
            raise ValueError("X, T, and Y must have the same number of rows.")

        if not np.isfinite(Y_array).all():
            raise ValueError("Y contains missing or infinite values.")

        treatment_values = np.unique(T_array)

        if len(treatment_values) < 2:
            raise ValueError("T must contain at least two treatment groups.")

        if not np.isin(treatment_values, [0, 5, 10, 20]).all():
            raise ValueError("Treatment values must be 0, 5, 10, or 20.")

        for value in treatment_values:
            if np.sum(T_array == value) < 3:
                raise ValueError(
                    "Each treatment group needs at least 3 samples for cv=3."
                )

        self.model.fit(
            Y=Y_array,
            T=T_array,
            X=X_array
        )

        self.treatment_values_ = treatment_values
        self.n_features_in_ = X_array.shape[1]
        self.is_fitted = True

        return self

    def estimate_effect(self, X, T0=0, T1=10):
        if not self.is_fitted:
            raise ValueError("Train the model first by calling fit().")

        X_array = self._validate_X(X)

        if X_array.shape[1] != self.n_features_in_:
            raise ValueError(
                "X has a different number of features than training X."
            )

        if T0 not in self.treatment_values_ or T1 not in self.treatment_values_:
            raise ValueError(
                f"T0 and T1 must be observed treatment values: "
                f"{self.treatment_values_.tolist()}"
            )

        effects = self.model.effect(X_array, T0=T0, T1=T1)
        return np.asarray(effects).reshape(-1)

    def average_effect(self, X, T0=0, T1=10):
        effects = self.estimate_effect(X, T0=T0, T1=T1)
        return float(np.mean(effects))
