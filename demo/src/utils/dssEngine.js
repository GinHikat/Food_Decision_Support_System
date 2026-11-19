/**
 * Menu-DSS Multi-Criteria Decision Support Engine (TOPSIS + Scenario Composer)
 */

export const ALLERGEN_OPTIONS = [
  'Dairy',
  'Gluten',
  'Eggs',
  'Shellfish',
  'Fish',
  'Peanuts',
  'Tree Nuts',
  'Soy',
];

export const DIETARY_OPTIONS = [
  { value: 'Normal', label: 'Bình thường' },
  { value: 'Veg', label: 'Ăn chay (Veg)' },
  { value: 'Vegan', label: 'Thuần chay (Vegan)' },
  { value: 'Diet', label: 'Ăn kiêng (Healthy)' },
  { value: 'Meat Lover', label: 'Thích ăn thịt' },
  { value: 'Spicy Lover', label: 'Thích ăn cay' },
];

export const MEAL_TYPE_OPTIONS = [
  { value: 'Breakfast', label: 'Bữa sáng' },
  { value: 'Lunch', label: 'Bữa trưa' },
  { value: 'Dinner', label: 'Bữa tối' },
  { value: 'Snack', label: 'Ăn nhẹ' },
];

export const CUISINE_OPTIONS = [
  'Italian',
  'Western',
  'Southeast Asian',
  'Indian',
  'Chinese',
  'Cafe',
  'Asian',
];

function parseList(str) {
  if (!str || str === 'None') return [];
  return str
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && s !== 'none');
}

/**
 * Step 1: Hard Filtering against availability, wait time, allergens, and strict diet.
 */
export function filterDishes(menu, config) {
  const userAllergies = config.allergies.map((a) => a.toLowerCase());
  const dislikedList = parseList(config.dislikedIng);

  const valid = [];
  const excluded = [];

  for (const dish of menu) {
    const reasons = [];

    if (!dish.is_available) {
      reasons.push('Tạm hết hàng');
    }

    if (dish.prep_time_min > config.maxWaitTime) {
      reasons.push(`Chờ lâu (${dish.prep_time_min}p > ${config.maxWaitTime}p)`);
    }

    const dishAllergens = parseList(dish.allergens);
    const matchedAllergens = dishAllergens.filter((a) => userAllergies.includes(a));
    if (matchedAllergens.length > 0) {
      reasons.push(`Dị ứng: ${matchedAllergens.join(', ')}`);
    }

    if (config.dietaryPreference === 'Vegan' && dish.food_type !== 'Vegan') {
      reasons.push('Không thuần chay');
    } else if (
      config.dietaryPreference === 'Veg' &&
      dish.food_type !== 'Veg' &&
      dish.food_type !== 'Vegan'
    ) {
      reasons.push('Món mặn');
    }

    const ingLower = (dish.ingredients || '').toLowerCase();
    const matchedDisliked = dislikedList.filter((d) => ingLower.includes(d));
    if (config.strictDisliked && matchedDisliked.length > 0) {
      reasons.push(`Chứa: ${matchedDisliked.join(', ')}`);
    }

    if (reasons.length > 0) {
      excluded.push({ ...dish, excludeReasons: reasons });
    } else {
      valid.push({
        ...dish,
        hasDislikedIng: matchedDisliked.length > 0,
        matchedDisliked,
      });
    }
  }

  return { valid, excluded };
}

/**
 * Step 2: TOPSIS Multi-Criteria Scoring on valid dishes.
 */
