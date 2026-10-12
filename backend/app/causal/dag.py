
"""Initial causal DAG for EconoCausal."""

class SimpleDAG:
    """Minimal directed graph implementation without external libraries."""

    def __init__(self):
        self.nodes = set()
        self.edges = set()

    def add_node(self, node):
        self.nodes.add(node)

    def add_edge(self, source, target):
        self.nodes.update([source, target])
        self.edges.add((source, target))

    def number_of_nodes(self):
        return len(self.nodes)

    def number_of_edges(self):
        return len(self.edges)

    def has_edge(self, source, target):
        return (source, target) in self.edges


def build_causal_dag():
    """Build the initial hypothesized causal graph."""
    dag = SimpleDAG()

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

    dag.add_edge("discount_offered", "purchased")

    for feature in covariates:
        dag.add_edge(feature, "discount_offered")
        dag.add_edge(feature, "purchased")

    return dag
