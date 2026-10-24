import pandas as pd
import pytest

from app.data_pipeline.validation import validate_data
from app.data_pipeline.cleaning import clean_data
from app.data_pipeline.features import prepare_features


def create_sample_data():

    feature_columns = [
        "age", "income_bracket", "urbanicity", "region",
        "tenure_months", "historical_spend", "recency_days",
        "browsing_frequency", "avg_session_duration_sec",
        "cart_abandonment_rate", "support_tickets_count",
        "email_open_rate", "previous_discounts_accepted",
        "previous_purchases_12m", "avg_order_value",
        "website_visits_30d", "mobile_app_user", "loyalty_member",
        "subscription_status", "preferred_channel", "product_category",
        "campaign_type", "day_of_week", "device_type",
        "competitor_price_index", "stock_availability",
        "seasonality_index", "customer_satisfaction", "return_rate",
        "days_since_last_campaign", "marketing_contact_count_30d"
    ]

    df = pd.DataFrame(index=range(20))

    for column in feature_columns:
        df[column] = range(20)

    df["income_bracket"] = ["Low", "Medium"] * 10
    df["urbanicity"] = ["Urban", "Rural"] * 10
    df["region"] = ["East", "West"] * 10
    df["subscription_status"] = ["Active", "Inactive"] * 10
    df["preferred_channel"] = ["Email", "App"] * 10
    df["product_category"] = ["A", "B"] * 10
    df["campaign_type"] = ["Online", "Offline"] * 10
    df["day_of_week"] = ["Monday", "Tuesday"] * 10
    df["device_type"] = ["Mobile", "Desktop"] * 10

    df["discount_offered"] = [0, 10] * 10
    df["purchased"] = [0, 1] * 10

    return df


def test_validate_data():
    df = create_sample_data()

    result = validate_data(df)

    assert result is True


def test_validate_data_missing_column():
    df = create_sample_data()
    df = df.drop(columns=["purchased"])

    with pytest.raises(ValueError):
        validate_data(df)


def test_clean_data():
    df = pd.DataFrame({
        " discount_offered ": [0, 10],
        " purchased ": [0, 1]
    })

    cleaned_df = clean_data(df)

    assert "discount_offered" in cleaned_df.columns
    assert "purchased" in cleaned_df.columns


def test_prepare_features():
    df = create_sample_data()

    data = prepare_features(df)

    assert len(data["X_train"]) > 0
    assert len(data["X_test"]) > 0

    assert len(data["T_train"]) == len(data["X_train"])
    assert len(data["y_train"]) == len(data["X_train"])

    assert data["X_train_scaled"].shape == data["X_train"].shape
    assert data["X_test_scaled"].shape == data["X_test"].shape