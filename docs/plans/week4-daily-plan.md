# EconoCausal
## Week 4 — Day-by-Day Causal Evaluation Work Plan
**Owner:** Tanishka (also referred to as Kanshika in earlier planning notes) — Causal DAG, Diagnostics, Refutation & Evaluation  
**Week:** Saturday, 31 October – Friday, 6 November 2026

## Week 4 objective

Finalize and document the causal-evaluation side of EconoCausal for the integrated demo and handover. Check that the DAG and assumptions, appropriate overlap/propensity diagnostics, refutation checks, and any justified uplift evaluation are consistent with the final data and DML analysis. Provide the team with a clear evaluation summary that distinguishes diagnostic evidence from causal proof.

**Week 4 deliverable:** a reproducible, documented evaluation summary tied to the approved dataset and final analysis configuration, with tests and caveats ready for the integrated demo.

## Ownership and boundaries

Tanishka owns:
- `backend/app/causal/dag.py`
- `backend/app/causal/propensity.py`
- `backend/app/causal/refutation.py`
- `backend/app/causal/uplift_evaluation.py`
- Causal-evaluation tests and documentation

Coordinate with:
- **Ritvik/Ritik:** final DML outputs, treatment/outcome definitions, and analysis configuration.
- **Harsh:** evaluation result schema, API integration, and error handling.
- **Khushi:** dashboard labels, diagnostic descriptions, and user-facing caveats.

Use the team-approved treatment, outcome, covariates, units, and dataset. Do not independently redefine the estimand, change shared API fields, or claim causal validity based on one diagnostic. If the available data cannot support a diagnostic or uplift metric, document why rather than fabricating a result.

---

## Day 1 — Sat, 31 Oct
### Review final integration and confirm evaluation inputs

**Tasks**
1. Fetch the latest remote changes and update your feature branch using the team-agreed merge/rebase workflow.
2. Review the Week 3 handoff and any open evaluation issues.
3. Confirm with Ritvik which dataset/version, treatment/outcome definitions, pre-treatment covariates, estimator configuration, and final estimates are being used.
4. Confirm with Harsh how evaluation results and warnings are represented in the API.
5. Confirm with Khushi which diagnostic statuses, labels, and caveats will appear in the dashboard.
6. Create a short list of required final checks and unresolved assumptions; do not change shared definitions without team agreement.

**Files**
- `backend/app/causal/dag.py`
- `backend/app/causal/propensity.py`
- `backend/app/causal/refutation.py`
- `backend/app/causal/uplift_evaluation.py`
- Existing causal-evaluation documentation (`docs/week4-day1-handoff.md`)
- `docs/api-contract.md` only in coordination with Harsh

**Acceptance check**
- Evaluation inputs and output fields are agreed with the team.
- Unresolved assumptions and integration blockers are documented.

**Suggested commit:** `docs(causal): confirm final evaluation interface`

---

## Day 2 — Sun, 1 Nov
### Finalize the DAG and document identification assumptions

**Tasks**
1. Review the DAG against the approved treatment, outcome, and pre-treatment covariates.
2. Check that the graph and accompanying notes make the assumed confounding structure explicit.
3. Confirm that variables used for adjustment are available before treatment and that post-treatment variables are not inadvertently included as confounders.
4. Record key identification assumptions, plausible sources of unmeasured confounding, and limitations of the available dataset.
5. Add or update tests for DAG construction or validation where applicable.
6. Review the documentation with Ritvik so the DAG matches the actual estimator inputs.

**Files**
- `backend/app/causal/dag.py`
- Relevant DAG tests (`tests/test_dag.py`)
- Existing causal assumptions or data documentation (`docs/week4-day2-handoff.md`, `docs/causal-assumptions.md`)

**Acceptance check**
- DAG, covariates, and treatment/outcome definitions are consistent.
- Assumptions and unverified causal claims are clearly documented.

**Suggested commit:** `docs(causal): finalize DAG and assumptions`

---

## Day 3 — Mon, 2 Nov
### Run final propensity/overlap diagnostics where appropriate

**Tasks**
1. Run the agreed propensity/overlap diagnostics on the final approved dataset, if the treatment design and data support them.
2. Check for missing values, extreme propensity estimates, limited overlap, or groups with insufficient observations.
3. Verify that diagnostic outputs are finite, interpretable, and labelled with the correct treatment definition.
4. Add tests for expected behavior on valid inputs and clear handling of unsupported or degenerate cases.
5. Summarize what the diagnostics suggest about the data and where estimates may be unreliable.
6. If a diagnostic is not appropriate for the current treatment setup, document the reason rather than forcing a metric.

**Files**
- `backend/app/causal/propensity.py`
- Relevant diagnostic tests (`tests/test_propensity.py`)
- Evaluation summary documentation (`docs/week4-day3-diagnostics.md`)

**Acceptance check**
- Supported diagnostics run reproducibly and surface limitations clearly.
- Unsupported diagnostics are explicitly marked as not applicable, with a reason.

**Suggested commit:** `test(causal): finalize overlap diagnostics`

---

## Day 4 — Tue, 3 Nov
### Finalize refutation checks and interpretation

