
import pytest

from backend.app.causal.refutation import (
    REFUTATION_METHODS,
    format_refutation_result,
    get_refutation_plan,
)


def test_refutation_plan_has_expected_methods():
    plan = get_refutation_plan()

    assert plan["methods"] == list(REFUTATION_METHODS)
    assert plan["causal_claim_proven"] is False
    assert "status" in plan
    assert "dependency_available" in plan


def test_refutation_plan_does_not_claim_checks_ran():
    plan = get_refutation_plan()

    assert plan["status"] in {"ready", "dependency_missing"}


def test_format_refutation_result():
    result = format_refutation_result(
        check_name="random_common_cause",
        status="passed",
        result={"details": "test result"},
        interpretation="Diagnostic check completed.",
        limitations="Does not prove causality.",
    )

    assert result["check_name"] == "random_common_cause"
    assert result["status"] == "passed"
    assert result["result"] == {"details": "test result"}
    assert result["causal_claim_proven"] if "causal_claim_proven" in result else True
    assert result["limitations"] == "Does not prove causality."


def test_unsupported_refutation_method_is_rejected():
    with pytest.raises(ValueError):
        format_refutation_result(
            check_name="unknown_method",
            status="passed",
        )


def test_unsupported_status_is_rejected():
    with pytest.raises(ValueError):
        format_refutation_result(
            check_name="random_common_cause",
            status="unknown",
        )
