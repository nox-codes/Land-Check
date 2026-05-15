import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo, I } from '../icons';
import type { IconName } from '../icons';
import { useAuth, displayName } from '../../contexts/AuthContext';
import { getNotifications } from '../../api/notifications';

const NAV_ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: '/app/dashboard',     label: 'Main Dashboard',      icon: 'dashboard' },
  { to: '/app/verify/new',    label: 'Start Verification',  icon: 'search' },
  { to: '/app/report',        label: 'Verification Report', icon: 'clipboard' },
  { to: '/app/purchases',     label: 'My Purchases',        icon: 'home' },
  { to: '/app/wallet',        label: 'My Wallet',           icon: 'wallet' },
  { to: '/app/escrow',        label: 'Escrow Status',       icon: 'shieldCheck' },
  { to: '/app/verifications', label: 'My Verifications',    icon: 'users' },
  { to: '/app/upload',        label: 'Upload & Chat',       icon: 'cloud' },
  { to: '/app/notifications', label: 'Notifications',       icon: 'bell' },
];

const ADMIN_NAV: { to: string; label: string; icon: IconName } = {
  to: '/app/admin', label: 'Admin Panel', icon: 'settings',
};

const SidebarItem: React.FC<{ to: string; icon: IconName; label: string; active: boolean }> = ({
  to, icon, label, active,
}) => {
  const [hover, setHover] = useState(false);
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 14px', borderRadius: 10,
          background: active ? 'var(--lc-primary)' : hover ? 'rgba(255,255,255,0.06)' : 'transparent',
          color: '#fff',
          fontSize: 14, fontWeight: active ? 500 : 400,
          transition: 'all var(--lc-dur) var(--lc-ease)',
          boxShadow: active ? '0 4px 12px rgba(61,179,73,0.3)' : 'none',
          cursor: 'pointer',
        }}
      >
        <I name={icon} size={20} strokeWidth={active ? 2 : 1.75} />
        {label}
      </div>
    </Link>
  );
};

const TopBar: React.FC<{ title?: string; subtitle?: string }> = ({ title, subtitle }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const name = displayName(user);

  const pollNotifications = useCallback(async () => {
    try {
      const { unreadCount: count } = await getNotifications();
      setUnreadCount(count);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    pollNotifications();
    const interval = setInterval(pollNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, pollNotifications]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div style={{
      padding: '18px 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid var(--lc-border-subtle)',
      background: '#fff',
    }}>
      <div>
        {title && <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--lc-text)' }}>{title}</h1>}
        {subtitle && <div style={{ fontSize: 13, color: 'var(--lc-text-muted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Link to="/app/notifications" onClick={() => setUnreadCount(0)} style={{
          width: 40, height: 40, borderRadius: 999,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--lc-primary)', position: 'relative',
        }}>
          <I name="bell" size={22} strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 16, height: 16, borderRadius: 999,
              background: 'var(--lc-danger)', border: '2px solid #fff',
              color: '#fff', fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <div ref={ref} style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, padding: '4px 10px 4px 4px',
              borderRadius: 999, border: '1px solid var(--lc-border-subtle)',
              background: '#fff', cursor: 'pointer',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 999,
              background: 'var(--lc-primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              {name.charAt(0).toUpperCase() || '?'}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--lc-text)' }}>{name}</span>
            <I name="chevronDown" size={16} style={{ color: 'var(--lc-text-muted)', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform var(--lc-dur) var(--lc-ease)' }} />
          </button>
          {profileOpen && (
            <div className="lc-scale-in lc-card" style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              minWidth: 240, padding: 6, boxShadow: 'var(--lc-shadow-lg)', zIndex: 30,
              transformOrigin: 'top right',
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--lc-border-subtle)', marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 12, color: 'var(--lc-text-muted)' }}>{user?.email}</div>
              </div>
              {([
                { icon: 'user' as const, label: 'My Profile', to: '/app/profile' },
                { icon: 'settings' as const, label: 'Settings', to: '/app/settings' },
              ]).map((m) => (
                <button
                  key={m.to}
                  onClick={() => { setProfileOpen(false); navigate(m.to); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
                    borderRadius: 8, fontSize: 14, color: 'var(--lc-text)', textAlign: 'left', cursor: 'pointer',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget).style.background = 'var(--lc-surface-2)'; }}
                  onMouseLeave={(e) => { (e.currentTarget).style.background = 'transparent'; }}
                >
                  <I name={m.icon} size={16} stroke="var(--lc-text-muted)" />
                  {m.label}
                </button>
              ))}
              <button
                onClick={() => { setProfileOpen(false); logout(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
                  borderRadius: 8, fontSize: 14, color: 'var(--lc-danger)', textAlign: 'left',
                  borderTop: '1px solid var(--lc-border-subtle)', marginTop: 6, cursor: 'pointer',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => { (e.currentTarget).style.background = 'var(--lc-danger-tint)'; }}
                onMouseLeave={(e) => { (e.currentTarget).style.background = 'transparent'; }}
              >
                <I name="logout" size={16} stroke="var(--lc-danger)" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children, title, subtitle }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '264px 1fr', minHeight: '100vh', background: 'var(--lc-bg)' }}>
      <aside style={{
        background: 'var(--lc-navy)', color: '#fff',
        padding: '28px 18px',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '0 12px 28px' }}>
          <Logo size={24} color="var(--lc-primary)" />
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
            />
          ))}
          {isAdmin && (
            <>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
              <SidebarItem
                to={ADMIN_NAV.to}
                icon={ADMIN_NAV.icon}
                label={ADMIN_NAV.label}
                active={location.pathname === ADMIN_NAV.to}
              />
            </>
          )}
        </nav>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, marginTop: 16 }}>
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 14px', borderRadius: 10,
              color: '#fff', fontSize: 14, width: '100%',
              transition: 'background var(--lc-dur)', cursor: 'pointer',
              background: 'transparent',
            }}
            onMouseEnter={(e) => { (e.currentTarget).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { (e.currentTarget).style.background = 'transparent'; }}
          >
            <I name="logout" size={20} />
            Log Out
          </button>
        </div>
      </aside>
      <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title={title} subtitle={subtitle} />
        <div style={{ padding: '24px 32px 40px', flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
};
