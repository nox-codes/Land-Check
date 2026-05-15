import React from 'react';

interface SectionProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Section: React.FC<SectionProps> = ({ title, action, children, style }) => (
  <div className="lc-card" style={{ padding: '22px 24px', ...style }}>
    {(title || action) && (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 18, gap: 12,
      }}>
        {title && (
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--lc-text)' }}>
            {title}
          </h2>
        )}
        {action}
      </div>
    )}
    {children}
  </div>
);
