# EconoCausal — Week 1 Daily Plan
## Kanshika | Causal DAG, Propensity Analysis, Refutation, and Evaluation

**Week:** Saturday, 10 October – Friday, 16 October 2026  
**Project duration:** 4 weeks total  
**Owner:** Kanshika  
**Primary ownership:** `backend/app/causal/dag.py`, `propensity.py`, `refutation.py`, `uplift_evaluation.py`, causal tests, and ML documentation.

> **Week 1 goal:** document the causal assumptions and treatment/outcome definitions, create the first causal DAG, and prepare a defensible evaluation/refutation plan. The primary EconML DML estimator is Ritik’s ownership and is planned for Week 2. Coordinate shared definitions with Ritik and shared API fields with Harsh.

---

## Before starting: branch and merge-safety rules

1. Start from the latest `develop` branch and create a personal feature branch, for example `feature/kanshika-causal-foundation-week1`.
2. Do not commit directly to `main` or `develop`. Push daily work to your feature branch.
3. At the start of each day, fetch the latest remote changes and update your feature branch from `develop` using the team's agreed merge/rebase policy.
4. Stay within Kanshika’s ownership: `dag.py`, `propensity.py`, `refutation.py`, `uplift_evaluation.py`, causal tests, and ML documentation. Coordinate before editing Ritik’s data pipeline/DML files or Harsh’s API/schema files.
5. Agree with Ritik on treatment, outcome, outcome window, and pre-treatment covariates. Agree with Harsh on any fields exposed through the API. Record shared decisions in the agreed docs/issues rather than independently freezing them.
6. Before a PR/merge, run relevant tests, inspect the diff, check the API/schema contract, avoid secrets/private data, and update documentation when a public schema changes.
7. Open a pull request into `develop` when the work is reviewable. Request review and resolve conflicts on your own branch. Do not force-push a shared branch.

---

## Day 1 — Saturday, 10 October
### Goal: inspect project requirements and establish causal documentation

**Work step by step**
1. Pull the latest `develop` and inspect the project structure and PRD sections on causal requirements, data requirements, validation, and team ownership.
2. Read Ritik’s initial dataset notes if available. Do not assume the dataset contains a treatment field, outcome window, or confounders until verified.
3. Create/update `docs/causal-assumptions.md` with sections for target question, treatment, outcome, target population, timing, candidate confounders, assumptions, known limitations, and open questions.
4. Create/update `docs/model-evaluation.md` with a proposed evaluation plan: what can be checked in Week 1, what requires the DML estimator in Week 2, and what data is needed for uplift/Qini metrics.
5. List the decisions that require team agreement: dataset, treatment encoding/discount levels, outcome and outcome window, pre-treatment covariates, and supported treatment comparison.
6. Ask Ritik to share dataset profile and proposed `X`, `T`, and `Y`; record any missing information as an open question.

**Files/artifacts:** `docs/causal-assumptions.md`, `docs/model-evaluation.md`, and a relevant entry in `docs/decisions-log.md` if the team uses it.

**End-of-day check:** causal questions, assumptions, and unresolved decisions are documented without pretending they have already been validated.

**Suggested commit:** `docs(causal): outline assumptions and evaluation plan`

---

## Day 2 — Sunday, 11 October
### Goal: draft the causal DAG

**Work step by step**
1. Use the agreed target question, treatment, outcome, and candidate covariates to draft a directed acyclic graph in `backend/app/causal/dag.py`.
2. Separate pre-treatment confounders from variables that may occur after treatment. Do not include post-treatment variables as ordinary confounders without a documented causal justification.
3. Add comments or accompanying documentation explaining each important arrow and the assumptions behind it.
4. If dataset meaning or timing is uncertain, label the graph as provisional and list the questions that would change it.
5. Review the graph with Ritik and confirm that the proposed covariates are actually available in the data.
6. Keep the implementation minimal; avoid adding an elaborate graph framework unless the repository already uses one.

**Files/artifacts:** `backend/app/causal/dag.py`, `docs/causal-assumptions.md`.

**End-of-day check:** a reviewer can understand the treatment, outcome, assumed confounders, and major causal pathways from the graph and notes.

**Suggested commit:** `feat(causal): add initial causal DAG`

---

## Day 3 — Monday, 12 October
### Goal: document identification assumptions and feature eligibility

**Work step by step**
1. Write down the assumptions needed to interpret estimates causally, including the role of measured confounding, treatment overlap/positivity, consistency, and timing where relevant to the chosen design.
2. For each candidate covariate, record its meaning, whether it is measured before treatment, whether it is available in the dataset, and whether it may create leakage.
3. Add a clear limitation that observational data and passing refutation checks do not prove causal identification.
4. Compare the assumptions document with the DAG and treatment/outcome proposal; make sure the two do not contradict each other.
5. Review the candidate feature list with Ritik. Record unresolved treatment/outcome definitions rather than guessing.
6. If the PRD’s treatment has multiple discount levels, note that the selected estimator and comparison strategy must support the agreed representation.

**Files/artifacts:** `docs/causal-assumptions.md`, `docs/data-dictionary.md` (coordinate with Ritik; avoid overwriting his changes).

**End-of-day check:** the assumptions and covariate eligibility rules are explicit and consistent with the current data proposal.

**Suggested commit:** `docs(causal): specify identification assumptions`

---

## Day 4 — Tuesday, 13 October
### Goal: plan propensity/balance diagnostics