export function computeTopsisScores(validDishes, config) {
  if (validDishes.length === 0) return [];

  const { wCost, wPopular, wHealthy, wTaste } = config.weights;
  const totalW = wCost + wPopular + wHealthy + wTaste || 1;
  const normWeights = {
    cost: wCost / totalW,
    popular: wPopular / totalW,
    healthy: wHealthy / totalW,
    taste: wTaste / totalW,
  };

  const favCuisines = config.favoriteCuisines.map((c) => c.toLowerCase());

  // Raw criterion values (all transformed to benefit criteria: higher = better)
  const rawMatrix = validDishes.map((dish) => {
    // 1. Cost efficiency (inverse of price per serving)
    const pricePerServing = dish.selling_price / Math.max(dish.serving_size, 1);
    const costBenefit = 1.0 / Math.max(pricePerServing, 0.5);

    // 2. Popularity (units sold)
    const popularBenefit = Math.max(dish.units_sold, 1);

    // 3. Healthy / Diet (satiety per 100 kcal + bonus for lower calorie density)
    const kcalPerServing = dish.calories / Math.max(dish.serving_size, 1);
    const healthyBase = (dish.satiety_score * 100) / Math.max(kcalPerServing, 80);
    const healthyBenefit =
      config.dietaryPreference === 'Diet' && kcalPerServing > 650
        ? healthyBase * 0.65
        : healthyBase;

    // 4. Taste & Experience (rating + cuisine match + dietary preference match - disliked penalty)
    let tasteBenefit = dish.customer_rating;
    if (favCuisines.includes((dish.cuisine_type || '').toLowerCase())) {
      tasteBenefit += 0.6;
    }
    if (config.dietaryPreference === 'Meat Lover' && dish.food_type === 'Non-Veg') {
      tasteBenefit += 0.5;
    }
    if (
      config.dietaryPreference === 'Spicy Lover' &&
      (dish.spice_level === 'Medium' || dish.spice_level === 'Spicy')
    ) {
      tasteBenefit += 0.5;
    }
    if (dish.hasDislikedIng) {
      tasteBenefit *= 0.7;
    }

    return { costBenefit, popularBenefit, healthyBenefit, tasteBenefit };
  });

  // Vector normalization denominators
  const denom = {
    cost: Math.sqrt(rawMatrix.reduce((acc, r) => acc + r.costBenefit ** 2, 0)) || 1,
    popular: Math.sqrt(rawMatrix.reduce((acc, r) => acc + r.popularBenefit ** 2, 0)) || 1,
    healthy: Math.sqrt(rawMatrix.reduce((acc, r) => acc + r.healthyBenefit ** 2, 0)) || 1,
    taste: Math.sqrt(rawMatrix.reduce((acc, r) => acc + r.tasteBenefit ** 2, 0)) || 1,
  };

  // Weighted normalized matrix
  const weighted = rawMatrix.map((r) => ({
    cost: (r.costBenefit / denom.cost) * normWeights.cost,
    popular: (r.popularBenefit / denom.popular) * normWeights.popular,
    healthy: (r.healthyBenefit / denom.healthy) * normWeights.healthy,
    taste: (r.tasteBenefit / denom.taste) * normWeights.taste,
  }));

  // Ideal Best (A+) and Ideal Worst (A-)
  const idealBest = {
    cost: Math.max(...weighted.map((w) => w.cost)),
    popular: Math.max(...weighted.map((w) => w.popular)),
    healthy: Math.max(...weighted.map((w) => w.healthy)),
    taste: Math.max(...weighted.map((w) => w.taste)),
  };
  const idealWorst = {
    cost: Math.min(...weighted.map((w) => w.cost)),
    popular: Math.min(...weighted.map((w) => w.popular)),
    healthy: Math.min(...weighted.map((w) => w.healthy)),
    taste: Math.min(...weighted.map((w) => w.taste)),
  };

  const scored = validDishes.map((dish, idx) => {
    const w = weighted[idx];
    const dPlus = Math.sqrt(
      (w.cost - idealBest.cost) ** 2 +
        (w.popular - idealBest.popular) ** 2 +
        (w.healthy - idealBest.healthy) ** 2 +
        (w.taste - idealBest.taste) ** 2
    );
    const dMinus = Math.sqrt(
      (w.cost - idealWorst.cost) ** 2 +
        (w.popular - idealWorst.popular) ** 2 +
        (w.healthy - idealWorst.healthy) ** 2 +
        (w.taste - idealWorst.taste) ** 2
    );
    const closeness = dPlus + dMinus === 0 ? 0.5 : dMinus / (dPlus + dMinus);
    return {
      ...dish,
      topsisScore: Math.round(closeness * 1000) / 10, // 0-100 scale
    };
  });

  scored.sort((a, b) => b.topsisScore - a.topsisScore);
  return scored;
}

