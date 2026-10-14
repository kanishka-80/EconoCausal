from typing import List, Optional
from pydantic import BaseModel, Field


class OptimizationRequest(BaseModel):
    budget: float = Field(gt=0, description="Total budget constraint; must be strictly positive")
    available_discounts: List[float] = Field(min_length=1, description="List of supported discount offer values")
    customer_ids: List[str] = Field(min_length=1, description="List of target customer identifiers to allocate across")
    objective: str = Field(default="maximize_revenue", description="Optimization objective (pending team freeze: maximize_revenue or maximize_profit)")


class CustomerAllocation(BaseModel):
    customer_id: str = Field(description="Customer identifier")
    assigned_discount: float = Field(ge=0, description="Recommended discount treatment amount")
    cost: float = Field(ge=0, description="Direct cost of offering the assigned discount")


class OptimizationResultData(BaseModel):
    optimization_id: str = Field(description="Unique identifier for the optimization run")
    status: str = Field(default="SCAFFOLD_MOCK", description="Solver execution status: SCAFFOLD_MOCK, COMPLETED, INFEASIBLE")
    is_mock: bool = Field(default=True, description="Explicit flag indicating mock/scaffold result for Week 1")
    total_spend: float = Field(ge=0, description="Total budget spent across allocated customers")
    unused_budget: float = Field(ge=0, description="Remaining unallocated budget")
    objective_value: float = Field(description="Evaluated objective value")
    allocated_customers_count: int = Field(ge=0, description="Number of customers receiving a discount")
    allocation: List[CustomerAllocation] = Field(description="Customer-level allocation recommendations")
