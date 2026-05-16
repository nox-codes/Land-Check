import React, { useState } from 'react';
import { MarketingNav } from '../../components/layout/MarketingNav';
import { MarketingFooter } from '../../components/layout/MarketingFooter';
import { Button, Input, Toast } from '../../components/ui';
import { I } from '../../components/icons';

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div style={{ background: '#fff' }}>
      <MarketingNav />

      <section style={{ padding: '80px 48px 100px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>Contact <span style={{ color: 'var(--lc-primary)' }}>Us</span></h1>
          <p style={{ color: 'var(--lc-text-muted)', fontSize: 16, lineHeight: 1.7 }}>We're here to help. Reach out and we'll respond within 24 hours.</p>
        </div>

        <div className="lc-grid-halves" style={{ gap: 48, alignItems: 'start' }}>
          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {[
              { icon: 'mail' as const, title: 'Email', value: 'support@landcheck.ng', sub: 'We reply within 24 hours' },
              { icon: 'phone' as const, title: 'Phone', value: '+234 800 LANDCHECK', sub: 'Mon–Fri, 8am–6pm WAT' },
              { icon: 'mapPin' as const, title: 'Office', value: '14 Broad Street, Victoria Island', sub: 'Lagos, Nigeria' },
            ].map((c) => (
              <div key={c.title} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'var(--lc-primary-50)', color: 'var(--lc-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <I name={c.icon} size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{c.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--lc-text-secondary)', marginTop: 2 }}>{c.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--lc-text-muted)', marginTop: 2 }}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lc-card" style={{ padding: 36 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="lc-grid-2">
                <Input label="Full Name" value={form.name} onChange={set('name')} />
                <Input label="Email Address" value={form.email} onChange={set('email')} type="email" />
              </div>
              <Input label="Subject" value={form.subject} onChange={set('subject')} />
              <Input label="Message" value={form.message} onChange={set('message')} multiline rows={5} />
              <Button type="submit" loading={loading} fullWidth size="lg">Send Message</Button>
            </form>
          </div>
        </div>
      </section>

      {submitted && (
        <Toast
          message="Message sent! We'll get back to you within 24 hours."
          tone="success"
          onClose={() => setSubmitted(false)}
        />
      )}

      <MarketingFooter />
    </div>
  );
};
