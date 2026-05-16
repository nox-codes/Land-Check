import React from 'react';

export type IconName =
  | 'dashboard' | 'search' | 'document' | 'clipboard' | 'wallet' | 'shield'
  | 'shieldCheck' | 'brain' | 'radar' | 'upload' | 'bell' | 'bellDot' | 'cloud'
  | 'user' | 'users' | 'logout' | 'chevronDown' | 'chevronRight' | 'chevronLeft'
  | 'arrowUp' | 'arrowDown' | 'arrowRight' | 'arrowLeft' | 'check' | 'checkCircle'
  | 'alertTriangle' | 'alertOctagon' | 'info' | 'mail' | 'phone' | 'mapPin'
  | 'eye' | 'eyeOff' | 'settings' | 'download' | 'filter' | 'plus' | 'minus' | 'trash'
  | 'external' | 'copy' | 'trendUp' | 'twitter' | 'facebook' | 'instagram'
  | 'apple' | 'google' | 'home' | 'x' | 'spinner' | 'menu';

export type Tone = 'success' | 'caution' | 'danger' | 'accent' | 'info' | 'neutral';

const ICONS: Record<IconName, React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  document: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>,
  clipboard: <><rect x="6" y="4" width="12" height="17" rx="2" /><rect x="9" y="2" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></>,
  wallet: <><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H5a2 2 0 0 0-2 2V7Z" /><path d="M3 11h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V11Z" /><circle cx="16" cy="15" r="1.2" fill="currentColor" /></>,
  shield: <><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9.5 4.5-1 8-4.5 8-9.5V6l-8-3Z" /></>,
  shieldCheck: <><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9.5 4.5-1 8-4.5 8-9.5V6l-8-3Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  brain: <><path d="M9.5 3a3 3 0 0 0-3 3v.5A3 3 0 0 0 4 9.5v1A3 3 0 0 0 6 13a3 3 0 0 0 3 3v1a3 3 0 0 0 6 0v-1a3 3 0 0 0 3-3 3 3 0 0 0 2-2.5v-1a3 3 0 0 0-2.5-3V6a3 3 0 0 0-3-3 3 3 0 0 0-5 0Z" /><path d="M12 6v15" /></>,
  radar: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><path d="M12 3v9l5-5" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>,
  bell: <><path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" /></>,
  bellDot: <><path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" /><circle cx="18" cy="6" r="3" fill="var(--lc-danger)" stroke="white" strokeWidth="2" /></>,
  cloud: <><path d="M7 18a4 4 0 0 1-.7-7.9 5 5 0 0 1 9.7-1.4A4.5 4.5 0 0 1 17 18H7Z" /><path d="M12 14V9m-2 2 2-2 2 2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M3 20a6 6 0 0 1 12 0" /><circle cx="17" cy="9" r="3" /><path d="M15 20a5 5 0 0 1 6-4.5" /></>,
  logout: <><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" /><path d="M16 17l5-5-5-5M21 12H10" /></>,
  chevronDown: <><path d="m6 9 6 6 6-6" /></>,
  chevronRight: <><path d="m9 6 6 6-6 6" /></>,
  chevronLeft: <><path d="m15 6-6 6 6 6" /></>,
  arrowUp: <><path d="M12 19V5M5 12l7-7 7 7" /></>,
  arrowDown: <><path d="M12 5v14M5 12l7 7 7-7" /></>,
  arrowRight: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  arrowLeft: <><path d="M19 12H5M11 6l-6 6 6 6" /></>,
  check: <><path d="m5 12 5 5L20 7" /></>,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 5-5.5" /></>,
  alertTriangle: <><path d="M10.3 3.9 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v5M12 17.5v.1" /></>,
  alertOctagon: <><path d="m3 8 5-5h8l5 5v8l-5 5H8l-5-5V8Z" /><path d="M12 7v5M12 16v.1" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.1" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  phone: <><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" /></>,
  mapPin: <><path d="M12 21s-7-6-7-12a7 7 0 1 1 14 0c0 6-7 12-7 12Z" /><circle cx="12" cy="9" r="2.5" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 6.2A10 10 0 0 1 12 6c6.5 0 10 6 10 6a16.7 16.7 0 0 1-3.1 3.9M6.5 7.3A16.5 16.5 0 0 0 2 12s3.5 6 10 6c1.5 0 2.9-.3 4.1-.8" /><path d="M9.3 9.3a3 3 0 0 0 4.2 4.2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>,
  download: <><path d="M12 4v12M7 11l5 5 5-5" /><path d="M4 19h16" /></>,
  filter: <><path d="M3 5h18l-7 9v5l-4 2v-7L3 5Z" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  minus: <><path d="M5 12h14" /></>,
  trash: <><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /></>,
  external: <><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>,
  trendUp: <><path d="m3 17 6-6 4 4 8-8" /><path d="M14 7h7v7" /></>,
  twitter: <><path d="M22 5.8c-.7.3-1.5.5-2.3.6.8-.5 1.5-1.3 1.8-2.2-.8.5-1.7.8-2.6 1A4.1 4.1 0 0 0 12 9c0 .3 0 .6.1.9A11.6 11.6 0 0 1 3 4.4 4.1 4.1 0 0 0 4.3 10c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.7 3.3 4.1-.3.1-.7.2-1.1.2-.3 0-.5 0-.8-.1.5 1.7 2.1 2.9 4 2.9A8.2 8.2 0 0 1 2 18.4 11.5 11.5 0 0 0 8.3 20c7.5 0 11.6-6.2 11.6-11.6V8A8.4 8.4 0 0 0 22 5.8Z" fill="currentColor" stroke="none" /></>,
  facebook: <><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v8h4v-8h3l1-4h-4V8.5c0-.3.2-.5.5-.5h.5Z" fill="currentColor" stroke="none" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></>,
  apple: <><path d="M16 13a4 4 0 0 0 2.5 3.7c-.3.9-.7 1.8-1.3 2.6-.8 1.2-1.7 2.3-3 2.3-1.3 0-1.7-.8-3.2-.8s-2 .8-3.2.8c-1.3 0-2.2-1.1-3-2.3C3 17.7 2.4 13 5 10.5a4 4 0 0 1 3-1.5c1.3 0 2 .8 3.2.8 1.1 0 2-.8 3.2-.8a4 4 0 0 1 3.3 1.7A4 4 0 0 0 16 13ZM13 5.5c.6-.7 1-1.7 1-2.5-.9 0-2 .6-2.5 1.3a3.4 3.4 0 0 0-.9 2.4c1 0 1.9-.5 2.4-1.2Z" fill="currentColor" stroke="none" /></>,
  google: <><path d="M21.5 11.7c0-.7-.1-1.4-.2-2H12v3.8h5.3a4.6 4.6 0 0 1-2 3v2.5h3.2a9.7 9.7 0 0 0 3-7.3Z" fill="#4285F4" stroke="none" /><path d="M12 22c2.7 0 5-1 6.6-2.4l-3.2-2.5a6 6 0 0 1-9-3.1H3v2.5A10 10 0 0 0 12 22Z" fill="#34A853" stroke="none" /><path d="M6.4 14a6 6 0 0 1 0-3.9V7.6H3a10 10 0 0 0 0 8.9L6.4 14Z" fill="#FBBC04" stroke="none" /><path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3 7.6L6.4 10a6 6 0 0 1 5.6-4Z" fill="#EA4335" stroke="none" /></>,
  home: <><path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" /><path d="M9 22V12h6v10" /></>,
  x: <><path d="M18 6 6 18M6 6l12 12" /></>,
  spinner: <><circle cx="12" cy="12" r="9" strokeDasharray="28 56" strokeLinecap="round" /></>,
  menu: <><path d="M3 12h18M3 6h18M3 18h18" /></>,
};

