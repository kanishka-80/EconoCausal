import csv
import io
from typing import List, Tuple
from fastapi import HTTPException, status
from backend.app.schemas.data import (
    ColumnProfile,
    DatasetSummaryData,
    TreatmentCoverage,
    UploadValidationData,
)


class DataService:
    @staticmethod
    def parse_and_validate_csv(file_bytes: bytes, filename: str) -> UploadValidationData:
        if not filename.lower().endswith(".csv"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_FILE_FORMAT",
                    "message": "Only CSV files are supported.",
                    "details": [],
                },
            )

        try:
            decoded = file_bytes.decode("utf-8")
            reader = csv.reader(io.StringIO(decoded))
            rows = list(reader)

            if not rows:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "EMPTY_DATASET",
                        "message": "The uploaded CSV file is empty.",
                        "details": [],
                    },
                )

            headers = [h.strip() for h in rows[0]]
            row_count = max(len(rows) - 1, 0)

            return UploadValidationData(
                filename=filename,
                row_count=row_count,
                column_count=len(headers),
                columns=headers,
                validation_status="VALID",
                validation_errors=[],
            )

        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "ENCODING_ERROR",
                    "message": "The file must be UTF-8 encoded text.",
                    "details": [],
                },
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "code": "PROCESSING_ERROR",
                    "message": f"Failed to parse CSV: {str(e)}",
                    "details": [],
                },
            )

    @staticmethod
    def get_dataset_summary() -> DatasetSummaryData:
        return DatasetSummaryData(
            row_count=1000,
            column_count=4,
            columns=[
                ColumnProfile(
                    name="customer_id",
                    data_type="string",
                    null_count=0,
                    null_percentage=0.0,
                    is_eligible_confounder=False,
                ),
                ColumnProfile(
                    name="discount_offered",
                    data_type="float",
                    null_count=0,
                    null_percentage=0.0,
                    is_eligible_confounder=False,
                ),
                ColumnProfile(
                    name="purchased",
                    data_type="int",
                    null_count=0,
                    null_percentage=0.0,
                    is_eligible_confounder=False,
                ),
                ColumnProfile(
                    name="income",
                    data_type="float",
                    null_count=10,
                    null_percentage=1.0,
                    is_eligible_confounder=True,
                ),
            ],
            treatment_coverage=TreatmentCoverage(
                treatment_column="discount_offered",
                unique_values=[0.0, 10.0, 20.0],
                counts={"0.0": 340, "10.0": 330, "20.0": 330},
            ),
            preprocessing_status="READY",
        )


data_service = DataService()
