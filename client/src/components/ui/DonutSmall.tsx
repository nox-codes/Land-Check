import React from 'react';

interface DonutSmallProps {
  value: number;
  total: number;
  color?: string;
  size?: number;
}

export const DonutSmall: React.FC<DonutSmallProps> = ({
  value,
  total,
  color = 'var(--lc-primary)',
  size = 32,
}) => {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / total) * circ;
  const cx = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--lc-border)" strokeWidth={4} />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
      />
    </svg>
  );
};
