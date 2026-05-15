import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../../components/layout/AuthShell';
import { Button, Input } from '../../components/ui';
import { I } from '../../components/icons';

export const ForgotPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    navigate('/auth/forgot/verify', { state: { email } });
  };

  return (
    <AuthShell title="Forgot password?" subtitle="Enter your email and we'll send you a reset code.">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          leading={<I name="mail" size={16} />}
        />
        <Button type="submit" loading={loading} fullWidth size="lg">Send Reset Code</Button>
        <Link to="/auth/login" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontSize: 14, color: 'var(--lc-text-muted)',
        }}>
          <I name="arrowLeft" size={14} />
          Back to Sign In
        </Link>
      </form>
    </AuthShell>
  );
};
