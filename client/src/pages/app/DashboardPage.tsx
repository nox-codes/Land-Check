import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { StatCard, TrustGauge, ActivityChart, Section, Pill, DonutSmall, Spinner } from '../../components/ui';
import { Select } from '../../components/ui/Select';
import { I } from '../../components/icons';
import { useAuth, displayName } from '../../contexts/AuthContext';
import { listVerifications } from '../../api/verifications';
import type { Verification, VerificationStatus } from '../../types';
import { useIsMobile } from '../../hooks/useIsMobile';

function statusTone(s: VerificationStatus) {
  if (s === 'VERIFIED') return 'success' as const;
  if (s === 'CAUTION') return 'caution' as const;
  return 'danger' as const;
}

function scoreColor(score: number | null) {
  if (score === null) return 'var(--lc-border)';
  if (score >= 75) return 'var(--lc-primary)';
  if (score >= 40) return 'var(--lc-caution)';
  return 'var(--lc-danger)';
}

// Build last-7-days activity from verification createdAt dates
function buildActivity(verifications: Verification[]) {
  const counts: number[] = Array(7).fill(0);
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  verifications.forEach((v) => {
    const d = new Date(v.createdAt);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays < 7) {
      const dayOfWeek = (d.getDay() + 6) % 7; // Mon=0
      counts[dayOfWeek]++;
    }
  });
  return { counts, labels };
}

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--lc-text-muted)', fontSize: 14 }}>
    <I name="document" size={32} stroke="var(--lc-border)" style={{ margin: '0 auto 12px' }} />
    <div>{message}</div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('Last 7 Days');

  useEffect(() => {
    listVerifications()
      .then(setVerifications)
      .catch(() => setVerifications([]))
      .finally(() => setLoading(false));
  }, []);

  const name = displayName(user);
  const verified = verifications.filter((v) => v.status === 'VERIFIED').length;
  const caution  = verifications.filter((v) => v.status === 'CAUTION').length;
  const highRisk = verifications.filter((v) => v.status === 'HIGH_RISK').length;
  const avgScore = verifications.length
    ? Math.round(verifications.reduce((acc, v) => acc + (v.trustScore ?? 0), 0) / verifications.length)
    : 0;

  const { counts: activityData, labels: activityLabels } = buildActivity(verifications);
  const recentVerifications = verifications.slice(0, 4);

  return (
    <AppShell
      title={`Welcome${name ? ` ${name}` : ''}`}
      subtitle="Here's what's happening with your verifications"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Stats */}
        <div className="lc-grid-4">
          <StatCard icon="document"      iconTone="success" label="Total Verifications" value={String(verifications.length)} />
          <StatCard icon="shieldCheck"   iconTone="success" label="Verified Lands"      value={String(verified)} />
          <StatCard icon="alertTriangle" iconTone="caution" label="Caution"             value={String(caution)} />
          <StatCard icon="alertOctagon"  iconTone="danger"  label="High Risk"           value={String(highRisk)} />
        </div>

        {/* Trust score + activity */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.8fr', gap: 18 }}>
          <Section title="Trust Score">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} color="var(--lc-primary)" /></div>
            ) : verifications.length === 0 ? (
              <EmptyState message="No verifications yet" />
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <TrustGauge score={avgScore} size={220} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
                  {[
                    { label: 'Verified', range: '75-100', val: verified, color: 'var(--lc-primary)' },
                    { label: 'Caution',  range: '40-74',  val: caution,  color: 'var(--lc-caution)' },
                    { label: 'High Risk',range: '0-39',   val: highRisk, color: 'var(--lc-danger)' },
                  ].map((row) => (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: row.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{row.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--lc-text-muted)', marginTop: 2 }}>{row.range}%</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Section>

          <Section title="Verification Activity" action={
            <Select value={range} onChange={setRange} options={['Last 7 Days', 'Last 30 Days']} style={{ width: 160 }} />
          }>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} color="var(--lc-primary)" /></div>
            ) : verifications.length === 0 ? (
              <EmptyState message="No activity yet" />
            ) : (
              <ActivityChart data={activityData.every((n) => n === 0) ? [0, 0, 0, 0, 0, 0, 0] : activityData} labels={activityLabels} />
            )}
          </Section>
        </div>

        {/* Account + Recent */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.8fr', gap: 18 }}>
          <Section title="Account Information">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 999,
                  background: 'var(--lc-primary)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 700, flexShrink: 0,
                }}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: 13, color: 'var(--lc-text-muted)' }}>{user?.email}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, paddingTop: 16, borderTop: '1px solid var(--lc-border-subtle)' }}>
                {[
                  { label: 'Total', val: String(verifications.length) },
                  { label: 'Verified', val: String(verified) },
                  { label: 'Role', val: <Pill tone="success" dot>{user?.role ?? 'USER'}</Pill> },
                  { label: 'Avg Score', val: verifications.length ? `${avgScore}%` : '—' },
                ].map((r, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 11, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{r.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Recent Verification Activity" action={
            <button onClick={() => navigate('/app/verifications')} style={{ fontSize: 13, fontWeight: 500, color: 'var(--lc-accent)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              View all <I name="arrowRight" size={14} />
            </button>
          }>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner size={24} color="var(--lc-primary)" /></div>
            ) : recentVerifications.length === 0 ? (
              <EmptyState message="No verifications yet. Start one to see it here." />
            ) : (
              <div className="lc-table-scroll">
                <div style={{ minWidth: 480, display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr', gap: 16, padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <span>Property</span><span>Owner</span><span>Trust Score</span><span>Status</span><span style={{ textAlign: 'right' }}>Date</span>
                </div>
                {recentVerifications.map((v) => (
                  <div key={v.id}
                    onClick={() => navigate(`/app/report/${v.id}`)}
                    style={{ minWidth: 480, display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr', gap: 16, padding: '14px 12px', alignItems: 'center', borderRadius: 10, cursor: 'pointer', transition: 'background var(--lc-dur)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--lc-surface-2)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.location}</div>
                      <div style={{ fontSize: 11, color: 'var(--lc-text-muted)', marginTop: 2 }}>{v.parcelNumber}</div>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--lc-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.ownerName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <DonutSmall value={v.trustScore ?? 0} total={100} color={scoreColor(v.trustScore)} size={24} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{v.trustScore ?? '—'}%</span>
                    </div>
                    <div><Pill tone={statusTone(v.status)} dot>{v.status}</Pill></div>
                    <div style={{ fontSize: 13, color: 'var(--lc-text-secondary)', textAlign: 'right' }}>
                      {new Date(v.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </AppShell>
  );
};
