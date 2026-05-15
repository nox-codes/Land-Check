import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../icons';
import { Button } from '../ui';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export const MarketingNav: React.FC = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px', height: 68,
      background: scrolled ? 'rgba(255,255,255,0.9)' : '#fff',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: `1px solid ${scrolled ? 'var(--lc-border-subtle)' : 'transparent'}`,
      transition: 'all var(--lc-dur) var(--lc-ease)',
    }}>
      <Link to="/">
        <Logo size={22} />
      </Link>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/auth/login">
          <Button variant="ghost" size="sm">Sign In</Button>
        </Link>
        <Link to="/auth/signup">
          <Button size="sm">Get Started</Button>
        </Link>
      </div>
    </nav>
  );
};
