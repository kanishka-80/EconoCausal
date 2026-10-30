"""Optional DoWhy refutation checks for EconoCausal.

Execution status is kept separate from causal validity. A completed check
does not prove that the causal estimate is correct.
"""

from importlib.util import find_spec


REFUTATION_METHODS = (
    "random_common_cause",
    "placebo_treatment_refuter",
    "data_subset_refuter",
)

ALLOWED_STATUSES = {
    "planned",
    "completed",
    "passed",
    "failed",
    "unsupported",
    "skipped",
    "error",
}


def _dowhy_available() -> bool:
    """Return whether DoWhy can be imported in this environment."""
    try:
        return find_spec("dowhy") is not None
    except (ImportError, ModuleNotFoundError, ValueError):
        return False


def get_refutation_plan() -> dict:
    """Describe supported methods without claiming they were executed."""
    available = _dowhy_available()

    return {
        "status": "ready" if available else "dependency_missing",
        "dependency_available": available,
        "methods": list(REFUTATION_METHODS),
        "checks": [
            {
                "check_name": method,
                "configuration": {"method_name": method},
                "status": "planned" if available else "unsupported",
            }
            for method in REFUTATION_METHODS
        ],
        "causal_claim_proven": False,
    }


def format_refutation_result(
    check_name: str,
    status: str,
    result=None,
    configuration: dict | None = None,
    interpretation: str = "",
    limitations: str = "",
    error: str | None = None,
) -> dict:
    """Return a consistent, serializable record for one check."""
    if check_name not in REFUTATION_METHODS:
        raise ValueError(f"Unsupported refutation check: {check_name}")

    if status not in ALLOWED_STATUSES:
        raise ValueError(f"Unsupported status: {status}")

    return {
        "check_name": check_name,
        "configuration": configuration or {},
        "status": status,
        "result": result,
        "error": error,
        "interpretation": interpretation,
        "limitations": limitations
        or (
            "Refutation diagnostics cannot establish causal validity "
            "or prove that the estimate is correct."
        ),
        "causal_claim_proven": False,
    }


def run_refutation_checks(
    causal_model,
    identified_estimand,
    estimate,
) -> dict:
    """Run each available DoWhy check independently.

    If DoWhy is unavailable, checks are reported as unsupported rather than
    raising an exception or pretending they ran. An error in one check does
    not prevent the remaining checks from running.
    """
    if not _dowhy_available():
        results = {
            method: format_refutation_result(
                check_name=method,
                status="unsupported",
                configuration={"method_name": method},
                interpretation="Check was not executed because DoWhy is unavailable.",
                error="Missing optional dependency: dowhy",
            )
            for method in REFUTATION_METHODS
        }
        return {
            "status": "unsupported",
            "dependency_available": False,
            "results": results,
            "checks_executed": 0,
            "causal_claim_proven": False,
        }

    results = {}

    for method in REFUTATION_METHODS:
        configuration = {"method_name": method}

        try:
            refutation = causal_model.refute_estimate(
                identified_estimand,
                estimate,
                method_name=method,
            )
            try:
                result_text = str(refutation)
            except Exception as exc:
                result_text = (
                    f"Result returned ({type(refutation).__name__}); "
                    f"string formatting failed: {type(exc).__name__}: {exc}"
                )

            results[method] = format_refutation_result(
                check_name=method,
                status="completed",
                result={"summary": result_text},
                configuration=configuration,
                interpretation=(
                    "The refutation method executed. Review its diagnostic "
                    "output before drawing conclusions."
                ),
            )

        except Exception as exc:
            results[method] = format_refutation_result(
                check_name=method,
                status="error",
                configuration=configuration,
                interpretation="The check failed during execution.",
                error=f"{type(exc).__name__}: {exc}",
            )

    statuses = [item["status"] for item in results.values()]
    if all(status == "error" for status in statuses):
        overall_status = "error"
    elif "error" in statuses:
        overall_status = "completed_with_errors"
    else:
        overall_status = "completed"

    return {
        "status": overall_status,
        "dependency_available": True,
        "results": results,
        "checks_executed": sum(
            item["status"] == "completed" for item in results.values()
        ),
        "causal_claim_proven": False,
    }
