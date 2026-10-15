
"""Initial causal DAG for EconoCausal.

This is a provisional graph of hypothesized relationships.
Arrows must be reviewed against the data-generation process.
"""

from dataclasses import dataclass, field


TREATMENT = "discount_offered"
OUTCOME = "purchased"

# Candidate features only. Confirm they were measured before treatment.
CANDIDATE_COVARIATES = [
    "age",
    "income_bracket",
    "urbanicity",
    "region",
    "tenure_months",
    "historical_spend",
    "recency_days",
    "browsing_frequency",
    "avg_session_duration_sec",
    "cart_abandonment_rate",
    "support_tickets_count",
    "email_open_rate",
    "previous_discounts_accepted",
    "previous_purchases_12m",
    "avg_order_value",
    "website_visits_30d",
    "mobile_app_user",
    "loyalty_member",
    "subscription_status",
    "preferred_channel",
    "product_category",
    "campaign_type",
    "day_of_week",
    "device_type",
    "competitor_price_index",
    "stock_availability",
    "seasonality_index",
    "customer_satisfaction",
    "return_rate",
    "days_since_last_campaign",
    "marketing_contact_count_30d",
]


@dataclass
class CausalDAG:
    """Minimal directed graph used for the initial DAG specification."""

    nodes: set[str] = field(default_factory=set)
    edges: set[tuple[str, str]] = field(default_factory=set)

    def add_edge(self, source: str, target: str) -> None:
        self.nodes.update((source, target))
        self.edges.add((source, target))

    def number_of_nodes(self) -> int:
        return len(self.nodes)

    def number_of_edges(self) -> int:
        return len(self.edges)

    def has_edge(self, source: str, target: str) -> bool:
        return (source, target) in self.edges


def build_causal_dag() -> CausalDAG:
    """Build a provisional graph from candidate covariates."""
    dag = CausalDAG()
    dag.add_edge(TREATMENT, OUTCOME)

    for feature in CANDIDATE_COVARIATES:
        dag.add_edge(feature, TREATMENT)
        dag.add_edge(feature, OUTCOME)

    return dag
