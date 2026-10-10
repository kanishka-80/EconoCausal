# EconoCausal
## Frontend Overview

The frontend will provide a simple and user-friendly interface for the EconoCausal project. It will help users upload campaign data, view causal analysis results, and explore budget allocation recommendations.

## Frontend Responsibilities

- **Dashboard:** Main overview and navigation for the application.
- **Data Upload:** Select campaign data in CSV format.
- **Data Preview:** Display uploaded data in a table and show basic validation information.
- **Causal Analysis:** Present treatment-effect estimates and diagnostics returned by the backend.
- **Charts:** Display discount comparisons and, when supported by the analysis results, Qini and uplift curves.
- **Budget Allocation:** Provide budget settings and display allocation recommendations.
- **Data Drift Warning:** Show warnings reported by the backend.

## Technology Stack

- React
- JavaScript
- Plotly.js for interactive charts, subject to the agreed implementation
- Team-approved backend APIs

## Week 1 Plan

1. Inspect the repository and confirm the frontend setup.
2. Create the dashboard layout and navigation.
3. Build the CSV selection and upload interface.
4. Create a dataset preview table using agreed field names.
5. Prepare the causal-results and diagnostics layout.
6. Create the budget-allocation interface scaffold.
7. Review the frontend changes and prepare them for team review.

## Development Notes

- Use clearly labelled mock data until backend responses are available.
- Confirm API endpoints and data fields with the team before integration.
- Present causal estimates as decision support, not guaranteed outcomes.
- Keep frontend changes within the agreed `frontend/src/` ownership unless coordinated with the team.
