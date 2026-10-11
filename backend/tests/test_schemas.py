import pytest
from pydantic import ValidationError
from backend.app.schemas.common import StandardResponse, ErrorPayload, ErrorResponse
from backend.app.schemas.data import ColumnProfile, DatasetSummaryData, UploadValidationData


def test_standard_response_wrapping():
    payload = {"message": "ok"}
    response = StandardResponse[dict](data=payload)
    assert response.status == "success"
    assert response.data["message"] == "ok"


def test_error_response_payload():
    error_payload = ErrorPayload(
        code="INVALID_CSV",
        message="Missing required headers",
        details=[]
    )
    response = ErrorResponse(error=error_payload)
    assert response.status == "error"
    assert response.error.code == "INVALID_CSV"


def test_column_profile_validation():
    col = ColumnProfile(
        name="discount",
        data_type="float",
        null_count=5,
        null_percentage=0.5,
        is_eligible_confounder=False
    )
    assert col.null_percentage == 0.5

    with pytest.raises(ValidationError):
        # null_percentage cannot exceed 100
        ColumnProfile(
            name="discount",
            data_type="float",
            null_count=5,
            null_percentage=150.0,
            is_eligible_confounder=False
        )


def test_dataset_summary_data():
    summary = DatasetSummaryData(
        row_count=100,
        column_count=2,
        columns=[
            ColumnProfile(name="id", data_type="int", null_count=0, null_percentage=0.0, is_eligible_confounder=False),
            ColumnProfile(name="treatment", data_type="float", null_count=0, null_percentage=0.0, is_eligible_confounder=False)
        ],
        preprocessing_status="READY"
    )
    assert summary.row_count == 100
    assert len(summary.columns) == 2
