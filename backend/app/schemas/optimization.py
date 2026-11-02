import math
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class OptimizationRequest(BaseModel):
    budget: float = Field(gt=0, description="Total budget constraint; must be strictly positive")
    available_discounts: List[float] = Field(min_length=1, description="List of supported discount offer values")
    customer_ids: Optional[List[str]] = Field(default=None, description="Optional list of target customer identifiers")
    objective: Optional[str] = Field(default="MAXIMIZE_UPLIFT", description="Optimization objective (default: MAXIMIZE_UPLIFT)")

    @field_validator("budget")
    @classmethod
    def validate_budget_finite(cls, v: float) -> float:
        if not math.isfinite(v) or math.isnan(v):
            raise ValueError("Budget must be a finite, non-NaN positive number.")
        if v <= 0:
            raise ValueError("Budget must be strictly positive.")
        return float(round(v, 2))

    @field_validator("available_discounts")
    @classmethod
    def validate_available_discounts(cls, v: List[float]) -> List[float]:
        if not v:
            raise ValueError("available_discounts cannot be empty.")
        clean_discounts = []
        for d in v:
            if not math.isfinite(d) or math.isnan(d):
                raise ValueError(f"Discount value {d} must be a finite number.")
            if d <= 0:
                raise ValueError(f"Treatment discount level {d} must be strictly positive.")
            clean_discounts.append(float(d))
        return clean_discounts

    @field_validator("customer_ids")
    @classmethod
    def validate_customer_ids(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return None
        if len(v) == 0:
            raise ValueError("customer_ids cannot be an empty list when provided.")
        seen = set()
        clean_ids = []
        for cid in v:
            clean_id = str(cid).strip()
            if not clean_id:
                raise ValueError("customer_ids cannot contain empty or blank strings.")
            if clean_id not in seen:
                seen.add(clean_id)
                clean_ids.append(clean_id)
        return clean_ids


class CustomerAllocation(BaseModel):
    customer_id: str = Field(description="Customer identifier")
    assigned_discount: float = Field(ge=0, description="Recommended discount treatment amount")
    cost: float = Field(ge=0, description="Direct subsidy cost of offering the assigned discount")
    expected_uplift: Optional[float] = Field(default=0.0, description="Incremental uplift for assigned discount")


class OptimizationSummary(BaseModel):
    total_customers: int = Field(ge=0, description="Total candidates evaluated")
    treated_customers: int = Field(ge=0, description="Total customers receiving positive discount")
    control_customers: int = Field(ge=0, description="Total customers assigned to baseline control (0%)")
    discount_breakdown: Dict[str, int] = Field(default_factory=dict, description="Counts per discount level")


class OptimizationResultData(BaseModel):
    optimization_id: str = Field(description="Unique identifier for the optimization run")
    status: str = Field(description="Solver execution status: FEASIBLE, INFEASIBLE_INSUFFICIENT_BUDGET, SOLVER_FAILURE")
    is_mock: bool = Field(default=False, description="Explicit flag indicating mock/scaffold result vs real solver execution")
    solver_message: str = Field(default="", description="Diagnostic message from SciPy solver")
    total_budget: float = Field(ge=0, description="Total budget allocated to the optimization problem")
    total_spend: float = Field(ge=0, description="Total budget spent across allocated customers")
    unused_budget: float = Field(ge=0, description="Remaining unallocated budget")
    unallocated_budget: float = Field(ge=0, description="Remaining unallocated budget (contract alias)")
    objective_value: float = Field(description="Evaluated objective value")
    total_expected_uplift: float = Field(description="Total expected incremental conversions / uplift")
    allocated_customers_count: int = Field(ge=0, description="Number of customers receiving a discount")
    allocation: List[CustomerAllocation] = Field(description="Customer-level allocation recommendations")
    allocations: List[CustomerAllocation] = Field(default_factory=list, description="Customer allocations (contract alias)")
    summary: Optional[OptimizationSummary] = Field(default=None, description="Cohort treatment breakdown summary")
    limitations: List[str] = Field(default_factory=list, description="Causal and optimization evaluation caveats")
