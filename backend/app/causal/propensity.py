
"""Multi-treatment propensity score estimation."""

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from backend.app.causal.dag import (
    CANDIDATE_COVARIATES,
    TREATMENT,
)


def estimate_propensity_scores(
    data: pd.DataFrame,
    treatment_col: str = TREATMENT,
    covariates: list[str] | None = None,
) -> pd.DataFrame:
    """Estimate probability of each observed treatment level."""

    features = (
        CANDIDATE_COVARIATES if covariates is None else covariates
    )

    if treatment_col not in data.columns:
        raise ValueError(f"Missing treatment column: {treatment_col}")

    if not features:
        raise ValueError("At least one covariate is required.")

    missing = [col for col in features if col not in data.columns]
    if missing:
        raise ValueError(f"Missing covariates: {missing}")

    if data[treatment_col].isna().any():
        raise ValueError("Treatment column contains missing values.")

    if data[treatment_col].nunique() < 2:
        raise ValueError("At least two treatment groups are required.")

    X = data[features].copy()
    y = data[treatment_col].copy()

    numeric_cols = X.select_dtypes(include="number").columns.tolist()
    categorical_cols = [
        col for col in features if col not in numeric_cols
    ]

    transformers = []

    if numeric_cols:
        transformers.append((
            "numeric",
            Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
            ]),
            numeric_cols,
        ))

    if categorical_cols:
        transformers.append((
            "categorical",
            Pipeline([
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("onehot", OneHotEncoder(handle_unknown="ignore")),
            ]),
            categorical_cols,
        ))

    model = Pipeline([
        ("preprocess", ColumnTransformer(transformers)),
        ("classifier", LogisticRegression(max_iter=2000)),
    ])

    model.fit(X, y)
    classifier = model.named_steps["classifier"]

    return pd.DataFrame(
        model.predict_proba(X),
        index=data.index,
        columns=[
            f"propensity_{level}" for level in classifier.classes_
        ],
    )


def propensity_diagnostics(scores: pd.DataFrame) -> dict:
    """Check probability validity and basic overlap indicators."""

    if scores.empty or scores.shape[1] < 2:
        raise ValueError("At least two treatment groups are required.")

    if scores.isna().any().any():
        raise ValueError("Scores contain missing values.")

    values = scores.to_numpy()

    if ((values < 0) | (values > 1)).any():
        raise ValueError("Scores must be between 0 and 1.")

    return {
        "n_observations": len(scores),
        "n_treatment_groups": len(scores.columns),
        "probabilities_sum_to_one": bool(
            ((scores.sum(axis=1) - 1).abs() < 1e-6).all()
        ),
        "min_propensity": float(values.min()),
        "max_propensity": float(values.max()),
        "near_zero_probability_count": int((values < 0.01).sum()),
    }

def covariate_balance_diagnostics(
    data: pd.DataFrame,
    treatment_col: str = TREATMENT,
    covariates: list[str] | None = None,
) -> pd.DataFrame:
    """Calculate pairwise absolute SMD for numeric covariates.

    This is a descriptive balance diagnostic, not proof of causality.
    Categorical covariates and feature timing need separate review.
    """
    if treatment_col not in data.columns:
        raise ValueError(f"Missing treatment column: {treatment_col}")

    features = CANDIDATE_COVARIATES if covariates is None else covariates
    if not features:
        raise ValueError("At least one covariate is required.")

    missing = [col for col in features if col not in data.columns]
    if missing:
        raise ValueError(f"Missing covariates: {missing}")

    if data[treatment_col].isna().any():
        raise ValueError("Treatment column contains missing values.")

    groups = sorted(data[treatment_col].dropna().unique().tolist())
    if len(groups) < 2:
        raise ValueError("At least two treatment groups are required.")

    numeric_features = [
        col for col in features
        if pd.api.types.is_numeric_dtype(data[col])
    ]
    if not numeric_features:
        raise ValueError("No numeric covariates available for SMD.")

    rows = []
    for i, group_a in enumerate(groups):
        for group_b in groups[i + 1:]:
            a = data.loc[data[treatment_col] == group_a, numeric_features]
            b = data.loc[data[treatment_col] == group_b, numeric_features]

            for feature in numeric_features:
                x = pd.to_numeric(a[feature], errors="coerce").dropna()
                y = pd.to_numeric(b[feature], errors="coerce").dropna()

                if len(x) < 2 or len(y) < 2:
                    smd = float("nan")
                else:
                    pooled_sd = (
                        (x.var(ddof=1) + y.var(ddof=1)) / 2
                    ) ** 0.5
                    if pooled_sd == 0:
                        smd = 0.0 if x.mean() == y.mean() else float("inf")
                    else:
                        smd = abs(float(x.mean() - y.mean()) / pooled_sd)

                rows.append({
                    "treatment_a": group_a,
                    "treatment_b": group_b,
                    "covariate": feature,
                    "absolute_smd": smd,
                    "imbalanced_at_0_1": (
                        bool(smd >= 0.1) if pd.notna(smd) else None
                    ),
                })

    return pd.DataFrame(rows)
