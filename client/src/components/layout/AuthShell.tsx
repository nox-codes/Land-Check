import React from 'react';
import { Link } from 'react-router-dom';
import { Logo, I } from '../icons';
import { useIsMobile } from '../../hooks/useIsMobile';

interface AuthShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AuthShell: React.FC<AuthShellProps> = ({ children, title, subtitle }) => {
  const isMobile = useIsMobile();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      minHeight: '100vh',
    }}>
      {/* Left: form */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        padding: isMobile ? '32px 24px' : '40px 56px',
        background: '#fff',
        overflowY: 'auto',
      }}>
        <Link to="/">
          <Logo size={22} />
        </Link>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          maxWidth: 420, width: '100%', margin: '0 auto', paddingBlock: 40,
        }}>
          {title && (
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: 'var(--lc-text)', letterSpacing: '-0.02em', margin: 0 }}>{title}</h1>
              {subtitle && <p style={{ marginTop: 8, fontSize: 15, color: 'var(--lc-text-muted)', lineHeight: 1.6 }}>{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </div>

      {/* Right: brand panel — hidden on mobile */}
      {!isMobile && (
        <div style={{
          background: 'var(--lc-navy)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 48, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: 999, background: 'var(--lc-primary)', opacity: 0.06 }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: 999, background: 'var(--lc-accent)', opacity: 0.08 }} />

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
            <img
              src="/assets/hero-phone.png"
              alt="LandCheck App"
              className="lc-float"
              style={{ width: 220, marginBottom: 36 }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, padding: '20px 24px',
              display: 'flex', gap: 28,
            }}>
              {[
                { value: '50K+', label: 'Verifications' },
                { value: '98%', label: 'Accuracy' },
                { value: '24/7', label: 'Support' },
              ].map((s) => (
                <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--lc-primary)' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Instant title deed verification',
                'AI-powered fraud detection',
                'Secure escrow payments',
              ].map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--lc-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <I name="check" size={12} stroke="#fff" strokeWidth={2.5} />
                  </span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
