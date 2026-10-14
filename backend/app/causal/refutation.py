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
