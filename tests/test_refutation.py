
import pytest

import backend.app.causal.refutation as refutation_module

from backend.app.causal.refutation import (
    REFUTATION_METHODS,
    format_refutation_result,
    get_refutation_plan,
     run_refutation_checks,
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
    assert result["causal_claim_proven"] is False
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

def test_unsupported_status_is_supported_by_formatter():
    result = format_refutation_result(
        check_name="random_common_cause",
        status="unsupported",
        error="Missing optional dependency: dowhy",
    )

    assert result["status"] == "unsupported"
    assert result["error"] == "Missing optional dependency: dowhy"
    assert result["causal_claim_proven"] is False


def test_error_status_is_supported_by_formatter():
    result = format_refutation_result(
        check_name="placebo_treatment_refuter",
        status="error",
        error="RuntimeError: test failure",
    )

    assert result["status"] == "error"
    assert "RuntimeError" in result["error"]


def test_refutation_plan_describes_each_check():
    plan = get_refutation_plan()

    assert len(plan["checks"]) == len(REFUTATION_METHODS)
    assert [item["check_name"] for item in plan["checks"]] == list(
        REFUTATION_METHODS
    )
    assert all("configuration" in item for item in plan["checks"])

def test_run_refutation_checks_reports_missing_dependency(monkeypatch):
    monkeypatch.setattr(
        refutation_module,
        "_dowhy_available",
        lambda: False,
    )

    report = run_refutation_checks(
        causal_model=None,
        identified_estimand=None,
        estimate=None,
    )

    assert report["status"] == "unsupported"
    assert report["dependency_available"] is False
    assert report["checks_executed"] == 0
    assert report["causal_claim_proven"] is False
    assert set(report["results"]) == set(REFUTATION_METHODS)

    for result in report["results"].values():
        assert result["status"] == "unsupported"
        assert "dowhy" in result["error"]


def test_run_refutation_checks_continues_after_individual_error(monkeypatch):
    monkeypatch.setattr(
        refutation_module,
        "_dowhy_available",
        lambda: True,
    )

    class FakeCausalModel:
        def __init__(self):
            self.called_methods = []

        def refute_estimate(
            self,
            identified_estimand,
            estimate,
            method_name,
        ):
            self.called_methods.append(method_name)

            if method_name == "placebo_treatment_refuter":
                raise RuntimeError("simulated refutation failure")

            return f"Mock result for {method_name}"

    model = FakeCausalModel()

    report = run_refutation_checks(
        causal_model=model,
        identified_estimand="mock_estimand",
        estimate="mock_estimate",
    )

    assert report["status"] == "completed_with_errors"
    assert report["dependency_available"] is True
    assert report["checks_executed"] == 2
    assert report["causal_claim_proven"] is False

    assert model.called_methods == list(REFUTATION_METHODS)

    assert (
        report["results"]["random_common_cause"]["status"]
        == "completed"
    )
    assert (
        report["results"]["placebo_treatment_refuter"]["status"]
        == "error"
    )
    assert (
        report["results"]["data_subset_refuter"]["status"]
        == "completed"
    )

    assert "simulated refutation failure" in (
        report["results"]["placebo_treatment_refuter"]["error"]
    )

def test_run_refutation_checks_reports_error_when_all_checks_fail(monkeypatch):
    monkeypatch.setattr(
        refutation_module,
        "_dowhy_available",
        lambda: True,
    )

    class FailingCausalModel:
        def refute_estimate(
            self,
            identified_estimand,
            estimate,
            method_name,
        ):
            raise RuntimeError(f"{method_name} failed")

    report = run_refutation_checks(
        causal_model=FailingCausalModel(),
        identified_estimand="mock_estimand",
        estimate="mock_estimate",
    )

    assert report["status"] == "error"
    assert report["dependency_available"] is True
    assert report["checks_executed"] == 0
    assert report["causal_claim_proven"] is False

    for method in REFUTATION_METHODS:
        assert report["results"][method]["status"] == "error"
        assert method in report["results"][method]["error"]

def test_run_refutation_checks_handles_result_string_conversion_error(
    monkeypatch,
):
    monkeypatch.setattr(
        refutation_module,
        "_dowhy_available",
        lambda: True,
    )

    class UnprintableResult:
        def __str__(self):
            raise RuntimeError("string conversion failed")

    class FakeCausalModel:
        def refute_estimate(
            self,
            identified_estimand,
            estimate,
            method_name,
        ):
            return UnprintableResult()

    report = run_refutation_checks(
        causal_model=FakeCausalModel(),
        identified_estimand="mock_estimand",
        estimate="mock_estimate",
    )

    assert report["status"] == "completed"
    assert report["checks_executed"] == len(REFUTATION_METHODS)

    for method in REFUTATION_METHODS:
        result = report["results"][method]
        assert result["status"] == "completed"
        assert "string formatting failed" in result["result"]["summary"]
        assert result["causal_claim_proven"] is False