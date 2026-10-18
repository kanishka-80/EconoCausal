import io
from typing import Dict, List, Optional
import pandas as pd
from fastapi import HTTPException, status
from backend.app.schemas.data import (
    ColumnProfile,
    DatasetSummaryData,
    TreatmentCoverage,
    UploadValidationData,
)


class DataService:
    _current_df: Optional[pd.DataFrame] = None
    _current_filename: Optional[str] = None

    @classmethod
    def get_current_dataframe(cls) -> Optional[pd.DataFrame]:
        return cls._current_df

    @classmethod
    def clear(cls) -> None:
        cls._current_df = None
        cls._current_filename = None

    @classmethod
    def parse_and_validate_csv(cls, file_bytes: bytes, filename: str) -> UploadValidationData:
        if not filename.lower().endswith(".csv"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_FILE_FORMAT",
                    "message": "Only CSV files are supported.",
                    "details": [],
                },
            )

        if not file_bytes or len(file_bytes.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "EMPTY_DATASET",
                    "message": "The uploaded CSV file is empty.",
                    "details": [],
                },
            )

        try:
            df = pd.read_csv(io.BytesIO(file_bytes))
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "ENCODING_ERROR",
                    "message": "The file must be UTF-8 encoded text.",
                    "details": [],
                },
            )
        except pd.errors.EmptyDataError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "EMPTY_DATASET",
                    "message": "The uploaded CSV file contains no data or columns.",
                    "details": [],
                },
            )
        except pd.errors.ParserError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "MALFORMED_CSV",
                    "message": f"Failed to parse CSV format: {str(e)}",
                    "details": [],
                },
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "code": "PROCESSING_ERROR",
                    "message": f"Failed to process CSV: {str(e)}",
                    "details": [],
                },
            )

        if df.empty or len(df.columns) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "EMPTY_DATASET",
                    "message": "The uploaded CSV file contains no rows.",
                    "details": [],
                },
            )

        # Store validated dataframe and filename
        cls._current_df = df
        cls._current_filename = filename

        return UploadValidationData(
            filename=filename,
            row_count=len(df),
            column_count=len(df.columns),
            columns=list(df.columns),
            validation_status="VALID",
            validation_errors=[],
        )

    @classmethod
    def get_dataset_summary(cls) -> DatasetSummaryData:
        if cls._current_df is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "NO_DATA_UPLOADED",
                    "message": "No dataset has been uploaded yet. Please upload a CSV first.",
                    "details": [],
                },
            )

        df = cls._current_df
        total_rows = len(df)
        columns_profile: List[ColumnProfile] = []

        special_cols = {
            "customer_id",
            "id",
            "discount_offered",
            "discount_amount",
            "purchased",
            "revenue",
            "net_profit",
        }

        for col in df.columns:
            null_count = int(df[col].isna().sum())
            null_pct = round((null_count / total_rows * 100.0), 2) if total_rows > 0 else 0.0
            is_confounder = str(col).lower() not in special_cols

            columns_profile.append(
                ColumnProfile(
                    name=str(col),
                    data_type=str(df[col].dtype),
                    null_count=null_count,
                    null_percentage=null_pct,
                    is_eligible_confounder=is_confounder,
                )
            )

        # Dynamic treatment coverage
        treatment_cov: Optional[TreatmentCoverage] = None
        treatment_col = None
        for candidate in ["discount_offered", "discount_amount"]:
            if candidate in df.columns:
                treatment_col = candidate
                break

        if treatment_col is not None:
            val_counts = df[treatment_col].value_counts(dropna=False).to_dict()
            unique_vals = [float(k) for k in val_counts.keys() if pd.notna(k)]
            counts_dict = {str(k): int(v) for k, v in val_counts.items()}
            treatment_cov = TreatmentCoverage(
                treatment_column=treatment_col,
                unique_values=sorted(unique_vals),
                counts=counts_dict,
            )

        return DatasetSummaryData(
            row_count=total_rows,
            column_count=len(df.columns),
            columns=columns_profile,
            treatment_coverage=treatment_cov,
            preprocessing_status="READY",
        )


data_service = DataService()
