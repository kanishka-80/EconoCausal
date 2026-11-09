# EconoCausal — Week 3 Day 1 Review

**Owner:** Khushi Tyagi  
**Role:** Frontend Developer  
**Date:** 30 October 2026  
**Branch:** khushi-work

## Objective
Review the existing frontend workflow and align its integration with the shared API contract.

## Completed Review
- Verified the current branch is khushi-work and is synchronized with origin/khushi-work.
- Reviewed dataset upload and summary integration.
- Reviewed causal analysis inputs, results, and diagnostics.
- Reviewed budget allocation inputs, validation, API request, and result display.
- Reviewed frontend API service methods.
- Ran ESLint successfully.
- Ran the production build successfully.

## API Contract Findings
- Optimizer endpoint: POST /api/optimization/run.
- Budget must be a positive number.
- Allowed discount percentages: 0, 5, 10, 20.
- Supported objectives: MAXIMIZE_UPLIFT and MAXIMIZE_REVENUE.
- The optimizer response includes allocation rows, summary information, budget totals, and limitations.
- Budget represents a financial subsidy/discount budget; the currency is not specified in the reviewed contract.

## Frontend Gaps
- Budget panel currently hardcodes MAXIMIZE_REVENUE instead of allowing the supported objective to be selected.
- Allocation rows are displayed as a list rather than a structured table.
- Existing Plotly charts are descriptive dataset charts, not charts of optimizer allocations.
- Budget currency/unit needs confirmation before adding a currency symbol.
- Optimizer result states need to distinguish scaffold/mock output from real solver output.

## Backend and Team Blockers
- Contract lists BLK-03: SciPy optimization service is scheduled for Harsh on Day 16 to replace SCAFFOLD_MOCK.
- Contract lists BLK-01: CausalForestDML integration is still in progress.
- Causal diagnostics include limitations; refutation checks do not prove causal identification.
- Final budget units, objective choice, and model caveats should be confirmed with the relevant team members.

## Day 1 Outcome
The existing frontend integration has been reviewed and the main gaps have been documented.
The optimizer is not yet confirmed as a production-ready solver.
Frontend changes must preserve clear mock/scaffold labeling until the backend confirms real solver output.
