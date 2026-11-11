#!/usr/bin/env python3
"""Restaurant Menu Decision Support System (Menu-DSS) Demo Runner

Interactive prototype demonstrating menu engineering and multi-criteria
decision support for restaurant menu optimization.
"""

import csv
import sys
from pathlib import Path

# Add project root to path for local imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from demo.modules.menu_analysis import analyze_menu
from demo.modules.dss_model import calculate_dss_scores


def load_sample_data(csv_path: Path):
    """Load sample menu dataset from CSV."""
    items = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            items.append({
                "id": int(row["id"]),
                "item_name": row["item_name"],
                "category": row["category"],
                "cost_price": float(row["cost_price"]),
                "selling_price": float(row["selling_price"]),
                "units_sold": int(row["units_sold"]),
                "customer_rating": float(row["customer_rating"]),
                "prep_time_min": float(row["prep_time_min"]),
            })
    return items


def print_banner():
    banner = """
================================================================================
             RESTAURANT MENU DECISION SUPPORT SYSTEM (Menu-DSS)
             HUST - Group Project for Decision Support System
================================================================================
"""
    print(banner)


def display_results(results, scored_items):
    print(f"Total Menu Items Analyzed: {len(results['items'])}")
    print(f"Total Sales Volume:        {results['total_units_sold']:,} units")
    print(f"Total Gross Revenue:       ${results['total_revenue']:,.2f}")
    print(f"Total Gross Margin:        ${results['total_gross_profit']:,.2f}")
    print(f"Average Contribution Margin: ${results['avg_contribution_margin']:.2f}")
    print(f"Popularity Hurdle Rate:      {results['popularity_hurdle_rate']:.2f}%")
    print("-" * 80)

    # Matrix Summary counts
    quadrant_counts = {"Star": 0, "Plowhorse": 0, "Puzzle": 0, "Dog": 0}
    for item in results["items"]:
        quadrant_counts[item["classification"]] += 1

    print("\n[1] MENU ENGINEERING MATRIX CLASSIFICATION (Kasavana & Smith)")
    print(f"  * Stars      (High Margin, High Demand): {quadrant_counts['Star']}")
    print(f"  * Plowhorses (Low Margin,  High Demand): {quadrant_counts['Plowhorse']}")
    print(f"  * Puzzles    (High Margin, Low Demand) : {quadrant_counts['Puzzle']}")
    print(f"  * Dogs       (Low Margin,  Low Demand) : {quadrant_counts['Dog']}")
    print("\n" + "=" * 95)

    header = f"{'Item Name':<28} {'Cat':<10} {'Price':>7} {'Margin':>7} {'Sold':>6} {'Mix%':>6} {'Class':<10} {'Score':>6}"
    print(header)
    print("-" * 95)

    for item in scored_items:
        print(
            f"{item['item_name']:<28} "
            f"{item['category']:<10} "
            f"${item['selling_price']:>6.2f} "
            f"${item['margin']:>6.2f} "
            f"{item['units_sold']:>6} "
            f"{item['popularity_pct']:>5.1f}% "
            f"{item['classification']:<10} "
            f"{item['dss_score']:>6.1f}"
        )
    print("=" * 95)

    print("\n[2] PRESCRIPTIVE DECISION RECOMMENDATIONS")
    for category in ["Star", "Plowhorse", "Puzzle", "Dog"]:
        matched = [i for i in scored_items if i["classification"] == category]
        if matched:
            print(f"\n>>> Category: {category.upper()}S")
            for item in matched:
                print(f"  - {item['item_name']} (DSS Score: {item['dss_score']}):")
                print(f"    Action: {item['recommended_action']}")

    print("\n" + "=" * 80)
    print("Demo completed successfully. Customize data at data/menu_items.csv")
    print("=" * 80)


def main():
    """Main execution function."""
    print_banner()
    data_path = PROJECT_ROOT / "data" / "menu_items.csv"
    if not data_path.exists():
        print(f"Error: Dataset not found at {data_path}", file=sys.stderr)
        sys.exit(1)

    items = load_sample_data(data_path)
    analysis_results = analyze_menu(items)
    scored_items = calculate_dss_scores(analysis_results["items"])
    display_results(analysis_results, scored_items)


if __name__ == "__main__":
    main()