/**
 * Helper: Compose a meal set from a ranked candidate list within budget & party size.
 */
function pickMenuSet(candidates, budgetLimit, partySize, mode) {
  const selected = [];
  let totalCost = 0;
  let totalServings = 0;
  const usedIds = new Set();
  const usedCategories = new Set();

  // Target dish count: main/filling dishes to cover partySize, plus side/drink if budget allows
  const targetMinServings = Math.max(1, partySize);
  const maxItems = Math.min(candidates.length, partySize + 2);

  // First pass: ensure primary food (Main Course or Appetizer for Snack) to satisfy partySize
  const primaryPool = candidates.filter((d) =>
    mode === 'Snack'
      ? d.category === 'Appetizer' || d.category === 'Dessert'
      : d.category === 'Main Course' || d.category === 'Appetizer'
  );

  for (const dish of primaryPool) {
    if (totalServings >= targetMinServings && selected.length >= Math.min(2, partySize)) break;
    if (totalCost + dish.selling_price <= budgetLimit) {
      selected.push(dish);
      usedIds.add(dish.id);
      usedCategories.add(dish.category);
      totalCost += dish.selling_price;
      totalServings += dish.serving_size;
    }
  }

  // Second pass: add complementary categories (Beverage, Dessert, Appetizer) for balance/variety
  for (const dish of candidates) {
    if (selected.length >= maxItems) break;
    if (usedIds.has(dish.id)) continue;
    // Prefer unseen categories for diversity
    if (usedCategories.has(dish.category) && selected.length >= 2) continue;
    if (totalCost + dish.selling_price <= budgetLimit) {
      selected.push(dish);
      usedIds.add(dish.id);
      usedCategories.add(dish.category);
      totalCost += dish.selling_price;
      totalServings += dish.serving_size;
    }
  }

  // Fallback if budget was too tight for any primary dish: pick the single cheapest valid item
  if (selected.length === 0 && candidates.length > 0) {
    const cheapest = [...candidates].sort((a, b) => a.selling_price - b.selling_price)[0];
    selected.push(cheapest);
  }

  return selected;
}

function summarizeScenario(key, title, subtitle, badge, items, config) {
  const totalCost = items.reduce((sum, d) => sum + d.selling_price, 0);
  const totalCalories = items.reduce((sum, d) => sum + d.calories, 0);
  const avgRating =
    items.length > 0
      ? items.reduce((sum, d) => sum + d.customer_rating, 0) / items.length
      : 0;
  const avgTopsis =
    items.length > 0
      ? items.reduce((sum, d) => sum + d.topsisScore, 0) / items.length
      : 0;
  const maxPrepTime =
    items.length > 0 ? Math.max(...items.map((d) => d.prep_time_min)) : 0;
  const totalServings = items.reduce((sum, d) => sum + d.serving_size, 0);

  const uniqueCategories = new Set(items.map((d) => d.category)).size;
  const uniqueCuisines = new Set(items.map((d) => d.cuisine_type)).size;

  // Radar Chart 4 Axes (0-100):
  // 1. Giá tiền (Cost Efficiency)
  const budgetRatio = totalCost / Math.max(config.budgetLimit, 1);
  const costScore = Math.max(15, Math.min(100, Math.round((1.15 - budgetRatio) * 90)));

  // 2. Cân bằng dinh dưỡng (Nutritional Balance: ideal ~550-750 kcal/person & category balance)
  const kcalPerPerson = totalCalories / Math.max(config.partySize, 1);
  const targetKcal = config.mealType === 'Snack' ? 350 : 650;
  const kcalDeviation = Math.abs(kcalPerPerson - targetKcal) / targetKcal;
  const nutritionScore = Math.max(
    20,
    Math.min(100, Math.round((1 - kcalDeviation * 0.65) * 90 + (uniqueCategories >= 2 ? 10 : 0)))
  );

  // 3. Rating (Customer rating 3.8–5.0 -> 0–100)
  const ratingScore = Math.max(
    20,
    Math.min(100, Math.round(((avgRating - 3.6) / 1.4) * 100))
  );

  // 4. Tính đa dạng (Diversity across categories & cuisines)
  const diversityScore = Math.max(
    20,
    Math.min(
      100,
      Math.round((uniqueCategories / 4) * 55 + (uniqueCuisines / Math.max(items.length, 1)) * 45)
    )
  );

  return {
    key,
    title,
    subtitle,
    badge,
    items,
    totalCost: Math.round(totalCost * 100) / 100,
    budgetUsedPct: Math.round((totalCost / Math.max(config.budgetLimit, 1)) * 100),
    overBudget: totalCost > config.budgetLimit,
    totalCalories,
    kcalPerPerson: Math.round(kcalPerPerson),
    avgRating: Math.round(avgRating * 100) / 100,
    avgTopsis: Math.round(avgTopsis * 10) / 10,
    maxPrepTime,
    totalServings,
    uniqueCategories,
    uniqueCuisines,
    radar: {
      cost: costScore,
      nutrition: nutritionScore,
      rating: ratingScore,
      diversity: diversityScore,
    },
  };
}

