"""Data Aggregation & Enrichment Pipeline for Menu-DSS

Merges three heterogeneous raw restaurant datasets:
1. foods_dataset_.csv (1,000 rows -> 10 dishes, INR prices, dietary & spice tags)
2. restaurant_menu_optimization_data.csv (1,000 rows -> 16 dishes, USD prices, profitability)
3. restaurant_sales_data.csv (10,000 rows -> 14 dishes, daily POS sales, cost & price)

Outputs a harmonized 40-dish master dataset at `data/processed/menu_dss_master.csv`.
"""

import ast
import random
from pathlib import Path
from typing import Dict, Any, List
import pandas as pd


INR_TO_USD = 84.0

# Deterministic culinary metadata enrichment & noise correction for the 40 unique dishes
DISH_ENRICHMENT: Dict[str, Dict[str, Any]] = {
    # --- F1: foods_dataset_.csv (10 dishes) ---
    "Brownie": {
        "category": "Dessert",
        "cuisine_type": "Western",
        "food_type": "Veg",
        "spice_level": "None",
        "ingredients": ["dark chocolate", "butter", "sugar", "eggs", "flour", "walnuts"],
        "prep_time_min": 12,
    },
    "Chicken Biryani": {
        "category": "Main Course",
        "cuisine_type": "Indian",
        "food_type": "Non-Veg",
        "spice_level": "Medium",
        "ingredients": ["basmati rice", "chicken", "yogurt", "onions", "saffron", "biryani masala"],
        "prep_time_min": 22,
    },
    "Chicken Manchurian": {
        "category": "Appetizer",
        "cuisine_type": "Chinese",
        "food_type": "Non-Veg",
        "spice_level": "Medium",
        "ingredients": ["chicken", "soy sauce", "garlic", "ginger", "bell peppers", "spring onions"],
        "prep_time_min": 15,
    },
    "Cold Coffee": {
        "category": "Beverage",
        "cuisine_type": "Cafe",
        "food_type": "Veg",
        "spice_level": "None",
        "ingredients": ["espresso", "milk", "sugar", "ice", "chocolate syrup"],
        "prep_time_min": 4,
    },
    "Gulab Jamun": {
        "category": "Dessert",
        "cuisine_type": "Indian",
        "food_type": "Veg",
        "spice_level": "None",
        "ingredients": ["milk solids", "flour", "sugar syrup", "cardamom", "rose water", "ghee"],
        "prep_time_min": 10,
    },
    "Lemon Iced Tea": {
        "category": "Beverage",
        "cuisine_type": "Cafe",
        "food_type": "Vegan",
        "spice_level": "None",
        "ingredients": ["black tea", "lemon juice", "sugar syrup", "mint", "ice"],
        "prep_time_min": 3,
    },
    "Margherita Pizza": {
        "category": "Main Course",
        "cuisine_type": "Italian",
        "food_type": "Veg",
        "spice_level": "Mild",
        "ingredients": ["pizza dough", "tomato sauce", "mozzarella", "fresh basil", "olive oil"],
        "prep_time_min": 14,
    },
    "Paneer Butter Masala": {
        "category": "Main Course",
        "cuisine_type": "Indian",
        "food_type": "Veg",
        "spice_level": "Mild",
        "ingredients": ["paneer", "tomatoes", "butter", "cream", "cashews", "garam masala"],
        "prep_time_min": 18,
    },
    "Spring Rolls": {
        "category": "Appetizer",
        "cuisine_type": "Chinese",
        "food_type": "Veg",
        "spice_level": "Mild",
        "ingredients": ["pastry wrapper", "cabbage", "carrots", "glass noodles", "soy sauce"],
        "prep_time_min": 10,
    },
    "Veg Hakka Noodles": {
        "category": "Main Course",
        "cuisine_type": "Chinese",
        "food_type": "Vegan",
        "spice_level": "Spicy",
        "ingredients": ["hakka noodles", "cabbage", "carrots", "bell peppers", "soy sauce", "chili"],
        "prep_time_min": 12,
    },
    # --- F2: restaurant_menu_optimization_data.csv (16 dishes) ---
    "Bruschetta": {
        "cuisine_type": "Italian",
        "food_type": "Vegan",
        "spice_level": "None",
        "ingredients": ["baguette", "tomatoes", "basil", "garlic", "olive oil"],
        "prep_time_min": 8,
    },
    "Caprese Salad": {
        "cuisine_type": "Italian",
        "food_type": "Veg",
        "spice_level": "None",
        "ingredients": ["tomatoes", "fresh mozzarella", "basil", "olive oil", "balsamic glaze"],
        "prep_time_min": 7,
    },
    "Chicken Alfredo": {
        "cuisine_type": "Italian",
        "food_type": "Non-Veg",
        "spice_level": "None",
        "ingredients": ["chicken", "fettuccine", "alfredo sauce", "parmesan", "garlic"],
        "prep_time_min": 16,
    },
    "Chocolate Lava Cake": {
        "cuisine_type": "Western",
        "food_type": "Veg",
        "spice_level": "None",
        "ingredients": ["dark chocolate", "butter", "sugar", "eggs", "flour"],
        "prep_time_min": 14,
    },
    "Coffee": {
        "cuisine_type": "Cafe",
        "food_type": "Vegan",
        "spice_level": "None",
        "ingredients": ["roasted coffee beans", "water"],
        "prep_time_min": 3,
    },
    "Fruit Tart": {
        "cuisine_type": "Western",
        "food_type": "Veg",
        "spice_level": "None",
        "ingredients": ["pastry crust", "custard cream", "seasonal berries", "sugar", "butter"],
        "prep_time_min": 10,
    },
    "Grilled Steak": {
        "cuisine_type": "Western",
        "food_type": "Non-Veg",
        "spice_level": "Mild",
        "ingredients": ["ribeye beef", "butter", "rosemary", "garlic", "black pepper"],
        "prep_time_min": 20,
    },
    "Iced Tea": {
        "cuisine_type": "Cafe",
        "food_type": "Vegan",
        "spice_level": "None",
        "ingredients": ["black tea", "sugar syrup", "ice", "lemon slice"],
        "prep_time_min": 3,
    },
    "Lemonade": {
        "cuisine_type": "Cafe",
        "food_type": "Vegan",
        "spice_level": "None",
        "ingredients": ["lemon juice", "sugar syrup", "water", "ice"],
        "prep_time_min": 3,
    },
    "New York Cheesecake": {
        "cuisine_type": "Western",
        "food_type": "Veg",
        "spice_level": "None",
        "ingredients": ["cream cheese", "graham crackers", "sugar", "eggs", "sour cream"],
        "prep_time_min": 8,
    },
    "Shrimp Scampi": {
        "cuisine_type": "Italian",
        "food_type": "Non-Veg",
        "spice_level": "Mild",
        "ingredients": ["shrimp", "linguine", "garlic", "butter", "lemon", "white wine"],
        "prep_time_min": 15,
    },
    "Soda": {
        "cuisine_type": "Cafe",
        "food_type": "Vegan",
        "spice_level": "None",
        "ingredients": ["carbonated water", "sugar", "flavoring"],
        "prep_time_min": 2,
    },
    "Spinach Artichoke Dip": {
        "cuisine_type": "Western",
        "food_type": "Veg",
        "spice_level": "None",
        "ingredients": ["spinach", "artichokes", "cream cheese", "parmesan", "garlic"],
        "prep_time_min": 10,
    },
    "Stuffed Mushrooms": {
        "cuisine_type": "Western",
        "food_type": "Veg",
        "spice_level": "Mild",
        "ingredients": ["button mushrooms", "breadcrumbs", "parmesan", "garlic", "herbs"],
        "prep_time_min": 12,
    },
    "Tiramisu": {
        "cuisine_type": "Italian",
        "food_type": "Veg",
        "spice_level": "None",
        "ingredients": ["mascarpone", "ladyfingers", "espresso", "cocoa powder", "eggs"],
        "prep_time_min": 8,
    },
    "Vegetable Stir-Fry": {
        "cuisine_type": "Asian",
        "food_type": "Vegan",
        "spice_level": "Mild",
        "ingredients": ["broccoli", "bell peppers", "carrots", "snow peas", "soy sauce", "garlic"],
        "prep_time_min": 11,
    },
    # --- F3: restaurant_sales_data.csv (14 dishes) ---
    "Beef Rendang": {
        "category": "Main Course",
        "cuisine_type": "Southeast Asian",
        "food_type": "Non-Veg",
        "spice_level": "Spicy",
        "prep_time_min": 25,
    },
    "Cendol": {
        "category": "Dessert",
        "cuisine_type": "Southeast Asian",
        "food_type": "Vegan",
        "spice_level": "None",
        "prep_time_min": 5,
    },
    "Char Kway Teow": {
        "category": "Main Course",
        "cuisine_type": "Southeast Asian",
        "food_type": "Non-Veg",
        "spice_level": "Medium",
        "prep_time_min": 12,
    },
    "Chicken Chop": {
        "category": "Main Course",
        "cuisine_type": "Western",
        "food_type": "Non-Veg",
        "spice_level": "Mild",
        "prep_time_min": 16,
    },
    "Chicken Rice": {
        "category": "Main Course",
        "cuisine_type": "Southeast Asian",
        "food_type": "Non-Veg",
        "spice_level": "Mild",
        "prep_time_min": 10,
    },
    "Iced Lemon Tea": {
        "category": "Beverage",
        "cuisine_type": "Cafe",
        "food_type": "Vegan",
        "spice_level": "None",
        "prep_time_min": 3,
    },
    "Kaya Toast Set": {
        "category": "Appetizer",
        "cuisine_type": "Southeast Asian",
        "food_type": "Veg",
        "spice_level": "None",
        "prep_time_min": 6,
    },
    "Laksa": {
        "category": "Main Course",
        "cuisine_type": "Southeast Asian",
        "food_type": "Non-Veg",
        "spice_level": "Spicy",
        "prep_time_min": 14,
    },
    "Mushroom Soup": {
        "category": "Appetizer",
        "cuisine_type": "Western",
        "food_type": "Veg",
        "spice_level": "None",
        "prep_time_min": 8,
    },
    "Nasi Lemak": {
        "category": "Main Course",
        "cuisine_type": "Southeast Asian",
        "food_type": "Non-Veg",
        "spice_level": "Medium",
        "prep_time_min": 12,
    },
    "Roti Canai": {
        "category": "Appetizer",
        "cuisine_type": "Southeast Asian",
        "food_type": "Veg",
        "spice_level": "Mild",
        "prep_time_min": 8,
    },
    "Spaghetti Carbonara": {
        "category": "Main Course",
        "cuisine_type": "Italian",
        "food_type": "Non-Veg",
        "spice_level": "Mild",
        "prep_time_min": 15,
    },
    "Tandoori Chicken": {
        "category": "Main Course",
        "cuisine_type": "Indian",
        "food_type": "Non-Veg",
        "spice_level": "Medium",
        "prep_time_min": 20,
    },
    "Teh Tarik": {
        "category": "Beverage",
        "cuisine_type": "Southeast Asian",
        "food_type": "Veg",
        "spice_level": "None",
        "prep_time_min": 4,
    },
}


