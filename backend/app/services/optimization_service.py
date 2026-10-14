import uuid
from fastapi import HTTPException, status
from backend.app.schemas.optimization import (
    CustomerAllocation,
    OptimizationRequest,
    OptimizationResultData,
)


class OptimizationService:
    def run_optimization(self, payload: OptimizationRequest) -> OptimizationResultData:
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

        # Controlled mock allocation for Week 1 Day 5
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


optimization_service = OptimizationService()
