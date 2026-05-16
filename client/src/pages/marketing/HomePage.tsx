import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingNav } from '../../components/layout/MarketingNav';
import { MarketingFooter } from '../../components/layout/MarketingFooter';
import { Button } from '../../components/ui';
import { I, IconTile } from '../../components/icons';

const TRUST_TIERS = [
  { label: 'Verified', range: '75–100%', desc: 'Title is clean and government-backed. Safe to proceed.', tone: 'success' as const, color: 'var(--lc-primary)' },
  { label: 'Caution', range: '40–74%', desc: 'Some issues found. Further due diligence recommended.', tone: 'caution' as const, color: 'var(--lc-caution)' },
  { label: 'High Risk', range: '0–39%', desc: 'Significant red flags detected. Do not proceed.', tone: 'danger' as const, color: 'var(--lc-danger)' },
];

const HOW_STEPS = [
  { num: '01', title: 'Submit Property Details', desc: 'Enter the property address, plot number, and seller information.' },
  { num: '02', title: 'Upload Documents', desc: 'Upload C of O, deed of assignment, survey plans and more.' },
  { num: '03', title: 'AI Analysis', desc: 'Our AI cross-references government records and fraud databases.' },
  { num: '04', title: 'Receive Report', desc: 'Get a detailed trust score report within minutes.' },
];

const WHY_FEATURES = [
  { icon: 'radar' as const, tone: 'success' as const, title: 'AI-Powered Analysis', desc: 'Advanced ML models trained on millions of land records.' },
  { icon: 'shieldCheck' as const, tone: 'accent' as const, title: 'Government Database Access', desc: 'Direct integration with MLSS, CAC, and state registries.' },
  { icon: 'wallet' as const, tone: 'info' as const, title: 'Secure Escrow', desc: 'Funds held safely until verification is complete.' },
  { icon: 'brain' as const, tone: 'caution' as const, title: 'Fraud Detection', desc: 'Real-time scanning against known fraudulent sellers.' },
];

export const HomePage: React.FC = () => (
  <div style={{ background: '#fff' }}>
    <MarketingNav />

    {/* Hero */}
    <section className="lc-hero lc-fade-up">
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'var(--lc-primary-50)', color: 'var(--lc-primary-700)',
        padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500,
        marginBottom: 24,
      }}>
        <I name="shieldCheck" size={14} stroke="var(--lc-primary)" />
        Trusted by 50,000+ Nigerians
      </div>
      <h1 style={{
        fontSize: 72, fontWeight: 800, color: 'var(--lc-text)',
        letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 24px',
      }}>
        Verify Land Titles<br />
        <span style={{ color: 'var(--lc-primary)' }}>Before You Buy</span>
      </h1>
      <p style={{ fontSize: 18, color: 'var(--lc-text-muted)', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 40px' }}>
        Nigeria's most advanced land verification platform. Get an AI-powered trust score and avoid property fraud in minutes.
      </p>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
        <Link to="/auth/signup"><Button size="xl">Start Verification</Button></Link>
        <Link to="/about"><Button size="xl" variant="outline">Learn More</Button></Link>
      </div>
      <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 56, flexWrap: 'wrap' }}>
        {[['50K+', 'Verifications Done'], ['₦4B+', 'Fraud Prevented'], ['98%', 'Accuracy Rate']].map(([v, l]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--lc-primary)', letterSpacing: '-0.02em' }}>{v}</div>
            <div style={{ fontSize: 13, color: 'var(--lc-text-muted)' }}>{l}</div>
          </div>
        ))}
      </div>
    </section>

    {/* Trust Tiers */}
    <section className="lc-section-pad" style={{ background: 'var(--lc-bg)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, textAlign: 'center', marginBottom: 12, letterSpacing: '-0.02em' }}>Understanding Trust Scores</h2>
        <p style={{ textAlign: 'center', color: 'var(--lc-text-muted)', marginBottom: 48, fontSize: 16 }}>Every property gets a score from 0 to 100 based on our AI analysis.</p>
        <div className="lc-grid-3" style={{ gap: 24 }}>
          {TRUST_TIERS.map((tier) => (
            <div key={tier.label} className="lc-card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 999, background: tier.color, opacity: 0.1, margin: '0 auto 16px' }} />
              <div style={{ fontSize: 24, fontWeight: 700, color: tier.color, marginBottom: 4 }}>{tier.label}</div>
              <div style={{ fontSize: 14, color: 'var(--lc-text-muted)', marginBottom: 12 }}>Score: {tier.range}</div>
              <p style={{ fontSize: 14, color: 'var(--lc-text-secondary)', lineHeight: 1.6 }}>{tier.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* How It Works */}
    <section className="lc-section-pad" style={{ background: 'var(--lc-navy)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, textAlign: 'center', color: '#fff', marginBottom: 12, letterSpacing: '-0.02em' }}>How It Works</h2>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginBottom: 56, fontSize: 16 }}>Get started in under 5 minutes.</p>
        <div className="lc-grid-4" style={{ gap: 24 }}>
          {HOW_STEPS.map((s) => (
            <div key={s.num} style={{ textAlign: 'center' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 999,
                background: 'var(--lc-primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, margin: '0 auto 16px',
              }}>{s.num}</div>
              <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Why Trust */}
    <section className="lc-section-pad">
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, textAlign: 'center', marginBottom: 12, letterSpacing: '-0.02em' }}>Why Trust LandCheck?</h2>
        <p style={{ textAlign: 'center', color: 'var(--lc-text-muted)', marginBottom: 56, fontSize: 16 }}>Built for Nigeria, powered by world-class AI.</p>
        <div className="lc-grid-2" style={{ gap: 24 }}>
          {WHY_FEATURES.map((f) => (
            <div key={f.title} className="lc-card" style={{ padding: '28px 32px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <IconTile icon={f.icon} tone={f.tone} size={48} />
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ color: 'var(--lc-text-muted)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section style={{ padding: '80px 48px', background: 'var(--lc-primary)', textAlign: 'center' }}>
      <h2 style={{ fontSize: 40, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: '-0.02em' }}>Ready to Verify?</h2>
      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 17, marginBottom: 36 }}>Join 50,000+ Nigerians who verify before they buy.</p>
      <Link to="/auth/signup">
        <Button size="xl" variant="secondary">Start Free Verification</Button>
      </Link>
    </section>

    <MarketingFooter />
  </div>
);
