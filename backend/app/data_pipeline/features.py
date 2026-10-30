
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


FEATURE_COLUMNS = [
    "age",
    "income_bracket",
    "urbanicity",
    "region",
    "tenure_months",
    "historical_spend",
    "recency_days",
    "browsing_frequency",
    "avg_session_duration_sec",
    "cart_abandonment_rate",
    "support_tickets_count",
    "email_open_rate",
    "previous_discounts_accepted",
    "previous_purchases_12m",
    "avg_order_value",
    "website_visits_30d",
    "mobile_app_user",
    "loyalty_member",
    "subscription_status",
    "preferred_channel",
    "product_category",
    "campaign_type",
    "day_of_week",
    "device_type",
    "competitor_price_index",
    "stock_availability",
    "seasonality_index",
    "customer_satisfaction",
    "return_rate",
    "days_since_last_campaign",
    "marketing_contact_count_30d"
]


def prepare_features(df):
    """Prepare features, treatment, outcome and customer IDs."""

    required_columns = FEATURE_COLUMNS + [
        "discount_offered",
        "purchased"
    ]

    missing_columns = [
        col for col in required_columns
        if col not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Required columns missing: {missing_columns}"
        )

    X = df[FEATURE_COLUMNS].copy()
    T = df["discount_offered"].copy()
    y = df["purchased"].copy()

    # Preserve customer IDs and original row order.
    if "customer_id" in df.columns:
        customer_ids = df["customer_id"].reset_index(drop=True)
    else:
        customer_ids = pd.Series(
            df.index.to_numpy(),
            name="customer_id"
        )

    # Encode categorical features.
    categorical_columns = X.select_dtypes(
        include=["object", "category", "str"]
    ).columns

    X = pd.get_dummies(
        X,
        columns=categorical_columns,
        drop_first=True,
        dtype=int
    )

    X_all = X.copy()

    # Split training and testing data.
    train_indices, test_indices = train_test_split(
        range(len(X)),
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    X_train = X.iloc[train_indices]
    X_test = X.iloc[test_indices]

    T_train = T.iloc[train_indices]
    T_test = T.iloc[test_indices]

    y_train = y.iloc[train_indices]
    y_test = y.iloc[test_indices]

    # Scale features.
    scaler = StandardScaler()

    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    X_all_scaled = scaler.transform(X_all)

    print("Complete feature shape:", X_all.shape)
    print("Training shape:", X_train_scaled.shape)
    print("Testing shape:", X_test_scaled.shape)
    print("All customer shape:", X_all_scaled.shape)

    return {
        "X_train": X_train,
        "X_test": X_test,
        "X_train_scaled": X_train_scaled,
        "X_test_scaled": X_test_scaled,
        "T_train": T_train,
        "T_test": T_test,
        "y_train": y_train,
        "y_test": y_test,
        "X_all": X_all,
        "X_all_scaled": X_all_scaled,
        "customer_ids": customer_ids,
        "feature_names": X.columns.tolist(),
        "scaler": scaler
    }
