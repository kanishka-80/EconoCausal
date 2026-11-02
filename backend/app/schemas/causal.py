from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator


class CausalAnalysisRequest(BaseModel):
    treatment_column: str = Field(description="Name of the treatment/discount column")
    outcome_column: str = Field(description="Name of the outcome/target column")
    confounders: List[str] = Field(min_length=1, description="List of pre-treatment covariates to control for")
    treatment_levels: Optional[List[float]] = Field(default=None, description="Supported discrete discount levels")

    @field_validator("treatment_column", "outcome_column")
    @classmethod
    def validate_non_empty_str(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Column name cannot be empty or whitespace.")
        return clean

    @field_validator("confounders")
    @classmethod
    def validate_confounders_list(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("Confounders list cannot be empty.")
        clean_list = []
        for c in v:
            clean_col = c.strip()
            if not clean_col:
                raise ValueError("Confounder column names cannot be empty or whitespace.")
            clean_list.append(clean_col)
        return clean_list


class TreatmentEffectSummary(BaseModel):
    average_treatment_effect: float = Field(description="Estimated population average treatment effect (ATE)")
    confidence_interval_lower: Optional[float] = Field(default=None, description="Lower bound of 95% confidence interval")
    confidence_interval_upper: Optional[float] = Field(default=None, description="Upper bound of 95% confidence interval")
    unit: str = Field(default="percentage_points", description="Measurement unit of the treatment effect")


class SegmentEffect(BaseModel):
    segment_name: str = Field(description="Name or category of the customer segment")
    segment_feature: str = Field(description="Feature used to segment the population")
    sample_size: int = Field(description="Number of observations in this segment")
    estimated_effect: float = Field(description="Estimated Conditional Average Treatment Effect (CATE) for the segment")


class AnalysisMetadata(BaseModel):
    sample_size: int = Field(description="Number of observations used in the analysis")
    treatment_column: str = Field(description="Treatment column used")
    outcome_column: str = Field(description="Outcome column used")
    confounders: List[str] = Field(description="Confounders controlled for")
    execution_time_seconds: float = Field(description="Time elapsed during analysis in seconds")


class DiagnosticCheckResult(BaseModel):
    check_name: str = Field(description="Identifier of the refutation or diagnostic check")
    status: str = Field(default="PENDING_INTEGRATION", description="Status of check")
    passed: Optional[bool] = Field(default=None, description="Whether diagnostic check passed")
    message: Optional[str] = Field(default=None, description="Summary interpretation of check outcome")
    p_value: Optional[float] = Field(default=None, description="Diagnostic p-value if applicable")
    details: Optional[Union[str, Dict[str, Any]]] = Field(default=None, description="Test details, message, or parameters")


class DiagnosticsSummary(BaseModel):
    refutation_status: str = Field(description="Overall health status of causal assumptions")
    checks: List[DiagnosticCheckResult] = Field(default_factory=list, description="Detailed diagnostic outcomes")
    warnings: List[str] = Field(default_factory=list, description="Diagnostic warning messages")
    open_decisions: Optional[str] = Field(default=None, description="Open methodological decisions")


class CausalAnalysisData(BaseModel):
    run_id: str = Field(description="Unique identifier for causal inference run")
    status: str = Field(description="Run status: PENDING, RUNNING, COMPLETED, FAILED")
    is_mock: bool = Field(default=True, description="Flag indicating mock/scaffold result vs live DML model")
    ate_summary: TreatmentEffectSummary = Field(description="Global average treatment effect")
    segment_effects: List[SegmentEffect] = Field(default_factory=list, description="Heterogeneous treatment effects by customer segment")
    metadata: AnalysisMetadata = Field(description="Dataset and run execution parameters")
    diagnostics: DiagnosticsSummary = Field(description="Refutation tests and assumption validation")
