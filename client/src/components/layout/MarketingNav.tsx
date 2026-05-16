import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo, I } from '../icons';
import { Button } from '../ui';
import { useIsMobile } from '../../hooks/useIsMobile';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export const MarketingNav: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: scrolled ? 'rgba(255,255,255,0.95)' : '#fff',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: `1px solid ${scrolled ? 'var(--lc-border-subtle)' : 'transparent'}`,
      transition: 'all var(--lc-dur) var(--lc-ease)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 20px' : '0 48px', height: 68,
      }}>
        <Link to="/">
          <Logo size={isMobile ? 18 : 22} />
        </Link>

        {/* Desktop nav */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  fontSize: 14, fontWeight: 500,
                  color: location.pathname === link.to ? 'var(--lc-primary)' : 'var(--lc-text-secondary)',
                  transition: 'color var(--lc-dur)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Desktop CTA */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        )}

        {/* Mobile: hamburger */}
        {isMobile && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, color: 'var(--lc-text)',
              }}
            >
              <I name={mobileMenuOpen ? 'x' : 'menu'} size={22} />
            </button>

            {mobileMenuOpen && (
              <div className="lc-scale-in lc-card" style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                minWidth: 200, padding: 8, boxShadow: 'var(--lc-shadow-lg)', zIndex: 50,
                transformOrigin: 'top right',
              }}>
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'block', padding: '12px 14px', borderRadius: 8,
                      fontSize: 14, fontWeight: 500,
                      color: location.pathname === link.to ? 'var(--lc-primary)' : 'var(--lc-text)',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
                <div style={{ borderTop: '1px solid var(--lc-border-subtle)', margin: '8px 0', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" style={{ width: '100%' }}>Sign In</Button>
                  </Link>
                  <Link to="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" style={{ width: '100%' }}>Get Started</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