interface IconProps {
  size?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({
  size = 20,
  stroke = 'currentColor',
  fill = 'none',
  strokeWidth = 1.75,
  children,
  style,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

interface IProps {
  name: IconName;
  size?: number;
  stroke?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
  className?: string;
}

export const I: React.FC<IProps> = ({ name, size = 20, stroke = 'currentColor', strokeWidth = 1.75, style, className }) => (
  <Icon size={size} stroke={stroke} strokeWidth={strokeWidth} style={style} className={className}>
    {ICONS[name]}
  </Icon>
);

export const LogoMark: React.FC<{ size?: number; color?: string }> = ({ size = 28, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path
      d="M14 2.5 4.5 6v7.2c0 5.7 4 11 9.5 12.3 5.5-1.3 9.5-6.6 9.5-12.3V6L14 2.5Z"
      fill={color}
      opacity="0.18"
    />
    <path
      d="M14 2.5 4.5 6v7.2c0 5.7 4 11 9.5 12.3 5.5-1.3 9.5-6.6 9.5-12.3V6L14 2.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="m9.5 13.5 3 3 6-6.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Logo: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = 'var(--lc-primary)' }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    color,
    fontFamily: 'Poppins',
    fontWeight: 700,
    fontSize: size,
    letterSpacing: '-0.02em',
    lineHeight: 1,
  }}>
    <LogoMark size={size * 1.05} color={color} />
    <span>LandCheck</span>
  </span>
);

const TONE_MAP: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: 'var(--lc-success-tint)', fg: 'var(--lc-primary)' },
  caution: { bg: 'var(--lc-caution-tint)', fg: 'var(--lc-caution)' },
  danger:  { bg: 'var(--lc-danger-tint)',  fg: 'var(--lc-danger)' },
  accent:  { bg: 'var(--lc-accent-tint)',  fg: 'var(--lc-accent)' },
  info:    { bg: 'var(--lc-info-tint)',    fg: 'var(--lc-info)' },
  neutral: { bg: '#F1F2F5',               fg: '#6B7280' },
};

export const IconTile: React.FC<{ icon: IconName; tone?: Tone; size?: number }> = ({
  icon, tone = 'success', size = 44,
}) => {
  const t = TONE_MAP[tone];
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: size * 0.32,
      background: t.bg,
      color: t.fg,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <I name={icon} size={size * 0.5} strokeWidth={2} />
    </div>
  );
};
