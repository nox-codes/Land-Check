import React from 'react';
import { IconTile } from '../icons';
import type { IconName, Tone } from '../icons';
import { I } from '../icons';

interface StatCardProps {
  icon: IconName;
  iconTone?: Tone;
  label: string;
  value: string;
  delta?: string;
  deltaTone?: Tone;
}

const DELTA_COLORS: Record<Tone, string> = {
  success: 'var(--lc-primary)',
  caution: 'var(--lc-caution)',
  danger:  'var(--lc-danger)',
  accent:  'var(--lc-accent)',
  info:    'var(--lc-info)',
  neutral: 'var(--lc-text-muted)',
};

export const StatCard: React.FC<StatCardProps> = ({
  icon, iconTone = 'success', label, value, delta, deltaTone = 'success',
}) => (
  <div className="lc-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <IconTile icon={icon} tone={iconTone} size={44} />
      {delta && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 500,
          color: DELTA_COLORS[deltaTone],
          background: deltaTone === 'success' ? 'var(--lc-success-tint)'
            : deltaTone === 'danger' ? 'var(--lc-danger-tint)'
            : deltaTone === 'caution' ? 'var(--lc-caution-tint)'
            : 'var(--lc-accent-tint)',
          padding: '3px 8px', borderRadius: 999,
        }}>
          <I name={deltaTone === 'danger' ? 'arrowUp' : 'trendUp'} size={12} />
          {delta}
        </span>
      )}
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--lc-text)', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--lc-text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);
