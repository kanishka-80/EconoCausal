
import pandas as pd

DATA_FILE = "econocausal_enriched_synthetic_dataset.csv"
OUTPUT_FILE = "categorical_balance_report.csv"

data = pd.read_csv(DATA_FILE)

categorical_columns = [
    "income_bracket",
    "region",
    "subscription_status",
    "preferred_channel",
    "product_category",
    "campaign_type",
    "day_of_week",
    "device_type",
]

groups = sorted(data["discount_offered"].dropna().unique())
rows = []

for column in categorical_columns:
    proportions = pd.crosstab(
        data["discount_offered"],
        data[column],
        normalize="index",
    ).reindex(groups, fill_value=0)

    for i, group_a in enumerate(groups):
        for group_b in groups[i + 1:]:
            differences = (
                proportions.loc[group_a] - proportions.loc[group_b]
            ).abs()

            rows.append({
                "covariate": column,
                "discount_a": group_a,
                "discount_b": group_b,
                "max_abs_proportion_difference": float(
                    differences.max()
                ),
            })

report = pd.DataFrame(rows)
report.to_csv(OUTPUT_FILE, index=False)

print("Categorical pairwise comparisons:", len(report))
print("\nLargest proportion differences:")
print(
    report.sort_values(
        "max_abs_proportion_difference",
        ascending=False,
    ).head(20).to_string(index=False)
)
print(f"\nSaved: {OUTPUT_FILE}")
