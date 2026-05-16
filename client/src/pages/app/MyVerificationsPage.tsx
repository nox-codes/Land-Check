import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Button, Pill, DonutSmall, Spinner } from '../../components/ui';
import { I } from '../../components/icons';
import { listVerifications } from '../../api/verifications';
import type { Verification, VerificationStatus } from '../../types';

const TABS = ['All', 'VERIFIED', 'CAUTION', 'HIGH_RISK', 'PENDING'];
const TAB_LABELS: Record<string, string> = { All: 'All', VERIFIED: 'Verified', CAUTION: 'Caution', HIGH_RISK: 'High Risk', PENDING: 'Pending' };

function scoreColor(score: number | null) {
  if (score === null) return 'var(--lc-border)';
  if (score >= 75) return 'var(--lc-primary)';
  if (score >= 40) return 'var(--lc-caution)';
  return 'var(--lc-danger)';
}

function statusTone(s: VerificationStatus) {
  if (s === 'VERIFIED') return 'success' as const;
  if (s === 'CAUTION') return 'caution' as const;
  if (s === 'HIGH_RISK') return 'danger' as const;
  return 'neutral' as const;
}

export const MyVerificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    listVerifications()
      .then(setVerifications)
      .catch(() => setVerifications([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = verifications.filter((v) => {
    const matchTab = tab === 'All' || v.status === tab;
    const q = search.toLowerCase();
    const matchSearch = !q || v.location.toLowerCase().includes(q) || v.parcelNumber.toLowerCase().includes(q) || v.ownerName.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  return (
    <AppShell title="My Verifications" subtitle={`${verifications.length} total verifications`}>
      <div className="lc-card" style={{ padding: '24px 28px' }}>
        {/* Filter tabs + search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--lc-surface-2)', padding: 4, borderRadius: 10 }}>
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? 'var(--lc-text)' : 'var(--lc-text-muted)',
                  boxShadow: tab === t ? 'var(--lc-shadow-sm)' : 'none',
                  transition: 'all var(--lc-dur)',
                }}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <I name="search" size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--lc-text-muted)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search property or parcel…"
                style={{
                  padding: '9px 16px 9px 38px', border: '1.5px solid var(--lc-border)',
                  borderRadius: 10, fontSize: 13, width: 240, background: '#fff',
                  outline: 'none', color: 'var(--lc-text)',
                }}
              />
            </div>
            <Button size="sm" leading={<I name="plus" size={14} />} onClick={() => navigate('/app/verify/new')}>
              New Verification
            </Button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Spinner size={28} color="var(--lc-primary)" />
          </div>
        ) : (
          <div className="lc-table-scroll">
            {/* Table header */}
            <div style={{ minWidth: 600, display: 'grid', gridTemplateColumns: '2fr 1.4fr 1fr 1fr 1fr 64px', gap: 16, padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--lc-border-subtle)' }}>
              <span>Property / Parcel</span><span>Owner</span><span>Trust Score</span><span>Status</span><span style={{ textAlign: 'right' }}>Date</span><span />
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--lc-text-muted)', fontSize: 14 }}>
                <I name="search" size={28} stroke="var(--lc-border)" style={{ margin: '0 auto 12px' }} />
                <div>{verifications.length === 0 ? 'No verifications yet. Start your first verification.' : 'No results match your filter.'}</div>
                {verifications.length === 0 && (
                  <Button size="sm" style={{ marginTop: 16 }} onClick={() => navigate('/app/verify/new')}>
                    Start Verification
                  </Button>
                )}
              </div>
            ) : filtered.map((v) => (
              <div key={v.id}
                style={{ minWidth: 600, display: 'grid', gridTemplateColumns: '2fr 1.4fr 1fr 1fr 1fr 64px', gap: 16, padding: '14px 12px', alignItems: 'center', borderBottom: '1px solid var(--lc-border-subtle)', cursor: 'pointer', transition: 'background var(--lc-dur)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--lc-surface-2)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                onClick={() => navigate(`/app/report/${v.id}`)}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.location}</div>
                  <div style={{ fontSize: 11, color: 'var(--lc-text-muted)', marginTop: 2 }}>{v.parcelNumber}</div>
                </div>
                <div style={{ fontSize: 14, color: 'var(--lc-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.ownerName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DonutSmall value={v.trustScore ?? 0} total={100} color={scoreColor(v.trustScore)} size={24} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{v.trustScore !== null ? `${v.trustScore}%` : '—'}</span>
                </div>
                <Pill tone={statusTone(v.status)} dot>{v.status.replace('_', ' ')}</Pill>
                <div style={{ fontSize: 13, color: 'var(--lc-text-secondary)', textAlign: 'right' }}>
                  {new Date(v.createdAt).toLocaleDateString()}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/app/report/${v.id}`); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, color: 'var(--lc-text-muted)', marginLeft: 'auto' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--lc-surface-2)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <I name="arrowRight" size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
