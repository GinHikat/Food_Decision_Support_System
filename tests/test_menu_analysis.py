import pytest
from demo.modules.menu_analysis import analyze_menu
from demo.modules.dss_model import calculate_dss_scores


def test_analyze_menu():
    sample_items = [
        {
            "id": 1,
            "item_name": "High Margin High Demand",
            "category": "Main",
            "cost_price": 5.0,
            "selling_price": 20.0,
            "units_sold": 100,
            "customer_rating": 4.5,
            "prep_time_min": 10,
        },
        {
            "id": 2,
            "item_name": "Low Margin Low Demand",
            "category": "Appetizer",
            "cost_price": 8.0,
            "selling_price": 10.0,
            "units_sold": 10,
            "customer_rating": 3.8,
            "prep_time_min": 15,
        },
    ]

    result = analyze_menu(sample_items)
    assert result["total_units_sold"] == 110
    assert len(result["items"]) == 2

    star_item = next(i for i in result["items"] if i["id"] == 1)
    dog_item = next(i for i in result["items"] if i["id"] == 2)

    assert star_item["classification"] == "Star"
    assert dog_item["classification"] == "Dog"


def test_calculate_dss_scores():
    sample_items = [
        {"margin": 15.0, "units_sold": 100, "customer_rating": 4.8, "prep_time_min": 10},
        {"margin": 2.0, "units_sold": 10, "customer_rating": 3.5, "prep_time_min": 25},
    ]
    scored = calculate_dss_scores(sample_items)
    assert len(scored) == 2
    assert scored[0]["dss_score"] > scored[1]["dss_score"]
