# EconoCausal — Week 4 Day 2 Handoff

## 1. Day 2 Objective

Review the current causal DAG, identification assumptions, DML input alignment, propensity diagnostics, and refutation-check implementation.

The review was documentation-focused. No causal implementation or test logic was changed.

## 2. DAG Review

File: `backend/app/causal/dag.py`

- Treatment: `discount_offered`
- Outcome: `purchased`
- Candidate covariates: 31
- Each candidate is provisionally connected to both treatment and outcome.
- The treatment-to-outcome edge is present.
- The graph implementation supports cycle detection and basic structural inspection.

The graph is structurally testable but remains provisional. Its causal edges have not been independently justified against the data-generating process.

## 3. DML and DAG Alignment

The DML implementation owner confirmed:

- DML uses 31 candidate features as X.
- Treatment T is `discount_offered`.
- Outcome Y is `purchased`.
- The DML feature names match the 31 candidate covariates in the DAG.
- The current enriched synthetic dataset has 20,000 rows and 40 columns.

This confirms feature-name alignment only. It does not establish causal validity or prove that all features are suitable adjustment variables.

## 4. Identification Questions Still Open

The following details remain unverified:

1. Whether discount levels were randomly assigned or determined by a business rule or model.
2. Whether all 31 candidate features were measured before treatment assignment.
3. The timing of `customer_satisfaction`, `return_rate`, and `campaign_type`, which are included in the current DML inputs.
4. The purchase observation window after a discount offer.
5. Whether the proposed DAG edges and adjustment covariates are scientifically justified.

Unknown details have not been treated as confirmed assumptions.

## 5. Dataset Status

- Dataset: enriched synthetic dataset.
- Observations: 20,000.
- Columns: 40.
- Treatment levels: 0, 5, 10, and 20.
- Treatment observations: 5,000 per level.

The dataset is used by the current DML pipeline. It is not confirmed as a final approved real-world causal dataset.

## 6. Automated Test Results

The following test files were executed:

| Test file | Result |
|---|---:|
| `tests/test_propensity.py` | 12 passed |
| `tests/test_refutation.py` | 12 passed |
| `tests/test_uplift_evaluation.py` | 16 passed |
| `tests/test_uplift_integration.py` | 3 passed |
| `tests/test_dag.py` | 9 passed |
| **Full test suite** | **52 passed** |

These results verify tested software behavior. They do not prove causal identification or the correctness of the proposed causal assumptions.

## 7. Diagnostics and Refutation Limitations

- Propensity and balance diagnostics are preliminary and do not establish causal validity.
- Numeric and categorical balance results are descriptive.
- DoWhy was not installed during the initial implementation review.
- Refutation checks must be reported according to their actual execution status.
- A completed refutation check must not be described as proof that an estimated effect is correct.

## 8. Day 2 Conclusion

The current DAG candidate list and DML input feature names are aligned.

However, the treatment assignment mechanism, feature timing, purchase observation window, and causal justification remain unresolved.

The DAG must remain provisional until these details are verified. No causal claim should be made solely from structural tests, feature alignment, diagnostics, or refutation-check execution.

## 9. Next Actions

- Obtain confirmation of the discount assignment mechanism.
- Verify the measurement timing of all proposed adjustment features.
- Confirm the purchase observation window.
- Review the DAG edges and adjustment set against the actual data-generation process.
- Reassess the DML inputs after the timing and causal justification review.

## 10. Change Scope

Week 4 Day 2 review and documentation update only.

No changes to DAG implementation, estimator logic, propensity logic, refutation logic, uplift evaluation, or automated test logic were authorized as part of this review.