# Nutrition & portion metadata: (calories_kcal, serving_size_persons)
DISH_NUTRITION_PORTION: Dict[str, tuple] = {
    # Appetizers
    "Bruschetta": (320, 2),
    "Caprese Salad": (260, 1),
    "Chicken Manchurian": (420, 2),
    "Kaya Toast Set": (380, 1),
    "Mushroom Soup": (240, 1),
    "Roti Canai": (310, 1),
    "Spinach Artichoke Dip": (480, 2),
    "Spring Rolls": (340, 2),
    "Stuffed Mushrooms": (360, 2),
    # Beverages
    "Coffee": (15, 1),
    "Cold Coffee": (210, 1),
    "Iced Lemon Tea": (110, 1),
    "Iced Tea": (90, 1),
    "Lemonade": (120, 1),
    "Soda": (140, 1),
    "Teh Tarik": (180, 1),
    # Desserts
    "Brownie": (380, 1),
    "Cendol": (290, 1),
    "Chocolate Lava Cake": (450, 1),
    "Fruit Tart": (310, 1),
    "Gulab Jamun": (320, 1),
    "New York Cheesecake": (420, 1),
    "Tiramisu": (390, 1),
    # Main Courses
    "Beef Rendang": (640, 1),
    "Char Kway Teow": (680, 1),
    "Chicken Alfredo": (750, 1),
    "Chicken Biryani": (690, 1),
    "Chicken Chop": (620, 1),
    "Chicken Rice": (580, 1),
    "Grilled Steak": (670, 1),
    "Laksa": (590, 1),
    "Margherita Pizza": (920, 2),
    "Nasi Lemak": (610, 1),
    "Paneer Butter Masala": (560, 1),
    "Shrimp Scampi": (540, 1),
    "Spaghetti Carbonara": (720, 1),
    "Tandoori Chicken": (490, 1),
    "Veg Hakka Noodles": (520, 1),
    "Vegetable Stir-Fry": (390, 1),
}

