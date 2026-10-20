from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CausalAnalysisRequest(BaseModel):
    treatment_column: str = Field(description="Name of the treatment/discount column")
    outcome_column: str = Field(description="Name of the outcome/target column")
    confounders: List[str] = Field(min_length=1, description="List of pre-treatment covariates to control for")
    treatment_levels: Optional[List[float]] = Field(default=None, description="Supported discrete discount levels (pending ML freeze)")


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
    status: str = Field(default="PENDING_INTEGRATION", description="Status: PASSED, FAILED, PENDING_INTEGRATION, SKIPPED")
    p_value: Optional[float] = Field(default=None, description="Significance p-value if applicable and computed")
    details: Optional[str] = Field(default=None, description="Description or caveat regarding check execution")


class DiagnosticsSummary(BaseModel):
    refutation_status: str = Field(default="PENDING_INTEGRATION", description="Status of DoWhy refutation checks")
    checks: List[DiagnosticCheckResult] = Field(default_factory=list, description="Granular refutation check results")
    open_decisions: Optional[str] = Field(default=None, description="Pending team modeling decisions")
    warnings: List[str] = Field(default_factory=list, description="Statistical or model caveats and warnings")


class CausalAnalysisData(BaseModel):
    run_id: str = Field(description="Unique identifier for the causal analysis run")
    status: str = Field(default="COMPLETED", description="Analysis status: PENDING, COMPLETED, FAILED, NOT_FOUND")
    estimator_used: str = Field(default="LinearDML (Baseline Orchestrator)", description="EconML estimator name")
    is_mock: bool = Field(default=True, description="Explicit flag indicating mock/placeholder calculation")
    ate_summary: TreatmentEffectSummary = Field(description="Primary population average treatment effect estimates")
    segment_effects: List[SegmentEffect] = Field(default_factory=list, description="Heterogeneous treatment effects by customer segments (CATE)")
    metadata: AnalysisMetadata = Field(description="Execution and dataset metadata")
    diagnostics: DiagnosticsSummary = Field(description="Refutation check outputs and diagnostic caveats")