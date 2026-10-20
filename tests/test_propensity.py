
import unittest

import pandas as pd

from backend.app.causal.propensity import (
    estimate_propensity_scores,
    propensity_diagnostics,
    covariate_balance_diagnostics,
)


class TestPropensity(unittest.TestCase):

    def setUp(self):
        self.data = pd.DataFrame({
            "discount_offered": [0, 5, 10, 20] * 20,
            "age": list(range(20, 100)),
            "income_bracket": ["low", "middle", "high", "middle"] * 20,
            "urbanicity": ["urban", "rural"] * 40,
        })

    def test_returns_one_probability_per_treatment_level(self):
        scores = estimate_propensity_scores(
            self.data,
            covariates=["age", "income_bracket", "urbanicity"],
        )
        self.assertEqual(scores.shape, (80, 4))
        self.assertEqual(
            list(scores.columns),
            [
                "propensity_0",
                "propensity_5",
                "propensity_10",
                "propensity_20",
            ],
        )

    def test_probabilities_sum_to_one(self):
        scores = estimate_propensity_scores(
            self.data,
            covariates=["age", "income_bracket", "urbanicity"],
        )
        self.assertTrue(
            ((scores.sum(axis=1) - 1).abs() < 1e-6).all()
        )

    def test_diagnostics_summary(self):
        scores = estimate_propensity_scores(
            self.data,
            covariates=["age", "income_bracket", "urbanicity"],
        )
        report = propensity_diagnostics(scores)
        self.assertEqual(report["n_observations"], 80)
        self.assertEqual(report["n_treatment_groups"], 4)
        self.assertTrue(report["probabilities_sum_to_one"])

    def test_missing_treatment_column_is_rejected(self):
        with self.assertRaises(ValueError):
            estimate_propensity_scores(
                self.data.drop(columns=["discount_offered"]),
                covariates=["age"],
            )

    def test_missing_covariate_is_rejected(self):
        with self.assertRaises(ValueError):
            estimate_propensity_scores(
                self.data,
                covariates=["age", "unknown_feature"],
            )

    def test_invalid_probability_values_are_rejected(self):
        invalid_scores = pd.DataFrame({
                "propensity_0": [1.2, 0.4],
                "propensity_5": [-0.2, 0.6],
        })

        with self.assertRaises(ValueError):
                propensity_diagnostics(invalid_scores)

    def test_probabilities_not_summing_to_one_are_reported(self):
        scores = pd.DataFrame({
            "propensity_0": [0.2, 0.3],
            "propensity_5": [0.2, 0.3],
        })

        report = propensity_diagnostics(scores)

        self.assertFalse(report["probabilities_sum_to_one"])

    def test_numeric_covariate_balance_returns_pairwise_results(self):
        report = covariate_balance_diagnostics(
            self.data,
            covariates=["age"],
        )

        self.assertEqual(len(report), 6)
        self.assertIn("absolute_smd", report.columns)
        self.assertIn("imbalanced_at_0_1", report.columns)

if __name__ == "__main__":
    unittest.main()
 