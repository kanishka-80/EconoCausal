
import unittest

import pandas as pd

from backend.app.causal.propensity import (
    estimate_propensity_scores,
    propensity_diagnostics,
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


if __name__ == "__main__":
    unittest.main()
