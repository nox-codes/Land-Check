import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '../../components/layout/AuthShell';
import { Button, Input } from '../../components/ui';

function getStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_COLORS = ['var(--lc-danger)', 'var(--lc-caution)', 'var(--lc-caution)', 'var(--lc-primary)', 'var(--lc-primary)'];
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

export const SetNewPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    navigate('/auth/login');
  };

  return (
    <AuthShell title="Set new password" subtitle="Create a strong password for your account.">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <Input label="New Password" type="password" value={password} onChange={setPassword} />
          {password && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: i <= strength ? STRENGTH_COLORS[strength] : 'var(--lc-border)',
                    transition: 'background var(--lc-dur)',
                  }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: STRENGTH_COLORS[strength] }}>{STRENGTH_LABELS[strength]}</span>
            </div>
          )}
        </div>
        <Input
          label="Confirm Password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          error={confirm && confirm !== password ? 'Passwords do not match' : undefined}
        />
        <Button
          type="submit"
          loading={loading}
          fullWidth
          size="lg"
          disabled={!password || password !== confirm}
        >
          Reset Password
        </Button>
      </form>
    </AuthShell>
  );
};
