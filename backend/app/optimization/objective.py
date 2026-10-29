"""Objective functions for promotional budget allocation."""
import numpy as np


def compute_total_uplift(allocation_matrix: np.ndarray, uplift_matrix: np.ndarray) -> float:
    """Computes total expected incremental conversions."""
    return float(np.sum(allocation_matrix * uplift_matrix))
