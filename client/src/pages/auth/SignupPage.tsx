import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '../../components/layout/AuthShell';
import { Button, Input, Checkbox } from '../../components/ui';
import { I } from '../../components/icons';
import { useAuth } from '../../contexts/AuthContext';

export const SignupPage: React.FC = () => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (!agree) { setError('Please agree to the terms.'); return; }
    setLoading(true);
    try {
      await register({ email, password });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start verifying land titles in minutes.">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Email Address" type="email" value={email} onChange={setEmail} leading={<I name="mail" size={16} />} />
        <Input label="Password" type="password" value={password} onChange={setPassword} leading={<I name="shieldCheck" size={16} />} />
        <Input
          label="Confirm Password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          error={error && error.includes('match') ? error : undefined}
        />
        {error && !error.includes('match') && (
          <div style={{ fontSize: 13, color: 'var(--lc-danger)', padding: '8px 12px', background: 'var(--lc-danger-tint)', borderRadius: 8 }}>
            {error}
          </div>
        )}
        <Checkbox
          checked={agree}
          onChange={setAgree}
          label={<span style={{ fontSize: 13 }}>I agree to the <a href="#" style={{ color: 'var(--lc-primary)', fontWeight: 500 }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--lc-primary)', fontWeight: 500 }}>Privacy Policy</a></span>}
        />
        <Button type="submit" loading={loading} fullWidth size="lg" disabled={!email || !password || !agree}>Create Account</Button>
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--lc-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/auth/login" style={{ color: 'var(--lc-primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
};
