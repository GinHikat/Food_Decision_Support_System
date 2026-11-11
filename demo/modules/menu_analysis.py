"""Menu Engineering Analysis Module

Implements the classic Kasavana & Smith (1982) Menu Engineering Matrix:
- Stars: High Contribution Margin, High Popularity
- Plowhorses: Low Contribution Margin, High Popularity
- Puzzles: High Contribution Margin, Low Popularity
- Dogs: Low Contribution Margin, Low Popularity
"""

from typing import Dict, Any, List


def analyze_menu(items: List[Dict[str, Any]], hurdle_rate_factor: float = 0.70) -> Dict[str, Any]:
    """Perform menu engineering calculations on a list of menu items.

    Args:
        items: List of dictionary containing menu items.
        hurdle_rate_factor: Popularity hurdle multiplier (default: 0.70 of fair share).

    Returns:
        Dictionary with overall benchmark metrics and processed items.
    """
    total_units_sold = sum(item["units_sold"] for item in items)
    num_items = len(items)

    if total_units_sold == 0 or num_items == 0:
        return {"items": [], "avg_margin": 0.0, "hurdle_rate": 0.0}

    # Fair share hurdle rate: (1 / N) * hurdle_rate_factor
    hurdle_rate_pct = (1.0 / num_items) * hurdle_rate_factor * 100.0

    # Calculate contribution margins and total contribution
    total_weighted_margin = 0.0
    processed = []

    for item in items:
        price = float(item["selling_price"])
        cost = float(item["cost_price"])
        units = int(item["units_sold"])

        margin = price - cost
        food_cost_pct = (cost / price * 100.0) if price > 0 else 0.0
        revenue = price * units
        total_margin = margin * units
        popularity_pct = (units / total_units_sold) * 100.0

        total_weighted_margin += total_margin

        processed.append({
            **item,
            "margin": margin,
            "food_cost_pct": food_cost_pct,
            "revenue": revenue,
            "total_margin": total_margin,
            "popularity_pct": popularity_pct,
        })

    # Weighted average contribution margin
    avg_cm = total_weighted_margin / total_units_sold

    # Classify each item
    for item in processed:
        high_cm = item["margin"] >= avg_cm
        high_pop = item["popularity_pct"] >= hurdle_rate_pct

        if high_cm and high_pop:
            classification = "Star"
            action = "Maintain high visibility and consistent quality; protect recipe."
        elif not high_cm and high_pop:
            classification = "Plowhorse"
            action = "Increase price incrementally, reduce portion/cost, or bundle with high-margin side."
        elif high_cm and not high_pop:
            classification = "Puzzle"
            action = "Improve menu placement, feature as chef's special, or train staff to upsell."
        else:
            classification = "Dog"
            action = "Consider removing from menu or reinventing recipe/pricing."

        item["classification"] = classification
        item["recommended_action"] = action

    return {
        "items": processed,
        "total_units_sold": total_units_sold,
        "total_revenue": sum(i["revenue"] for i in processed),
        "total_gross_profit": total_weighted_margin,
        "avg_contribution_margin": avg_cm,
        "popularity_hurdle_rate": hurdle_rate_pct,
    }
