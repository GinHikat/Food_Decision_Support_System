"""Decision Support System (DSS) Multi-Criteria Evaluation Module

Calculates multi-attribute utility scores balancing profitability, demand,
customer ratings, and kitchen execution complexity.
"""

from typing import List, Dict, Any


def calculate_dss_scores(
    items: List[Dict[str, Any]],
    weights: Dict[str, float] = None,
) -> List[Dict[str, Any]]:
    """Compute normalized composite DSS score for menu prioritization.

    Default weights:
        - Profitability (Margin): 35%
        - Popularity (Sales Volume): 30%
        - Customer Satisfaction (Rating): 20%
        - Operational Ease (Lower Prep Time): 15%
    """
    if weights is None:
        weights = {
            "margin": 0.35,
            "popularity": 0.30,
            "rating": 0.20,
            "prep_ease": 0.15,
        }

    if not items:
        return []

    # Find min and max for min-max normalization
    margins = [item["margin"] for item in items]
    popularities = [item["units_sold"] for item in items]
    ratings = [float(item.get("customer_rating", 4.0)) for item in items]
    prep_times = [float(item.get("prep_time_min", 15.0)) for item in items]

    min_margin, max_margin = min(margins), max(margins)
    min_pop, max_pop = min(popularities), max(popularities)
    min_rating, max_rating = min(ratings), max(ratings)
    min_prep, max_prep = min(prep_times), max(prep_times)

    def norm(val: float, low: float, high: float) -> float:
        if high == low:
            return 1.0
        return (val - low) / (high - low)

    scored_items = []
    for item in items:
        n_margin = norm(item["margin"], min_margin, max_margin)
        n_pop = norm(item["units_sold"], min_pop, max_pop)
        n_rating = norm(float(item.get("customer_rating", 4.0)), min_rating, max_rating)
        # Prep ease is inverse of prep time (shorter time -> higher ease)
        n_ease = 1.0 - norm(float(item.get("prep_time_min", 15.0)), min_prep, max_prep)

        composite_score = (
            n_margin * weights["margin"]
            + n_pop * weights["popularity"]
            + n_rating * weights["rating"]
            + n_ease * weights["prep_ease"]
        ) * 100.0

        scored_item = {
            **item,
            "dss_score": round(composite_score, 2),
        }
        scored_items.append(scored_item)

    scored_items.sort(key=lambda x: x["dss_score"], reverse=True)
    return scored_items
