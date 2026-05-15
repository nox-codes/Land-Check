import React, { useState } from 'react';

interface ActivityChartProps {
  data: number[];
  labels?: string[];
  highlight?: number;
  height?: number;
}

function cubicSpline(points: [number, number][]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({
  data,
  labels = [],
  highlight,
  height = 180,
}) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; label: string } | null>(null);
  const W = 580;
  const H = height;
  const pad = { t: 16, r: 16, b: 32, l: 32 };
  const w = W - pad.l - pad.r;
  const h = H - pad.t - pad.b;
  const max = Math.max(...data, 1);
  const min = 0;

  const pts: [number, number][] = data.map((v, i) => [
    pad.l + (i / (data.length - 1)) * w,
    pad.t + h - ((v - min) / (max - min)) * h,
  ]);

  const linePath = cubicSpline(pts);
  const areaPath = linePath
    + ` L ${pts[pts.length - 1][0]} ${pad.t + h} L ${pts[0][0]} ${pad.t + h} Z`;

  const gradId = 'lc-chart-grad';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--lc-primary)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--lc-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const y = pad.t + h * (1 - f);
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={pad.l + w} y2={y} stroke="var(--lc-border)" strokeWidth={1} />
            <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize={10} fill="var(--lc-text-muted)">
              {Math.round(f * max)}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke="var(--lc-primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Points */}
      {pts.map(([x, y], i) => (
        <g key={i}>
          {highlight === i && (
            <circle cx={x} cy={y} r={14} fill="var(--lc-primary)" fillOpacity="0.08" />
          )}
          <circle
            cx={x} cy={y} r={highlight === i ? 6 : 4}
            fill={highlight === i ? 'var(--lc-primary)' : '#fff'}
            stroke="var(--lc-primary)"
            strokeWidth={2}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setTooltip({ x, y, value: data[i], label: labels[i] || `${i + 1}` })}
            onMouseLeave={() => setTooltip(null)}
          />
          {labels[i] && (
            <text x={x} y={pad.t + h + 20} textAnchor="middle" fontSize={11} fill="var(--lc-text-muted)">
              {labels[i]}
            </text>
          )}
        </g>
      ))}

      {/* Tooltip */}
      {tooltip && (
        <g>
          <rect
            x={tooltip.x - 30} y={tooltip.y - 36}
            width={60} height={26}
            rx={6} fill="var(--lc-navy)"
          />
          <text x={tooltip.x} y={tooltip.y - 20} textAnchor="middle" fontSize={12} fill="#fff" fontWeight="600">
            {tooltip.value}
          </text>
        </g>
      )}
    </svg>
  );
};
