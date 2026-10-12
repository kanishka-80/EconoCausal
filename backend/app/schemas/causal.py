from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CausalAnalysisRequest(BaseModel):
    treatment_column: str = Field(description="Name of the treatment/discount column")
    outcome_column: str = Field(description="Name of the outcome/target column")
    confounders: List[str] = Field(min_length=1, description="List of pre-treatment covariates to control for")
    # Open decision: discrete discount levels vs continuous pricing treatment
    treatment_levels: Optional[List[float]] = Field(default=None, description="Supported discrete discount levels (pending ML freeze)")


class TreatmentEffectSummary(BaseModel):
    average_treatment_effect: float = Field(description="Estimated population average treatment effect (ATE)")
    confidence_interval_lower: Optional[float] = Field(default=None, description="Lower bound of confidence interval")
    confidence_interval_upper: Optional[float] = Field(default=None, description="Upper bound of confidence interval")


class CausalAnalysisData(BaseModel):
    run_id: str = Field(description="Unique identifier for the causal analysis run")
    status: str = Field(default="COMPLETED", description="Analysis status: PENDING, COMPLETED, FAILED")
    estimator_used: str = Field(default="LinearDML", description="EconML estimator name")
    ate_summary: TreatmentEffectSummary = Field(description="Primary effect estimates")
    # Open decision: refutation test types to surface to frontend
    diagnostics: Dict[str, Any] = Field(default_factory=dict, description="DoWhy refutation check outputs (placeholder)")
