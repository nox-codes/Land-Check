import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui';
import { Spinner } from '../../components/ui/Spinner';
import { I } from '../../components/icons';
import type { IconName, Tone } from '../../components/icons';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/notifications';
import type { Notification, NotifType } from '../../types';

const NOTIF_META: Record<NotifType, { icon: IconName; tone: Tone }> = {
  OFFER_RECEIVED:   { icon: 'mail',          tone: 'accent' },
  OFFER_ACCEPTED:   { icon: 'checkCircle',   tone: 'success' },
  OFFER_DECLINED:   { icon: 'alertTriangle', tone: 'danger' },
  ESCROW_HELD:      { icon: 'wallet',        tone: 'caution' },
  ESCROW_RELEASED:  { icon: 'checkCircle',   tone: 'success' },
  MESSAGE_RECEIVED: { icon: 'mail',          tone: 'info' },
};

const TONE_BG: Record<Tone, string> = {
  success: 'var(--lc-success-tint)',
  danger:  'var(--lc-danger-tint)',
  caution: 'var(--lc-caution-tint)',
  accent:  'var(--lc-accent-tint)',
  info:    'var(--lc-info-tint)',
  neutral: 'var(--lc-surface-2)',
};
const TONE_FG: Record<Tone, string> = {
  success: 'var(--lc-primary)',
  danger:  'var(--lc-danger)',
  caution: 'var(--lc-caution)',
  accent:  'var(--lc-accent)',
  info:    'var(--lc-info)',
  neutral: 'var(--lc-text-muted)',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export const NotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const firstLoad = useRef(false);

  const load = useCallback(async () => {
    const isFirst = !firstLoad.current;
    try {
      const { notifications: notifs, unreadCount: count } = await getNotifications();
      setNotifications(notifs);
      setUnreadCount(count);
      firstLoad.current = true;
    } catch {
      // ignore
    } finally {
      if (isFirst) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  const handleClick = async (notif: Notification) => {
    // Always mark as read on click, optimistically
    if (!notif.read) {
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
      markNotificationRead(notif.id).catch(() => {});
    }
    if (notif.purchaseId) {
      navigate(`/app/purchases/${notif.purchaseId}`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <AppShell title="Notifications" subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}>
      <div className="lc-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--lc-text-muted)' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'No unread notifications'}
          </div>
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            Mark all as read
          </Button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Spinner size={32} color="var(--lc-primary)" />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--lc-text-muted)', fontSize: 14 }}>
            <I name="bell" size={40} stroke="var(--lc-border)" strokeWidth={1} />
            <div style={{ marginTop: 12 }}>No notifications yet.</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Purchase activity will appear here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {notifications.map((notif) => {
              const meta = NOTIF_META[notif.type] ?? { icon: 'bell' as IconName, tone: 'neutral' as Tone };
              return (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  style={{
                    display: 'flex', gap: 16, padding: '16px 18px', borderRadius: 12,
                    background: notif.read ? 'transparent' : 'var(--lc-primary-50)',
                    cursor: 'pointer',
                    transition: 'background var(--lc-dur)',
                    borderLeft: notif.read ? '3px solid transparent' : '3px solid var(--lc-primary)',
                  }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    background: TONE_BG[meta.tone],
                    color: TONE_FG[meta.tone],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <I name={meta.icon} size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: notif.read ? 500 : 700, color: 'var(--lc-text)' }}>
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--lc-primary)', flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{
                      fontSize: 13, color: 'var(--lc-text-secondary)', lineHeight: 1.5, margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {notif.body}
                    </p>
                    {notif.purchaseId && (
                      <div style={{ fontSize: 11, color: 'var(--lc-primary)', marginTop: 4, fontWeight: 500 }}>
                        View purchase →
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--lc-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {relativeTime(notif.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
};
