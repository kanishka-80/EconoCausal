
import pandas as pd


def validate_data(df):
    if df.empty:
        raise ValueError("Dataset is empty.")

    required_columns = [
        "discount_offered",
        "purchased"
    ]

    for col in required_columns:
        if col not in df.columns:
            raise ValueError(f"Required column is missing: {col}")

    # Check missing treatment values.
    if df["discount_offered"].isnull().any():
        raise ValueError("discount_offered contains missing values.")

    # Check valid treatment values.
    valid_treatments = [0, 5, 10, 20]

    if not df["discount_offered"].isin(valid_treatments).all():
        raise ValueError(
            f"discount_offered must contain only {valid_treatments}."
        )

    # Check missing outcome values.
    if df["purchased"].isnull().any():
        raise ValueError("purchased contains missing values.")

    print("Discount values:")
    print(df["discount_offered"].value_counts(dropna=False))

    print("\nPurchase values:")
    print(df["purchased"].value_counts(dropna=False))

    # Check binary outcome values.
    if not df["purchased"].isin([0, 1]).all():
        raise ValueError("purchased must contain only 0 and 1.")

    print("\nDataset validation completed.")
    print("Dataset shape:", df.shape)

    return True
