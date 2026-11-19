import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Clock,
  Flame,
  Minus,
  Plus,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Star,
  Table2,
  Users,
  Utensils,
  Wallet,
  X,
} from 'lucide-react';
import dssData from './data/dssData.json';
import RadarChart, { OPTION_STYLES } from './components/RadarChart';
import RestaurantMenuModal from './components/RestaurantMenuModal';
import ScenarioDetailModal from './components/ScenarioDetailModal';
import {
  ALLERGEN_OPTIONS,
  CUISINE_OPTIONS,
  DIETARY_OPTIONS,
  MEAL_TYPE_OPTIONS,
  buildThreeScenarios,
  computeTopsisScores,
  filterDishes,
} from './utils/dssEngine';

const QUICK_SCENARIOS = [
  { id: 'S001', label: 'Cặp đôi ăn tối · $65' },
  { id: 'S002', label: 'Trưa tiết kiệm 1 mình · $15' },
  { id: 'S003', label: 'Thuần chay Healthy · $12' },
  { id: 'S005', label: 'Tiệc nhóm 4 bạn · $150' },
  { id: 'S006', label: 'Nhóm 3 người ăn cay · $55' },
];

const QUICK_PRIORITIES = [
  {
    id: 'balanced',
    label: 'Cân bằng',
    weights: { wCost: 25, wPopular: 25, wHealthy: 25, wTaste: 25 },
  },
  {
    id: 'cost',
    label: 'Tiết kiệm',
    weights: { wCost: 55, wPopular: 25, wHealthy: 10, wTaste: 10 },
  },
  {
    id: 'bestseller',
    label: 'Best-seller',
    weights: { wCost: 15, wPopular: 55, wHealthy: 10, wTaste: 20 },
  },
  {
    id: 'taste',
    label: 'Ăn ngon',
    weights: { wCost: 10, wPopular: 25, wHealthy: 15, wTaste: 50 },
  },
  {
    id: 'healthy',
    label: 'Healthy',
    weights: { wCost: 15, wPopular: 15, wHealthy: 55, wTaste: 15 },
  },
];

const DEFAULT_CONFIG = {
  sessionId: 'CUSTOM',
  priorityPreset: 'balanced',
  partySize: 2,
  budgetLimit: 55,
  maxWaitTime: 22,
  mealType: 'Dinner',
  dietaryPreference: 'Normal',
  allergies: [],
  dislikedIng: '',
  strictDisliked: false,
  favoriteCuisines: ['Italian', 'Southeast Asian'],
  weights: {
    wCost: 25,
    wPopular: 25,
    wHealthy: 25,
    wTaste: 25,
  },
};

function mapPriorityToPreset(priority) {
  if (priority === 'Cost-Saving') return QUICK_PRIORITIES[1];
  if (priority === 'Healthy & Diet') return QUICK_PRIORITIES[4];
  return QUICK_PRIORITIES[3];
}

