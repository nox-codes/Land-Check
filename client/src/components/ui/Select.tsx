import React, { useState, useRef, useEffect, useId } from 'react';
import { I } from '../icons';

interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: string[] | { label: string; value: string }[];
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  style,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  const normalized = options.map((o) =>
    typeof o === 'string' ? { label: o, value: o } : o
  );
  const selected = normalized.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500,
            color: 'var(--lc-text-muted)',
          }}
        >
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '10px 14px',
          background: open ? '#fff' : 'var(--lc-surface-2)',
          border: `1.5px solid ${open ? 'var(--lc-primary)' : 'var(--lc-border)'}`,
          borderRadius: 10, fontSize: 14, color: selected ? 'var(--lc-text)' : 'var(--lc-text-muted)',
          transition: 'all var(--lc-dur) var(--lc-ease)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          gap: 8,
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <I
          name="chevronDown"
          size={16}
          style={{
            color: 'var(--lc-text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform var(--lc-dur) var(--lc-ease)',
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <div
          className="lc-scale-in lc-card"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            zIndex: 50, padding: 4, maxHeight: 240, overflowY: 'auto',
            boxShadow: 'var(--lc-shadow-lg)',
          }}
        >
          {normalized.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px', borderRadius: 8, fontSize: 14,
                color: o.value === value ? 'var(--lc-primary)' : 'var(--lc-text)',
                background: o.value === value ? 'var(--lc-primary-50)' : 'transparent',
                fontWeight: o.value === value ? 500 : 400,
                transition: 'background var(--lc-dur)',
              }}
              onMouseEnter={(e) => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = 'var(--lc-surface-2)'; }}
              onMouseLeave={(e) => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
