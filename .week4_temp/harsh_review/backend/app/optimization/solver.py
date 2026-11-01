"""Core mathematical optimization solver using SciPy."""
from dataclasses import dataclass, field
from typing import List
import numpy as np
import scipy.sparse as sp
from scipy.optimize import LinearConstraint, milp, linprog


@dataclass
class SolverAllocationResult:
    status: str
    is_feasible: bool
    total_spend: float
    total_expected_uplift: float
    unallocated_budget: float
    allocations: np.ndarray  # Shape (N, K) binary
    assigned_discounts: np.ndarray  # Shape (N,)
    solver_message: str = ""


def solve_budget_constrained_allocation(
    uplift_matrix: np.ndarray,
    discount_levels: List[float],
    budget: float,
) -> SolverAllocationResult:
    """
    Solves binary knapsack with mutual exclusivity:
        max sum_{i, k} uplift_{i,k} * x_{i,k}
        s.t. sum_{i, k} discount_k * x_{i,k} <= budget
             sum_k x_{i,k} <= 1 for all i
             x_{i,k} in {0, 1}
    """
    # 1. Validate inputs
    if uplift_matrix.ndim != 2:
        raise ValueError("uplift_matrix must be a 2D numpy array.")
    N, K = uplift_matrix.shape
    if N == 0:
        raise ValueError("uplift_matrix has 0 customer rows.")
    if len(discount_levels) != K:
        raise ValueError(f"discount_levels length ({len(discount_levels)}) must match columns ({K}).")
    if not np.all(np.isfinite(uplift_matrix)):
        raise ValueError("uplift_matrix contains non-finite (NaN/Inf) values.")

    discounts = np.array(discount_levels, dtype=float)
    if np.any(discounts <= 0.0):
        raise ValueError("All treatment discount levels must be strictly positive.")

    # 2. Check for zero or insufficient budget
    min_possible_cost = np.min(discounts)
    if budget < min_possible_cost:
        return SolverAllocationResult(
            status="INFEASIBLE_INSUFFICIENT_BUDGET",
            is_feasible=False,
            total_spend=0.0,
            total_expected_uplift=0.0,
            unallocated_budget=float(budget),
            allocations=np.zeros((N, K), dtype=float),
            assigned_discounts=np.zeros(N, dtype=float),
            solver_message="Available budget is smaller than the minimum positive discount.",
        )

    # 3. Objective formulation: SciPy milp minimizes, so c = -uplift
    c = -uplift_matrix.flatten()

    # 4. Formulate Budget Constraint as sparse row: sum_{i, k} (discount_k * x_{i,k}) <= budget
    budget_row = sp.csr_matrix(np.tile(discounts, N).reshape(1, -1))

    # 5. Formulate Mutual Exclusivity: for each customer i, sum_k x_{i,k} <= 1
    # Constructed efficiently via sparse block diagonal / repeat
    row_ind = np.repeat(np.arange(N), K)
    col_ind = np.arange(N * K)
    data = np.ones(N * K, dtype=float)
    customer_rows = sp.csr_matrix((data, (row_ind, col_ind)), shape=(N, N * K))

    # Combine constraints: (1 budget row + N customer rows)
    A_sparse = sp.vstack([budget_row, customer_rows], format="csc")
    lhs = np.zeros(1 + N)
    rhs = np.concatenate([[budget], np.ones(N)])

    # Variable bounds: 0 <= x <= 1, binary integrality
    integrality = np.ones(N * K)

    try:
        constraints = LinearConstraint(A_sparse, lhs, rhs)
        res = milp(c=c, integrality=integrality, constraints=constraints)
    except Exception:
        # Fallback to highs linear programming
        res = linprog(c=c, A_ub=A_sparse, b_ub=rhs, integrality=1, method="highs")

    if not res.success or res.x is None:
        return SolverAllocationResult(
            status="SOLVER_FAILURE",
            is_feasible=False,
            total_spend=0.0,
            total_expected_uplift=0.0,
            unallocated_budget=float(budget),
            allocations=np.zeros((N, K), dtype=float),
            assigned_discounts=np.zeros(N, dtype=float),
            solver_message=str(getattr(res, "message", "Optimization terminated without feasible solution.")),
        )

    # 6. Extract solution
    alloc_flat = np.where(res.x > 0.5, 1.0, 0.0)
    allocations = alloc_flat.reshape((N, K))

    # Compute assigned discounts
    assigned_discounts = np.zeros(N, dtype=float)
    for k_idx, d in enumerate(discounts):
        assigned_discounts[allocations[:, k_idx] == 1.0] = d

    # Zero-out treatments for customers with non-positive uplift
    for i in range(N):
        chosen_k = np.where(allocations[i, :] == 1.0)[0]
        if len(chosen_k) > 0 and uplift_matrix[i, chosen_k[0]] <= 0.0:
            allocations[i, chosen_k[0]] = 0.0
            assigned_discounts[i] = 0.0

    total_spend = float(np.sum(allocations * discounts))
    total_uplift = float(np.sum(allocations * uplift_matrix))
    unallocated_budget = max(0.0, round(budget - total_spend, 2))

    return SolverAllocationResult(
        status="FEASIBLE",
        is_feasible=True,
        total_spend=round(total_spend, 2),
        total_expected_uplift=round(total_uplift, 4),
        unallocated_budget=unallocated_budget,
        allocations=allocations,
        assigned_discounts=assigned_discounts,
        solver_message=str(getattr(res, "message", "Optimal solution found.")),
    )
