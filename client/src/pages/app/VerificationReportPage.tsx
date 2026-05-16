import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { TrustGauge, Pill, Section, Button, Spinner } from '../../components/ui';
import { I, IconTile } from '../../components/icons';
import { listVerifications, getVerification } from '../../api/verifications';
import type { Verification, VerificationStatus } from '../../types';
import { useIsMobile } from '../../hooks/useIsMobile';

function statusTone(s: VerificationStatus) {
  if (s === 'VERIFIED') return 'success' as const;
  if (s === 'CAUTION') return 'caution' as const;
  return 'danger' as const;
}

const EmptyState: React.FC = () => (
  <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--lc-text-muted)', fontSize: 14 }}>
    <I name="clipboard" size={36} stroke="var(--lc-border)" style={{ margin: '0 auto 16px' }} />
    <div style={{ fontWeight: 500, marginBottom: 8 }}>No verification selected</div>
    <div style={{ fontSize: 13 }}>Go to My Verifications and select one to view its report.</div>
  </div>
);

export const VerificationReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getVerification(id)
        .then(setVerification)
        .catch(() => setVerification(null))
        .finally(() => setLoading(false));
    } else {
      // No ID — load latest verification
      listVerifications()
        .then((list) => { if (list.length > 0) setVerification(list[0]); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <AppShell title="Verification Report">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spinner size={36} color="var(--lc-primary)" />
        </div>
      </AppShell>
    );
  }

  if (!verification) {
    return (
      <AppShell title="Verification Report">
        <EmptyState />
      </AppShell>
    );
  }

  const v = verification;
  const tone = statusTone(v.status);
  const score = v.trustScore ?? 0;
  const docCount = v.documents.length;
  const findings = v.documents.flatMap((d) => (d.analysisResult?.findings ?? []));
  const suspiciousDocs = v.documents.filter((d) => d.analysisResult?.isSuspicious).length;

  return (
    <AppShell
      title="Verification Report"
      subtitle={`${v.parcelNumber} · ${v.location}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Summary metrics */}
        <div className="lc-grid-4">
          <div className="lc-card" style={{ padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
            <IconTile icon="document" tone="success" size={44} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{docCount}</div>
              <div style={{ fontSize: 13, color: 'var(--lc-text-muted)' }}>Documents</div>
            </div>
          </div>
          <div className="lc-card" style={{ padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
            <IconTile icon="shieldCheck" tone={v.registryStatus === 'FOUND' ? 'success' : 'danger'} size={44} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{v.registryStatus.replace('_', ' ')}</div>
              <div style={{ fontSize: 13, color: 'var(--lc-text-muted)' }}>Registry Status</div>
            </div>
          </div>
          <div className="lc-card" style={{ padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
            <IconTile icon="alertTriangle" tone={suspiciousDocs > 0 ? 'caution' : 'success'} size={44} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{suspiciousDocs}</div>
              <div style={{ fontSize: 13, color: 'var(--lc-text-muted)' }}>Suspicious Docs</div>
            </div>
          </div>
          <div className="lc-card" style={{ padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
            <IconTile icon="brain" tone="accent" size={44} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{score}%</div>
              <div style={{ fontSize: 13, color: 'var(--lc-text-muted)' }}>Trust Score</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.6fr', gap: 18 }}>
          {/* Trust gauge */}
          <Section title="Overall Trust Score">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <TrustGauge score={score} size={220} />
              <Pill tone={tone} dot>{v.status.replace('_', ' ')}</Pill>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                {[
                  { label: 'Parcel Number', value: v.parcelNumber },
                  { label: 'Location', value: v.location },
                  { label: 'Owner Name', value: v.ownerName },
                  { label: 'Last Updated', value: new Date(v.updatedAt).toLocaleDateString() },
                ].map((r) => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: 6, borderBottom: '1px solid var(--lc-border-subtle)' }}>
                    <span style={{ color: 'var(--lc-text-muted)' }}>{r.label}</span>
                    <span style={{ fontWeight: 500, textAlign: 'right' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Findings */}
          <Section title="AI Verification Findings">
            {findings.length === 0 && docCount === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--lc-text-muted)', fontSize: 13 }}>
                <I name="upload" size={24} stroke="var(--lc-border)" style={{ margin: '0 auto 10px' }} />
                <div>Upload documents to get AI analysis findings.</div>
              </div>
            ) : findings.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--lc-text-muted)', fontSize: 13 }}>
                No findings available yet. AI analysis is in progress.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {findings.map((finding, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 12, padding: '12px 14px',
                    background: 'var(--lc-success-tint)', borderRadius: 10,
                    borderLeft: '3px solid var(--lc-primary)',
                  }}>
                    <I name="checkCircle" size={16} stroke="var(--lc-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 13, color: 'var(--lc-text-secondary)', lineHeight: 1.5 }}>{finding}</div>
                  </div>
                ))}
                {v.documents.filter((d) => d.analysisResult?.isSuspicious).map((d) => (
                  <div key={d.id} style={{
                    display: 'flex', gap: 12, padding: '12px 14px',
                    background: 'var(--lc-danger-tint)', borderRadius: 10,
                    borderLeft: '3px solid var(--lc-danger)',
                  }}>
                    <I name="alertTriangle" size={16} stroke="var(--lc-danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--lc-danger)' }}>Suspicious: {d.type.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: 13, color: 'var(--lc-text-secondary)', marginTop: 2 }}>
                        Authenticity score: {d.authenticityScore ?? 'N/A'}%
                      </div>
                    </div>
                  </div>
                ))}

                {/* Match report */}
                {v.matchReport && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Registry Match Report</div>
                    {Object.entries(v.matchReport).map(([key, val]) => (
                      <div key={key} style={{
                        display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 8, marginBottom: 6,
                        background: val.match ? 'var(--lc-success-tint)' : 'var(--lc-danger-tint)',
                      }}>
                        <I name={val.match ? 'checkCircle' : 'alertTriangle'} size={15}
                          stroke={val.match ? 'var(--lc-primary)' : 'var(--lc-danger)'} style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</div>
                          <div style={{ fontSize: 12, color: 'var(--lc-text-secondary)' }}>{val.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Section>
        </div>

        {/* Documents list */}
        {docCount > 0 && (
          <Section title="Uploaded Documents">
            <div className="lc-grid-2">
              {v.documents.map((doc) => (
                <div key={doc.id} style={{
                  display: 'flex', gap: 14, padding: '14px 16px',
                  background: 'var(--lc-surface-2)', borderRadius: 10,
                  border: `1px solid ${doc.analysisResult?.isSuspicious ? 'var(--lc-danger)' : 'var(--lc-border-subtle)'}`,
                }}>
                  <I name="document" size={20} stroke="var(--lc-primary)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{doc.type.replace(/_/g, ' ')}</div>
                    {doc.authenticityScore !== null && (
                      <div style={{ fontSize: 12, color: 'var(--lc-text-muted)', marginTop: 2 }}>
                        Authenticity: {doc.authenticityScore}%
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--lc-text-muted)' }}>
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Pill tone={doc.analysisResult?.isSuspicious ? 'danger' : 'success'} dot>
                    {doc.analysisResult?.isSuspicious ? 'Suspicious' : 'OK'}
                  </Pill>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Certificate / actions */}
        <Section title="Certificate" action={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="outline" size="sm" leading={<I name="download" size={14} />}>Download PDF</Button>
            {v.status === 'VERIFIED' && (
              <Button size="sm" onClick={() => navigate('/app/certificate')} trailing={<I name="arrowRight" size={14} />}>View Certificate</Button>
            )}
          </div>
        }>
          <div style={{
            background: tone === 'success' ? 'var(--lc-success-tint)' : tone === 'caution' ? 'var(--lc-caution-tint)' : 'var(--lc-danger-tint)',
            borderRadius: 10, padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 999, background: tone === 'success' ? 'var(--lc-primary)' : tone === 'caution' ? 'var(--lc-caution)' : 'var(--lc-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I name={tone === 'success' ? 'shieldCheck' : 'alertTriangle'} size={22} stroke="#fff" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>LandCheck Verification Report</div>
              <div style={{ fontSize: 13, color: 'var(--lc-text-secondary)', marginTop: 2 }}>{v.location} · Trust Score: {score}%</div>
              <div style={{ fontSize: 12, color: 'var(--lc-text-muted)', marginTop: 2 }}>
                {new Date(v.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </Section>
      </div>
    </AppShell>
  );
};
