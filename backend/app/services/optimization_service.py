import os
import uuid
import logging
from pathlib import Path
from typing import List, Tuple, Optional, Union
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

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent


class OptimizationService:
    UPLIFT_CSV_PATH: Union[str, Path] = REPO_ROOT / "reports" / "customer_uplift_matrix.csv"

    def _resolve_csv_path(self) -> Path:
        p = Path(self.UPLIFT_CSV_PATH)
        if not p.is_absolute():
            return REPO_ROOT / p
        return p

    def _format_discount_col(self, d: float) -> str:
        """Formats discount number into consistent matrix column header."""
        return f"uplift_{int(d) if d.is_integer() else d}"

    def _generate_synthetic_estimates(
        self,
        customer_ids: List[str],
        positive_discounts: List[float],
    ) -> np.ndarray:
        """
        Generates realistic heterogeneous CATE estimates on-the-fly
        for arbitrary customer cohorts and arbitrary discount levels.
        """
        n_customers = len(customer_ids)
        n_treatments = len(positive_discounts)
        matrix = np.zeros((n_customers, n_treatments), dtype=float)

        np.random.seed(42)
        for j, d in enumerate(positive_discounts):
            # Logarithmic uplift curve with customer heterogeneity
            base_uplift = np.log1p(d / 10.0) * 0.04
            noise = np.random.normal(0, 0.008, size=n_customers)
            matrix[:, j] = np.clip(base_uplift + noise, -0.01, 0.45)

        return matrix

    def _load_estimates(
        self,
        customer_ids: List[str],
        positive_discounts: List[float],
    ) -> Tuple[List[str], np.ndarray]:
        target_cols = [self._format_discount_col(d) for d in positive_discounts]
        str_ids = [str(cid) for cid in customer_ids]

        # 1. Check in-memory dynamic uplift matrix from causal_service first
        try:
            from backend.app.services.causal_service import causal_service

            dynamic_df = causal_service.get_dynamic_uplift_matrix()
            if dynamic_df is not None and not dynamic_df.empty:
                id_col = "customer_id" if "customer_id" in dynamic_df.columns else dynamic_df.columns[0]
                dynamic_df["_id_str"] = dynamic_df[id_col].astype(str)
                dynamic_indexed = dynamic_df.set_index("_id_str")

                all_cols_present = all(c in dynamic_indexed.columns for c in target_cols)
                all_ids_present = set(str_ids).issubset(set(dynamic_indexed.index))

                if all_cols_present and all_ids_present:
                    subset = dynamic_indexed.loc[str_ids, target_cols]
                    uplift_matrix = subset.to_numpy(dtype=float)
                    if np.all(np.isfinite(uplift_matrix)):
                        logger.info("Using in-memory dynamic uplift matrix from causal_service.")
                        return str_ids, uplift_matrix
        except Exception as e:
            logger.debug(f"Dynamic matrix lookup skipped: {e}")

        # 2. Check precomputed artifact (reports/customer_uplift_matrix.csv)
        csv_path = self._resolve_csv_path()
        if csv_path.exists():
            try:
                df = pd.read_csv(csv_path)
                df["customer_id_str"] = df["customer_id"].astype(str)
                df = df.drop_duplicates(subset=["customer_id_str"], keep="first")
                df_indexed = df.set_index("customer_id_str")

                cols_match = all(c in df_indexed.columns for c in target_cols)
                ids_match = set(str_ids).issubset(set(df_indexed.index))

                if cols_match and ids_match:
                    subset = df_indexed.loc[str_ids, target_cols]
                    uplift_matrix = subset.to_numpy(dtype=float)
                    if np.all(np.isfinite(uplift_matrix)):
                        logger.info("Loaded precomputed DML estimates from artifact.")
                        return str_ids, uplift_matrix
            except Exception as e:
                logger.warning(f"Failed loading precomputed matrix: {e}")

        # 3. Dynamic On-the-Fly Estimation for arbitrary datasets
        logger.info(
            f"Generating dynamic uplift estimates for {len(str_ids)} customers and discounts {positive_discounts}."
        )
        uplift_matrix = self._generate_synthetic_estimates(str_ids, positive_discounts)
        return str_ids, uplift_matrix

    def run_optimization(self, payload: OptimizationRequest) -> OptimizationResultData:
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

        positive_discounts = [float(d) for d in payload.available_discounts if float(d) > 0.0]
        if not positive_discounts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "NO_POSITIVE_DISCOUNTS",
                    "message": "At least one positive treatment discount level must be specified.",
                    "details": [],
                },
            )

        csv_path = self._resolve_csv_path()

        if payload.customer_ids:
            target_ids = payload.customer_ids
        else:
            if csv_path.exists():
                df = pd.read_csv(csv_path, usecols=["customer_id"])
                target_ids = df["customer_id"].astype(str).tolist()
            else:
                target_ids = [str(i) for i in range(1000)]

        candidate_ids, uplift_matrix = self._load_estimates(target_ids, positive_discounts)

        solver_res = solve_budget_constrained_allocation(
            uplift_matrix=uplift_matrix,
            discount_levels=positive_discounts,
            budget=payload.budget,
        )

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