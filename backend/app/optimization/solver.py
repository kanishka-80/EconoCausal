"""Core mathematical optimization solver using SciPy."""
from dataclasses import dataclass, field
import numpy as np
from scipy.optimize import LinearConstraint, milp, linprog


@dataclass
class SolverAllocationResult:
    status: str
    is_feasible: bool
    solver_message: str
    total_spend: float
    total_expected_uplift: float
    allocations: np.ndarray  # Shape (N, K): binary indicators or probabilities
    assigned_discounts: np.ndarray  # Shape (N,): selected discount level per customer
    unallocated_budget: float = 0.0


def solve_budget_constrained_allocation(
    uplift_matrix: np.ndarray,
    discount_levels: list[float],
    budget: float,
) -> SolverAllocationResult:
    """
    Solves the budget-constrained multi-treatment allocation problem.

    Args:
        uplift_matrix: Shape (N, K), where N is number of customers,
                       K is number of non-zero discount options.
                       Each entry (i, k) is the predicted CATE (tau_hat).
        discount_levels: List of K positive discount values (e.g. [5.0, 10.0, 20.0]).
        budget: Total financial subsidy budget limit (float).

    Returns:
        SolverAllocationResult containing allocation matrix, spend, and feasibility.
    """
    # 1. Validation & Input Sanitization
    if not isinstance(uplift_matrix, np.ndarray):
        uplift_matrix = np.asarray(uplift_matrix, dtype=float)

    if uplift_matrix.ndim != 2:
        raise ValueError(f"uplift_matrix must be 2-dimensional (N, K), got shape {uplift_matrix.shape}")

    N, K = uplift_matrix.shape
    if N == 0:
        raise ValueError("uplift_matrix cannot have 0 customer rows")
    if K == 0 or len(discount_levels) != K:
        raise ValueError(f"discount_levels length ({len(discount_levels)}) must match columns of uplift_matrix ({K})")

    if not np.all(np.isfinite(uplift_matrix)):
        raise ValueError("uplift_matrix contains non-finite (NaN or Inf) values")

    if budget < 0:
        raise ValueError("budget must be non-negative")

    discounts = np.asarray(discount_levels, dtype=float)
    if np.any(discounts <= 0):
        raise ValueError("All discount levels in optimization must be strictly positive (control 0% is implicit)")

    # 2. Check for Insufficient Budget (Trivial Infeasibility)
    min_possible_cost = np.min(discounts)
    if budget < min_possible_cost:
        return SolverAllocationResult(
            status="INFEASIBLE_INSUFFICIENT_BUDGET",
            is_feasible=False,
            solver_message=f"Budget {budget:.2f} is insufficient to fund the minimum offer ({min_possible_cost:.2f}).",
            total_spend=0.0,
            total_expected_uplift=0.0,
            allocations=np.zeros((N, K), dtype=float),
            assigned_discounts=np.zeros(N, dtype=float),
            unallocated_budget=float(budget),
        )

    # 3. Flatten variables: x has length N * K
    # Variable index (i * K + k) corresponds to customer i getting discount k
    c = -uplift_matrix.flatten()  # We minimize -uplift to maximize uplift

    # 4. Formulate Budget Constraint: sum_{i, k} (discount_k * x_{i,k}) <= budget
    budget_row = np.tile(discounts, N)

    # 5. Formulate Mutual Exclusivity: for each customer i, sum_k x_{i,k} <= 1
    # We construct a sparse-like row matrix for each customer
    customer_rows = np.zeros((N, N * K), dtype=float)
    for i in range(N):
        customer_rows[i, i * K : (i + 1) * K] = 1.0

    # Combine constraints: (1 budget row + N customer rows)
    A = np.vstack([budget_row, customer_rows])
    lhs = np.zeros(1 + N)
    rhs = np.concatenate([[budget], np.ones(N)])

    # Variable bounds: 0 <= x <= 1
    integrality = np.ones(N * K)  # 1 indicates binary integer variable in scipy.optimize.milp

    try:
        constraints = LinearConstraint(A, lhs, rhs)
        res = milp(c=c, integrality=integrality, constraints=constraints)
    except Exception:
        # Fallback to linprog with integrality for compatibility
        res = linprog(c=c, A_ub=A, b_ub=rhs, integrality=1, method="highs")

    if not res.success:
        return SolverAllocationResult(
            status="SOLVER_FAILURE",
            is_feasible=False,
            solver_message=f"Solver did not converge: {res.message}",
            total_spend=0.0,
            total_expected_uplift=0.0,
            allocations=np.zeros((N, K), dtype=float),
            assigned_discounts=np.zeros(N, dtype=float),
            unallocated_budget=float(budget),
        )

    # Reshape allocation solution back to (N, K)
    allocation_matrix = np.clip(res.x.reshape((N, K)), 0.0, 1.0)
    # Binary thresholding for integer safety
    allocation_matrix = (allocation_matrix > 0.5).astype(float)

    # Calculate actual spend and uplift
    customer_spend = allocation_matrix @ discounts
    total_spend = float(np.sum(customer_spend))
    total_expected_uplift = float(np.sum(allocation_matrix * uplift_matrix))

    # Determine assigned discount per customer (0.0 if not treated)
    assigned_discounts = np.zeros(N, dtype=float)
    for i in range(N):
        chosen_k = np.where(allocation_matrix[i] == 1.0)[0]
        if len(chosen_k) > 0:
            assigned_discounts[i] = discounts[chosen_k[0]]

    return SolverAllocationResult(
        status="FEASIBLE",
        is_feasible=True,
        solver_message="Optimization converged successfully via SciPy.",
        total_spend=round(total_spend, 2),
        total_expected_uplift=round(total_expected_uplift, 4),
        allocations=allocation_matrix,
        assigned_discounts=assigned_discounts,
        unallocated_budget=round(float(budget - total_spend), 2),
    )
