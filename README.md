# EconoCausal
### Causal Intelligence & Budget Optimization Platform

**Better Data. Deeper Insights. Smarter Decisions.**

EconoCausal is a data-driven causal intelligence platform designed to help businesses understand the actual impact of marketing interventions and make smarter budget allocation decisions.

Unlike traditional predictive analytics systems that primarily identify patterns and correlations, EconoCausal focuses on estimating causal effects using Double Machine Learning (DML) and optimizing treatment allocation under budget constraints.

The platform combines causal machine learning, data analytics, and budget optimization into an interactive dashboard.

---

## Table of Contents

1. [Project Overview](#-project-overview)
2. [Problem Statement](#-problem-statement)
3. [Project Objectives](#-project-objectives)
4. [Key Features](#-key-features)
5. [System Architecture](#-system-architecture)
6. [Technology Stack](#-technology-stack)
7. [Causal Machine Learning Methodology](#-causal-machine-learning-methodology)
8. [Budget Optimization](#-budget-optimization)
9. [Frontend Dashboard](#-frontend-dashboard)
10. [Dataset](#-dataset)
11. [Project Structure](#-project-structure)
12. [Installation and Setup](#-installation-and-setup)
13. [API Overview](#-api-overview)
14. [Testing](#-testing)
15. [Team Contributions](#-team-contributions)
16. [Future Enhancements](#-future-enhancements)

---

## 📌 Project Overview

Businesses frequently offer discounts and promotional incentives to increase customer conversions. However, offering the same discount to every customer can result in unnecessary marketing expenditure.

EconoCausal addresses this challenge by using causal machine learning to estimate how different discount levels influence customer purchasing behavior.

The platform aims to help businesses:

- Understand the causal impact of marketing interventions.
- Estimate Average Treatment Effect (ATE).
- Analyze heterogeneous treatment effects (CATE).
- Identify customer segments with different treatment responses.
- Optimize discount allocation under a defined marketing budget.
- Visualize analytical results through an interactive dashboard.

**Core Idea:** Move beyond predicting what customers might do and estimate what changes when a business takes a particular action.

---

## 🎯 Problem Statement

Traditional marketing strategies often rely on historical correlations, assumptions, and uniform promotional campaigns.

These approaches can lead to:

- Unnecessary discount expenditure.
- Inefficient marketing budget utilization.
- Difficulty identifying customers who respond to incentives.
- Inability to distinguish correlation from causation.
- Limited understanding of customer-level treatment effects.

EconoCausal introduces a causal machine learning-based approach to address these challenges.

---

## 🚀 Project Objectives

1. Develop a unified platform for customer-level causal analysis.
2. Estimate treatment effects using Double Machine Learning.
3. Analyze heterogeneous treatment effects across customer segments.
4. Evaluate model reliability through diagnostic and refutation methods.
5. Optimize discount allocation under budget constraints.
6. Provide an interactive dashboard for analytical interpretation.
7. Integrate the frontend, backend, and machine learning pipeline.

---

## ✨ Key Features

### 1. Data Upload and Validation
- Upload customer datasets in CSV format.
- Parse and validate uploaded data.
- Inspect dataset dimensions and missing values.
- Preview uploaded records.

### 2. Exploratory Data Analysis
- Numerical and categorical feature analysis.
- Statistical summaries.
- Correlation analysis.
- Distribution visualization.
- Dataset insights and quality indicators.

### 3. Causal Analysis
- Treatment and outcome variable selection.
- Confounder selection.
- Double Machine Learning-based estimation.
- Average Treatment Effect (ATE).
- Conditional Average Treatment Effect (CATE).
- Confidence intervals.
- Model diagnostics and refutation checks.

### 4. Budget Optimization
- Configure marketing budget.
- Select supported discount levels.
- Choose optimization objectives.
- Generate customer-level discount allocations.
- Analyze total expenditure and unused budget.
- View customer-wise recommendations.

### 5. Interactive Analytics Dashboard
- Dataset overview.
- Causal analysis results.
- Treatment effect visualizations.
- Budget allocation summaries.
- Customer assignment tables.
- Analysis history and notifications.

---

## 🏗️ System Architecture

The platform follows a modular architecture consisting of frontend, backend, data processing, machine learning, and optimization layers.

```text
                 EconoCausal Platform
                          |
             +------------+------------+
             |                         |
        Frontend                   Backend
       React + Vite                 FastAPI
             |                         |
             |                   API Services
             |                         |
             |            +------------+-----------+
             |            |            |           |
             |        Data API     Causal API  Optimization API
             |            |            |           |
             |            |        DML Engine      |
             |            |            |           |
             |            |       ATE / CATE       |
             |            |            |           |
             |            |      Diagnostics      |
             |            |                        |
             +------------+------------------------+
                          |
                  Analytics Dashboard
                          |
                  Business Insights
```

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Styling | CSS3, CSS Variables |
| Visualization | Plotly.js |
| Icons | Lucide React |
| Backend | Python, FastAPI |
| Machine Learning | Double Machine Learning |
| Data Processing | Pandas, NumPy |
| Statistical Analysis | SciPy, Scikit-learn |
| API Communication | REST API, Fetch API |
| Testing | Pytest, Node.js Test Runner |
| Version Control | Git, GitHub |

---

## 🧠 Causal Machine Learning Methodology

EconoCausal uses Double Machine Learning (DML) to estimate causal treatment effects while accounting for observed confounding variables.

### 1. Treatment Variable

Represents the intervention applied to customers, such as discount levels.

### 2. Outcome Variable

Represents the target business outcome, such as customer purchase or conversion.

### 3. Confounding Variables

Represent observed customer characteristics that may influence both treatment assignment and outcomes.

### 4. Double Machine Learning

DML uses machine learning models to estimate nuisance functions and reduce confounding bias under its identification assumptions.

### 5. Average Treatment Effect (ATE)

Estimates the average causal impact of a treatment across the analyzed population.

### 6. Conditional Average Treatment Effect (CATE)

Estimates how treatment effects vary across different customer groups or characteristics.

### 7. Model Diagnostics

The platform incorporates diagnostic and refutation methods to examine the robustness of causal estimates.

**Important:** Causal estimates depend on assumptions such as appropriate confounder measurement, treatment assignment, overlap, and correct temporal ordering. Model diagnostics do not independently prove causal validity.

---

## 💰 Budget Optimization

The budget optimization module aims to allocate promotional discounts efficiently across customers.

The optimization workflow includes:

1. Define the available marketing budget.
2. Configure supported discount levels.
3. Select the optimization objective.
4. Evaluate customer-level treatment information.
5. Generate discount allocation recommendations.
6. Calculate total expenditure and unused budget.
7. Display customer-level assignments.

The optimization module supports business objectives such as:

- Maximizing estimated uplift.
- Maximizing revenue.

The final allocation depends on the optimization constraints, available customer data, and treatment-effect estimates.

---

## 📊 Frontend Dashboard

The React-based dashboard provides an interactive interface for exploring datasets and interpreting analytical results.

Major dashboard modules include:

| Module | Description |
|---|---|
| Dashboard Overview | Key project and dataset metrics |
| Dataset Upload | CSV upload and validation |
| Dataset Insights | Statistical analysis and visualizations |
| Causal Analysis | Treatment effect estimation and diagnostics |
| Budget Allocation | Budget optimization and customer assignments |
| Analysis History | Historical analysis interface |
| Notifications | Application status and notifications |

---

## 📁 Dataset

EconoCausal uses customer-level structured datasets for data analysis and causal modeling.

The project includes an expanded synthetic dataset and an enriched synthetic dataset for development and experimentation.

Example features include:

- Customer demographics.
- Income and customer characteristics.
- Historical spending.
- Browsing behavior.
- Discount offers.
- Purchase outcomes.
- Revenue and profit-related variables.

**Dataset Disclaimer:** Synthetic datasets are used for development and experimentation. Results obtained from synthetic data should not be interpreted as validated real-world business outcomes.

---

## 📂 Project Structure

```text
EconoCausal/
│
├── backend/
│   └── app/
│       ├── api/
│       ├── causal/
│       ├── optimization/
│       ├── schemas/
│       └── services/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── tests/
│   ├── package.json
│   └── vite.config.js
│
├── docs/
├── reports/
├── tests/
│
├── EconoCausal_project.ipynb
├── econocausal_dataset_expanded.csv
├── econocausal_enriched_synthetic_dataset.csv
└── README.md
```

*Note: This represents the logical project structure. Exact files may vary across branches and development versions.*

---

## ⚙️ Installation and Setup

### Prerequisites

- Python 3.10+
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/kanishka-80/EconoCausal.git
cd EconoCausal
```

### 2. Backend Setup

```bash
python -m venv .venv
```

Activate the environment:

**Windows:**
```powershell
.venv\Scripts\activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn backend.app.main:app --reload
```

The exact application import path and dependency file should be verified against the checked-out branch.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed by Vite, typically:

```text
http://localhost:5173
```

### 4. API Documentation

If the FastAPI server is running with its default documentation configuration:

```text
http://127.0.0.1:8000/docs
```

---

## 🔌 API Overview

The application uses REST APIs for frontend-backend communication.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Backend health check |
| `/api/data/upload` | POST | Upload dataset |
| `/api/data/summary` | GET | Retrieve dataset summary |
| `/api/causal/analyze` | POST | Execute causal analysis |
| `/api/causal/results/{id}` | GET | Retrieve causal results |
| `/api/optimization/run` | POST | Execute budget optimization |

*Endpoint availability and request/response schemas should be verified against the deployed backend version.*

---

## 🧪 Testing

The project includes testing at different levels.

### Backend Testing

Backend tests use Pytest to validate application functionality, including:

- API routes.
- Service layer.
- Data schemas.
- Optimization logic.
- Integration workflows.

Run:

```bash
pytest
```

### Frontend Testing

Frontend tests use the native Node.js test runner.

```bash
cd frontend
npm test
```

### Build Validation

```bash
npm run build
```

Testing results should be recorded only after executing the corresponding commands on the final integrated branch.

---

## 👥 Team Contributions

EconoCausal is a collaborative project developed through contributions across frontend engineering, backend development, data analytics, and machine learning.

Each team member contributed to a different part of the overall platform.

### Khushi — Frontend Development

**Primary Responsibility: Frontend & User Interface**

- Developed the React-based frontend dashboard.
- Implemented reusable UI components.
- Built dataset upload and preview interfaces.
- Developed causal analysis and budget allocation panels.
- Implemented data visualization components.
- Integrated frontend services with backend APIs.
- Worked on responsive layouts and user experience.

### Harsh — Backend Development

**Primary Responsibility: Backend Architecture & API Development**

- Developed backend application components.
- Implemented REST API endpoints.
- Worked on backend services and request validation.
- Developed causal analysis and optimization API integration.
- Worked on DML service integration.
- Contributed to backend testing and system integration.

### Ritik — Data Analytics & Machine Learning

**Primary Responsibility: Data Processing & ML Support**

- Contributed to dataset preparation and analysis.
- Worked on exploratory data analysis.
- Contributed to feature analysis and data preprocessing.
- Participated in machine learning experimentation.
- Supported the development and evaluation of analytical workflows.

### Vishal — Data Analytics & Machine Learning

**Primary Responsibility: Data Science, Causal ML & Analytical Workflows**

- Contributed to dataset preparation and validation.
- Worked on exploratory data analysis and statistical insights.
- Contributed to causal machine learning implementation.
- Worked on Double Machine Learning workflows.
- Contributed to treatment-effect analysis and model evaluation.
- Supported integration of analytical results into the overall platform.

### Team Collaboration

All team members collaborated toward building an integrated causal intelligence and budget optimization platform.

The project combines frontend development, backend engineering, data analytics, and machine learning into one unified application.

---

## 🔮 Future Enhancements

Potential future improvements include:

- Advanced propensity score diagnostics.
- Cross-fitting and robustness improvements for causal estimation.
- Enhanced heterogeneous treatment effect analysis.
- Interactive model evaluation reports.
- Advanced budget allocation strategies.
- Dashboard pagination and performance optimization.
- Historical campaign comparison.
- Production deployment and monitoring.
- Real-world dataset validation.

---

## 🎓 Project Information

**Project Name:** EconoCausal  
**Category:** Data Science, Causal Machine Learning & Business Analytics  
**Application Domain:** Marketing Analytics and Budget Optimization  
**Architecture:** Full-Stack Web Application  
**Development:** Collaborative Team Project  

---

## 🙌 Acknowledgements

We would like to acknowledge the contributions of all team members who worked across frontend development, backend engineering, data analytics, and machine learning.

EconoCausal represents our collaborative effort to explore how causal machine learning can support more informed, data-driven business decisions.

---

**EconoCausal — From Predictive Insights to Causal Decisions.**
