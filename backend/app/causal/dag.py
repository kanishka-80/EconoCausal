
"""
Initial causal DAG for EconoCausal.

Treatment: discount_offered
Outcome: purchased

Candidate confounders must be verified as pre-treatment variables.
"""

import networkx as nx


def build_causal_dag() -> nx.DiGraph:
    """Build the initial hypothesized causal graph."""

    dag = nx.DiGraph()

    # Treatment and outcome
    dag.add_edge("discount_offered", "purchased")

    # Candidate pre-treatment covariates from the dataset
    covariates = [
        "age",
        "income_bracket",
        "urbanicity",
        "tenure_months",
        "historical_spend",
        "recency_days",
        "browsing_frequency",
        "avg_session_duration_sec",
        "cart_abandonment_rate",
        "support_tickets_count",
        "email_open_rate",
        "previous_discounts_accepted",
    ]

    dag.add_nodes_from(covariates)

    # Initial hypotheses:
    # Customer characteristics may influence discount assignment
    # and purchase behavior. Validate these relationships with the
    # project team and data-generation process before causal estimation.
    for feature in covariates:
        dag.add_edge(feature, "discount_offered")
        dag.add_edge(feature, "purchased")

    return dag
