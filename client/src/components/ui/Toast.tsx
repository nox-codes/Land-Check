import React, { useEffect, useState } from 'react';
import { I } from '../icons';
import type { Tone } from '../icons';

interface ToastProps {
  message: string;
  tone?: Tone;
  onClose?: () => void;
  duration?: number;
}

const TONE_STYLES: Record<Tone, { bg: string; color: string; border: string; icon: 'checkCircle' | 'alertTriangle' | 'info' }> = {
  success: { bg: 'var(--lc-success-tint)', color: 'var(--lc-primary-700)', border: 'var(--lc-primary)', icon: 'checkCircle' },
  caution: { bg: 'var(--lc-caution-tint)', color: '#92400E', border: 'var(--lc-caution)', icon: 'alertTriangle' },
  danger:  { bg: 'var(--lc-danger-tint)',  color: '#991B1B', border: 'var(--lc-danger)',  icon: 'alertTriangle' },
  accent:  { bg: 'var(--lc-accent-tint)',  color: 'var(--lc-accent)', border: 'var(--lc-accent)', icon: 'info' },
  info:    { bg: 'var(--lc-info-tint)',    color: '#1D4ED8', border: 'var(--lc-info)', icon: 'info' },
  neutral: { bg: '#F1F2F5', color: '#374151', border: '#D1D5DB', icon: 'info' },
};

export const Toast: React.FC<ToastProps> = ({ message, tone = 'success', onClose, duration = 3500 }) => {
  const [visible, setVisible] = useState(true);
  const t = TONE_STYLES[tone];

  useEffect(() => {
    const timer = setTimeout(() => { setVisible(false); setTimeout(() => onClose?.(), 300); }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 20px',
      background: t.bg,
      border: `1.5px solid ${t.border}`,
      borderRadius: 12,
      boxShadow: 'var(--lc-shadow-lg)',
      color: t.color,
      fontSize: 14, fontWeight: 500,
      maxWidth: 360,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.3s var(--lc-ease)',
    }}>
      <I name={t.icon} size={18} stroke={t.border} />
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(() => onClose?.(), 300); }}
        style={{ color: t.color, opacity: 0.6, marginLeft: 4 }}>
        <I name="check" size={16} />
      </button>
    </div>
  );
};
