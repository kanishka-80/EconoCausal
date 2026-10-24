
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


def prepare_features(df):
    feature_columns = [
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

    # Check that all selected columns exist.
    missing_columns = [
        col for col in feature_columns
        if col not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Feature columns missing from dataset: {missing_columns}"
        )

    X = df[feature_columns].copy()

    T = df["discount_offered"].copy()

    y = df["purchased"].copy()

    X = pd.get_dummies(
        X,
        columns=X.select_dtypes(
            include=["object", "str", "category"]
        ).columns,
        drop_first=True,
        dtype=int
    )

    X_train, X_test, T_train, T_test, y_train, y_test = (
        train_test_split(
            X,
            T,
            y,
            test_size=0.2,
            random_state=42,
            stratify=y
        )
    )

    scaler = StandardScaler()

    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print("X shape:", X.shape)
    print("Training shape:", X_train_scaled.shape)
    print("Testing shape:", X_test_scaled.shape)

    return {
        "X_train": X_train,
        "X_test": X_test,
        "X_train_scaled": X_train_scaled,
        "X_test_scaled": X_test_scaled,
        "T_train": T_train,
        "T_test": T_test,
        "y_train": y_train,
        "y_test": y_test,
        "scaler": scaler
    }