**Tasks**
1. Run the refutation checks agreed with the team on the final model/data configuration.
2. Verify that each check records its method, relevant settings, result, and any failure or warning.
3. Test how the evaluation code handles exceptions, unsupported checks, and incomplete outputs.
4. Review findings with Ritvik and distinguish model/data problems from limitations inherent in observational analysis.
5. Document what each check can and cannot establish; do not treat passing a refutation test as proof that the causal estimate is correct.
6. Investigate any material regression from the Week 3 results and report it to the team.

**Files**
- `backend/app/causal/refutation.py`
- Relevant refutation tests (`tests/test_refutation.py`)
- Evaluation summary documentation (`docs/week4-day4-refutation.md`)

**Acceptance check**
- Refutation checks and their outcomes are reproducible and interpretable.
- Results are not overstated as proof of causality.

**Suggested commit:** `test(causal): finalize refutation checks`

---

## Day 5 — Wed, 4 Nov
### Validate uplift evaluation only if supported by the data

**Tasks**
1. Review with Ritvik whether the data, treatment setup, and available outcome labels support the planned uplift evaluation.
2. If appropriate, run the agreed metric(s) and verify their inputs, grouping, and output units/meaning.
3. Check that evaluation is not using post-treatment information incorrectly or leaking labels into model inputs.
4. Add tests for supported metrics and clear handling of insufficient data or unsupported treatment setups.
5. If uplift evaluation is not justified, record the reason and provide the other available evaluation evidence instead.
6. Summarize practical interpretation and uncertainty without implying that an uplift metric alone proves causal effectiveness.

**Files**
- `backend/app/causal/uplift_evaluation.py`
- Relevant uplift tests (`tests/test_uplift_evaluation.py`, `tests/test_uplift_integration.py`)
- Evaluation summary documentation (`docs/week4-day5-uplift.md`)

**Acceptance check**
- Any reported uplift metric is justified by the data and has a documented interpretation.
- Unsupported evaluation is transparently marked rather than invented.

**Suggested commit:** `test(causal): validate supported uplift evaluation`

---

## Day 6 — Thu, 5 Nov
### Integrate the evaluation summary and run regression checks

**Tasks**
1. Combine the DAG/assumptions, supported overlap diagnostics, refutation results, and any justified uplift findings into one concise evaluation summary.
2. Align the summary with Ritvik’s final DML run and the same dataset/version and configuration.
3. Pair with Harsh to verify that evaluation results and warnings fit the agreed API schema.
4. Pair with Khushi to check that dashboard wording is clear and does not overstate what the metrics mean.
5. Run the relevant causal-evaluation tests and available backend/integration tests.
6. Document any skipped checks, failed tests, known limitations, or missing evidence.

**Files**
- Owned modules under `backend/app/causal/`
- Causal-evaluation tests
- Evaluation summary and existing docs (`docs/week4-day6-evaluation-summary.md`)
- `docs/api-contract.md` only in coordination with Harsh

**Acceptance check**
- Evaluation summary is consistent with the final DML run.
- API and UI representations preserve the meaning and caveats of each result.
- Test outcomes and skipped checks are recorded honestly.

**Suggested commit:** `test(causal): verify final evaluation integration`

---

## Day 7 — Fri, 6 Nov
### Prepare final causal-evaluation handover and demo notes

**Tasks**
1. Review the final evaluation summary, tests, and documentation for completeness.
2. Prepare a short demo explanation of the DAG, assumptions, supported diagnostics, refutation findings, and known limitations.
3. Ensure the demo distinguishes estimated effects from realized outcomes and diagnostic evidence from causal proof.
4. Confirm with Ritvik that model outputs and evaluation results use the same definitions/configuration.
5. Confirm with Harsh and Khushi that warnings and caveats are represented consistently in the API and dashboard.
6. Open or update your pull request to `develop`, include test evidence, and request review.
7. List deferred work and known limitations clearly for handover.

**Files**
- `backend/app/causal/dag.py`
- `backend/app/causal/propensity.py`
- `backend/app/causal/refutation.py`
- `backend/app/causal/uplift_evaluation.py`
- Evaluation tests and documentation (`docs/week4-final-handover.md`)

**Acceptance check**
- Final evaluation summary is reproducible, reviewed, and ready for handover.
- PR includes test evidence and known limitations.
- Demo language does not overclaim causal certainty.

**Suggested commit:** `docs(causal): finalize Week 4 evaluation handover`

---

## Week 4 completion checklist

- [x] DAG reflects the approved treatment, outcome, and pre-treatment covariates.
- [x] Identification assumptions and unverified assumptions are documented.
- [x] Appropriate overlap/propensity diagnostics are run or marked not applicable with a reason.
- [x] Refutation checks are reproducible and interpreted cautiously.
- [x] Uplift evaluation is reported only if the data and setup support it.
- [x] Evaluation summary matches Ritvik’s final DML run and configuration.
- [x] Harsh’s API and Khushi’s dashboard represent evaluation fields and caveats consistently.
- [x] Relevant tests run and results, skipped checks, and limitations are recorded (52/52 passed).
- [x] PR and handover notes are complete.

## Important interpretation note

A DAG represents assumptions, not proof that the assumed causal structure is true. Propensity/overlap diagnostics can reveal weak support or data problems. Refutation checks can challenge an analysis but cannot certify causal validity. Uplift metrics are appropriate only when the design and data support their interpretation. Observational causal estimates remain dependent on assumptions and data quality.
