# EconoCausal
## Week 3 — Day-by-Day Causal Evaluation Work Plan
**Owner:** Tanishka (Kanshika) — Causal DAG, Assumptions & Evaluation  
**Week:** Saturday, 24 October – Friday, 30 October 2026

## Week 3 objective

Support the budget-constrained recommendation prototype by evaluating the DML analysis with Ritik, strengthening and documenting the causal evaluation/refutation workflow, and providing Harsh and Khushi with clear, correctly interpreted diagnostic and evaluation outputs.

**Week 3 deliverable:** a reproducible evaluation summary for the agreed model/data setup, including supported diagnostics and refutation results, documented assumptions and limitations, and an agreed output shape that can be consumed by the backend and dashboard. Evaluation checks should identify risks and limitations; they must not be described as proof of causality.

## Ownership and boundaries

Primary ownership:
- `backend/app/causal/dag.py`
- `backend/app/causal/propensity.py`
- `backend/app/causal/refutation.py`
- `backend/app/causal/uplift_evaluation.py`
- Causal evaluation tests and documentation

Coordinate with:
- **Ritik:** DML outputs, treatment/outcome definitions, evaluation setup, and interpretation.
- **Harsh:** optimizer/API integration fields and structured diagnostic responses.
- **Khushi:** dashboard labels, warnings, and explanations.

Do not implement Harsh’s SciPy optimizer or replace Ritik’s primary DML estimator. Follow the team-approved Week 1 definitions for dataset, treatment, outcome, outcome window, and pre-treatment covariates. If any remain unresolved, record the blocker and agree on the demo scope before interpreting results.

---

## Day 1 — Sat, 24 Oct
### Review Week 2 results and agree on Week 3 evaluation goals

**Tasks**
1. Fetch the latest `develop` and update your feature branch using the team-agreed merge/rebase workflow.
2. Review Ritik’s DML implementation, Week 2 test results, output schema, and documented limitations.
3. Reconfirm the agreed treatment, outcome, outcome window, covariates, dataset, and units.
4. Review the current causal DAG and list assumptions that are supported by domain knowledge versus those that cannot be checked from the data alone.
5. Agree with Ritik which evaluation questions are in scope and with Harsh which summary fields the API/optimizer integration needs.
6. Agree with Khushi on concise, non-misleading labels for diagnostics, warnings, and evaluation results.

**Files**
- `backend/app/causal/dag.py`
- Existing causal/evaluation documentation
- `docs/api-contract.md` only in coordination with Harsh

**Acceptance check**
- Evaluation goals and output fields are agreed.
- Unverified assumptions and data limitations are documented.

**Suggested commit:** `docs(causal): define Week 3 evaluation scope`

---

## Day 2 — Sun, 25 Oct
### Review propensity and overlap diagnostics

**Tasks**
1. Run the available propensity/overlap diagnostics on the approved analysis setup where the treatment design supports them.
2. Confirm the diagnostics match the actual treatment representation; do not apply binary-treatment diagnostics to an incompatible setup.
3. Inspect warnings related to limited overlap, treatment-group imbalance, missing values, or insufficient variation.
4. Add tests for supported behavior and for cases where the diagnostic cannot validly run.
5. Document what each diagnostic indicates and what it cannot establish.
6. Review any concerning findings with Ritik before recommending model or data changes.

**Files**
- `backend/app/causal/propensity.py`
- Relevant causal tests
- Existing evaluation documentation

**Acceptance check**
- Diagnostics run only under supported conditions.
- Unsupported or degenerate inputs produce clear warnings/errors, not misleading numbers.

**Suggested commit:** `test(causal): validate propensity and overlap diagnostics`

---

## Day 3 — Mon, 26 Oct
### Strengthen refutation checks and their reporting

**Tasks**
1. Review which refutation checks are already implemented and can be run reproducibly on the current estimator/data setup.
2. Improve the selected checks in `refutation.py` without duplicating model fitting owned by Ritik.
3. Standardize the result representation to include the check name, status, configuration, and supported result details.
4. Handle unavailable checks, exceptions, and failed checks transparently; do not label an error as a pass.
5. Add tests for successful execution, failure, and unsupported configurations.
6. Document that refutation checks probe robustness but cannot prove the causal assumptions are true.

**Files**
- `backend/app/causal/refutation.py`
- Relevant causal tests
- Causal evaluation documentation

**Acceptance check**
- Refutation results are structured and distinguish pass, fail, unavailable, and error where the implementation supports those states.
- Results are reproducible from documented settings.

**Suggested commit:** `feat(causal): improve refutation reporting`

---