ALLERGEN_KEYWORDS: Dict[str, List[str]] = {
    "Dairy": [
        "milk", "butter", "cream", "cheese", "mozzarella", "parmesan",
        "mascarpone", "ghee", "paneer", "yogurt", "sour cream",
        "condensed milk", "evaporated milk", "custard", "alfredo",
    ],
    "Gluten": [
        "flour", "dough", "bread", "baguette", "pasta", "spaghetti",
        "fettuccine", "linguine", "noodles", "pastry", "ladyfingers",
        "breadcrumbs", "graham crackers", "soy sauce", "wrapper",
    ],
    "Eggs": ["egg", "eggs", "soft-boiled eggs"],
    "Shellfish": ["shrimp", "prawns", "cockles", "shrimp paste"],
    "Fish": ["fish broth", "anchovies"],
    "Peanuts": ["peanuts", "peanut"],
    "Tree Nuts": ["walnuts", "cashews", "almond"],
    "Soy": ["soy sauce", "tofu"],
}


def compute_satiety_score(calories: int, category: str, serving_size: int) -> int:
    """Compute satiety score (1=Very Light to 5=Very Filling) per person."""
    if category == "Beverage":
        return 1
    kcal_per_person = calories / max(serving_size, 1)
    if kcal_per_person < 150:
        return 1
    elif kcal_per_person < 320:
        return 2
    elif kcal_per_person < 460:
        return 3
    elif kcal_per_person < 650:
        return 4
    else:
        return 5


