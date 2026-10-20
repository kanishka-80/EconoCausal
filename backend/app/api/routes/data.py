import logging
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from backend.app.schemas.common import StandardResponse
from backend.app.schemas.data import DatasetSummaryData, UploadValidationData
from backend.app.services.data_service import DataService

logger = logging.getLogger("econocausal.routes.data")
router = APIRouter(prefix="/data", tags=["data"])


@router.post(
    "/upload",
    response_model=StandardResponse[UploadValidationData],
    status_code=status.HTTP_200_OK,
    summary="Upload dataset CSV",
)
async def upload_dataset(file: UploadFile = File(...)):
    filename = file.filename or "unknown.csv"
    logger.info(f"Received file upload request: filename={filename}")

    try:
        content = await file.read()
    except Exception as exc:
        logger.error(f"Failed to read uploaded file {filename}: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "FILE_READ_ERROR",
                "message": f"Failed to read uploaded file: {str(exc)}",
                "details": [],
            },
        )
    finally:
        await file.close()

    result = DataService.parse_and_validate_csv(content, filename)
    logger.info(f"Successfully processed {filename}: {result.row_count} rows, {result.column_count} columns.")
    return StandardResponse(data=result)


@router.get(
    "/summary",
    response_model=StandardResponse[DatasetSummaryData],
    status_code=status.HTTP_200_OK,
    summary="Get dataset summary and profiling",
)
def get_dataset_summary():
    result = DataService.get_dataset_summary()
    return StandardResponse(data=result)


@router.post(
    "/reset",
    response_model=StandardResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Safely clear uploaded dataset from memory",
)
def reset_dataset():
    logger.info("Explicit dataset reset requested. Clearing stored data.")
    DataService.clear()
    return StandardResponse(data={"message": "Dataset cleared successfully."})