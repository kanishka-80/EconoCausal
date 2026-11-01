from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ColumnProfile(BaseModel):
    name: str = Field(description="Column name in dataset")
    data_type: str = Field(description="Inferred or declared data type")
    null_count: int = Field(ge=0, description="Count of missing values")
    null_percentage: float = Field(ge=0.0, le=100.0, description="Percentage of missing values")
    is_eligible_confounder: bool = Field(default=False, description="Flag whether feature is a valid pre-treatment covariate")


class TreatmentCoverage(BaseModel):
    treatment_column: str = Field(description="Name of the treatment column")
    unique_values: List[float] = Field(description="List of observed discount/treatment values")
    counts: Dict[str, int] = Field(description="Count of observations per treatment level")


class DatasetSummaryData(BaseModel):
    row_count: int = Field(ge=0, description="Total rows in dataset")
    column_count: int = Field(ge=0, description="Total columns in dataset")
    columns: List[ColumnProfile] = Field(description="Per-column profile statistics")
    treatment_coverage: Optional[TreatmentCoverage] = Field(default=None, description="Distribution of treatment values")
    preprocessing_status: str = Field(default="UNPROCESSED", description="Status: UNPROCESSED, READY, FAILED")


class UploadValidationData(BaseModel):
    filename: str = Field(description="Original uploaded filename")
    row_count: int = Field(ge=0, description="Number of rows read")
    column_count: int = Field(ge=0, description="Number of columns read")
    columns: List[str] = Field(description="List of extracted column headers")
    validation_status: str = Field(description="Validation result: VALID or INVALID")
    validation_errors: List[str] = Field(default_factory=list, description="Actionable schema or parsing errors")
