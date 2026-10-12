import csv
import io
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from backend.app.schemas.common import ErrorPayload, ErrorResponse, StandardResponse
from backend.app.schemas.data import (
    ColumnProfile,
    DatasetSummaryData,
    TreatmentCoverage,
    UploadValidationData,
)

router = APIRouter(prefix="/data", tags=["data"])


@router.post(
    "/upload",
    response_model=StandardResponse[UploadValidationData],
    responses={
        400: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
    },
)
async def upload_dataset(file: UploadFile = File(...)):
    # 1. Validate file format
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_FILE_FORMAT",
                "message": "Only CSV files are supported.",
                "details": [],
            },
        )

    # 2. Inspect CSV content
    try:
        content = await file.read()
        decoded = content.decode("utf-8")
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
        row_count = len(rows) - 1

        validation_data = UploadValidationData(
            filename=file.filename,
            row_count=max(row_count, 0),
            column_count=len(headers),
            columns=headers,
            validation_status="VALID",
            validation_errors=[],
        )
        return StandardResponse(data=validation_data)

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "ENCODING_ERROR",
                "message": "The file must be UTF-8 encoded text.",
                "details": [],
            },
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "PROCESSING_ERROR",
                "message": f"Failed to parse CSV: {str(e)}",
                "details": [],
            },
        )


@router.get(
    "/summary",
    response_model=StandardResponse[DatasetSummaryData],
)
async def get_dataset_summary():
    # Placeholder dataset summary conforming to docs/api-contract.md until Day 4 services
    summary_data = DatasetSummaryData(
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
    return StandardResponse(data=summary_data)
