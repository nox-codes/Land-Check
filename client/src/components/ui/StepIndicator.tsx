import React from 'react';
import { I } from '../icons';

interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, current }) => (
  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
    {steps.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: done ? 'var(--lc-primary)' : active ? 'var(--lc-primary)' : 'var(--lc-surface-2)',
              border: `2px solid ${done || active ? 'var(--lc-primary)' : 'var(--lc-border)'}`,
              color: done || active ? '#fff' : 'var(--lc-text-muted)',
              fontWeight: 600, fontSize: 14,
              transition: 'all var(--lc-dur) var(--lc-ease)',
            }}>
              {done ? <I name="check" size={16} stroke="#fff" strokeWidth={2.5} /> : i + 1}
            </div>
            <span style={{
              fontSize: 12, fontWeight: active ? 600 : 400,
              color: active ? 'var(--lc-text)' : done ? 'var(--lc-primary)' : 'var(--lc-text-muted)',
              whiteSpace: 'nowrap',
            }}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 2, marginBottom: 24, marginInline: 8,
              background: i < current ? 'var(--lc-primary)' : 'var(--lc-border)',
              transition: 'background var(--lc-dur) var(--lc-ease)',
            }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);
