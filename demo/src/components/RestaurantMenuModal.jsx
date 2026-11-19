import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Clock,
  Flame,
  Search,
  ShieldAlert,
  Star,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';

const CATEGORIES = ['Tất cả', 'Appetizer', 'Main Course', 'Dessert', 'Beverage'];

export default function RestaurantMenuModal({ isOpen, onClose, menu }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menu.filter((d) => {
      const catOk = activeCategory === 'Tất cả' || d.category === activeCategory;
      const searchOk =
        !q ||
        d.dish_name.toLowerCase().includes(q) ||
        d.ingredients.toLowerCase().includes(q) ||
        d.cuisine_type.toLowerCase().includes(q);
      return catOk && searchOk;
    });
  }, [menu, search, activeCategory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#13241c]/45 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#dce7df] rounded-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#dce7df] bg-[#f8fbf9] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#1e6f50]" />
            <div>
              <h2 className="text-lg font-bold text-[#13241c]">
                Thực Đơn Toàn Bộ Nhà Hàng ({menu.length} món)
              </h2>
              <p className="text-xs text-[#475c51]">
                Tra cứu giá bán, nguyên liệu, chất gây dị ứng, calo, độ no, khẩu phần và lượt gọi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#475c51] hover:bg-[#eaf2ec] hover:text-[#13241c] cursor-pointer"
            aria-label="Đóng thực đơn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filters */}
        <div className="px-6 py-3 border-b border-[#edf4ef] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#1e6f50] text-white border-[#1e6f50]'
                    : 'bg-[#f4f8f5] text-[#475c51] border-[#d5e3d9] hover:border-[#1e6f50]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#6b8075] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên món, nguyên liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#cfe0d4] bg-[#f4f8f5] text-xs text-[#13241c] placeholder-[#6b8075] focus:outline-none focus:border-[#1e6f50]"
            />
          </div>
        </div>

        {/* Dish Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#f4f8f5]">
          {filtered.map((dish) => (
            <div
              key={dish.id}
              className={`bg-white border rounded-xl p-4 flex flex-col justify-between ${
                dish.is_available ? 'border-[#dce7df]' : 'border-[#f3d4c2] bg-[#fffaf6] opacity-85'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#13241c]">{dish.dish_name}</h3>
                      {!dish.is_available && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#fdebe2] text-[#c2410c]">
                          Tạm hết hàng
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#6b8075] mt-0.5 flex flex-wrap gap-x-1.5">
                      <span>{dish.category}</span>
                      <span>·</span>
                      <span>{dish.cuisine_type}</span>
                      <span>·</span>
                      <span>{dish.food_type}</span>
                      {dish.spice_level && dish.spice_level !== 'None' && (
                        <>
                          <span>·</span>
                          <span>Cay: {dish.spice_level}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="font-mono text-sm font-bold text-[#1e6f50] shrink-0">
                    ${dish.selling_price.toFixed(2)}
                  </div>
                </div>

                {/* Key Numeric Specs */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#475c51] font-mono">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4f8f5]">
                    <Flame className="w-3 h-3 text-[#d97724]" />
                    {dish.calories} kcal (No {dish.satiety_score}/5)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4f8f5]">
                    <Users className="w-3 h-3 text-[#1e6f50]" />
                    {dish.serving_size} người
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4f8f5]">
                    <Clock className="w-3 h-3 text-[#1d6a8a]" />
                    {dish.prep_time_min}p
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

                {/* Ingredients & Allergens */}
                <p className="mt-2.5 text-xs text-[#475c51] leading-relaxed">
                  <span className="font-semibold text-[#13241c]">Nguyên liệu: </span>
                  {dish.ingredients}
                </p>
                {dish.allergens && dish.allergens !== 'None' && (
                  <p className="mt-1 text-[11px] text-[#c2410c] flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 shrink-0" />
                    <span>Chất gây dị ứng: {dish.allergens}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
