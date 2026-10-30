
from pathlib import Path

import numpy as np
import pandas as pd

from app.data_pipeline.cleaning import clean_data
from app.data_pipeline.features import prepare_features
from app.causal.dml_estimator import DMLEstimator
from app.causal.effect_estimation import EffectEstimator


def run_pipeline():
    # 1. Load dataset
    project_root = Path(__file__).resolve().parents[3]
    dataset_path = (
        project_root
        / "raw_data"
        / "econocausal_enriched_synthetic_dataset.csv"
    )

    df = pd.read_csv(dataset_path)

    print("Dataset loaded:", df.shape)

    # 2. Clean dataset
    df = clean_data(df)

    # 3. Prepare features, treatment and outcome
    data = prepare_features(df)

    X_train = data["X_train_scaled"]
    T_train = data["T_train"]
    y_train = data["y_train"]

    X_all = data["X_all_scaled"]
    customer_ids = data["customer_ids"]

    print("\nTraining DML model...")

    # 4. Train DML model
    dml = DMLEstimator(random_state=42)

    dml.fit(
        X=X_train,
        T=T_train,
        Y=y_train
    )

    print("DML model training completed.")

    # 5. Estimate uplift for optimizer
    estimator = EffectEstimator(dml)

    uplift_matrix = estimator.estimate_for_optimizer(X_all)

    # 6. Validate optimizer output
    expected_shape = (len(customer_ids), 3)

    if uplift_matrix.shape != expected_shape:
        raise ValueError(
            f"Expected shape {expected_shape}, "
            f"got {uplift_matrix.shape}"
        )

    if not np.isfinite(uplift_matrix).all():
        raise ValueError("Uplift matrix contains invalid values.")

    # 7. Create optimizer-ready output
    output = pd.DataFrame(
        uplift_matrix,
        columns=[
            "uplift_5",
            "uplift_10",
            "uplift_20"
        ]
    )

    output.insert(
        0,
        "customer_id",
        customer_ids.to_numpy()
    )

    # 8. Save results
    output_dir = project_root / "reports"
    output_dir.mkdir(exist_ok=True)

    output_path = output_dir / "customer_uplift_matrix.csv"
    output.to_csv(output_path, index=False)

    print("\nPipeline completed successfully.")
    print("Uplift matrix shape:", uplift_matrix.shape)
    print("Treatment order: [5, 10, 20]")
    print("Saved output:", output_path)
    print("\nSample output:")
    print(output.head())

    return output


if __name__ == "__main__":
    run_pipeline()
