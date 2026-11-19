import React, { useState } from 'react';

const AXES = [
  { key: 'cost', label: 'Giá tiền', angleDeg: -90 },
  { key: 'nutrition', label: 'Cân bằng dinh dưỡng', angleDeg: 0 },
  { key: 'rating', label: 'Rating', angleDeg: 90 },
  { key: 'diversity', label: 'Tính đa dạng', angleDeg: 180 },
];

export const OPTION_STYLES = {
  A: {
    stroke: '#1e6f50',
    fill: 'rgba(30, 111, 80, 0.14)',
    fillActive: 'rgba(30, 111, 80, 0.28)',
    badgeBg: '#e6f4ed',
    shortLabel: 'Option A · Cân bằng',
  },
  B: {
    stroke: '#d97724',
    fill: 'rgba(217, 119, 36, 0.13)',
    fillActive: 'rgba(217, 119, 36, 0.26)',
    badgeBg: '#fdf1e6',
    shortLabel: 'Option B · Tiết kiệm',
  },
  C: {
    stroke: '#1d6a8a',
    fill: 'rgba(29, 106, 138, 0.13)',
    fillActive: 'rgba(29, 106, 138, 0.26)',
    badgeBg: '#e6f2f7',
    shortLabel: 'Option C · Trải nghiệm',
  },
  D: {
    stroke: '#7c3a6b',
    fill: 'rgba(124, 58, 107, 0.13)',
    fillActive: 'rgba(124, 58, 107, 0.26)',
    badgeBg: '#f5ecf3',
    shortLabel: 'Option D · Best-seller',
  },
};

function polarToCartesian(cx, cy, radius, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export default function RadarChart({ scenarios, selectedKey, onSelectKey }) {
  const [hoveredKey, setHoveredKey] = useState(null);

  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = 110;
  const levels = [20, 40, 60, 80, 100];

  if (!scenarios || scenarios.length === 0) {
    return null;
  }

  const activeFocus = hoveredKey || selectedKey;

  return (
    <div className="flex flex-col items-center">
      {/* Interactive Legend Pills */}
      <div className="w-full flex flex-wrap items-center justify-center gap-2 mb-3">
        {scenarios.map((sc) => {
          const st = OPTION_STYLES[sc.key];
          const isFocused = activeFocus === sc.key;
          const isDimmed = activeFocus && !isFocused;
          return (
            <button
              key={sc.key}
              type="button"
              onMouseEnter={() => setHoveredKey(sc.key)}
              onMouseLeave={() => setHoveredKey(null)}
              onClick={() => onSelectKey && onSelectKey(selectedKey === sc.key ? null : sc.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                isDimmed ? 'opacity-45' : 'opacity-100'
              }`}
              style={{
                borderColor: isFocused ? st.stroke : '#dce7df',
                backgroundColor: isFocused ? st.badgeBg : '#ffffff',
                color: '#13241c',
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: st.stroke }}
              />
              <span>{st.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Crisp Botanical Light Radar SVG */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[350px] h-auto overflow-visible"
        role="img"
        aria-label="Biểu đồ Radar so sánh 3 kịch bản thực đơn"
      >
        {/* Concentric rings */}
        {levels.map((lvl) => {
          const r = (lvl / 100) * maxRadius;
          const pts = AXES.map((ax) => {
            const p = polarToCartesian(cx, cy, r, ax.angleDeg);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <g key={lvl}>
              <polygon
                points={pts}
                fill={lvl === 100 ? '#f8fbf9' : 'none'}
                stroke={lvl === 100 ? '#c4d7ca' : '#dce7df'}
                strokeWidth={lvl === 100 ? '1.2' : '0.9'}
                strokeDasharray={lvl === 100 ? undefined : '3,3'}
              />
              <text
                x={cx + 5}
                y={cy - r + 10}
                fontSize="9"
                fill="#6b8075"
                fontFamily="JetBrains Mono, monospace"
              >
                {lvl}
              </text>
            </g>
          );
        })}

        {/* Axis spokes and labels */}
        {AXES.map((ax) => {
          const end = polarToCartesian(cx, cy, maxRadius, ax.angleDeg);
          const labelPos = polarToCartesian(cx, cy, maxRadius + 24, ax.angleDeg);
          let textAnchor = 'middle';
          if (ax.angleDeg === 0) textAnchor = 'start';
          if (ax.angleDeg === 180) textAnchor = 'end';

          return (
            <g key={ax.key}>
              <line
                x1={cx}
                y1={cy}
                x2={end.x}
                y2={end.y}
                stroke="#cfe0d4"
                strokeWidth="1"
              />
              <text
                x={labelPos.x}
                y={labelPos.y + 4}
                textAnchor={textAnchor}
                fontSize="11.5"
                fontWeight="600"
                fill="#13241c"
              >
                {ax.label}
              </text>
            </g>
          );
        })}

        {/* Scenario polygons */}
        {scenarios.map((sc) => {
          const st = OPTION_STYLES[sc.key];
          const isFocused = activeFocus === sc.key;
          const isDimmed = activeFocus && !isFocused;

          const points = AXES.map((ax) => {
            const val = sc.radar[ax.key] || 0;
            const r = (val / 100) * maxRadius;
            return polarToCartesian(cx, cy, r, ax.angleDeg);
          });

          const polyString = points.map((p) => `${p.x},${p.y}`).join(' ');

          return (
            <g
              key={sc.key}
              className="radar-polygon cursor-pointer"
              style={{ opacity: isDimmed ? 0.2 : 1 }}
              onMouseEnter={() => setHoveredKey(sc.key)}
              onMouseLeave={() => setHoveredKey(null)}
              onClick={() => onSelectKey && onSelectKey(selectedKey === sc.key ? null : sc.key)}
            >
              <polygon
                points={polyString}
                fill={isFocused ? st.fillActive : st.fill}
                stroke={st.stroke}
                strokeWidth={isFocused ? '2.5' : '1.9'}
                strokeLinejoin="round"
              />
              {points.map((p, idx) => (
                <g key={AXES[idx].key}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isFocused ? 4.5 : 3.2}
                    fill={st.stroke}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {isFocused && (
                    <text
                      x={p.x}
                      y={p.y - 9}
                      textAnchor="middle"
                      fontSize="10.5"
                      fontWeight="700"
                      fontFamily="JetBrains Mono, monospace"
                      fill={st.stroke}
                    >
                      {sc.radar[AXES[idx].key]}
                    </text>
                  )}
                </g>
              ))}
            </g>
          );
        })}
      </svg>

      {/* Compact Numeric Matrix */}
      <div className="w-full mt-4 overflow-x-auto">
        <table className="w-full text-xs border-collapse tabular-nums">
          <thead>
            <tr className="border-b border-[#dce7df] text-[#6b8075]">
              <th className="py-1.5 text-left font-medium">Trục đánh giá</th>
              {scenarios.map((sc) => (
                <th
                  key={sc.key}
                  className="py-1.5 text-right font-semibold"
                  style={{ color: OPTION_STYLES[sc.key].stroke }}
                >
                  Option {sc.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AXES.map((ax) => (
              <tr key={ax.key} className="border-b border-[#edf4ef]">
                <td className="py-1.5 text-[#475c51] font-medium">{ax.label}</td>
                {scenarios.map((sc) => (
                  <td
                    key={sc.key}
                    className={`py-1.5 text-right font-mono ${
                      activeFocus === sc.key ? 'text-[#13241c] font-bold' : 'text-[#475c51]'
                    }`}
                  >
                    {sc.radar[ax.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
