import numpy as np
import pytest
from pydantic import ValidationError
from backend.app.optimization.solver import solve_budget_constrained_allocation
from backend.app.services.optimization_service import optimization_service
from backend.app.schemas.optimization import OptimizationRequest


def test_scipy_solver_binding_budget():
    """Verify solver allocates discounts within exact budget limit."""
    uplift = np.array([
        [0.05, 0.15],
        [0.12, 0.14],
        [0.01, 0.02],
    ])
    discounts = [10.0, 20.0]
    budget = 25.0

    result = solve_budget_constrained_allocation(uplift, discounts, budget)

    assert result.is_feasible is True
    assert result.status == "FEASIBLE"
    assert result.total_spend <= budget
    assert result.unallocated_budget >= 0.0
    assert np.all(np.sum(result.allocations, axis=1) <= 1.0)


def test_scipy_solver_infeasible_insufficient_budget():
    """Verify solver detects when budget cannot afford the minimum offer."""
    uplift = np.array([[0.10, 0.20]])
    discounts = [10.0, 20.0]
    budget = 5.0

    result = solve_budget_constrained_allocation(uplift, discounts, budget)

    assert result.is_feasible is False
    assert result.status == "INFEASIBLE_INSUFFICIENT_BUDGET"
    assert result.total_spend == 0.0
    assert np.all(result.assigned_discounts == 0.0)


def test_scipy_solver_rejects_invalid_inputs():
    """Verify solver input validation for non-finite values and shape mismatches."""
    with pytest.raises(ValueError, match="non-finite"):
        solve_budget_constrained_allocation(
            np.array([[np.nan, 0.1]]), [10.0, 20.0], 50.0
        )

    with pytest.raises(ValueError, match="discount_levels length"):
        solve_budget_constrained_allocation(
            np.array([[0.1, 0.2]]), [10.0], 50.0
        )


def test_optimization_service_solver_execution():
    """Verify service can execute real SciPy solver when requested."""
    req = OptimizationRequest(
        budget=100.0,
        available_discounts=[5.0, 10.0, 20.0],
        customer_ids=["c1", "c2", "c3", "c4", "c5"],
    )
    res = optimization_service.run_solver(req)

    assert res.is_mock is False
    assert res.status == "FEASIBLE"
    assert res.total_spend <= 100.0
    assert len(res.allocation) == 5
    assert res.allocated_customers_count <= 5


def test_optimization_service_rejects_negative_budget():
    """Verify Pydantic schema validation rejects negative budget."""
    with pytest.raises(ValidationError):
        OptimizationRequest(
            budget=-10.0,
            available_discounts=[10.0],
            customer_ids=["c1"],
        )