/**
 * Step 3: Build Option A (Top TOPSIS), Option B (Cost-Optimized), Option C (Culinary Experience).
 */
export function buildThreeScenarios(scoredDishes, config) {
  if (scoredDishes.length === 0) {
    return [];
  }

  // Option A: Highest TOPSIS score (balanced according to user sliders)
  const optionAItems = pickMenuSet(
    scoredDishes,
    config.budgetLimit,
    config.partySize,
    config.mealType
  );

  // Option B: Cost-Optimized (lowest price per serving while maintaining satiety >= 2)
  const costCandidates = [...scoredDishes].sort((a, b) => {
    const aVal = a.selling_price / Math.max(a.satiety_score, 1);
    const bVal = b.selling_price / Math.max(b.satiety_score, 1);
    return aVal - bVal;
  });
  const optionBItems = pickMenuSet(
    costCandidates,
    config.budgetLimit * 0.75, // Aim below full budget to highlight savings
    config.partySize,
    config.mealType
  );

  // Option C: Best Culinary Experience (highest rating + favorite cuisine + popularity)
  const favCuisines = config.favoriteCuisines.map((c) => c.toLowerCase());
  const expCandidates = [...scoredDishes].sort((a, b) => {
    const aFav = favCuisines.includes((a.cuisine_type || '').toLowerCase()) ? 0.5 : 0;
    const bFav = favCuisines.includes((b.cuisine_type || '').toLowerCase()) ? 0.5 : 0;
    const aScore = a.customer_rating + aFav + a.units_sold / 1000;
    const bScore = b.customer_rating + bFav + b.units_sold / 1000;
    return bScore - aScore;
  });
  const optionCItems = pickMenuSet(
    expCandidates,
    config.budgetLimit,
    config.partySize,
    config.mealType
  );

  // Option D: Best-seller (most frequently ordered / popular combo)
  const bestSellerCandidates = [...scoredDishes].sort((a, b) => b.units_sold - a.units_sold);
  const optionDItems = pickMenuSet(
    bestSellerCandidates,
    config.budgetLimit,
    config.partySize,
    config.mealType
  );

  return [
    summarizeScenario(
      'A',
      'Option A — Cân bằng nhất',
      'Điểm TOPSIS cao nhất theo trọng số ưu tiên',
      'Top TOPSIS',
      optionAItems,
      config
    ),
    summarizeScenario(
      'B',
      'Option B — Tối ưu chi phí',
      'Tiết kiệm ngân sách nhất vẫn đảm bảo độ no',
      'Tiết kiệm',
      optionBItems,
      config
    ),
    summarizeScenario(
      'C',
      'Option C — Trải nghiệm ẩm thực',
      'Ưu tiên đánh giá cao, hợp khẩu vị & đa dạng món',
      'Trải nghiệm',
      optionCItems,
      config
    ),
    summarizeScenario(
      'D',
      'Option D — Best-seller',
      'Combo gồm các món được gọi nhiều nhất tại nhà hàng',
      'Best-seller',
      optionDItems,
      config
    ),
  ];
}