## Day 4 — Tue, 27 Oct
### Evaluate uplift support and define limitations

**Tasks**
1. Review the available treatment, outcome, and effect outputs with Ritik to determine which uplift-evaluation methods are justified by the dataset and design.
2. Refine `uplift_evaluation.py` for the supported evaluation setup.
3. Use metrics only when their required inputs and assumptions are met; do not fabricate an uplift score when the data cannot support it.
4. Check behavior for insufficient samples, missing outcomes, invalid treatment groups, and incompatible estimate shapes.
5. Add tests for valid results and key failure cases.
6. Document the meaning, prerequisites, and limitations of every metric returned.

**Files**
- `backend/app/causal/uplift_evaluation.py`
- Relevant causal tests
- Existing evaluation documentation

**Acceptance check**
- Metrics are calculated only when supported by the data and treatment design.
- Unsupported evaluations return a clear explanation.

**Suggested commit:** `feat(causal): refine supported uplift evaluation`

---

## Day 5 — Wed, 28 Oct
### Create an integrated evaluation summary for the backend and UI

**Tasks**
1. Pair with Ritik to run the evaluation against the agreed DML output and verify row alignment and treatment/outcome consistency.
2. Agree with Harsh on the API-compatible shape for diagnostics, warnings, and evaluation summaries.
3. Keep estimate values distinct from diagnostic status and interpretive warnings.
4. Provide Khushi with field definitions, display labels, and concise caveats for the dashboard.
5. Check that synthetic-data results are explicitly labelled and are not described as real-world validation.
6. Add tests for the summary structure and for missing/unavailable diagnostic components.

**Files**
- `backend/app/causal/propensity.py`
- `backend/app/causal/refutation.py`
- `backend/app/causal/uplift_evaluation.py`
- Relevant tests
- Shared contract only in coordination with Harsh

**Acceptance check**
- The summary matches the agreed API contract.
- The frontend can distinguish estimates, diagnostics, warnings, and unavailable checks.

**Suggested commit:** `feat(causal): provide integrated evaluation summary`

---

## Day 6 — Thu, 29 Oct
### Run end-to-end evaluation and investigate issues

**Tasks**
1. Run the documented data pipeline → DML analysis → causal evaluation workflow on the approved dataset.
2. If real data is unavailable or unsuitable, use a team-approved synthetic fixture and label it clearly.
3. Verify that diagnostic and evaluation outputs are finite, correctly shaped, and accompanied by the right configuration/metadata where available.
4. Review unusual findings with Ritik and distinguish data/design limitations from code defects.
5. Test invalid and insufficient-data cases and confirm the messages are actionable.
6. Record runtime and any evaluation step that is too slow or unstable for the student prototype.

**Files**
- Causal evaluation modules and tests
- Existing evaluation documentation
- `docs/api-contract.md` only in coordination with Harsh

**Acceptance check**
- The evaluation workflow is reproducible or its blockers are documented.
- Results include the necessary caveats and do not overstate what the data establishes.

**Suggested commit:** `test(causal): verify end-to-end evaluation workflow`

---

## Day 7 — Fri, 30 Oct
### Stabilize, document, and hand off Week 3 evaluation

**Tasks**
1. Run relevant causal/evaluation tests and record the exact results.
2. Review the final diff for unrelated edits, secrets, `.env` files, private data, and large generated artifacts.
3. Document the DAG assumptions, diagnostic prerequisites, refutation settings, uplift metrics, output fields, and limitations.
4. Confirm the final diagnostic schema with Harsh and the dashboard wording with Khushi.
5. Open or update a pull request to `develop`, include test evidence, and request review.
6. Prepare a concise handoff: what is evaluated, which checks ran, what they found, what remains uncertain, and what Week 4 validation should revisit.

**Acceptance check**
- Tests pass, or failures and blockers are documented honestly.
- A teammate can reproduce the evaluation workflow.
- Assumptions and limitations are understandable to someone viewing the demo.

**Suggested commit:** `docs(causal): finalize Week 3 evaluation handoff`

---

## Week 3 completion checklist

- [x] Evaluation scope and assumptions reviewed with Ritik.
- [x] Propensity/overlap diagnostics run only where appropriate.
- [x] Refutation checks report outcomes transparently and reproducibly.
- [x] Uplift metrics are used only when supported by the data and treatment design.
- [x] Evaluation summary matches the agreed API contract.
- [x] Harsh and Khushi have the correct fields, labels, and caveats.
- [x] Tests cover successful, failed, and unsupported diagnostic cases.
- [x] End-to-end evaluation steps and metadata are documented.
- [x] PR includes test evidence, known limitations, and Week 4 follow-up items.
