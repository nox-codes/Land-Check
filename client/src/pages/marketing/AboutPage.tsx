import React, { useState } from 'react';
import { MarketingNav } from '../../components/layout/MarketingNav';
import { MarketingFooter } from '../../components/layout/MarketingFooter';
import { I } from '../../components/icons';

const TEAM = [
  { name: 'Chidi Okafor', role: 'CEO & Co-Founder', img: '/assets/team-1.jpg' },
  { name: 'Amina Bello', role: 'CTO & Co-Founder', img: '/assets/team-2.jpg' },
  { name: 'Tunde Adeleke', role: 'Head of AI Research', img: '/assets/team-3.jpg' },
];

const FAQS = [
  { q: 'How does LandCheck verify land titles?', a: 'We integrate directly with state land registries, MLSS, CAC, and other government databases to cross-reference property information against official records.' },
  { q: 'How long does verification take?', a: 'Most verifications are completed within 5–15 minutes. Complex cases may take up to 24 hours.' },
  { q: 'What documents do I need to upload?', a: 'You need the Certificate of Occupancy (C of O), Deed of Assignment, Survey Plan, and the seller\'s government-issued ID.' },
  { q: 'Is my data secure?', a: 'Absolutely. All data is encrypted at rest and in transit using AES-256. We are SOC2 Type II compliant.' },
  { q: 'What is the trust score?', a: 'The trust score (0–100) represents the likelihood that a property\'s title is legitimate. Scores above 75 are verified, 40–74 require caution, and below 40 indicate high risk.' },
];

export const AboutPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ background: '#fff' }}>
      <MarketingNav />

      {/* Hero */}
      <section style={{ padding: '80px 48px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }} className="lc-fade-up">
        <h1 style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Our <span style={{ color: 'var(--lc-primary)' }}>Mission</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--lc-text-muted)', lineHeight: 1.7 }}>
          To eliminate land fraud in Nigeria by making property verification accessible, fast, and trustworthy for every Nigerian.
        </p>
      </section>

      {/* Problem */}
      <section style={{ padding: '60px 48px', background: 'var(--lc-bg)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--lc-primary)', fontWeight: 600, fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>The Problem</div>
            <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20 }}>Land Fraud Costs Nigerians Billions Annually</h2>
            <p style={{ color: 'var(--lc-text-muted)', lineHeight: 1.8, fontSize: 15 }}>
              Over ₦4 billion is lost to land fraud every year in Nigeria. Fraudulent sellers use forged documents, double sales, and phantom properties to scam unsuspecting buyers.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { val: '₦4B+', label: 'Lost to land fraud annually' },
              { val: '1 in 3', label: 'Property transactions involves fraud risk' },
              { val: '72%', label: 'Of victims had no prior verification' },
            ].map((s) => (
              <div key={s.label} className="lc-card" style={{ padding: '20px 24px', display: 'flex', gap: 20, alignItems: 'center' }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--lc-danger)', letterSpacing: '-0.02em', minWidth: 80 }}>{s.val}</span>
                <span style={{ color: 'var(--lc-text-secondary)', fontSize: 14 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, textAlign: 'center', marginBottom: 48, letterSpacing: '-0.02em' }}>Our Values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { icon: '🔍', title: 'Transparency', desc: 'Every verification step is documented and available to our clients.' },
              { icon: '🛡️', title: 'Security', desc: 'Bank-grade encryption protects every document and transaction.' },
              { icon: '⚡', title: 'Speed', desc: 'Most verifications complete in under 15 minutes.' },
            ].map((v) => (
              <div key={v.title} className="lc-card" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{v.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{v.title}</h3>
                <p style={{ color: 'var(--lc-text-muted)', fontSize: 14, lineHeight: 1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: '80px 48px', background: 'var(--lc-bg)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, textAlign: 'center', marginBottom: 48, letterSpacing: '-0.02em' }}>Meet the Team</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
            {TEAM.map((m) => (
              <div key={m.name} className="lc-card" style={{ padding: 28, textAlign: 'center' }}>
                <img
                  src={m.img}
                  alt={m.name}
                  style={{ width: 88, height: 88, borderRadius: 999, objectFit: 'cover', margin: '0 auto 16px' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{ fontSize: 16, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 13, color: 'var(--lc-text-muted)', marginTop: 4 }}>{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, textAlign: 'center', marginBottom: 48, letterSpacing: '-0.02em' }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map((faq, i) => (
              <div key={i} className="lc-card" style={{ overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '18px 22px', textAlign: 'left',
                    fontSize: 15, fontWeight: 500, color: 'var(--lc-text)',
                  }}
                >
                  {faq.q}
                  <I
                    name="chevronDown"
                    size={18}
                    style={{
                      flexShrink: 0, color: 'var(--lc-text-muted)',
                      transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform var(--lc-dur)',
                    }}
                  />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 22px 18px', fontSize: 14, color: 'var(--lc-text-secondary)', lineHeight: 1.7 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};
