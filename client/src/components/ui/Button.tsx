import React from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, React.CSSProperties> = {
  primary:   { background: 'var(--lc-primary)',  color: '#fff', border: 'none' },
  secondary: { background: 'var(--lc-primary-50)', color: 'var(--lc-primary-700)', border: 'none' },
  ghost:     { background: 'transparent', color: 'var(--lc-text)', border: 'none' },
  outline:   { background: 'transparent', color: 'var(--lc-text)', border: '1.5px solid var(--lc-border)' },
  danger:    { background: 'var(--lc-danger)',  color: '#fff', border: 'none' },
  accent:    { background: 'var(--lc-accent)',  color: '#fff', border: 'none' },
};

const SIZES: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 14px',  fontSize: 13, borderRadius: 8,  gap: 6 },
  md: { padding: '10px 20px', fontSize: 14, borderRadius: 10, gap: 8 },
  lg: { padding: '13px 28px', fontSize: 15, borderRadius: 12, gap: 8 },
  xl: { padding: '16px 36px', fontSize: 16, borderRadius: 14, gap: 10 },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leading,
  trailing,
  fullWidth = false,
  disabled,
  children,
  style,
  ...props
}) => {
  const isDisabled = disabled || loading;
  return (
    <button
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Poppins, sans-serif',
        fontWeight: 500,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all var(--lc-dur) var(--lc-ease)',
        width: fullWidth ? '100%' : undefined,
        ...VARIANTS[variant],
        ...SIZES[size],
        ...style,
      }}
      {...props}
    >
      {loading ? <Spinner size={16} color="currentColor" /> : leading}
      {children}
      {!loading && trailing}
    </button>
  );
};
