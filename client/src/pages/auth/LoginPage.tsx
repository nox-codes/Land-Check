import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '../../components/layout/AuthShell';
import { Button, Input, Checkbox } from '../../components/ui';
import { I } from '../../components/icons';
import { useAuth } from '../../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your LandCheck account.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input label="Email Address" type="email" value={email} onChange={setEmail} leading={<I name="mail" size={16} />} />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            leading={<I name="shieldCheck" size={16} />}
          />
          {error && (
            <div style={{ fontSize: 13, color: 'var(--lc-danger)', padding: '8px 12px', background: 'var(--lc-danger-tint)', borderRadius: 8 }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
            <Link to="/auth/forgot" style={{ fontSize: 13, fontWeight: 500, color: 'var(--lc-primary)' }}>
              Forgot password?
            </Link>
          </div>
          <Button type="submit" loading={loading} fullWidth size="lg">Sign In</Button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--lc-text-muted)', fontSize: 13 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--lc-border)' }} />
          Or continue with
          <div style={{ flex: 1, height: 1, background: 'var(--lc-border)' }} />
        </div>

        <Button
          type="button"
          variant="outline"
          fullWidth
          size="md"
          leading={<I name="google" size={18} />}
          onClick={() => { window.location.href = '/api/v1/auth/google'; }}
        >
          Continue with Google
        </Button>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--lc-text-muted)', margin: 0 }}>
          Don't have an account?{' '}
          <Link to="/auth/signup" style={{ color: 'var(--lc-primary)', fontWeight: 600 }}>Create one</Link>
        </p>
      </div>
    </AuthShell>
  );
};
