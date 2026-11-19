import React from 'react';
import {
  Clock,
  Flame,
  ShieldAlert,
  Star,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { OPTION_STYLES } from './RadarChart';

export default function ScenarioDetailModal({ scenario, config, onClose }) {
  if (!scenario) return null;

  const style = OPTION_STYLES[scenario.key];
  const matchPct = Math.min(99, Math.max(55, Math.round(scenario.avgTopsis + 28)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#13241c]/45 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#dce7df] rounded-2xl w-full max-w-3xl max-h-[86vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b border-[#dce7df] flex items-start justify-between gap-4"
          style={{ backgroundColor: style.badgeBg }}
        >
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: style.stroke }}
              />
              <h2 className="text-lg font-bold text-[#13241c]">{scenario.title}</h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white"
                style={{ color: style.stroke }}
              >
                Hợp {matchPct}% · TOPSIS {scenario.avgTopsis}/100
              </span>
            </div>
            <p className="text-xs text-[#475c51] mt-1">{scenario.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/80 text-[#475c51] hover:bg-white hover:text-[#13241c] cursor-pointer"
            aria-label="Đóng chi tiết thực đơn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary KPI Bar */}
        <div className="px-6 py-3.5 bg-[#f8fbf9] border-b border-[#dce7df] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center tabular-nums">
          <div className="bg-white border border-[#e3ede6] rounded-lg py-2 px-3">
            <div className="text-[11px] text-[#6b8075]">Tổng tiền / Ngân sách</div>
            <div className="text-sm font-mono font-bold text-[#13241c] mt-0.5">
              ${scenario.totalCost.toFixed(2)}{' '}
              <span className="text-[11px] font-normal text-[#6b8075]">
                ({scenario.budgetUsedPct}%)
              </span>
            </div>
          </div>
          <div className="bg-white border border-[#e3ede6] rounded-lg py-2 px-3">
            <div className="text-[11px] text-[#6b8075]">Năng lượng / người</div>
            <div className="text-sm font-mono font-bold text-[#13241c] mt-0.5">
              {scenario.kcalPerPerson} kcal
            </div>
          </div>
          <div className="bg-white border border-[#e3ede6] rounded-lg py-2 px-3">
            <div className="text-[11px] text-[#6b8075]">Đánh giá TB</div>
            <div className="text-sm font-mono font-bold text-[#d97724] mt-0.5">
              {scenario.avgRating} / 5.0
            </div>
          </div>
          <div className="bg-white border border-[#e3ede6] rounded-lg py-2 px-3">
            <div className="text-[11px] text-[#6b8075]">Chờ tối đa / Khẩu phần</div>
            <div className="text-sm font-mono font-bold text-[#13241c] mt-0.5">
              {scenario.maxPrepTime}p · {scenario.totalServings} phần
            </div>
          </div>
        </div>

        {/* Full Dish List */}
        <div className="p-6 overflow-y-auto space-y-3 bg-[#f4f8f5]">
          <h3 className="text-xs font-semibold text-[#475c51] uppercase tracking-wide">
            Chi tiết {scenario.items.length} món trong thực đơn (cho {config.partySize} người)
          </h3>

          {scenario.items.map((dish, idx) => (
            <div
              key={dish.id}
              className="bg-white border border-[#dce7df] rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#6b8075]">#{idx + 1}</span>
                    <h4 className="text-sm font-bold text-[#13241c]">{dish.dish_name}</h4>
                    <span className="px-2 py-0.5 rounded bg-[#f4f8f5] text-[11px] text-[#475c51]">
                      {dish.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#6b8075] mt-0.5 flex flex-wrap gap-x-2">
                    <span>Ẩm thực: {dish.cuisine_type}</span>
                    <span>·</span>
                    <span>Loại: {dish.food_type}</span>
                    {dish.spice_level && dish.spice_level !== 'None' && (
                      <>
                        <span>·</span>
                        <span>Độ cay: {dish.spice_level}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono">
                  <div className="text-sm font-bold text-[#1e6f50]">
                    ${dish.selling_price.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-[#6b8075]">
                    TOPSIS {dish.topsisScore}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] font-mono text-[#475c51]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4f8f5]">
                  <Flame className="w-3 h-3 text-[#d97724]" />
                  {dish.calories} kcal (Độ no {dish.satiety_score}/5)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4f8f5]">
                  <Users className="w-3 h-3 text-[#1e6f50]" />
                  {dish.serving_size} người
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4f8f5]">
                  <Clock className="w-3 h-3 text-[#1d6a8a]" />
                  {dish.prep_time_min} phút
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4f8f5]">
                  <Star className="w-3 h-3 text-[#d97724] fill-[#d97724]" />
                  {dish.customer_rating}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4f8f5]">
                  <TrendingUp className="w-3 h-3 text-[#7c3a6b]" />
                  {dish.units_sold} lượt gọi
                </span>
              </div>

              <p className="text-xs text-[#475c51]">
                <span className="font-semibold text-[#13241c]">Nguyên liệu: </span>
                {dish.ingredients}
              </p>

              {dish.allergens && dish.allergens !== 'None' && (
                <p className="text-[11px] text-[#c2410c] flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 shrink-0" />
                  <span>Lưu ý dị ứng: {dish.allergens}</span>
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#dce7df] bg-white flex items-center justify-between">
          <span className="text-xs text-[#475c51]">
            Đa dạng: <strong>{scenario.uniqueCategories}</strong> nhóm món ·{' '}
            <strong>{scenario.uniqueCuisines}</strong> nền ẩm thực
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1e6f50] text-white text-xs font-semibold hover:bg-[#16593f] cursor-pointer"
          >
            Đóng chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}