def extract_allergens(ingredients_str: str) -> str:
    """Curate standardized food allergens from the dish ingredient list."""
    # Remove non-dairy/gluten-free false-positive phrases before keyword matching
    sanitized = (
        ingredients_str.lower()
        .replace("coconut milk", "coconut_liquid")
        .replace("rice flour", "rice_starch")
    )
    detected = []
    for allergen, keywords in ALLERGEN_KEYWORDS.items():
        if any(kw in sanitized for kw in keywords):
            detected.append(allergen)
    return ", ".join(detected) if detected else "None"


def normalize_category(cat: str) -> str:
    """Standardize category names into 4 core groups."""
    mapping = {
        "Starter": "Appetizer",
        "Appetizers": "Appetizer",
        "Main Course": "Main Course",
        "Dessert": "Dessert",
        "Desserts": "Dessert",
        "Beverage": "Beverage",
        "Beverages": "Beverage",
    }
    return mapping.get(cat, cat)


def estimate_units_sold(category: str, selling_price: float, rng: random.Random) -> int:
    """Reproducibly estimate daily/period units sold when missing, scaled by category."""
    base_ranges = {
        "Beverage": (220, 420),
        "Appetizer": (110, 220),
        "Main Course": (120, 280),
        "Dessert": (80, 190),
    }
    low, high = base_ranges.get(category, (100, 200))
    # Slight inverse price elasticity effect
    price_factor = max(0.7, min(1.2, 15.0 / max(selling_price, 1.0)))
    val = rng.randint(low, high) * (0.8 + 0.2 * price_factor)
    return int(round(val))


