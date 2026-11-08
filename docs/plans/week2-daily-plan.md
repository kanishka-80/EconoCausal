# EconoCausal
## Week 2 — Day-by-Day Causal Evaluation Work Plan
**Owner:** Kanshika (Tanishika) — Causal DAG, Assumptions & Evaluation  
**Week:** Saturday, 17 October – Friday, 23 October 2026

## Week 2 objective

Support the first end-to-end causal-analysis demo by checking that the agreed treatment, outcome, and covariates match the causal design; reviewing the primary DML estimator’s outputs with Ritik; and implementing initial diagnostics and uplift-evaluation support within the agreed project scope.

**Week 2 deliverable:** a documented causal-design and evaluation layer that works with Ritik’s agreed estimator outputs, reports diagnostics and limitations clearly, and supplies a consistent evaluation summary for the API/UI team. Do not present diagnostics or refutation results as proof of causality.

## Ownership and boundaries

Primary ownership:
- `backend/app/causal/dag.py`
- `backend/app/causal/propensity.py`
- `backend/app/causal/refutation.py`
- `backend/app/causal/uplift_evaluation.py`
- Causal evaluation tests and ML documentation

Coordinate with Ritik on estimator inputs/outputs and with Harsh on API schemas. Coordinate with Khushi on how evaluation summaries and warnings will be displayed. Avoid editing Ritik’s estimator files or Harsh’s API implementation without an explicit agreement.

If Week 1 decisions remain unresolved, document the blocker and ask the team to decide the treatment, outcome, outcome window, pre-treatment covariates, and dataset before drawing conclusions.

---

## Day 1 — Sat, 17 Oct
### Review the Week 1 causal design and agree on interfaces

**Tasks**
1. Fetch the latest `develop` and update your own feature branch using the team-agreed merge/rebase workflow.
2. Review the agreed treatment, outcome, outcome window, eligible pre-treatment covariates, dataset description, and data dictionary.
3. Review `backend/app/causal/dag.py` and the documented causal assumptions. Check that the DAG matches the agreed problem framing rather than assumptions inferred from column names.
4. Meet with Ritik to agree which input and output fields are available from the primary DML estimator and which diagnostics you will calculate separately.
5. Meet with Harsh to align the evaluation summary and warning fields with the shared `docs/api-contract.md`; coordinate with Khushi on useful UI labels.
6. Record unresolved assumptions or unavailable fields instead of silently inventing them.

**Files**
- `backend/app/causal/dag.py`
- `backend/app/causal/propensity.py`
- Existing causal/ML documentation
- `docs/api-contract.md` only in coordination with Harsh

**Acceptance check**
- The causal design and interfaces are documented.
- The evaluation work does not duplicate Ritik’s model-fitting or Harsh’s API ownership.

**Suggested commit:** `docs(causal): confirm evaluation interfaces and assumptions`

---

## Day 2 — Sun, 18 Oct
### Implement or refine the causal DAG and assumptions documentation

**Tasks**
1. Translate the team-approved causal assumptions into the project’s existing DAG representation.
2. Clearly distinguish treatment, outcome, pre-treatment confounders, other relevant variables, and variables that should not be adjusted for without a defensible reason.
3. Check for potential post-treatment variables and data leakage risks.
4. Document important assumptions and which ones cannot be verified from the available dataset.
5. Keep the DAG code and documentation consistent; ask for review if the real dataset does not support the intended design.

**Files**
- `backend/app/causal/dag.py`
- Existing causal-design documentation
- Relevant tests if the DAG has testable behavior

**Acceptance check**
- The DAG represents the agreed design and has a short explanation.
- Unsupported assumptions are explicitly listed as limitations.

**Suggested commit:** `feat(causal): encode approved causal DAG`

---

## Day 3 — Mon, 19 Oct
### Add propensity and overlap diagnostics where appropriate

**Tasks**
1. Inspect the agreed treatment type and determine with Ritik whether propensity/overlap diagnostics are appropriate for this setup.
2. Implement or refine `propensity.py` for the agreed treatment representation; do not assume binary treatment if the project uses another encoding.
3. Report useful diagnostics supported by the data, such as propensity-score distributions or overlap warnings for a suitable treatment setup.
4. Handle degenerate treatment groups, missing values, and invalid inputs with clear warnings or errors.
5. Keep diagnostic results separate from treatment-effect estimates and avoid interpreting overlap checks as causal validation.

**Files**
- `backend/app/causal/propensity.py`
- Relevant causal tests
- Causal documentation

**Acceptance check**
- Diagnostics match the actual treatment representation.
- Invalid or unsupported setups produce clear messages rather than misleading plots or numbers.

