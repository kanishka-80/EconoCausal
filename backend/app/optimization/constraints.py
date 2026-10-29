"""Constraint validation and cost helpers for optimization."""
import numpy as np


def calculate_total_subsidy(allocation_matrix: np.ndarray, discount_levels: list[float]) -> float:
    """Calculates total subsidy spend across all allocated customers."""
    discounts = np.asarray(discount_levels, dtype=float)
    return float(np.sum(allocation_matrix @ discounts))