def build_unified_dataset(raw_dir: Path, output_path: Path) -> pd.DataFrame:
    """Aggregate, harmonize, and enrich the 3 raw datasets into 1 master CSV."""
    rng = random.Random(42)
    records: List[Dict[str, Any]] = []

    # 1. Process foods_dataset_.csv
    f1 = pd.read_csv(raw_dir / "foods_dataset_.csv")
    # Deduplicate: "Lemon Iced Tea" is the same item as "Iced Lemon Tea" in restaurant_sales_data.csv
    # (which has actual POS cost and sales volume), so we exclude it from F1.
    f1 = f1[f1["dish_name"] != "Lemon Iced Tea"]
    f1_agg = (
        f1.groupby("dish_name", as_index=False)
        .agg(
            raw_category=("category", lambda x: x.mode()[0]),
            raw_cuisine=("cuisine_type", lambda x: x.mode()[0]),
            raw_food_type=("food_type", lambda x: x.mode()[0]),
            raw_spice=("spice_level", lambda x: x.mode()[0]),
            price_inr=("price", "mean"),
        )
    )

    for _, row in f1_agg.iterrows():
        name = row["dish_name"]
        meta = DISH_ENRICHMENT[name]
        category = meta.get("category", normalize_category(row["raw_category"]))
        selling_price = round(float(row["price_inr"]) / INR_TO_USD, 2)
        # Estimate food cost around 34% for F1
        cost_ratio = rng.uniform(0.30, 0.38)
        cost_price = round(selling_price * cost_ratio, 2)
        ingredients = meta["ingredients"]

        records.append({
            "dish_name": name,
            "category": category,
            "cuisine_type": meta.get("cuisine_type", row["raw_cuisine"]),
            "food_type": meta.get("food_type", row["raw_food_type"]),
            "spice_level": meta.get("spice_level", row["raw_spice"]),
            "ingredients": ", ".join(ingredients),
            "ingredient_count": len(ingredients),
            "cost_price": cost_price,
            "selling_price": selling_price,
            "units_sold": estimate_units_sold(category, selling_price, rng),
            "prep_time_min": meta["prep_time_min"],
            "customer_rating": round(rng.uniform(4.1, 4.8), 1),
            "profitability_tier": "Medium",
            "source_dataset": "foods_dataset_.csv",
        })

    # 2. Process restaurant_menu_optimization_data.csv
    f2 = pd.read_csv(raw_dir / "restaurant_menu_optimization_data.csv")
    f2_agg = (
        f2.groupby("MenuItem", as_index=False)
        .agg(
            raw_category=("MenuCategory", lambda x: x.mode()[0]),
            raw_ingredients=("Ingredients", "first"),
            selling_price=("Price", "mean"),
            profitability=("Profitability", lambda x: x.mode()[0]),
        )
    )

    cost_ratio_by_tier = {"High": (0.22, 0.28), "Medium": (0.32, 0.38), "Low": (0.42, 0.50)}

    for _, row in f2_agg.iterrows():
        name = row["MenuItem"]
        meta = DISH_ENRICHMENT[name]
        category = normalize_category(row["raw_category"])
        selling_price = round(float(row["selling_price"]), 2)
        tier = row["profitability"]
        low_r, high_r = cost_ratio_by_tier.get(tier, (0.32, 0.38))
        cost_price = round(selling_price * rng.uniform(low_r, high_r), 2)
        ingredients = meta["ingredients"]

        records.append({
            "dish_name": name,
            "category": category,
            "cuisine_type": meta["cuisine_type"],
            "food_type": meta["food_type"],
            "spice_level": meta["spice_level"],
            "ingredients": ", ".join(ingredients),
            "ingredient_count": len(ingredients),
            "cost_price": cost_price,
            "selling_price": selling_price,
            "units_sold": estimate_units_sold(category, selling_price, rng),
            "prep_time_min": meta["prep_time_min"],
            "customer_rating": round(rng.uniform(4.0, 4.9), 1),
            "profitability_tier": tier,
            "source_dataset": "restaurant_menu_optimization_data.csv",
        })

    # 3. Process restaurant_sales_data.csv
    f3 = pd.read_csv(raw_dir / "restaurant_sales_data.csv")
    f3_agg = (
        f3.groupby("menu_item_name", as_index=False)
        .agg(
            ingredients=("key_ingredients_tags", "first"),
            cost_price=("typical_ingredient_cost", "mean"),
            selling_price=("actual_selling_price", "mean"),
            units_sold=("quantity_sold", "mean"),
        )
    )

    for _, row in f3_agg.iterrows():
        name = row["menu_item_name"]
        meta = DISH_ENRICHMENT[name]
        cost_price = round(float(row["cost_price"]), 2)
        selling_price = round(float(row["selling_price"]), 2)
        food_cost_pct = (cost_price / selling_price) * 100.0 if selling_price > 0 else 0.0

        if food_cost_pct < 28.0:
            tier = "High"
        elif food_cost_pct <= 36.0:
            tier = "Medium"
        else:
            tier = "Low"

        ing_list = [i.strip() for i in str(row["ingredients"]).split(",") if i.strip()]

        records.append({
            "dish_name": name,
            "category": meta["category"],
            "cuisine_type": meta["cuisine_type"],
            "food_type": meta["food_type"],
            "spice_level": meta["spice_level"],
            "ingredients": ", ".join(ing_list),
            "ingredient_count": len(ing_list),
            "cost_price": cost_price,
            "selling_price": selling_price,
            "units_sold": int(round(float(row["units_sold"]))),
            "prep_time_min": meta["prep_time_min"],
            "customer_rating": round(rng.uniform(4.2, 4.9), 1),
            "profitability_tier": tier,
            "source_dataset": "restaurant_sales_data.csv",
        })

    master_df = pd.DataFrame(records)
    master_df = master_df.sort_values(by=["category", "dish_name"]).reset_index(drop=True)
    master_df.insert(0, "id", range(1, len(master_df) + 1))

    # Add calculated financial KPIs
    master_df["contribution_margin"] = (master_df["selling_price"] - master_df["cost_price"]).round(2)
    master_df["food_cost_pct"] = (
        (master_df["cost_price"] / master_df["selling_price"]) * 100.0
    ).round(2)

    # Add nutrition, portion size, curated allergens, and stock availability
    master_df["calories"] = master_df["dish_name"].map(lambda n: DISH_NUTRITION_PORTION[n][0])
    master_df["serving_size"] = master_df["dish_name"].map(lambda n: DISH_NUTRITION_PORTION[n][1])
    master_df["satiety_score"] = master_df.apply(
        lambda r: compute_satiety_score(r["calories"], r["category"], r["serving_size"]), axis=1
    )
    master_df["allergens"] = master_df["ingredients"].apply(extract_allergens)
    # Simulate ~10% temporary out-of-stock items deterministically
    unavailable_indices = set(rng.sample(range(len(master_df)), k=4))
    master_df["is_available"] = [idx not in unavailable_indices for idx in range(len(master_df))]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    master_df.to_csv(output_path, index=False, encoding="utf-8")
    return master_df


