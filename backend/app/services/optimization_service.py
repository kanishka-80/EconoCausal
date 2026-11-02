import os
import uuid
import logging
from typing import List, Tuple, Optional
import numpy as np
import pandas as pd
from fastapi import HTTPException, status

from backend.app.schemas.optimization import (
    OptimizationRequest,
    OptimizationResultData,
    CustomerAllocation,
    OptimizationSummary,
)
from backend.app.optimization.solver import solve_budget_constrained_allocation

logger = logging.getLogger("econocausal.services.optimization")


class OptimizationService:
    UPLIFT_CSV_PATH = "reports/customer_uplift_matrix.csv"

    def _load_estimates(
        self,
        customer_ids: List[str],
        positive_discounts: List[float],
    ) -> Tuple[List[str], np.ndarray]:
        """Loads and aligns real CATE estimates strictly from Ritik's DML uplift matrix."""
        # 1. Validate supported discounts align with available estimates
        supported_treatments = {5.0: "uplift_5", 10.0: "uplift_10", 20.0: "uplift_20"}
        for d in positive_discounts:
            if d not in supported_treatments:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "UNSUPPORTED_DISCOUNT",
                        "message": f"Discount level {d} is not supported. Supported positive discounts are: [5.0, 10.0, 20.0]",
                        "details": [],
                    },
                )

        target_cols = [supported_treatments[d] for d in positive_discounts]

        # 2. Check missing CSV artifact -> returns MISSING_CUSTOMER_ESTIMATES
        if not os.path.exists(self.UPLIFT_CSV_PATH):
            logger.error(f"Required DML estimates file not found at {self.UPLIFT_CSV_PATH}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "MISSING_CUSTOMER_ESTIMATES",
                    "message": f"DML estimates artifact '{self.UPLIFT_CSV_PATH}' is missing. Synthetic fallbacks are disabled.",
                    "details": [],
                },
            )

        df = pd.read_csv(self.UPLIFT_CSV_PATH)
        df["customer_id_str"] = df["customer_id"].astype(str)

        # 3. Detect duplicate customer IDs in CSV
        if df["customer_id_str"].duplicated().any():
            duplicate_ids = df[df["customer_id_str"].duplicated()]["customer_id_str"].tolist()
            logger.warning(f"Duplicate customer IDs detected in CSV: {duplicate_ids[:10]}. Deduplicating by keeping first instance.")
            df = df.drop_duplicates(subset=["customer_id_str"], keep="first")

        df_indexed = df.set_index("customer_id_str")

        # 4. Check requested customer IDs -> returns ESTIMATES_NOT_FOUND if missing
        str_ids = [str(cid) for cid in customer_ids]
        missing_ids = [cid for cid in str_ids if cid not in df_indexed.index]
        if missing_ids:
            logger.error(f"Requested customer IDs not found in real DML matrix: {missing_ids[:10]}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "ESTIMATES_NOT_FOUND",
                    "message": f"{len(missing_ids)} requested customer ID(s) do not exist in the DML uplift matrix.",
                    "details": missing_ids[:10],
                },
            )

        # 5. Extract aligned slice for optimizer
        subset = df_indexed.loc[str_ids, target_cols]
        uplift_matrix = subset.to_numpy(dtype=float)

        if not np.all(np.isfinite(uplift_matrix)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INCOMPATIBLE_ESTIMATES",
                    "message": "Model estimates contain missing or non-finite values.",
                    "details": [],
                },
            )

        return str_ids, uplift_matrix

    def run_optimization(self, payload: OptimizationRequest) -> OptimizationResultData:
        """Executes budget-constrained promotional optimization via SciPy MILP/HiGHS."""
        # 1. Input Validation
        if payload.budget <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "code": "VALIDATION_ERROR",
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

        positive_discounts = [d for d in payload.available_discounts if d > 0.0]
        if not positive_discounts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "NO_POSITIVE_DISCOUNTS",
                    "message": "At least one positive treatment discount level must be specified.",
                    "details": [],
                },
            )

        # 2. Determine target customer cohort
        if payload.customer_ids:
            target_ids = payload.customer_ids
        else:
            if not os.path.exists(self.UPLIFT_CSV_PATH):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "MISSING_CUSTOMER_ESTIMATES",
                        "message": f"DML estimates file '{self.UPLIFT_CSV_PATH}' is missing.",
                        "details": [],
                    },
                )
            df = pd.read_csv(self.UPLIFT_CSV_PATH, usecols=["customer_id"])
            target_ids = df["customer_id"].astype(str).tolist()

        # 3. Load aligned estimates strictly from DML output
        candidate_ids, uplift_matrix = self._load_estimates(target_ids, positive_discounts)

        # 4. Invoke SciPy Solver
        solver_res = solve_budget_constrained_allocation(
            uplift_matrix=uplift_matrix,
            discount_levels=positive_discounts,
            budget=payload.budget,
        )

        # 5. Format Allocations
        allocations: List[CustomerAllocation] = []
        discount_breakdown = {"0.0": 0}
        for d in positive_discounts:
            discount_breakdown[str(d)] = 0

        treated_count = 0
        for i, cid in enumerate(candidate_ids):
            assigned_d = float(solver_res.assigned_discounts[i])
            chosen_k = np.where(solver_res.allocations[i, :] == 1.0)[0]
            expected_u = float(uplift_matrix[i, chosen_k[0]]) if len(chosen_k) > 0 else 0.0

            if assigned_d > 0.0:
                treated_count += 1
                cost = assigned_d
            else:
                cost = 0.0

            discount_breakdown[str(assigned_d)] = discount_breakdown.get(str(assigned_d), 0) + 1

            allocations.append(
                CustomerAllocation(
                    customer_id=cid,
                    assigned_discount=assigned_d,
                    cost=cost,
                    expected_uplift=round(expected_u, 4),
                )
            )

        summary = OptimizationSummary(
            total_customers=len(candidate_ids),
            treated_customers=treated_count,
            control_customers=len(candidate_ids) - treated_count,
            discount_breakdown=discount_breakdown,
        )

        limitations = [
            "Estimates rely on conditional unconfoundedness; unobserved confounding cannot be ruled out.",
            "Optimized allocations represent model-guided recommendations, not guaranteed business outcomes.",
            "Refutation checks are descriptive and do not prove causal identification.",
            "Cost estimations assume fixed unit discount subsidies per treated individual.",
        ]

        return OptimizationResultData(
            optimization_id=f"opt-{uuid.uuid4().hex[:8]}",
            status=solver_res.status,
            is_mock=False,
            solver_message=solver_res.solver_message,
            total_budget=round(payload.budget, 2),
            total_spend=round(solver_res.total_spend, 2),
            unused_budget=round(solver_res.unallocated_budget, 2),
            unallocated_budget=round(solver_res.unallocated_budget, 2),
            objective_value=round(solver_res.total_expected_uplift, 4),
            total_expected_uplift=round(solver_res.total_expected_uplift, 4),
            allocated_customers_count=treated_count,
            allocation=allocations,
            allocations=allocations,
            summary=summary,
            limitations=limitations,
        )


optimization_service = OptimizationService()
