import uuid
import numpy as np
from fastapi import HTTPException, status
from backend.app.schemas.optimization import (
    CustomerAllocation,
    OptimizationRequest,
    OptimizationResultData,
)
from backend.app.optimization.solver import solve_budget_constrained_allocation


class OptimizationService:
    """Service orchestrating budget-constrained causal recommendations."""

    def run_optimization(self, payload: OptimizationRequest) -> OptimizationResultData:
        """Preserves existing scaffold endpoint behavior for active API tests."""
        if payload.budget <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_BUDGET",
                    "message": "Budget must be greater than zero.",
                    "details": [],
                },
            )

        if not payload.available_discounts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "EMPTY_DISCOUNTS",
                    "message": "At least one available discount level must be provided.",
                    "details": [],
                },
            )

        if not payload.customer_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "EMPTY_CUSTOMERS",
                    "message": "At least one customer ID must be provided.",
                    "details": [],
                },
            )

        opt_id = f"opt-{uuid.uuid4().hex[:8]}"
        min_discount = min(payload.available_discounts)
        mock_allocations = []
        current_spend = 0.0

        for cust_id in payload.customer_ids:
            if current_spend + min_discount <= payload.budget:
                mock_allocations.append(
                    CustomerAllocation(
                        customer_id=cust_id,
                        assigned_discount=min_discount,
                        cost=min_discount,
                    )
                )
                current_spend += min_discount
            else:
                break

        return OptimizationResultData(
            optimization_id=opt_id,
            status="SCAFFOLD_MOCK",
            is_mock=True,
            total_spend=current_spend,
            unused_budget=max(payload.budget - current_spend, 0.0),
            objective_value=current_spend * 1.5,
            allocated_customers_count=len(mock_allocations),
            allocation=mock_allocations,
        )

    def run_solver(self, payload: OptimizationRequest) -> OptimizationResultData:
        """Executes core SciPy solver for Day 16 engine implementation."""
        customer_ids = payload.customer_ids or [f"cust-{i+1}" for i in range(10)]
        N = len(customer_ids)

        positive_discounts = sorted([d for d in payload.available_discounts if d > 0])
        if not positive_discounts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_DISCOUNTS",
                    "message": "Available discounts must include at least one positive discount level.",
                    "details": [],
                },
            )

        K = len(positive_discounts)

        # Deterministic synthetic test estimates per customer
        np.random.seed(42)
        uplift_matrix = np.zeros((N, K), dtype=float)
        for k_idx, disc in enumerate(positive_discounts):
            base_effect = (disc / 100.0) * 0.4
            uplift_matrix[:, k_idx] = base_effect + np.linspace(0.01, 0.08, N)

        result = solve_budget_constrained_allocation(
            uplift_matrix=uplift_matrix,
            discount_levels=positive_discounts,
            budget=payload.budget,
        )

        allocations = []
        discount_breakdown = {str(d): 0 for d in [0.0] + positive_discounts}

        for i, cust_id in enumerate(customer_ids):
            assigned_d = float(result.assigned_discounts[i])
            discount_breakdown[str(assigned_d)] = discount_breakdown.get(str(assigned_d), 0) + 1

            allocations.append(
                CustomerAllocation(
                    customer_id=cust_id,
                    assigned_discount=assigned_d,
                    cost=assigned_d,
                )
            )

        treated_count = sum(count for d, count in discount_breakdown.items() if float(d) > 0)
        opt_id = f"opt-{uuid.uuid4().hex[:8]}"

        return OptimizationResultData(
            optimization_id=opt_id,
            status=result.status,
            is_mock=False,
            total_spend=result.total_spend,
            unused_budget=result.unallocated_budget,
            objective_value=result.total_expected_uplift,
            allocated_customers_count=treated_count,
            allocation=allocations,
        )


optimization_service = OptimizationService()
