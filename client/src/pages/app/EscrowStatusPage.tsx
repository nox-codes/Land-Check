import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { StatCard, Pill, Section } from '../../components/ui';
import { Spinner } from '../../components/ui/Spinner';
import { getMyPurchases } from '../../api/purchases';
import { useAuth } from '../../contexts/AuthContext';
import type { LandPurchase, PurchaseStatus, Verification } from '../../types';
import { useIsMobile } from '../../hooks/useIsMobile';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const STAGES = ['Initiated', 'In Escrow', 'Completed'];

function purchaseStage(status: PurchaseStatus): number {
  if (status === 'COMPLETED') return 3;
  if (status === 'IN_ESCROW') return 2;
  if (status === 'CANCELLED') return 0;
  return 1;
}

type Tone = 'success' | 'caution' | 'danger' | 'accent' | 'info' | 'neutral';

function statusTone(status: PurchaseStatus): Tone {
  if (status === 'COMPLETED') return 'success';
  if (status === 'IN_ESCROW') return 'accent';
  if (status === 'CANCELLED') return 'danger';
  return 'neutral';
}

const STATUS_LABEL: Record<PurchaseStatus, string> = {
  PENDING_SELLER: 'Pending Seller',
  INITIATED: 'Initiated',
  DOCS_UPLOADED: 'Docs Uploaded',
  AI_REVIEWED: 'AI Reviewed',
  IN_ESCROW: 'In Escrow',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DECLINED: 'Declined',
};

export const EscrowStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<LandPurchase[]>([]);

  useEffect(() => {
    getMyPurchases()
      .then(setPurchases)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Only show purchases with escrow relevance
  const escrowPurchases = purchases.filter((p) =>
    ['IN_ESCROW', 'COMPLETED', 'DOCS_UPLOADED', 'AI_REVIEWED', 'INITIATED'].includes(p.status)
  );

  const inEscrow = purchases.filter((p) => p.status === 'IN_ESCROW');
  const completed = purchases.filter((p) => p.status === 'COMPLETED');

  const totalHeld = inEscrow.reduce((acc, p) => acc + Number(p.agreedAmount), 0);
  const totalReleased = completed.reduce((acc, p) => acc + Number(p.agreedAmount), 0);

  return (
    <AppShell title="Escrow Status" subtitle="Track your land purchase payment pipeline">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="lc-grid-3">
          <StatCard icon="wallet"      iconTone="accent"   label="Total in Escrow"     value={fmt(totalHeld)} />
          <StatCard icon="checkCircle" iconTone="success"  label="Total Released"       value={fmt(totalReleased)} />
          <StatCard icon="document"    iconTone="info"     label="Active Purchases"     value={String(escrowPurchases.length)} />
        </div>

        <Section title="Purchase Transactions">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <Spinner size={32} color="var(--lc-primary)" />
            </div>
          ) : escrowPurchases.length === 0 ? (
            <div className="lc-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: 'var(--lc-text-muted)' }}>
                No purchase transactions yet. Initiate a land purchase to get started.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Table header */}
              {!isMobile && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.2fr 1fr', gap: 16, padding: '6px 24px', fontSize: 11, fontWeight: 600, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <span>Property</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span style={{ textAlign: 'right' }}>Date</span>
                </div>
              )}

              {escrowPurchases.map((p) => {
                const stage = purchaseStage(p.status);
                const verification = p.verification as Verification;
                const isBuyer = user?.id === p.buyerId;

                return (
                  <div
                    key={p.id}
                    className="lc-card"
                    style={{ padding: '20px 24px', cursor: 'pointer' }}
                    onClick={() => navigate(`/app/purchases/${p.id}`)}
                  >
                    {/* Row summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1.4fr 1.2fr 1fr', gap: isMobile ? 8 : 16, alignItems: 'center', marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{verification?.location ?? '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--lc-text-muted)', marginTop: 2 }}>
                          {verification?.parcelNumber ?? '—'} · {isBuyer ? `Seller: ${p.seller.email}` : `Buyer: ${p.buyer.email}`}
                        </div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(Number(p.agreedAmount))}</div>
                      <Pill tone={statusTone(p.status)} dot>{STATUS_LABEL[p.status]}</Pill>
                      <div style={{ fontSize: 13, color: 'var(--lc-text-muted)', textAlign: 'right' }}>{fmtDate(p.createdAt)}</div>
                    </div>

                    {/* Stage pipeline */}
                    {p.status !== 'CANCELLED' && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {STAGES.map((s, j) => {
                          const done = j < stage;
                          const active = j === stage - 1;
                          const color = done || active ? 'var(--lc-primary)' : 'var(--lc-border)';
                          return (
                            <React.Fragment key={j}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: 999,
                                  background: done || active ? 'var(--lc-primary)' : 'var(--lc-border)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 600, color: done || active ? '#fff' : 'var(--lc-text-muted)',
                                }}>
                                  {done ? '✓' : j + 1}
                                </div>
                                <span style={{ fontSize: 10, color, whiteSpace: 'nowrap', fontWeight: active ? 600 : 400 }}>{s}</span>
                              </div>
                              {j < STAGES.length - 1 && (
                                <div style={{ flex: 1, height: 2, background: j < stage - 1 ? 'var(--lc-primary)' : 'var(--lc-border)', marginBottom: 20 }} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}

                    {p.status === 'CANCELLED' && (
                      <div style={{ padding: '8px 12px', background: 'var(--lc-danger-tint)', borderRadius: 8, fontSize: 12, color: 'var(--lc-danger)' }}>
                        This purchase was cancelled.
                      </div>
                    )}

                    {p.status === 'IN_ESCROW' && isBuyer && (
                      <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(61,179,73,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--lc-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Funds locked in escrow. Click to open the purchase session and release when ready.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </AppShell>
  );
};
