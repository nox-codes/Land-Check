import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui';
import { I, LogoMark } from '../../components/icons';

export const CertificatePage: React.FC = () => (
  <AppShell title="Verification Certificate">
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 20 }}>
      <Button variant="outline" size="sm" leading={<I name="copy" size={14} />}>Copy Link</Button>
      <Button size="sm" leading={<I name="download" size={14} />}>Download PDF</Button>
    </div>

    <div style={{
      background: '#fff', borderRadius: 16, border: '2px solid var(--lc-primary)',
      padding: 48, maxWidth: 780, margin: '0 auto',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Watermark */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', opacity: 0.04,
      }}>
        <LogoMark size={320} color="var(--lc-primary)" />
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: 'var(--lc-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I name="shieldCheck" size={36} stroke="#fff" strokeWidth={2} />
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
          LandCheck Technologies Ltd.
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--lc-text)', letterSpacing: '-0.02em', marginBottom: 6 }}>
          Land Verification Certificate
        </h1>
        <div style={{ fontSize: 13, color: 'var(--lc-text-muted)' }}>Certificate No: LV-2026-03-12-2256</div>
      </div>

      {/* Trust badge */}
      <div style={{
        background: 'var(--lc-primary-50)', border: '1.5px solid var(--lc-primary)',
        borderRadius: 12, padding: '16px 24px', textAlign: 'center', marginBottom: 36,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--lc-primary)', marginBottom: 4 }}>VERIFIED — HIGH TRUST</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--lc-primary)' }}>88/100</div>
        <div style={{ fontSize: 13, color: 'var(--lc-primary-700)' }}>Trust Score</div>
      </div>

      {/* Property details */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Property Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            ['Property Address', 'Plot 127, Lekki Phase 1, Lagos'],
            ['Plot Number', 'PLT/LKK/2021/0127'],
            ['Survey Plan No.', 'SP-LG-2021-5623'],
            ['Land Area', '600 sqm'],
            ['Property Type', 'Residential'],
            ['State', 'Lagos State'],
          ].map(([k, v]) => (
            <div key={k} style={{ paddingBottom: 12, borderBottom: '1px solid var(--lc-border-subtle)' }}>
              <div style={{ fontSize: 11, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Seller */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Seller Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            ['Seller Name', 'Ahmed Abubakar'],
            ['NIN Verified', 'Yes — Confirmed'],
          ].map(([k, v]) => (
            <div key={k} style={{ paddingBottom: 12, borderBottom: '1px solid var(--lc-border-subtle)' }}>
              <div style={{ fontSize: 11, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 28, borderTop: '2px solid var(--lc-border-subtle)' }}>
        {[
          { label: 'LandCheck AI Verification', name: 'AI Verification System', date: 'May 13, 2026' },
          { label: 'Certified Analyst', name: 'Olumide Adeyemi', date: 'May 13, 2026' },
        ].map((sig) => (
          <div key={sig.label} style={{ textAlign: 'center' }}>
            <div style={{ width: 120, height: 1, background: 'var(--lc-text)', margin: '0 auto 8px' }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>{sig.name}</div>
            <div style={{ fontSize: 11, color: 'var(--lc-text-muted)', marginTop: 2 }}>{sig.label}</div>
            <div style={{ fontSize: 11, color: 'var(--lc-text-muted)' }}>{sig.date}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--lc-text-muted)', lineHeight: 1.6 }}>
        This certificate is valid for 90 days from the date of issue. Verify authenticity at verify.landcheck.ng
      </div>
    </div>
  </AppShell>
);
