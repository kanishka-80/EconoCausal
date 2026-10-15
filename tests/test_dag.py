
import unittest

from EconoCausal.backend.app.causal.dag import (
    CANDIDATE_COVARIATES,
    OUTCOME,
    TREATMENT,
    build_causal_dag,
)


class TestCausalDAG(unittest.TestCase):

    def setUp(self):
        self.dag = build_causal_dag()

    def test_treatment_and_outcome_exist(self):
        self.assertIn(TREATMENT, self.dag.nodes)
        self.assertIn(OUTCOME, self.dag.nodes)

    def test_treatment_to_outcome_edge_exists(self):
        self.assertTrue(self.dag.has_edge(TREATMENT, OUTCOME))

    def test_candidate_covariates_are_in_graph(self):
        for feature in CANDIDATE_COVARIATES:
            with self.subTest(feature=feature):
                self.assertIn(feature, self.dag.nodes)

    def test_expected_graph_size(self):
        self.assertEqual(
            self.dag.number_of_nodes(),
            len(CANDIDATE_COVARIATES) + 2,
        )
        self.assertEqual(
            self.dag.number_of_edges(),
            2 * len(CANDIDATE_COVARIATES) + 1,
        )

    def test_no_self_loops(self):
        for source, target in self.dag.edges:
            with self.subTest(edge=(source, target)):
                self.assertNotEqual(source, target)


if __name__ == "__main__":
    unittest.main()
