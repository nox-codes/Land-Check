import React, { useEffect, useRef, useState } from 'react';

interface TrustGaugeProps {
  score: number;  // 0–100
  size?: number;
}

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

export const TrustGauge: React.FC<TrustGaugeProps> = ({ score, size = 160 }) => {
  const animRef = useRef<number | null>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    setDisplay(0);
    const start = performance.now();
    const dur = 1000;
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      setDisplay(Math.round(easeOut(t) * score));
      if (t < 1) animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [score]);

  const sw = Math.max(10, size * 0.09);
  const r = (size - sw) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - display / 100);

  const color =
    display >= 75 ? 'var(--lc-primary)' :
    display >= 40 ? 'var(--lc-caution)' :
    'var(--lc-danger)';

  const label =
    display >= 75 ? 'VERIFIED' :
    display >= 40 ? 'CAUTION' :
    display > 0 ? 'HIGH RISK' : 'PENDING';

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size}>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="var(--lc-border)"
            strokeWidth={sw}
          />
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeDasharray={`${circ}`}
            strokeDashoffset={`${offset}`}
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: size * 0.2, fontWeight: 700, color: 'var(--lc-text)', lineHeight: 1, fontFamily: 'Poppins, sans-serif' }}>
          {display}%
        </div>
        <div style={{ fontSize: size * 0.08, fontWeight: 600, color, marginTop: 6, letterSpacing: '0.05em', fontFamily: 'Poppins, sans-serif' }}>
          {label}
        </div>
      </div>
    </div>
  );
};