**Work step by step**
1. Inspect the treatment encoding proposed by Ritik and determine whether a propensity/balance check is meaningful for that representation.
2. Draft a small diagnostic in `backend/app/causal/propensity.py` only if the treatment and data format are sufficiently clear. Otherwise, document the expected input/output and the blocker instead of hard-coding assumptions.
3. Where appropriate, assess treatment-group counts and propensity-score overlap/balance. Keep propensity analysis as supporting sensitivity/balancing work; do not present it as a replacement for DML.
4. Define how diagnostics should report insufficient overlap, extreme scores, or groups too small for a stable comparison.
5. Add focused tests or test cases for valid input and obvious invalid/unsupported treatment configurations.
6. Coordinate output naming with Ritik and Harsh if the results will later be returned through an API.

**Files/artifacts:** `backend/app/causal/propensity.py`, relevant causal tests, `docs/model-evaluation.md`.

**End-of-day check:** the team has a justified propensity/balance diagnostic plan or a clear, documented reason it cannot yet be implemented.

**Suggested commit:** `feat(causal): add initial propensity diagnostics`

---

## Day 5 — Wednesday, 14 October
### Goal: establish the DoWhy refutation plan

**Work step by step**
1. Review the proposed causal model and identify which DoWhy refutation checks are applicable to the chosen data and design.
2. Draft or implement a small, clearly separated interface in `backend/app/causal/refutation.py`; avoid claiming that every refutation method is suitable for every dataset.
3. Define a consistent result format for each check: check name, status/result, relevant configuration, interpretation, and limitations. Coordinate public fields before exposing them in an API.
4. Make sure results will be described as diagnostic evidence, not proof that confounding has been eliminated or that causality is established.
5. Add tests for result formatting and unsupported/missing inputs; defer estimator-dependent tests until Week 2 if the estimator is not available.
6. Update `docs/model-evaluation.md` with checks selected, why they are relevant, and what their results can/cannot mean.

**Files/artifacts:** `backend/app/causal/refutation.py`, causal tests, `docs/model-evaluation.md`.

**End-of-day check:** refutation checks have a documented selection rationale and an honest interpretation format.

**Suggested commit:** `feat(causal): define refutation check interface`

---

## Day 6 — Thursday, 15 October
### Goal: define evaluation and uplift/Qini requirements

**Work step by step**
1. Document the evaluation dataset and treatment/outcome setup needed before uplift or Qini metrics are calculated.
2. Identify what baseline, ranking/score, treatment indicator, and outcome information will be needed. Confirm that the data supports the proposed metric before implementing it.
3. Create or refine the interface in `backend/app/causal/uplift_evaluation.py` only if the required inputs and semantics are agreed; otherwise commit the evaluation specification and a clearly marked stub/interface.
4. Define outputs and metric interpretation so they are not presented as proof of causal identification. Do not create plausible-looking curves from arbitrary observational data.
5. Add tests for input validation and output shape, using clearly labelled synthetic fixtures if needed.
6. Coordinate with Khushi on the chart data that the frontend may eventually need, and with Harsh on API field names, without editing their owned UI/API files.

**Files/artifacts:** `backend/app/causal/uplift_evaluation.py`, relevant tests, `docs/model-evaluation.md`.

**End-of-day check:** evaluation requirements and data prerequisites are explicit; any implementation is guarded against unsupported inputs.

**Suggested commit:** `docs(eval): specify uplift and Qini requirements`

---

## Day 7 — Friday, 16 October
### Goal: consistency review, tests, and Week 1 handoff

**Work step by step**
1. Review `dag.py`, `propensity.py`, `refutation.py`, and `uplift_evaluation.py` together for consistent treatment/outcome names and compatible assumptions.
2. Run relevant tests and record actual commands/results. If some checks depend on Ritik’s Week 2 estimator, mark them as pending instead of claiming success.
3. Review documentation for causal overclaims. State that estimates depend on assumptions and that refutation checks do not prove causality.
4. Ask Ritik to confirm data/treatment/outcome alignment and Harsh to confirm any planned response fields. Record unresolved issues in the shared decisions log or issue tracker.
5. Check your diff for unrelated edits, private data, secrets, and accidental modifications to another owner’s files.
6. Open/update a pull request into `develop` with a summary, tests, assumptions, limitations, and dependencies for Week 2.

**Files/artifacts:** the four owned causal modules, relevant tests, `docs/causal-assumptions.md`, `docs/model-evaluation.md`, PR/issue notes.

**End-of-day check:** the causal design is reviewable, assumptions are documented, relevant tests are run or explicitly pending, and Week 2 dependencies are visible.

**Suggested commit:** `test(causal): verify week-one causal foundations`

---

## Daily GitHub commit checklist

- [x] A meaningful code, test, documentation, or reproducibility change was made.
- [x] The commit message describes the change and follows the team convention.
- [x] The commit is pushed to Kanshika’s feature branch and visible on GitHub.
- [x] Relevant tests were run, or blockers/dependencies are documented honestly.
- [x] No secrets, `.env` files, private customer data, or large generated datasets are committed.
- [x] Changes to shared data/API contracts were coordinated with Ritik and Harsh.

## Week 1 completion checklist

- [x] Causal assumptions and open decisions are documented.
- [x] Initial DAG exists and matches the current treatment/outcome proposal.
- [x] Pre-treatment covariate eligibility and leakage risks are recorded.
- [x] Propensity/balance diagnostic plan or initial implementation is reviewable.
- [x] DoWhy refutation checks have a documented rationale and interpretation limits.
- [x] Uplift/Qini prerequisites and expected outputs are documented.
- [x] PR is open for review and Week 2 dependencies are listed.
