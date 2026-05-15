import React, { useState, useId } from 'react';
import { I } from '../icons';

interface InputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  helper?: string;
  multiline?: boolean;
  rows?: number;
  leading?: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  error,
  helper,
  multiline = false,
  rows = 4,
  leading,
  disabled = false,
  style,
}) => {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const id = useId();
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPw ? 'text' : 'password') : type;
  const lifted = focused || !!value;

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    ...style,
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: multiline ? '24px 16px 10px' : '22px 16px 8px',
    paddingLeft: leading ? 44 : 16,
    paddingRight: isPassword ? 44 : 16,
    background: error ? 'var(--lc-danger-tint)' : focused ? '#fff' : 'var(--lc-surface-2)',
    border: `1.5px solid ${error ? 'var(--lc-danger)' : focused ? 'var(--lc-primary)' : 'var(--lc-border)'}`,
    borderRadius: 10,
    fontSize: 14,
    color: 'var(--lc-text)',
    transition: 'all var(--lc-dur) var(--lc-ease)',
    resize: multiline ? 'vertical' : 'none',
    minHeight: multiline ? rows * 24 + 34 : undefined,
    outline: 'none',
    opacity: disabled ? 0.6 : 1,
  };

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    left: leading ? 44 : 16,
    top: lifted ? 8 : '50%',
    transform: lifted ? 'none' : 'translateY(-50%)',
    fontSize: lifted ? 11 : 14,
    fontWeight: lifted ? 500 : 400,
    color: error ? 'var(--lc-danger)' : focused ? 'var(--lc-primary)' : 'var(--lc-text-muted)',
    transition: 'all var(--lc-dur) var(--lc-ease)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={containerStyle}>
      {leading && (
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--lc-text-muted)', pointerEvents: 'none',
        }}>
          {leading}
        </span>
      )}
      <label htmlFor={id} style={labelStyle}>{label}</label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          rows={rows}
          style={fieldStyle}
        />
      ) : (
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          style={fieldStyle}
        />
      )}
      {isPassword && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPw((p) => !p)}
          style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--lc-text-muted)',
          }}
        >
          <I name={showPw ? 'eyeOff' : 'eye'} size={18} />
        </button>
      )}
      {(error || helper) && (
        <div style={{
          marginTop: 4, fontSize: 12,
          color: error ? 'var(--lc-danger)' : 'var(--lc-text-muted)',
          paddingLeft: 4,
        }}>
          {error || helper}
        </div>
      )}
    </div>
  );
};
