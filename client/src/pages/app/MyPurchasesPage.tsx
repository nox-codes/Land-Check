import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui';
import { I } from '../../components/icons';
import { getMyPurchases } from '../../api/purchases';
import { useAuth } from '../../contexts/AuthContext';
import type { LandPurchase, Verification } from '../../types';

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_SELLER: { label: 'Awaiting Seller', color: '#B45309', bg: 'rgba(180,83,9,0.1)' },
  INITIATED:      { label: 'Initiated',        color: 'var(--lc-text-muted)', bg: 'var(--lc-surface-2)' },
  DOCS_UPLOADED:  { label: 'Docs Uploaded',    color: '#7C4AC9', bg: 'rgba(124,74,201,0.1)' },
  AI_REVIEWED:    { label: 'AI Reviewed',      color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  IN_ESCROW:      { label: 'In Escrow',        color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  COMPLETED:      { label: 'Completed',        color: 'var(--lc-success)', bg: 'rgba(61,179,73,0.1)' },
  CANCELLED:      { label: 'Cancelled',        color: 'var(--lc-danger)', bg: 'var(--lc-danger-tint)' },
  DECLINED:       { label: 'Declined',         color: 'var(--lc-danger)', bg: 'var(--lc-danger-tint)' },
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n);

export const MyPurchasesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<LandPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const firstLoad = useRef(false);

  const load = useCallback(async () => {
    const isFirst = !firstLoad.current;
    try {
      const data = await getMyPurchases();
      setPurchases(data);
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

  // Count purchases that need attention
  const pendingCount = purchases.filter(
    (p) => p.status === 'PENDING_SELLER' && user?.id === p.sellerId
  ).length;

  return (
    <AppShell title="My Purchases" subtitle="Land purchases you're involved in as buyer or seller">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {pendingCount > 0 ? (
            <div style={{ fontSize: 13, padding: '6px 12px', borderRadius: 8, background: 'rgba(180,83,9,0.1)', color: '#B45309', fontWeight: 500 }}>
              {pendingCount} offer{pendingCount > 1 ? 's' : ''} awaiting your response
            </div>
          ) : <div />}
          <Button size="sm" leading={<I name="plus" size={16} />} onClick={() => navigate('/app/purchases/new')}>
            New Purchase
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--lc-text-muted)' }}>Loading…</div>
        ) : purchases.length === 0 ? (
          <div className="lc-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <I name="home" size={40} stroke="var(--lc-text-muted)" />
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 16 }}>No purchases yet</div>
            <div style={{ fontSize: 13, color: 'var(--lc-text-muted)', marginTop: 6 }}>
              Initiate a land purchase to get started.
            </div>
            <Button style={{ marginTop: 20 }} onClick={() => navigate('/app/purchases/new')}>
              Initiate Purchase
            </Button>
          </div>
        ) : (
          purchases.map((p) => {
            const verification = p.verification as Verification;
            const badge = STATUS_BADGE[p.status] ?? STATUS_BADGE.INITIATED;
            const isBuyer = user?.id === p.buyerId;
            const needsAction = p.status === 'PENDING_SELLER' && !isBuyer;
            return (
              <div
                key={p.id}
                className="lc-card"
                style={{
                  padding: '18px 20px', cursor: 'pointer', transition: 'box-shadow 0.15s',
                  borderLeft: needsAction ? '3px solid #D97706' : '3px solid transparent',
                }}
                onClick={() => navigate(`/app/purchases/${p.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--lc-primary-50, rgba(61,179,73,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <I name="home" size={20} stroke="var(--lc-primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{verification?.parcelNumber ?? 'Unknown Parcel'}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--lc-surface-2)', color: 'var(--lc-text-muted)' }}>
                        {isBuyer ? 'You are Buyer' : 'You are Seller'}
                      </span>
                      {needsAction && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(180,83,9,0.15)', color: '#B45309' }}>
                          Action required
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--lc-text-muted)', marginTop: 4 }}>
                      {verification?.location ?? '—'}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12 }}>
                      <span style={{ color: 'var(--lc-text-muted)' }}>
                        {isBuyer ? 'Seller:' : 'Buyer:'} {isBuyer ? p.seller.email : p.buyer.email}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--lc-primary)' }}>{fmt(Number(p.agreedAmount))}</span>
                    </div>
                  </div>
                  <I name="chevronRight" size={16} stroke="var(--lc-text-muted)" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
};
