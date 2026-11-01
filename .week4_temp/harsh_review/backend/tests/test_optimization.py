import numpy as np
import pytest
from pydantic import ValidationError
from backend.app.optimization.solver import (
    solve_budget_constrained_allocation,
    SolverAllocationResult,
)
from backend.app.optimization.objective import compute_total_uplift
from backend.app.optimization.constraints import calculate_total_subsidy
from backend.app.services.optimization_service import optimization_service
from backend.app.schemas.optimization import OptimizationRequest


# ---------------------------------------------------------------------------
# 1. Budget Feasibility & Independent Verification Tests
# ---------------------------------------------------------------------------

def test_independent_budget_feasibility_check():
    """Verify that returned allocations independently satisfy budget ceiling."""
    np.random.seed(101)
    N, K = 25, 3
    discounts = [5.0, 10.0, 20.0]
    uplift = np.random.uniform(0.01, 0.20, size=(N, K))
    budget = 125.0

    result = solve_budget_constrained_allocation(uplift, discounts, budget)

    assert result.is_feasible is True
    assert result.status == "FEASIBLE"

    # Independent mathematical verification
    independent_spend = calculate_total_subsidy(result.allocations, discounts)
    independent_uplift = compute_total_uplift(result.allocations, uplift)

    assert independent_spend <= budget + 1e-6
    assert abs(result.total_spend - independent_spend) < 1e-2
    assert abs(result.total_expected_uplift - independent_uplift) < 1e-2
    assert result.unallocated_budget == pytest.approx(budget - independent_spend, abs=1e-2)


def test_hand_calculated_deterministic_optimum():
    """Verify solver against an analytical, manually solved optimum."""
    # Customer 0: 10% -> 0.05, 20% -> 0.25 (Efficiencies: 0.005, 0.0125)
    # Customer 1: 10% -> 0.12, 20% -> 0.14 (Efficiencies: 0.012, 0.007)
    uplift = np.array([
        [0.05, 0.25],
        [0.12, 0.14],
    ])
    discounts = [10.0, 20.0]
    budget = 30.0  # Exactly enough for Customer 0 on 20% and Customer 1 on 10%

    result = solve_budget_constrained_allocation(uplift, discounts, budget)

    assert result.is_feasible is True
    assert result.total_spend == 30.0
    assert result.unallocated_budget == 0.0
    assert result.total_expected_uplift == pytest.approx(0.37, abs=1e-4)

    # Customer 0 gets 20% (index 1), Customer 1 gets 10% (index 0)
    assert result.assigned_discounts[0] == 20.0
    assert result.assigned_discounts[1] == 10.0
    assert result.allocations[0, 1] == 1.0
    assert result.allocations[1, 0] == 1.0


# ---------------------------------------------------------------------------
# 2. Eligibility & Mutual Exclusivity Tests
# ---------------------------------------------------------------------------

def test_mutual_exclusivity_strictly_enforced():
    """Verify each customer receives at most one non-zero discount offer."""
    np.random.seed(202)
    N, K = 50, 3
    discounts = [5.0, 10.0, 20.0]
    # Generous budget so all customers could receive an offer
    uplift = np.random.uniform(0.05, 0.30, size=(N, K))
    budget = 1000.0

    result = solve_budget_constrained_allocation(uplift, discounts, budget)

    assert result.is_feasible is True
    # Row-sum across treatment columns must be <= 1.0 for every customer
    row_sums = np.sum(result.allocations, axis=1)
    assert np.all(row_sums <= 1.0 + 1e-6)
    assert np.all((result.allocations == 0.0) | (result.allocations == 1.0))


def test_zero_allocation_when_uplift_is_non_positive():
    """Verify customers with zero or negative uplift receive 0% discount."""
    uplift = np.array([
        [-0.05, -0.01],  # Detractor
        [0.00, 0.00],    # Neutral
    ])
    discounts = [10.0, 20.0]
    budget = 100.0

    result = solve_budget_constrained_allocation(uplift, discounts, budget)

    assert result.is_feasible is True
    assert result.total_spend == 0.0
    assert np.all(result.assigned_discounts == 0.0)
    assert np.all(result.allocations == 0.0)


