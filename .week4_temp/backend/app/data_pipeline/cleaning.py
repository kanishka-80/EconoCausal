
def clean_data(df):
    df = df.copy()

    # Remove extra spaces from column names.
    df.columns = df.columns.str.strip()

    # Remove extra spaces from text values.
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].str.strip()

    # Check duplicate rows without deleting them automatically.
    print("Duplicate rows:", df.duplicated().sum())

    # Check missing values.
    print("\nMissing values:")
    print(df.isnull().sum()[df.isnull().sum() > 0])

    print("\nData cleaning checks completed.")

    return df
