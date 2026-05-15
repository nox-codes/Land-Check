import React from 'react';
import type { Tone } from '../icons';

const TONE_STYLES: Record<Tone, { bg: string; color: string }> = {
  success: { bg: 'var(--lc-success-tint)', color: 'var(--lc-primary-700)' },
  caution: { bg: 'var(--lc-caution-tint)', color: '#92400E' },
  danger:  { bg: 'var(--lc-danger-tint)',  color: '#991B1B' },
  accent:  { bg: 'var(--lc-accent-tint)',  color: 'var(--lc-accent)' },
  info:    { bg: 'var(--lc-info-tint)',    color: '#1D4ED8' },
  neutral: { bg: '#F1F2F5',               color: '#6B7280' },
};

interface PillProps {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Pill: React.FC<PillProps> = ({ tone = 'neutral', dot = false, children, style }) => {
  const t = TONE_STYLES[tone];
  const dotColors: Record<Tone, string> = {
    success: 'var(--lc-primary)',
    caution: 'var(--lc-caution)',
    danger:  'var(--lc-danger)',
    accent:  'var(--lc-accent)',
    info:    'var(--lc-info)',
    neutral: '#9CA3AF',
  };
  return (
    <span
      className="lc-pill"
      style={{ background: t.bg, color: t.color, ...style }}
    >
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: 999,
          background: dotColors[tone], flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
};
