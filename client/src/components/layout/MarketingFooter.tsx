import React from 'react';
import { Link } from 'react-router-dom';
import { Logo, I } from '../icons';

export const MarketingFooter: React.FC = () => (
  <footer style={{ background: 'var(--lc-navy)', color: '#fff', padding: '60px 48px 32px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
      {/* Brand */}
      <div>
        <Logo size={22} color="var(--lc-primary)" />
        <p style={{ marginTop: 14, fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 280 }}>
          Nigeria's most trusted land verification platform. Verify before you buy.
        </p>
        <div style={{ display: 'flex', gap: 14, marginTop: 20 }}>
          {(['twitter', 'facebook', 'instagram'] as const).map((icon) => (
            <a key={icon} href="#" style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.7)',
              transition: 'all var(--lc-dur)',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--lc-primary)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
            >
              <I name={icon} size={16} />
            </a>
          ))}
        </div>
      </div>
      {/* Links */}
      {[
        { title: 'Product', links: ['How It Works', 'Pricing', 'API Docs', 'Integrations'] },
        { title: 'Company', links: ['About Us', 'Blog', 'Careers', 'Press'] },
        { title: 'Legal', links: ['Privacy Policy', 'Terms of Use', 'Cookie Policy', 'Contact'] },
      ].map((col) => (
        <div key={col.title}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {col.title}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {col.links.map((l) => (
              <a key={l} href="#" style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', transition: 'color var(--lc-dur)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; }}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: 13, color: 'rgba(255,255,255,0.4)',
    }}>
      <span>© 2026 LandCheck Technologies Ltd. All rights reserved.</span>
      <div style={{ display: 'flex', gap: 16 }}>
        <Link to="/about" style={{ color: 'rgba(255,255,255,0.4)' }}>About</Link>
        <Link to="/contact" style={{ color: 'rgba(255,255,255,0.4)' }}>Contact</Link>
      </div>
    </div>
  </footer>
);