# ---------------------------------------------------------------------------
# 3. Edge Cases & Boundary Handling
# ---------------------------------------------------------------------------

def test_zero_budget_handled_as_insufficient():
    """Verify zero budget produces explicit infeasible status with 0 spend."""
    uplift = np.array([[0.10, 0.20]])
    discounts = [10.0, 20.0]
    result = solve_budget_constrained_allocation(uplift, discounts, budget=0.0)

    assert result.is_feasible is False
    assert result.status == "INFEASIBLE_INSUFFICIENT_BUDGET"
    assert result.total_spend == 0.0
    assert result.unallocated_budget == 0.0
    assert np.all(result.assigned_discounts == 0.0)


def test_budget_smaller_than_min_discount():
    """Verify budget below min discount level results in INFEASIBLE_INSUFFICIENT_BUDGET."""
    uplift = np.array([[0.15, 0.30], [0.10, 0.20]])
    discounts = [10.0, 20.0]
    result = solve_budget_constrained_allocation(uplift, discounts, budget=8.5)

    assert result.is_feasible is False
    assert result.status == "INFEASIBLE_INSUFFICIENT_BUDGET"
    assert result.total_spend == 0.0
    assert result.unallocated_budget == 8.5


def test_reject_empty_candidate_matrix():
    """Verify ValueError is raised on 0-length customer rows."""
    with pytest.raises(ValueError, match="0 customer rows"):
        solve_budget_constrained_allocation(np.empty((0, 2)), [10.0, 20.0], 50.0)


def test_reject_infinite_estimates():
    """Verify solver rejects inf and -inf values."""
    with pytest.raises(ValueError, match="non-finite"):
        solve_budget_constrained_allocation(np.array([[np.inf, 0.1]]), [10.0, 20.0], 50.0)

    with pytest.raises(ValueError, match="non-finite"):
        solve_budget_constrained_allocation(np.array([[-np.inf, 0.1]]), [10.0, 20.0], 50.0)


def test_reject_negative_or_zero_treatment_discount_values():
    """Verify positive discount requirement."""
    with pytest.raises(ValueError, match="strictly positive"):
        solve_budget_constrained_allocation(np.array([[0.1, 0.2]]), [0.0, 10.0], 50.0)

    with pytest.raises(ValueError, match="strictly positive"):
        solve_budget_constrained_allocation(np.array([[0.1, 0.2]]), [-5.0, 10.0], 50.0)


# ---------------------------------------------------------------------------
# 4. Determinism & Input Immutability Tests
# ---------------------------------------------------------------------------

def test_solver_determinism_and_input_immutability():
    """Verify identical inputs produce identical allocations without mutating inputs."""
    uplift = np.array([
        [0.08, 0.14],
        [0.04, 0.19],
        [0.11, 0.12],
    ])
    uplift_copy = uplift.copy()
    discounts = [10.0, 20.0]
    budget = 40.0

    res1 = solve_budget_constrained_allocation(uplift, discounts, budget)
    res2 = solve_budget_constrained_allocation(uplift, discounts, budget)

    # Assert input array was not modified
    np.testing.assert_array_equal(uplift, uplift_copy)

    # Assert exact deterministic outputs
    assert res1.status == res2.status
    assert res1.total_spend == res2.total_spend
    assert res1.total_expected_uplift == res2.total_expected_uplift
    np.testing.assert_array_equal(res1.allocations, res2.allocations)
    np.testing.assert_array_equal(res1.assigned_discounts, res2.assigned_discounts)


# ---------------------------------------------------------------------------
# 5. Service Layer Integration Tests
# ---------------------------------------------------------------------------

def test_optimization_service_solver_execution():
    """Verify service formats output and executes real SciPy allocation."""
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