function formatFriendlySessionLabel(s) {
  const mealMap = { Breakfast: 'Sáng', Lunch: 'Trưa', Dinner: 'Tối', Snack: 'Ăn nhẹ' };
  const dietMap = {
    Normal: 'Bình thường',
    Veg: 'Ăn chay',
    Vegan: 'Thuần chay',
    Diet: 'Ăn kiêng',
    'Meat Lover': 'Thích thịt',
    'Spicy Lover': 'Thích cay',
  };
  return `${s.session_id} · ${s.party_size} người · Bữa ${mealMap[s.meal_type] || s.meal_type} · $${s.budget_limit} · ${dietMap[s.dietary_preference] || s.dietary_preference}`;
}

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [detailScenarioKey, setDetailScenarioKey] = useState(null);
  const [selectedOption, setSelectedOption] = useState('A');
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'topsis'

  const handleLoadSession = (sessionId) => {
    if (sessionId === 'CUSTOM') {
      setConfig(DEFAULT_CONFIG);
      return;
    }
    const found = dssData.sessions.find((s) => s.session_id === sessionId);
    if (!found) return;

    const allergies =
      found.allergies && found.allergies !== 'None'
        ? found.allergies.split(',').map((a) => a.trim())
        : [];
    const favoriteCuisines =
      found.favorite_cuisines && found.favorite_cuisines !== 'None'
        ? found.favorite_cuisines.split(',').map((c) => c.trim())
        : [];

    const preset = mapPriorityToPreset(found.priority);

    setConfig({
      sessionId: found.session_id,
      priorityPreset: preset.id,
      partySize: Number(found.party_size),
      budgetLimit: Number(found.budget_limit),
      maxWaitTime: Number(found.max_wait_time),
      mealType: found.meal_type,
      dietaryPreference: found.dietary_preference,
      allergies,
      dislikedIng: found.disliked_ing === 'None' ? '' : found.disliked_ing,
      strictDisliked: false,
      favoriteCuisines,
      weights: { ...preset.weights },
    });
  };

  const applyPriorityPreset = (preset) => {
    setConfig((prev) => ({
      ...prev,
      sessionId: 'CUSTOM',
      priorityPreset: preset.id,
      weights: { ...preset.weights },
    }));
  };

  const toggleAllergy = (allergen) => {
    setConfig((prev) => ({
      ...prev,
      sessionId: 'CUSTOM',
      allergies: prev.allergies.includes(allergen)
        ? prev.allergies.filter((a) => a !== allergen)
        : [...prev.allergies, allergen],
    }));
  };

  const toggleCuisine = (cuisine) => {
    setConfig((prev) => ({
      ...prev,
      sessionId: 'CUSTOM',
      favoriteCuisines: prev.favoriteCuisines.includes(cuisine)
        ? prev.favoriteCuisines.filter((c) => c !== cuisine)
        : [...prev.favoriteCuisines, cuisine],
    }));
  };

  const updateWeight = (key, val) => {
    setConfig((prev) => ({
      ...prev,
      sessionId: 'CUSTOM',
      priorityPreset: 'custom',
      weights: { ...prev.weights, [key]: Number(val) },
    }));
  };

  const totalWeight =
    config.weights.wCost +
      config.weights.wPopular +
      config.weights.wHealthy +
      config.weights.wTaste || 1;

  const { valid, excluded } = useMemo(
    () => filterDishes(dssData.menu, config),
    [config]
  );

  const scoredDishes = useMemo(
    () => computeTopsisScores(valid, config),
    [valid, config]
  );

  const scenarios = useMemo(
    () => buildThreeScenarios(scoredDishes, config),
    [scoredDishes, config]
  );

  const activeDetailScenario = useMemo(
    () => scenarios.find((s) => s.key === detailScenarioKey) || null,
    [scenarios, detailScenarioKey]
  );

  const activeFilterCount =
    config.allergies.length +
    (config.dietaryPreference !== 'Normal' ? 1 : 0) +
    (config.dislikedIng.trim() ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#f4f8f5] text-[#13241c]">
      {/* Fresh Organic Masthead */}
      <header className="border-b border-[#dce7df] bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-[-0.02em] text-[#13241c]">
              Menu-DSS · Trợ Lý Chọn Thực Đơn Thông Minh
            </h1>
            <p className="text-xs sm:text-sm text-[#475c51] mt-0.5">
              Chọn nhanh nhu cầu bữa ăn — hệ thống tự động lọc món an toàn và đề xuất 4 kịch bản thực đơn tối ưu
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowMenuModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1e6f50] hover:bg-[#16593f] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Mở menu nhà hàng ({dssData.menu.length} món)
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eaf2ec] border border-[#d2e4d7] text-xs font-medium text-[#1e6f50] tabular-nums">
              <Utensils className="w-3.5 h-3.5 text-[#1e6f50]" />
              {valid.length}/{dssData.menu.length} hợp lệ
            </span>
            <button
              type="button"
              onClick={() => {
                setConfig(DEFAULT_CONFIG);
                setSelectedOption('A');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#dce7df] bg-white hover:bg-[#eaf2ec] text-xs font-medium text-[#13241c] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#475c51]" />
              Làm mới
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* TOP QUICK-PICK & COMMAND BAR */}
        <section className="bg-white border border-[#dce7df] rounded-xl p-4 sm:p-5 space-y-4 shadow-[0_1px_3px_rgba(19,36,28,0.04)]">
          {/* Row 1: Human-Friendly Quick Scenario Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[#6b8075] mr-1">
              Thử nhanh tình huống:
            </span>
            {QUICK_SCENARIOS.map((qs) => {
              const isActive = config.sessionId === qs.id;
              return (
                <button
                  key={qs.id}
                  type="button"
                  onClick={() => handleLoadSession(qs.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1e6f50] text-white border-[#1e6f50] font-semibold'
                      : 'bg-[#f4f8f5] text-[#2c4237] border-[#d5e3d9] hover:border-[#1e6f50] hover:bg-[#eaf2ec]'
                  }`}
                >
                  {qs.label}
                </button>
              );
            })}
          </div>

          {/* Row 2: Core Inline Controls */}
          <div className="pt-3 border-t border-[#ebf2ed] grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
            {/* Party Size Stepper */}
            <div className="md:col-span-2 flex items-center justify-between gap-2 bg-[#f4f8f5] border border-[#dce7df] rounded-lg px-3 py-2">
              <span className="text-xs text-[#475c51] flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5 text-[#1e6f50]" />
                Người
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setConfig((p) => ({
                      ...p,
                      sessionId: 'CUSTOM',
                      partySize: Math.max(1, p.partySize - 1),
                    }))
                  }
                  className="w-6 h-6 rounded bg-white border border-[#cfe0d4] hover:bg-[#eaf2ec] flex items-center justify-center text-[#13241c] cursor-pointer"
                  aria-label="Giảm số người"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center font-mono text-sm font-bold tabular-nums text-[#13241c]">
                  {config.partySize}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((p) => ({
                      ...p,
                      sessionId: 'CUSTOM',
                      partySize: Math.min(10, p.partySize + 1),
                    }))
                  }
                  className="w-6 h-6 rounded bg-white border border-[#cfe0d4] hover:bg-[#eaf2ec] flex items-center justify-center text-[#13241c] cursor-pointer"
                  aria-label="Tăng số người"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Inline Budget Slider */}
            <div className="md:col-span-3 bg-[#f4f8f5] border border-[#dce7df] rounded-lg px-3 py-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#475c51] flex items-center gap-1.5 font-medium">
                  <Wallet className="w-3.5 h-3.5 text-[#d97724]" />
                  Ngân sách
                </span>
                <span className="font-mono font-bold text-[#13241c] tabular-nums">
                  ${config.budgetLimit}{' '}
                  <span className="text-[10px] font-normal text-[#6b8075]">
                    (~${Math.round(config.budgetLimit / config.partySize)}/ng)
                  </span>
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={220}
                step={5}
                value={config.budgetLimit}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    sessionId: 'CUSTOM',
                    budgetLimit: Number(e.target.value),
                  }))
                }
                className="dss-slider"
              />
            </div>

            {/* Quick Priority Pills (including Best-seller) */}
            <div className="md:col-span-5 flex flex-wrap items-center gap-1 bg-[#f4f8f5] border border-[#dce7df] rounded-lg p-1">
              {QUICK_PRIORITIES.map((pr) => {
                const active = config.priorityPreset === pr.id;
                return (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => applyPriorityPreset(pr)}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      active
                        ? 'bg-white text-[#1e6f50] font-semibold border border-[#c6dccd] shadow-xs'
                        : 'text-[#475c51] hover:text-[#13241c] border border-transparent'
                    }`}
                  >
                    {pr.label}
                  </button>
                );
              })}
            </div>

            {/* Expandable Customize & Allergies Trigger */}
            <div className="md:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCustomize(!showCustomize)}
                className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  showCustomize
                    ? 'bg-[#1e6f50] text-white border-[#1e6f50]'
                    : 'bg-white text-[#13241c] border-[#cfe0d4] hover:border-[#1e6f50] hover:bg-[#f4f8f5]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Tùy chỉnh</span>
                {activeFilterCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      showCustomize
                        ? 'bg-white text-[#1e6f50]'
                        : 'bg-[#d97724] text-white'
                    }`}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Progressive Disclosure Panel */}
          {showCustomize && (
            <div className="pt-4 border-t border-[#dce7df] grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Column 1: 4 Fine Priority Sliders */}
              <div className="space-y-3 bg-[#f4f8f5] border border-[#dce7df] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[#13241c]">
                    Chỉnh chi tiết 4 thanh ưu tiên (TOPSIS)
                  </h3>
                  <span className="text-[11px] text-[#6b8075]">Tổng 100%</span>
                </div>
                {[
                  { key: 'wCost', label: 'Ưu tiên giá rẻ' },
                  { key: 'wPopular', label: 'Best-seller (Độ phổ biến)' },
                  { key: 'wHealthy', label: 'Ăn kiêng / Healthy' },
                  { key: 'wTaste', label: 'Trải nghiệm ngon & Hợp gu' },
                ].map((item) => {
                  const rawVal = config.weights[item.key];
                  const pct = Math.round((rawVal / totalWeight) * 100);
                  return (
                    <div key={item.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#2c4237]">{item.label}</span>
                        <span className="font-mono font-semibold text-[#1e6f50] tabular-nums">
                          {pct}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={rawVal}
                        onChange={(e) => updateWeight(item.key, e.target.value)}
                        className="dss-slider"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Column 2: Diet, Wait Time, Meal Type & All 30 Sessions */}
              <div className="space-y-3 bg-[#f4f8f5] border border-[#dce7df] rounded-lg p-4">
                <h3 className="text-xs font-semibold text-[#13241c]">
                  Chế độ ăn & Ngữ cảnh chi tiết
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#6b8075] mb-1">Chế độ ăn</label>
                    <select
                      value={config.dietaryPreference}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          sessionId: 'CUSTOM',
                          dietaryPreference: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-[#cfe0d4] bg-white px-2.5 py-1.5 text-xs text-[#13241c] focus:outline-none focus:border-[#1e6f50]"
                    >
                      {DIETARY_OPTIONS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6b8075] mb-1">Bữa ăn</label>
                    <select
                      value={config.mealType}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          sessionId: 'CUSTOM',
                          mealType: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-[#cfe0d4] bg-white px-2.5 py-1.5 text-xs text-[#13241c] focus:outline-none focus:border-[#1e6f50]"
                    >
                      {MEAL_TYPE_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#475c51] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Thời gian chờ tối đa
                    </span>
                    <span className="font-mono font-semibold text-[#13241c]">
                      {config.maxWaitTime} phút
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={1}
                    value={config.maxWaitTime}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        sessionId: 'CUSTOM',
                        maxWaitTime: Number(e.target.value),
                      }))
                    }
                    className="dss-slider"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#6b8075] mb-1">
                    Nạp từ 30 phiên dữ liệu mẫu (customer_sessions_master.csv)
                  </label>
                  <select
                    value={config.sessionId}
                    onChange={(e) => handleLoadSession(e.target.value)}
                    className="w-full rounded-md border border-[#cfe0d4] bg-white px-2.5 py-1.5 text-xs text-[#13241c] focus:outline-none focus:border-[#1e6f50]"
                  >
                    <option value="CUSTOM">-- Đang tùy chỉnh thủ công --</option>
                    {dssData.sessions.map((s) => (
                      <option key={s.session_id} value={s.session_id}>
                        {formatFriendlySessionLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Column 3: Allergies, Cuisines & Disliked Ingredients */}
              <div className="space-y-3 bg-[#f4f8f5] border border-[#dce7df] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[#13241c] flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#d97724]" />
                    Dị ứng & Sở thích ẩm thực
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCustomize(false)}
                    className="text-[#6b8075] hover:text-[#13241c] cursor-pointer"
                    aria-label="Đóng bảng tùy chỉnh"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <span className="block text-[11px] text-[#6b8075] mb-1.5">
                    Loại trừ tuyệt đối chất gây dị ứng:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ALLERGEN_OPTIONS.map((al) => {
                      const active = config.allergies.includes(al);
                      return (
                        <button
                          key={al}
                          type="button"
                          onClick={() => toggleAllergy(al)}
                          className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#d97724] text-white border-[#d97724] font-semibold'
                              : 'bg-white text-[#475c51] border-[#d5e3d9] hover:border-[#d97724]'
                          }`}
                        >
                          {al}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] text-[#6b8075] mb-1.5">
                    Ẩm thực yêu thích:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {CUISINE_OPTIONS.map((cu) => {
                      const active = config.favoriteCuisines.includes(cu);
                      return (
                        <button
                          key={cu}
                          type="button"
                          onClick={() => toggleCuisine(cu)}
                          className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#1e6f50] text-white border-[#1e6f50] font-semibold'
                              : 'bg-white text-[#475c51] border-[#d5e3d9] hover:border-[#1e6f50]'
                          }`}
                        >
                          {cu}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Nguyên liệu không thích (vd: mushrooms, garlic)"
                    value={config.dislikedIng}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        sessionId: 'CUSTOM',
                        dislikedIng: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-[#cfe0d4] bg-white px-2.5 py-1.5 text-xs text-[#13241c] placeholder-[#7d9387] focus:outline-none focus:border-[#1e6f50]"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* EMPTY STATE */}
        {scenarios.length === 0 ? (
          <div className="bg-white border border-[#dce7df] rounded-xl p-10 text-center">
            <AlertTriangle className="w-8 h-8 text-[#d97724] mx-auto mb-3" />
            <h2 className="text-base font-semibold text-[#13241c]">
              Không còn món ăn nào phù hợp với tất cả bộ lọc hiện tại
            </h2>
            <p className="text-sm text-[#475c51] mt-1 max-w-md mx-auto">
              Hãy thử giảm bớt danh sách dị ứng, đổi chế độ ăn hoặc tăng thời gian chờ tối đa ({config.maxWaitTime} phút).
            </p>
            <button
              type="button"
              onClick={() => setConfig(DEFAULT_CONFIG)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1e6f50] text-white text-sm font-semibold hover:bg-[#16593f] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <>
            {/* COMPACT 2x2 RECTANGULAR GRID OF 4 RECOMMENDED MENUS */}
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <h2 className="text-lg font-bold text-[#13241c]">
                  Danh sách các thực đơn tốt nhất cho bạn
                </h2>
                <p className="text-xs text-[#6b8075]">
                  Nhấn vào từng thẻ để xem đầy đủ danh sách món, nguyên liệu và thông số dinh dưỡng
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenarios.map((sc) => {
                  const style = OPTION_STYLES[sc.key];
                  const isSelected = selectedOption === sc.key;
                  const matchPct = Math.min(99, Math.max(55, Math.round(sc.avgTopsis + 28)));
                  const dishPreview = sc.items.map((d) => d.dish_name).join(' · ');

                  return (
                    <article
                      key={sc.key}
                      onClick={() => {
                        setSelectedOption(sc.key);
                        setDetailScenarioKey(sc.key);
                      }}
                      className={`group rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer border bg-white ${
                        isSelected
                          ? 'shadow-[0_4px_16px_rgba(19,36,28,0.08)]'
                          : 'border-[#dce7df] hover:border-[#9ebea9] hover:shadow-xs'
                      }`}
                      style={{
                        borderColor: isSelected ? style.stroke : undefined,
                      }}
                    >
                      {/* Top Line: Title + Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: style.stroke }}
                            />
                            <h3 className="text-sm sm:text-base font-bold text-[#13241c] truncate">
                              {sc.title}
                            </h3>
                          </div>
                          <p className="text-xs text-[#475c51] mt-0.5 truncate">{sc.subtitle}</p>
                        </div>

                        <span
                          className="shrink-0 px-2.5 py-1 rounded-md text-xs font-mono font-bold"
                          style={{
                            backgroundColor: style.badgeBg,
                            color: style.stroke,
                          }}
                        >
                          Hợp {matchPct}%
                        </span>
                      </div>

                      {/* Compact 4-Metric Horizontal Strip */}
                      <div className="mt-3 grid grid-cols-4 gap-2 py-2 px-3 rounded-lg bg-[#f4f8f5] border border-[#e3ede6] text-center tabular-nums">
                        <div>
                          <div className="text-[10px] text-[#6b8075]">Tổng tiền</div>
                          <div className="text-xs sm:text-sm font-mono font-bold text-[#13241c]">
                            ${sc.totalCost.toFixed(2)}
                          </div>
                        </div>
                        <div className="border-l border-[#dce7df]">
                          <div className="text-[10px] text-[#6b8075]">Số món</div>
                          <div className="text-xs sm:text-sm font-mono font-semibold text-[#13241c]">
                            {sc.items.length} món
                          </div>
                        </div>
                        <div className="border-l border-[#dce7df]">
                          <div className="text-[10px] text-[#6b8075]">Calo/người</div>
                          <div className="text-xs sm:text-sm font-mono font-semibold text-[#13241c] flex items-center justify-center gap-0.5">
                            <Flame className="w-3 h-3 text-[#d97724]" />
                            {sc.kcalPerPerson}
                          </div>
                        </div>
                        <div className="border-l border-[#dce7df]">
                          <div className="text-[10px] text-[#6b8075]">Đánh giá</div>
                          <div className="text-xs sm:text-sm font-mono font-semibold text-[#13241c] flex items-center justify-center gap-0.5">
                            <Star className="w-3 h-3 text-[#d97724] fill-[#d97724]" />
                            {sc.avgRating}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Line: Compact Dish Preview + Click Cue */}
                      <div className="mt-3 pt-2.5 border-t border-[#edf4ef] flex items-center justify-between gap-3 text-xs">
                        <p className="text-[#475c51] truncate">{dishPreview}</p>
                        <span
                          className="shrink-0 inline-flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform"
                          style={{ color: style.stroke }}
                        >
                          Xem chi tiết
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* ANALYTICAL TABS */}
            <section className="bg-white border border-[#dce7df] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(19,36,28,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[#dce7df] bg-[#f8fbf9]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('radar')}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === 'radar'
                        ? 'bg-[#1e6f50] text-white'
                        : 'text-[#475c51] hover:bg-[#eaf2ec] hover:text-[#13241c]'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Biểu đồ Radar & So sánh trực quan
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('topsis')}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === 'topsis'
                        ? 'bg-[#1e6f50] text-white'
                        : 'text-[#475c51] hover:bg-[#eaf2ec] hover:text-[#13241c]'
                    }`}
                  >
                    <Table2 className="w-3.5 h-3.5" />
                    Góc phân tích TOPSIS ({scoredDishes.length} hợp lệ / {excluded.length} bị loại)
                  </button>
                </div>

                {excluded.length > 0 && (
                  <span className="text-[11px] text-[#6b8075]">
                    Đã tự động lọc bỏ {excluded.length} món không phù hợp (hết hàng / dị ứng / thời gian)
                  </span>
                )}
              </div>

              {activeTab === 'radar' ? (
                <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Left: Radar Spider Chart */}
                  <div className="lg:col-span-6">
                    <RadarChart
                      scenarios={scenarios}
                      selectedKey={selectedOption}
                      onSelectKey={setSelectedOption}
                    />
                  </div>

                  {/* Right: Concise Comparison Table & Takeaways */}
                  <div className="lg:col-span-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#13241c] mb-2.5">
                        Bảng đối chiếu nhanh 4 phương án
                      </h3>
                      <div className="overflow-x-auto rounded-lg border border-[#dce7df]">
                        <table className="w-full text-xs border-collapse tabular-nums">
                          <thead>
                            <tr className="bg-[#f4f8f5] text-[#6b8075] border-b border-[#dce7df]">
                              <th className="py-2 px-2.5 text-left font-medium">Tiêu chí</th>
                              {scenarios.map((sc) => (
                                <th
                                  key={sc.key}
                                  className="py-2 px-2.5 text-right font-semibold"
                                  style={{ color: OPTION_STYLES[sc.key].stroke }}
                                >
                                  Opt {sc.key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#edf4ef]">
                            <tr>
                              <td className="py-2 px-2.5 text-[#475c51]">Tổng chi phí</td>
                              {scenarios.map((sc) => (
                                <td key={sc.key} className="py-2 px-2.5 text-right font-mono font-semibold text-[#13241c]">
                                  ${sc.totalCost.toFixed(2)}
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="py-2 px-2.5 text-[#475c51]">TOPSIS TB</td>
                              {scenarios.map((sc) => (
                                <td key={sc.key} className="py-2 px-2.5 text-right font-mono font-semibold text-[#1e6f50]">
                                  {sc.avgTopsis}
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="py-2 px-2.5 text-[#475c51]">Calo / người</td>
                              {scenarios.map((sc) => (
                                <td key={sc.key} className="py-2 px-2.5 text-right font-mono text-[#13241c]">
                                  {sc.kcalPerPerson}
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="py-2 px-2.5 text-[#475c51]">Chờ tối đa</td>
                              {scenarios.map((sc) => (
                                <td key={sc.key} className="py-2 px-2.5 text-right font-mono text-[#13241c]">
                                  {sc.maxPrepTime}p
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="py-2 px-2.5 text-[#475c51]">Đa dạng</td>
                              {scenarios.map((sc) => (
                                <td key={sc.key} className="py-2 px-2.5 text-right font-mono text-[#13241c]">
                                  {sc.uniqueCategories}N·{sc.uniqueCuisines}G
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Plain Vietnamese Trade-off Takeaways */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-[#13241c]">
                        Gợi ý chốt phương án
                      </h3>
                      {scenarios.map((sc) => {
                        const st = OPTION_STYLES[sc.key];
                        return (
                          <div
                            key={sc.key}
                            onClick={() => setSelectedOption(sc.key)}
                            className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                              selectedOption === sc.key
                                ? 'bg-[#f4f8f5]'
                                : 'bg-white border-[#dce7df] hover:border-[#b5cdbe]'
                            }`}
                            style={{
                              borderColor: selectedOption === sc.key ? st.stroke : undefined,
                            }}
                          >
                            <div className="text-xs font-semibold flex items-center gap-2 text-[#13241c]">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: st.stroke }}
                              />
                              {sc.title}
                            </div>
                            <p className="text-xs text-[#475c51] mt-0.5 leading-relaxed">
                              {sc.key === 'A' && (
                                <>
                                  Hài hòa nhất theo trọng số hiện tại (TOPSIS{' '}
                                  <strong className="text-[#13241c]">{sc.avgTopsis}/100</strong>), dùng{' '}
                                  <strong className="text-[#13241c]">{sc.budgetUsedPct}%</strong> ngân sách.
                                </>
                              )}
                              {sc.key === 'B' && (
                                <>
                                  Tiết kiệm nhất với <strong className="text-[#d97724]">${sc.totalCost.toFixed(2)}</strong>{' '}
                                  (giảm <strong className="text-[#1e6f50]">${Math.max(0, scenarios[0].totalCost - sc.totalCost).toFixed(2)}</strong> so với Option A).
                                </>
                              )}
                              {sc.key === 'C' && (
                                <>
                                  Trải nghiệm vị giác nổi bật (<strong className="text-[#1d6a8a]">{sc.avgRating}/5.0</strong>) trên {sc.uniqueCategories} nhóm món và {sc.uniqueCuisines} phong cách ẩm thực.
                                </>
                              )}
                              {sc.key === 'D' && (
                                <>
                                  Combo bán chạy nhất nhà hàng, tập hợp các món có lượng gọi cao nhất ({sc.items.reduce((s, d) => s + d.units_sold, 0).toLocaleString()} tổng lượt gọi).
                                </>
                              )}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* TAB 2: Technical TOPSIS Ranking Table */
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse tabular-nums">
                    <thead>
                      <tr className="bg-[#f4f8f5] border-b border-[#dce7df] text-[#6b8075]">
                        <th className="py-2.5 px-3 text-left">Hạng</th>
                        <th className="py-2.5 px-3 text-left">Tên món</th>
                        <th className="py-2.5 px-3 text-left">Loại</th>
                        <th className="py-2.5 px-3 text-left">Ẩm thực</th>
                        <th className="py-2.5 px-3 text-right">Giá</th>
                        <th className="py-2.5 px-3 text-right">Lượt gọi</th>
                        <th className="py-2.5 px-3 text-right">Calo</th>
                        <th className="py-2.5 px-3 text-right">Chờ</th>
                        <th className="py-2.5 px-3 text-right">Rating</th>
                        <th className="py-2.5 px-3 text-right">TOPSIS / Lý do loại</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf4ef]">
                      {scoredDishes.map((d, idx) => (
                        <tr key={d.id} className="hover:bg-[#f4f8f5]">
                          <td className="py-2 px-3 font-mono text-[#6b8075]">#{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-[#13241c]">{d.dish_name}</td>
                          <td className="py-2 px-3 text-[#475c51]">{d.category}</td>
                          <td className="py-2 px-3 text-[#475c51]">{d.cuisine_type}</td>
                          <td className="py-2 px-3 text-right font-mono text-[#13241c]">${d.selling_price.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-mono text-[#7c3a6b]">{d.units_sold}</td>
                          <td className="py-2 px-3 text-right font-mono text-[#475c51]">{d.calories}</td>
                          <td className="py-2 px-3 text-right font-mono text-[#475c51]">{d.prep_time_min}p</td>
                          <td className="py-2 px-3 text-right font-mono text-[#d97724] font-semibold">{d.customer_rating}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#1e6f50]">
                            {d.topsisScore}
                          </td>
                        </tr>
                      ))}
                      {excluded.map((d) => (
                        <tr key={d.id} className="bg-[#fdf6f0] text-[#7a6b5f]">
                          <td className="py-2 px-3 font-mono">--</td>
                          <td className="py-2 px-3 font-medium line-through">{d.dish_name}</td>
                          <td className="py-2 px-3">{d.category}</td>
                          <td className="py-2 px-3">{d.cuisine_type}</td>
                          <td className="py-2 px-3 text-right font-mono">${d.selling_price.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-mono">{d.units_sold}</td>
                          <td className="py-2 px-3 text-right font-mono">{d.calories}</td>
                          <td className="py-2 px-3 text-right font-mono">{d.prep_time_min}p</td>
                          <td className="py-2 px-3 text-right font-mono">{d.customer_rating}</td>
                          <td className="py-2 px-3 text-right text-[#c2410c] font-medium">
                            {d.excludeReasons.join('; ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Modals */}
      <RestaurantMenuModal
        isOpen={showMenuModal}
        onClose={() => setShowMenuModal(false)}
        menu={dssData.menu}
      />

      <ScenarioDetailModal
        scenario={activeDetailScenario}
        config={config}
        onClose={() => setDetailScenarioKey(null)}
      />
    </div>
  );
}
