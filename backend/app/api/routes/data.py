from fastapi import APIRouter, File, UploadFile
from backend.app.schemas.common import ErrorResponse, StandardResponse
from backend.app.schemas.data import DatasetSummaryData, UploadValidationData
from backend.app.services.data_service import data_service

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
    file_bytes = await file.read()
    result = data_service.parse_and_validate_csv(file_bytes, file.filename)
    return StandardResponse(data=result)


@router.get(
    "/summary",
    response_model=StandardResponse[DatasetSummaryData],
)
async def get_dataset_summary():
    result = data_service.get_dataset_summary()
    return StandardResponse(data=result)
