import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthShell } from '../../components/layout/AuthShell';
import { Button } from '../../components/ui';

const CODE_LEN = 6;

export const VerifyCodePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || 'your email';
  const [digits, setDigits] = useState<string[]>(Array(CODE_LEN).fill(''));
  const [countdown, setCountdown] = useState(45);
  const [loading, setLoading] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (i: number, val: string) => {
    const d = [...digits];
    if (val.length > 1) {
      // paste handling
      const pasted = val.replace(/\D/g, '').slice(0, CODE_LEN);
      const newDigits = [...d];
      for (let j = 0; j < pasted.length && i + j < CODE_LEN; j++) {
        newDigits[i + j] = pasted[j];
      }
      setDigits(newDigits);
      refs.current[Math.min(i + pasted.length, CODE_LEN - 1)]?.focus();
      return;
    }
    if (!/^\d?$/.test(val)) return;
    d[i] = val;
    setDigits(d);
    if (val && i < CODE_LEN - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    navigate('/auth/forgot/set-new');
  };

  return (
    <AuthShell title="Check your email" subtitle={`We sent a 6-digit code to ${email}.`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: 52, height: 60, textAlign: 'center',
                fontSize: 24, fontWeight: 700, color: 'var(--lc-text)',
                border: `2px solid ${d ? 'var(--lc-primary)' : 'var(--lc-border)'}`,
                borderRadius: 12, background: '#fff',
                outline: 'none',
                transition: 'border-color var(--lc-dur)',
              }}
            />
          ))}
        </div>
        <Button type="submit" loading={loading} fullWidth size="lg" disabled={digits.some((d) => !d)}>
          Verify Code
        </Button>
        <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--lc-text-muted)' }}>
          {countdown > 0 ? (
            <>Resend code in <span style={{ fontWeight: 600, color: 'var(--lc-text)' }}>{countdown}s</span></>
          ) : (
            <button
              type="button"
              onClick={() => setCountdown(45)}
              style={{ color: 'var(--lc-primary)', fontWeight: 600, fontSize: 14 }}
            >
              Resend code
            </button>
          )}
        </div>
      </form>
    </AuthShell>
  );
};