**Suggested commit:** `feat(causal): add treatment overlap diagnostics`

---

## Day 4 — Tue, 20 Oct
### Implement initial refutation checks

**Tasks**
1. Review the available refutation capabilities and the installed project dependencies.
2. Implement the initial checks supported by the chosen causal workflow in `refutation.py`, coordinating with Ritik so the checks use compatible inputs.
3. Record each check’s name, configuration, result/status, and any supported diagnostic output.
4. Handle failed checks and exceptions transparently; do not turn a failure into a pass or hide it.
5. Explain in documentation that refutation checks can probe robustness but cannot prove causality.

**Files**
- `backend/app/causal/refutation.py`
- Relevant causal tests
- Causal evaluation documentation

**Acceptance check**
- The selected checks can run on the agreed example or return a clear unsupported/error status.
- Results are structured and reproducible enough for the team to inspect.

**Suggested commit:** `feat(causal): add initial refutation checks`

---

## Day 5 — Wed, 21 Oct
### Add initial uplift-evaluation support

**Tasks**
1. Confirm with Ritik what individual or conditional effect outputs are available and with Harsh which fields the API can carry.
2. Implement the simplest evaluation summary that is justified by the available treatment and outcome setup in `uplift_evaluation.py`.
3. Use an evaluation metric only when the data and treatment design support it; document the required inputs and interpretation.
4. If the available data cannot support a valid uplift metric, provide a clear documented limitation instead of fabricating a score.
5. Add tests for valid outputs, invalid inputs, and insufficient data.
6. Share a small example output and field descriptions with Khushi so the dashboard can label it correctly.

**Files**
- `backend/app/causal/uplift_evaluation.py`
- Relevant causal tests
- Shared API documentation only in coordination with Harsh

**Acceptance check**
- The evaluation summary is supported by the available data and has documented meaning.
- Missing prerequisites are surfaced clearly.

**Suggested commit:** `feat(causal): add initial uplift evaluation support`

---

## Day 6 — Thu, 22 Oct
### Integrate evaluation outputs with the first analysis run

**Tasks**
1. Run the evaluation modules on the approved example alongside Ritik’s DML analysis.
2. Check that the treatment/outcome definitions and row alignment match the estimator run.
3. Verify that warnings and diagnostics are represented consistently and can be consumed by Harsh’s API and Khushi’s UI.
4. Review results with Ritik: investigate surprising diagnostics and distinguish data limitations from implementation defects.
5. If synthetic data is used, label it clearly and do not describe synthetic performance as real-world evidence.
6. Fix issues in your owned modules and coordinate before changing shared contracts.

**Files**
- `backend/app/causal/propensity.py`
- `backend/app/causal/refutation.py`
- `backend/app/causal/uplift_evaluation.py`
- Relevant tests and documentation

**Acceptance check**
- A documented example run produces evaluation outputs or actionable explanations of why a diagnostic cannot run.
- The outputs are consistent with the agreed treatment/outcome schema.

**Suggested commit:** `test(causal): validate evaluation on analysis example`

---

## Day 7 — Fri, 23 Oct
### Stabilize tests, documentation, and the Week 2 handoff

**Tasks**
1. Run relevant causal/evaluation tests and record the results.
2. Review the final diff for unrelated changes, secrets, `.env` files, private data, and large generated artifacts.
3. Document the DAG assumptions, diagnostic definitions, evaluation inputs, output fields, and limitations.
4. Confirm with Ritik that the model outputs and evaluation inputs align; confirm with Harsh that shared fields match the API contract.
5. Provide Khushi with labels and explanations for diagnostics, warnings, and evaluation summaries.
6. Open or update a pull request to `develop`, request review, and list remaining limitations for Week 3.

**Acceptance check**
- Tests pass, or failures are clearly documented.
- A teammate can reproduce the evaluation example from the instructions.
- The Week 2 handoff identifies supported diagnostics and unresolved questions.

**Suggested commit:** `docs(causal): finalize Week 2 evaluation handoff`

---

## Week 2 completion checklist

- [x] Causal DAG matches the agreed treatment/outcome framing.
- [x] Assumptions, potential confounders, and limitations are documented.
- [x] Propensity/overlap diagnostics are implemented only where appropriate.
- [x] Initial refutation checks return transparent, structured results.
- [x] Uplift evaluation is implemented only to the extent supported by the data and treatment setup.
- [x] Tests cover supported behavior and important failure cases.
- [x] Evaluation outputs align with Ritik’s estimator and Harsh’s API contract.
- [x] Khushi has clear labels/interpretation notes for the dashboard.
- [x] PR includes test evidence, reproducible instructions, and known limitations.
