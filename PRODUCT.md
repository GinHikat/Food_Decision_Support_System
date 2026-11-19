# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + Tailwind CSS

## Users

Diners, restaurant hosts, and HUST Decision Support System (DSS) evaluators configuring meal-specific constraints and priority weights to compare optimal menu recommendations.

## Product Purpose

Provide an interactive, real-time Decision Support System (Menu-DSS) web application in Vietnamese that filters a 39-dish restaurant catalog against hard dietary, allergen, availability, and wait-time constraints, then ranks and composes three distinct menu scenarios (Option A: Balanced TOPSIS, Option B: Cost-Optimized, Option C: Best Culinary Experience) with visual trade-off analysis.

## Positioning

Unlike static menu lists or opaque single-score recommenders, Menu-DSS exposes the multi-criteria decision trade-offs directly: users can load real preset dining sessions (`S001`–`S030`) or tune priority sliders live, compare three contrasting menu options side by side, and inspect multi-axis balance on a Radar (Spider) chart.

## Operating Context

Group project prototype for the Decision Support System course at Hanoi University of Science and Technology (HUST). Delivered as a Vietnamese-language interactive web dashboard powered by the curated datasets in `data/processed/`.

## Capabilities and Constraints

- **Preset & Custom Inputs:** Select any preset session (`S001`–`S030`) from `customer_sessions_master.csv` or manually adjust party size, budget limit, max wait time, dietary preferences (`Ăn chay`, `Thuần chay`, `Ăn kiêng`, `Bình thường`, `Thích ăn thịt`, `Thích ăn cay`), allergens, and priority sliders (Giá rẻ, Best-seller, Ăn kiêng/Healthy, Trải nghiệm ngon).
- **Hard Filtering:** Exclude out-of-stock dishes (`is_available === false`), dishes containing user allergens, and dishes exceeding `max_wait_time` or violating strict dietary rules (`Vegan`, `Veg`).
- **3-Scenario Output Table:**
  - **Option A (Cân bằng nhất):** Highest composite TOPSIS score under the user's active priority weights.
  - **Option B (Tối ưu chi phí):** Cost-focused scenario minimizing total spend within budget while meeting satiety needs.
  - **Option C (Trải nghiệm ẩm thực tốt nhất):** Experience-focused scenario maximizing `customer_rating`, cuisine/dish diversity, and culinary appeal within budget.
- **Radar (Spider) Chart:** Compare Option A, Option B, and Option C across four axes: **Giá tiền** (Cost Efficiency), **Cân bằng dinh dưỡng** (Nutritional Balance), **Rating**, and **Tính đa dạng** (Diversity).
- **Language:** Vietnamese UI.

## Evidence on Hand

- `data/processed/menu_dss_master.csv` (39 dishes x 22 columns: pricing, margin, sales volume, prep time, rating, calories, serving size, satiety score, allergens, availability).
- `data/processed/customer_sessions_master.csv` (30 preset dining sessions x 11 columns).
- `demo/modules/menu_analysis.py` and `demo/modules/dss_model.py` (reference Python DSS logic).

## Product Principles

- **Safety before scoring:** Allergens, strict dietary rules, and stock availability are enforced as hard filters prior to TOPSIS ranking.
- **Transparent trade-offs:** Every scenario shows its selected dishes, total cost, prep time, calories/satiety, and radar profile so users understand what they gain or trade off.
- **Immediate responsiveness:** Adjusting any slider, filter, or preset session updates all three options and the radar chart instantaneously on the client.
