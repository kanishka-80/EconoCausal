"""Optional DoWhy refutation checks for EconoCausal."""

from importlib.util import find_spec


REFUTATION_METHODS = (
    "random_common_cause",
    "placebo_treatment_refuter",
    "data_subset_refuter",
)


def get_refutation_plan() -> dict:
    """Describe planned checks without pretending they ran."""
    return {
        "status": "ready" if find_spec("dowhy") else "dependency_missing",
        "dependency_available": find_spec("dowhy") is not None,
        "methods": list(REFUTATION_METHODS),
        "causal_claim_proven": False,
    }


def run_refutation_checks(causal_model, identified_estimand, estimate) -> dict:
    """Run DoWhy refuters against an existing identified estimate."""
    if find_spec("dowhy") is None:
        raise ImportError(
            "DoWhy is not installed. Use a compatible environment to run "
            "refutation checks; no checks were executed."
        )

    results = {}
    for method in REFUTATION_METHODS:
        results[method] = causal_model.refute_estimate(
            identified_estimand,
            estimate,
            method_name=method,
        )
    return {
        "status": "executed",
        "results": results,
        "causal_claim_proven": False,
    }


def format_refutation_result(
    check_name: str,
    status: str,
    result=None,
    configuration: dict | None = None,
    interpretation: str = "",
    limitations: str = "",
) -> dict:
    """Format a refutation check result consistently."""

    if check_name not in REFUTATION_METHODS:
        raise ValueError(f"Unsupported refutation check: {check_name}")

    allowed_statuses = {"planned", "passed", "failed", "skipped", "error"}
    if status not in allowed_statuses:
        raise ValueError(f"Unsupported status: {status}")

    return {
        "check_name": check_name,
        "status": status,
        "result": result,
        "configuration": configuration or {},
        "interpretation": interpretation,
        "limitations": limitations,
        "causal_claim_proven": False,
    }