def build_customer_database(processed_dir: Path) -> Dict[str, pd.DataFrame]:
    """Generate structured customer profiles and meal-context dining sessions.

    Creates:
    1. customers.csv (Basic customer profiles: user_id, dietary_preference, allergies,
       disliked_ing, favorite_cuisines)
    2. dining_sessions.csv (Contextual meal sessions: session_id, user_id, party_size,
       budget_limit, max_wait_time, meal_type, priority)
    3. customer_sessions_master.csv (Denormalized joined view of customer + session context)
    """
    customers_data = [
        {
            "user_id": "U001",
            "dietary_preference": "Normal",
            "allergies": "None",
            "disliked_ing": "anchovies",
            "favorite_cuisines": "Italian, Western",
        },
        {
            "user_id": "U002",
            "dietary_preference": "Veg",
            "allergies": "Peanuts",
            "disliked_ing": "mushrooms",
            "favorite_cuisines": "Indian, Italian, Cafe",
        },
        {
            "user_id": "U003",
            "dietary_preference": "Vegan",
            "allergies": "Dairy, Eggs",
            "disliked_ing": "None",
            "favorite_cuisines": "Asian, Chinese, Cafe",
        },
        {
            "user_id": "U004",
            "dietary_preference": "Diet",
            "allergies": "Gluten",
            "disliked_ing": "sugar syrup, cream",
            "favorite_cuisines": "Western, Southeast Asian",
        },
        {
            "user_id": "U005",
            "dietary_preference": "Meat Lover",
            "allergies": "Shellfish",
            "disliked_ing": "broccoli",
            "favorite_cuisines": "Western, Italian, Indian",
        },
        {
            "user_id": "U006",
            "dietary_preference": "Spicy Lover",
            "allergies": "None",
            "disliked_ing": "sour cream",
            "favorite_cuisines": "Southeast Asian, Indian, Chinese",
        },
        {
            "user_id": "U007",
            "dietary_preference": "Normal",
            "allergies": "Tree Nuts",
            "disliked_ing": "cockles",
            "favorite_cuisines": "Southeast Asian, Cafe",
        },
        {
            "user_id": "U008",
            "dietary_preference": "Diet",
            "allergies": "Dairy",
            "disliked_ing": "butter, ghee",
            "favorite_cuisines": "Asian, Italian",
        },
        {
            "user_id": "U009",
            "dietary_preference": "Veg",
            "allergies": "None",
            "disliked_ing": "garlic, onions",
            "favorite_cuisines": "Indian, Western, Cafe",
        },
        {
            "user_id": "U010",
            "dietary_preference": "Meat Lover",
            "allergies": "Fish, Peanuts",
            "disliked_ing": "mint",
            "favorite_cuisines": "Western, Chinese",
        },
        {
            "user_id": "U011",
            "dietary_preference": "Spicy Lover",
            "allergies": "Dairy",
            "disliked_ing": "None",
            "favorite_cuisines": "Southeast Asian, Chinese",
        },
        {
            "user_id": "U012",
            "dietary_preference": "Normal",
            "allergies": "Shellfish, Fish",
            "disliked_ing": "bell peppers",
            "favorite_cuisines": "Italian, Cafe",
        },
        {
            "user_id": "U013",
            "dietary_preference": "Vegan",
            "allergies": "Dairy, Eggs, Soy",
            "disliked_ing": "None",
            "favorite_cuisines": "Italian, Southeast Asian, Cafe",
        },
        {
            "user_id": "U014",
            "dietary_preference": "Diet",
            "allergies": "None",
            "disliked_ing": "condensed milk, fries",
            "favorite_cuisines": "Western, Asian, Cafe",
        },
        {
            "user_id": "U015",
            "dietary_preference": "Normal",
            "allergies": "Gluten",
            "disliked_ing": "black pepper",
            "favorite_cuisines": "Indian, Southeast Asian",
        },
        {
            "user_id": "U016",
            "dietary_preference": "Meat Lover",
            "allergies": "None",
            "disliked_ing": "cabbage",
            "favorite_cuisines": "Western, Italian, Southeast Asian",
        },
        {
            "user_id": "U017",
            "dietary_preference": "Veg",
            "allergies": "Eggs",
            "disliked_ing": "rose water",
            "favorite_cuisines": "Italian, Chinese, Indian",
        },
        {
            "user_id": "U018",
            "dietary_preference": "Spicy Lover",
            "allergies": "Peanuts, Tree Nuts",
            "disliked_ing": "None",
            "favorite_cuisines": "Indian, Southeast Asian",
        },
        {
            "user_id": "U019",
            "dietary_preference": "Normal",
            "allergies": "None",
            "disliked_ing": "shrimp paste",
            "favorite_cuisines": "Western, Cafe, Italian",
        },
        {
            "user_id": "U020",
            "dietary_preference": "Diet",
            "allergies": "Shellfish",
            "disliked_ing": "ghee,chocolate syrup",
            "favorite_cuisines": "Cafe, Asian, Italian",
        },
    ]

    sessions_data = [
        # session_id, user_id, party_size, budget_limit, max_wait_time, meal_type, priority
        ("S001", "U001", 2, 65.0, 25, "Dinner", "Taste & Experience"),
        ("S002", "U002", 1, 15.0, 15, "Lunch", "Cost-Saving"),
        ("S003", "U003", 1, 12.0, 10, "Breakfast", "Healthy & Diet"),
        ("S004", "U004", 2, 45.0, 20, "Lunch", "Healthy & Diet"),
        ("S005", "U005", 4, 150.0, 30, "Dinner", "Taste & Experience"),
        ("S006", "U006", 3, 55.0, 20, "Dinner", "Taste & Experience"),
        ("S007", "U007", 1, 10.0, 10, "Snack", "Cost-Saving"),
        ("S008", "U008", 2, 38.0, 18, "Lunch", "Healthy & Diet"),
        ("S009", "U009", 4, 50.0, 20, "Dinner", "Cost-Saving"),
        ("S010", "U010", 2, 85.0, 25, "Dinner", "Taste & Experience"),
        ("S011", "U011", 1, 18.0, 15, "Lunch", "Cost-Saving"),
        ("S012", "U012", 2, 30.0, 12, "Breakfast", "Taste & Experience"),
        ("S013", "U013", 1, 14.0, 10, "Snack", "Healthy & Diet"),
        ("S014", "U014", 3, 60.0, 20, "Lunch", "Healthy & Diet"),
        ("S015", "U015", 2, 40.0, 22, "Dinner", "Cost-Saving"),
        ("S016", "U016", 6, 220.0, 30, "Dinner", "Taste & Experience"),
        ("S017", "U017", 2, 28.0, 15, "Lunch", "Cost-Saving"),
        ("S018", "U018", 3, 75.0, 25, "Dinner", "Taste & Experience"),
        ("S019", "U019", 1, 12.0, 10, "Breakfast", "Cost-Saving"),
        ("S020", "U020", 2, 35.0, 15, "Snack", "Healthy & Diet"),
        ("S021", "U001", 1, 16.0, 12, "Lunch", "Cost-Saving"),
        ("S022", "U005", 2, 95.0, 25, "Dinner", "Taste & Experience"),
        ("S023", "U006", 1, 20.0, 15, "Lunch", "Taste & Experience"),
        ("S024", "U009", 2, 22.0, 12, "Breakfast", "Cost-Saving"),
        ("S025", "U012", 4, 110.0, 25, "Dinner", "Taste & Experience"),
        ("S026", "U014", 1, 15.0, 10, "Breakfast", "Healthy & Diet"),
        ("S027", "U016", 3, 70.0, 20, "Lunch", "Cost-Saving"),
        ("S028", "U018", 2, 50.0, 20, "Dinner", "Healthy & Diet"),
        ("S029", "U019", 2, 25.0, 10, "Snack", "Taste & Experience"),
        ("S030", "U020", 1, 22.0, 15, "Lunch", "Healthy & Diet"),
    ]

    customers_df = pd.DataFrame(customers_data)
    sessions_df = pd.DataFrame(
        sessions_data,
        columns=[
            "session_id",
            "user_id",
            "party_size",
            "budget_limit",
            "max_wait_time",
            "meal_type",
            "priority",
        ],
    )
    combined_df = pd.merge(sessions_df, customers_df, on="user_id", how="left")

    processed_dir.mkdir(parents=True, exist_ok=True)
    customers_df.to_csv(processed_dir / "customers.csv", index=False, encoding="utf-8")
    sessions_df.to_csv(processed_dir / "dining_sessions.csv", index=False, encoding="utf-8")
    combined_df.to_csv(
        processed_dir / "customer_sessions_master.csv", index=False, encoding="utf-8"
    )

    return {
        "customers": customers_df,
        "sessions": sessions_df,
        "combined": combined_df,
    }


if __name__ == "__main__":
    project_root = Path(__file__).resolve().parent.parent.parent
    raw = project_root / "data" / "raw"
    processed = project_root / "data" / "processed"
    out = processed / "menu_dss_master.csv"
    df = build_unified_dataset(raw, out)
    print(f"Generated {len(df)} unified dishes at {out}")

    cust_dbs = build_customer_database(processed)
    print(
        f"Generated {len(cust_dbs['customers'])} customer profiles and "
        f"{len(cust_dbs['sessions'])} dining sessions in {processed}"
    )
    print("\nSample combined customer sessions:")
    print(cust_dbs["combined"].head(10).to_string(index=False))
