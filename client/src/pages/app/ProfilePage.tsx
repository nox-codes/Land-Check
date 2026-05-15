import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Section } from '../../components/ui';
import { I } from '../../components/icons';
import { useAuth, displayName } from '../../contexts/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const name = displayName(user);

  return (
    <AppShell title="My Profile" subtitle="Your account information">
      <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Avatar + name */}
        <div className="lc-card" style={{ padding: '28px 24px', display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 999,
            background: 'var(--lc-primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, flexShrink: 0,
          }}>
            {name.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--lc-text)' }}>{name}</div>
            <div style={{ fontSize: 14, color: 'var(--lc-text-muted)', marginTop: 2 }}>{user?.email}</div>
            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: user?.role === 'ADMIN' ? 'var(--lc-accent-tint)' : 'var(--lc-primary-50)', fontSize: 12, fontWeight: 600, color: user?.role === 'ADMIN' ? 'var(--lc-accent)' : 'var(--lc-primary)' }}>
              {user?.role === 'ADMIN' ? 'Administrator' : 'User'}
            </div>
          </div>
        </div>

        <Section title="Account Details">
          <div className="lc-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                { icon: 'mail' as const, label: 'Email Address', value: user?.email || '—' },
                { icon: 'user' as const, label: 'Display Name', value: name || '—' },
                { icon: 'shieldCheck' as const, label: 'Account Role', value: user?.role === 'ADMIN' ? 'Administrator' : 'Standard User' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--lc-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <I name={row.icon} size={16} stroke="var(--lc-primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{row.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--lc-text)', marginTop: 2 }}>{row.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <div style={{ padding: '16px 20px', background: 'var(--lc-primary-50)', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <I name="info" size={16} stroke="var(--lc-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: 'var(--lc-primary-700)', margin: 0, lineHeight: 1.6 }}>
            To update your email or change your password, please contact support. Additional profile fields will be available in a future update.
          </p>
        </div>

      </div>
    </AppShell>
  );
};
