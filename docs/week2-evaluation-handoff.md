# EconoCausal — Week 2 Causal Evaluation Handoff

## 1. Scope
This handoff records the causal evaluation utilities, synthetic uplift
integration test, verification results, and known limitations.

## 2. Treatment and Outcome
- Treatment column: `discount_offered`
- Outcome column: `purchased`
- Outcome type: binary (`0` or `1`)
- Example comparison: treatment level `10` versus control level `0`
- Other treatment levels are excluded from this pairwise comparison.

## 3. Implemented Evaluation Components
- `backend/app/causal/dag.py`: causal DAG utilities.
- `backend/app/causal/propensity.py`: propensity and covariate-balance diagnostics.
- `backend/app/causal/refutation.py`: refutation plan and result formatting, including unsupported or error statuses.
- `backend/app/causal/uplift_evaluation.py`: score-ranked cumulative treated-versus-control outcome-gain diagnostic.

## 4. Verification Results
- Full test suite: 41 passed, 94 subtests passed.
- Uplift integration tests: 2 passed.
- Propensity and refutation tests: 21 passed.
- `git diff --check`: no whitespace errors reported.
- Synthetic integration test checks test-split row alignment, selected treatment/control filtering, descending score ordering, and rejection of a score-length mismatch.

These are the results observed in the current development environment on 2026-10-26.

## 5. Important Limitations
- The uplift integration test uses synthetic stand-in scores; it does not fit a real DML model.
- EconML is not installed in the checked environment. Real `CausalForestDML` integration remains unverified here.
- DoWhy is not installed in the checked environment. Actual DoWhy refutation execution remains unverified here.
- Uplift gain is a descriptive ranking diagnostic, not proof of a causal effect.
- Passing software tests does not establish causal identification or validate model performance on real customer data.
- No real-model performance metric or confidence interval is claimed by this handoff.

## 6. Data and Alignment Requirements
- Scores must be finite numeric values, one per input row.
- Scores must remain positionally aligned with the exact data rows supplied to the evaluator.
- For test-split evaluation, pass only the matching test rows and their corresponding scores.
- Validate treatment assignment, pre-treatment covariates, overlap, and causal assumptions before interpreting results.

## 7. API and Frontend Handoff
The evaluator currently returns a pandas DataFrame with rank, score, treatment,
outcome, cumulative counts, cumulative positive outcomes, and uplift gain.
API/frontend integration should agree on field names, status/warning structure,
and interpretation labels before wiring this output into a shared contract.

## 8. Pending Work
1. Verify the supported EconML environment and run the actual DML fit/effect pipeline.
2. Run DoWhy refutation checks in an environment where the dependency and supported model inputs are available.
3. Confirm API/frontend output contracts with Harsh and Khushi.
4. Record real-data evaluation results only after a reproducible run.
5. Review and merge through the team's agreed pull-request process.

## 9. Status
The local test suite passes. Synthetic uplift evaluation is tested.
Real DML integration and actual DoWhy refutation execution remain pending verification.
