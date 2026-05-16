import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui';
import { Select } from '../../components/ui/Select';
import { I } from '../../components/icons';
import { HandshakeModal } from '../../components/ui/HandshakeModal';
import { ChatWidget } from '../../components/ui/ChatWidget';
import {
  getPurchase, moveToEscrow, completePurchase,
  acceptPurchase, declinePurchase, cancelPurchase,
} from '../../api/purchases';
import { uploadDocument } from '../../api/documents';
import { useAuth } from '../../contexts/AuthContext';
import type { LandPurchase, DocumentType, Verification } from '../../types';
import { useIsMobile } from '../../hooks/useIsMobile';

// ─── Trust score helpers ──────────────────────────────────────────────────────

type TrustLevel = 'red' | 'yellow' | 'green' | 'none';

function trustLevel(score: number | null | undefined): TrustLevel {
  if (score === null || score === undefined) return 'none';
  if (score <= 40) return 'red';
  if (score <= 74) return 'yellow';
  return 'green';
}

const TRUST_COLOR: Record<TrustLevel, string> = {
  red:    'var(--lc-danger)',
  yellow: '#D97706',
  green:  'var(--lc-success)',
  none:   'var(--lc-text-muted)',
};

const TRUST_BG: Record<TrustLevel, string> = {
  red:    'var(--lc-danger-tint)',
  yellow: 'rgba(217,119,6,0.1)',
  green:  'rgba(61,179,73,0.1)',
  none:   'var(--lc-surface-2)',
};

const TRUST_LABEL: Record<TrustLevel, string> = {
  red:    'High Risk',
  yellow: 'Caution',
  green:  'Verified',
  none:   'Pending Analysis',
};

// ─── Escrow warning dialog ────────────────────────────────────────────────────

interface EscrowDialogProps {
  level: 'red' | 'yellow';
  score: number;
  findings: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

const EscrowDialog: React.FC<EscrowDialogProps> = ({ level, score, findings, onConfirm, onCancel }) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const isRed = level === 'red';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(10,20,40,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="lc-card" style={{
        maxWidth: 520, width: '100%',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header — always visible, never scrolls */}
        <div style={{
          padding: '18px 24px', flexShrink: 0,
          background: isRed ? 'var(--lc-danger)' : '#D97706',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <I name={isRed ? 'alertOctagon' : 'alertTriangle'} size={22} stroke="#fff" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
              {isRed ? 'HIGH RISK PROPERTY — Proceed with Extreme Caution' : 'Caution: Issues Detected'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>
              Trust score: {score}% — {isRed ? 'Serious red flags identified' : 'Some concerns were identified'}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Warning text */}
          <div style={{ fontSize: 13, color: 'var(--lc-text)', lineHeight: 1.7 }}>
            {isRed ? (
              <>
                <strong>You are about to move funds into escrow for a property flagged as high risk.</strong>{' '}
                Our AI has identified serious concerns with the provided documents. Moving funds does NOT mean ownership is confirmed.
                You may lose your money if this property has fraudulent titles or is the subject of a dispute.
              </>
            ) : (
              <>
                Our AI has identified some concerns with this property's documents. While not conclusive,
                these issues warrant further investigation before committing funds.
              </>
            )}
          </div>

          {/* AI findings — scrolls within the body */}
          {findings.length > 0 && (
            <div style={{ background: 'var(--lc-surface-2)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Analysis Findings ({findings.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {findings.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, lineHeight: 1.5 }}>
                    <span style={{ color: isRed ? 'var(--lc-danger)' : '#D97706', flexShrink: 0, fontWeight: 700, marginTop: 1 }}>•</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer — always visible, never scrolls */}
        <div style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid var(--lc-border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Acknowledgment checkbox (red only) */}
          {isRed && (
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: 13, lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--lc-danger)', width: 16, height: 16 }}
              />
              <span>
                I have read and understood the risks above. I accept full responsibility for this transaction and hold LandCheck harmless for any losses.
              </span>
            </label>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <Button fullWidth variant="outline" onClick={onCancel}>
              Cancel — Go Back
            </Button>
            <Button
              fullWidth
              onClick={onConfirm}
              disabled={isRed && !acknowledged}
              style={isRed ? { background: 'var(--lc-danger)', borderColor: 'var(--lc-danger)' } : {}}
            >
              {isRed ? 'I Accept the Risk — Proceed' : 'Proceed Anyway'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Misc helpers ─────────────────────────────────────────────────────────────

const DOC_TYPES: { label: string; value: DocumentType }[] = [
  { label: 'Certificate of Occupancy (C of O)', value: 'C_OF_O' },
  { label: 'Deed of Assignment', value: 'DEED' },
  { label: 'Survey Plan', value: 'SURVEY_PLAN' },
  { label: 'Power of Attorney', value: 'POWER_OF_ATTORNEY' },
];

const STATUS_STEPS: LandPurchase['status'][] = [
  'INITIATED', 'DOCS_UPLOADED', 'AI_REVIEWED', 'IN_ESCROW', 'COMPLETED',
];

const STATUS_LABEL: Record<string, string> = {
  PENDING_SELLER: 'Pending Seller',
  INITIATED: 'Initiated',
  DOCS_UPLOADED: 'Docs Uploaded',
  AI_REVIEWED: 'AI Reviewed',
  IN_ESCROW: 'In Escrow',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DECLINED: 'Declined',
};

function renderMarkdown(text: string): React.ReactNode {
  return text.split('\n').map((line, li) => {
    if (!line) return <div key={li} style={{ height: '0.4em' }} />;
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    const rendered = parts.map((part, pi) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={pi}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('`') && part.endsWith('`')) return <code key={pi} style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 4, padding: '1px 5px', fontSize: '0.92em', fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
      return part;
    });
    return <div key={li}>{rendered}</div>;
  });
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n);

// ─── Page ─────────────────────────────────────────────────────────────────────

export const PurchaseSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [purchase, setPurchase] = useState<LandPurchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHandshake, setShowHandshake] = useState(false);
  const [escrowDialog, setEscrowDialog] = useState<'red' | 'yellow' | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const firstLoad = useRef(false);

  // Upload
  const [docType, setDocType] = useState<DocumentType>('C_OF_O');
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [drag, setDrag] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const isFirst = !firstLoad.current;
    try {
      const p = await getPurchase(id);
      if (
        prevStatusRef.current === 'PENDING_SELLER' &&
        p.status === 'INITIATED' &&
        user?.id === p.buyerId
      ) {
        setShowHandshake(true);
      }
      prevStatusRef.current = p.status;
      setPurchase(p);
      firstLoad.current = true;
    } catch (e: unknown) {
      if (isFirst) setError((e as Error).message ?? 'Failed to load purchase');
    } finally {
      if (isFirst) setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => { load(); }, [load]);

  // Poll every 5s when awaiting seller; 15s otherwise
  useEffect(() => {
    const ms = purchase?.status === 'PENDING_SELLER' ? 5000 : 15000;
    const interval = setInterval(load, ms);
    return () => clearInterval(interval);
  }, [purchase?.status, load]);

  const isBuyer = user?.id === purchase?.buyerId;
  const isSeller = user?.id === purchase?.sellerId;
  const verification = purchase?.verification as Verification | undefined;

  // Aggregate all AI findings from every analysed document
  const allFindings: string[] = (verification?.documents ?? [])
    .flatMap((d) => d.analysisResult?.findings ?? [])
    .filter(Boolean);

  const score = verification?.trustScore ?? null;
  const level = trustLevel(score);
  const hasAiAnalysis = score !== null;

  const handleUpload = async () => {
    if (!stagedFile || !purchase) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      await uploadDocument(purchase.verificationId, stagedFile, docType, setUploadProgress);
      setStagedFile(null);
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Upload failed';
      setActionError(msg);
    } finally {
      setUploading(false);
    }
  };

  const withAction = async (fn: () => Promise<LandPurchase | void>) => {
    setActionLoading(true);
    setActionError('');
    try {
      const updated = await fn();
      if (updated) setPurchase(updated as LandPurchase);
      else await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Action failed';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Escrow click — gate by trust level
  const handleEscrowClick = () => {
    if (!hasAiAnalysis) return; // button should be disabled; belt + suspenders
    if (level === 'red') { setEscrowDialog('red'); return; }
    if (level === 'yellow') { setEscrowDialog('yellow'); return; }
    // green → proceed directly
    withAction(() => moveToEscrow(id!));
  };

  const handleEscrowConfirm = () => {
    setEscrowDialog(null);
    withAction(() => moveToEscrow(id!));
  };

  const currentStepIdx = purchase ? STATUS_STEPS.indexOf(purchase.status as LandPurchase['status']) : -1;
  const isTerminal = ['COMPLETED', 'CANCELLED', 'DECLINED'].includes(purchase?.status ?? '');

  return (
    <AppShell title="Purchase Session" subtitle="Manage your land purchase">
      {/* Escrow warning dialog */}
      {escrowDialog && (
        <EscrowDialog
          level={escrowDialog}
          score={score!}
          findings={allFindings}
          onConfirm={handleEscrowConfirm}
          onCancel={() => setEscrowDialog(null)}
        />
      )}

      {showHandshake && (
        <HandshakeModal onContinue={() => { setShowHandshake(false); navigate(`/app/purchases/${id}`); }} />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--lc-text-muted)' }}>Loading…</div>
      ) : error ? (
        <div style={{ color: 'var(--lc-danger)', padding: 24 }}>{error}</div>
      ) : purchase ? (
        <>
          {/* ── PENDING_SELLER ─────────────────────────────────────────────── */}
          {purchase.status === 'PENDING_SELLER' && (
            <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {isBuyer && (
                <div className="lc-card" style={{ padding: '32px 36px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                  <div style={{ fontSize: 44 }}>⏳</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Awaiting Seller's Response</div>
                    <div style={{ fontSize: 14, color: 'var(--lc-text-muted)', lineHeight: 1.6 }}>
                      Your offer for <strong>{verification?.parcelNumber}</strong> has been sent to{' '}
                      <strong>{purchase.seller.email}</strong> for {fmt(Number(purchase.agreedAmount))}.
                      You'll be notified when they respond.
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => withAction(() => cancelPurchase(id!))}>
                    Cancel Offer
                  </Button>
                </div>
              )}
              {isSeller && (
                <div className="lc-card" style={{ padding: '32px 36px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                  <div style={{ fontSize: 44 }}>📨</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>You have a purchase offer!</div>
                    <div style={{ fontSize: 14, color: 'var(--lc-text-muted)', lineHeight: 1.6 }}>
                      <strong>{purchase.buyer.email}</strong> wants to buy{' '}
                      <strong>{verification?.parcelNumber}</strong> for{' '}
                      <strong>{fmt(Number(purchase.agreedAmount))}</strong>.
                      <br />Do you accept this offer?
                    </div>
                  </div>
                  {actionError && (
                    <div style={{ fontSize: 13, color: 'var(--lc-danger)', padding: '8px 14px', background: 'var(--lc-danger-tint)', borderRadius: 8, width: '100%' }}>
                      {actionError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                    <Button fullWidth loading={actionLoading} onClick={() => withAction(() => acceptPurchase(id!))}>
                      Accept Offer
                    </Button>
                    <Button
                      fullWidth variant="outline" loading={actionLoading}
                      style={{ borderColor: 'var(--lc-danger)', color: 'var(--lc-danger)' }}
                      onClick={() => withAction(() => declinePurchase(id!))}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── DECLINED ───────────────────────────────────────────────────── */}
          {purchase.status === 'DECLINED' && (
            <div className="lc-card" style={{ maxWidth: 500, margin: '0 auto', padding: '32px 36px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 44 }}>❌</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Offer Declined</div>
              <div style={{ fontSize: 14, color: 'var(--lc-text-muted)' }}>
                {isBuyer ? `${purchase.seller.email} declined your purchase offer.` : 'You declined this purchase offer.'}
              </div>
              <Button variant="outline" onClick={() => navigate('/app/purchases')}>Back to Purchases</Button>
            </div>
          )}

          {/* ── MAIN SESSION ───────────────────────────────────────────────── */}
          {purchase.status !== 'PENDING_SELLER' && purchase.status !== 'DECLINED' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 20 }}>
              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Progress stepper */}
                <div className="lc-card" style={{ padding: '20px 24px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Purchase Progress</div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {STATUS_STEPS.map((s, i) => (
                      <React.Fragment key={s}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 999,
                            background: currentStepIdx >= i ? 'var(--lc-primary)' : 'var(--lc-surface-2)',
                            color: currentStepIdx >= i ? '#fff' : 'var(--lc-text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700,
                          }}>
                            {currentStepIdx > i ? <I name="check" size={12} stroke="#fff" /> : i + 1}
                          </div>
                          <span style={{ fontSize: 10, color: currentStepIdx >= i ? 'var(--lc-primary)' : 'var(--lc-text-muted)', textAlign: 'center', fontWeight: currentStepIdx === i ? 600 : 400, whiteSpace: 'nowrap' }}>
                            {STATUS_LABEL[s]}
                          </span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div style={{ flex: 1, height: 2, background: currentStepIdx > i ? 'var(--lc-primary)' : 'var(--lc-border)', margin: '0 4px 18px' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  {purchase.status === 'CANCELLED' && (
                    <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--lc-danger-tint)', color: 'var(--lc-danger)', borderRadius: 8, fontSize: 13 }}>
                      This purchase has been cancelled.
                    </div>
                  )}
                </div>

                {/* AI Analysis results */}
                {verification && verification.documents && verification.documents.length > 0 && (
                  <div className="lc-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>AI Document Analysis</div>
                      {/* Trust score badge */}
                      {score !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                            background: TRUST_BG[level], color: TRUST_COLOR[level],
                          }}>
                            {TRUST_LABEL[level]}
                          </div>
                          {/* Score gauge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                              width: 80, height: 6, borderRadius: 999,
                              background: 'var(--lc-border)', overflow: 'hidden',
                            }}>
                              <div style={{
                                height: '100%', borderRadius: 999,
                                width: `${score}%`,
                                background: TRUST_COLOR[level],
                                transition: 'width 0.5s ease',
                              }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: TRUST_COLOR[level] }}>{score}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {(verification.documents ?? []).map((doc) => {
                      const result = doc.analysisResult;
                      return (
                        <div key={doc.id} style={{ marginBottom: 14, padding: '14px', background: 'var(--lc-surface-2)', borderRadius: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lc-text-muted)', marginBottom: 8 }}>
                            {doc.type.replace(/_/g, ' ')} · {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                          {result ? (
                            <div style={{ fontSize: 13, lineHeight: 1.65 }}>
                              {renderMarkdown(
                                `**Authenticity Score:** ${result.authenticityScore ?? 'N/A'}%\n` +
                                `**Status:** ${result.isSuspicious ? '⚠ Suspicious' : '✓ Looks OK'}\n` +
                                (result.findings?.length ? `\nFindings:\n${result.findings.map((f) => `• ${f}`).join('\n')}` : '\nNo specific findings.')
                              )}
                            </div>
                          ) : (
                            <div style={{ fontSize: 13, color: 'var(--lc-text-muted)' }}>Analysis pending…</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upload section */}
                {!isTerminal && (
                  <div className="lc-card" style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Upload Document</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <Select value={docType} onChange={(v) => setDocType(v as DocumentType)} options={DOC_TYPES} />
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) setStagedFile(e.dataTransfer.files[0]); }}
                        onClick={() => document.getElementById('ps-file-input')?.click()}
                        style={{
                          border: `2px dashed ${drag ? 'var(--lc-primary)' : 'var(--lc-border)'}`,
                          borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer',
                          background: drag ? 'var(--lc-primary-50)' : '#fff', transition: 'all 0.2s',
                        }}
                      >
                        <I name="cloud" size={24} stroke={drag ? 'var(--lc-primary)' : 'var(--lc-text-muted)'} />
                        <div style={{ fontSize: 13, marginTop: 6, color: stagedFile ? 'var(--lc-primary)' : 'var(--lc-text-muted)', fontWeight: stagedFile ? 500 : 400 }}>
                          {stagedFile ? stagedFile.name : 'Drop or click to choose file'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--lc-text-muted)', marginTop: 4 }}>PDF, JPG, PNG · max 10MB</div>
                        <input id="ps-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                          onChange={(e) => { if (e.target.files?.[0]) setStagedFile(e.target.files[0]); }} />
                      </div>
                      {uploading && (
                        <div style={{ height: 3, background: 'var(--lc-border)', borderRadius: 2 }}>
                          <div style={{ height: '100%', background: 'var(--lc-primary)', width: `${uploadProgress}%`, transition: 'width 0.2s', borderRadius: 2 }} />
                        </div>
                      )}
                      <Button onClick={handleUpload} disabled={!stagedFile || uploading} loading={uploading} size="sm">
                        {uploading ? `${uploadProgress}%` : 'Upload & Analyze'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error display */}
                {actionError && (
                  <div style={{ padding: '12px 16px', background: 'var(--lc-danger-tint)', color: 'var(--lc-danger)', borderRadius: 10, fontSize: 13 }}>
                    {actionError}
                  </div>
                )}

                {/* Payment actions (buyer only) */}
                {isBuyer && !isTerminal && (
                  <div className="lc-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Payment Actions</div>

                    {purchase.status !== 'IN_ESCROW' && (
                      <>
                        {/* AI gate — must have analysis before escrow */}
                        {!hasAiAnalysis ? (
                          <div style={{ padding: '14px 16px', background: 'rgba(37,99,235,0.06)', borderRadius: 10, border: '1px solid rgba(37,99,235,0.2)' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                              <I name="info" size={16} stroke="#2563EB" style={{ flexShrink: 0, marginTop: 1 }} />
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#2563EB' }}>AI Validation Required</div>
                                <div style={{ fontSize: 12, color: 'var(--lc-text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                                  Upload and analyze at least one property document before moving funds to escrow. This protects you from fraud.
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Trust score summary before escrow */
                          <div style={{
                            padding: '12px 14px', borderRadius: 10,
                            background: TRUST_BG[level], border: `1px solid ${TRUST_COLOR[level]}33`,
                            display: 'flex', alignItems: 'center', gap: 12,
                          }}>
                            <I
                              name={level === 'red' ? 'alertOctagon' : level === 'yellow' ? 'alertTriangle' : 'shieldCheck'}
                              size={18}
                              stroke={TRUST_COLOR[level]}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: TRUST_COLOR[level] }}>
                                Trust Score: {score}% — {TRUST_LABEL[level]}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--lc-text-muted)', marginTop: 2 }}>
                                {level === 'red'
                                  ? 'High risk detected. A warning will appear before escrow.'
                                  : level === 'yellow'
                                  ? 'Some concerns noted. Review findings before proceeding.'
                                  : 'Property looks good. You may proceed to escrow.'}
                              </div>
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={handleEscrowClick}
                          loading={actionLoading}
                          variant="outline"
                          disabled={!hasAiAnalysis}
                        >
                          Move {fmt(Number(purchase.agreedAmount))} to Escrow
                        </Button>
                      </>
                    )}

                    {purchase.status === 'IN_ESCROW' && (
                      <Button onClick={() => withAction(() => completePurchase(id!))} loading={actionLoading}>
                        Release Funds to Seller (Complete Purchase)
                      </Button>
                    )}

                    <div style={{ fontSize: 12, color: 'var(--lc-text-muted)' }}>
                      Escrow holds the funds securely until you confirm the purchase is complete.
                    </div>
                  </div>
                )}

                {/* Cancel button */}
                {!isTerminal && purchase.status !== 'IN_ESCROW' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outline" size="sm"
                      style={{ borderColor: 'var(--lc-danger)', color: 'var(--lc-danger)' }}
                      loading={actionLoading}
                      onClick={() => withAction(() => cancelPurchase(id!))}
                    >
                      Cancel Purchase
                    </Button>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Purchase summary */}
                <div className="lc-card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lc-text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Purchase Summary
                  </div>
                  {[
                    ['Parcel', verification?.parcelNumber ?? '—'],
                    ['Location', verification?.location ?? '—'],
                    ['Amount', fmt(Number(purchase.agreedAmount))],
                    ['Status', STATUS_LABEL[purchase.status]],
                    ['Buyer', purchase.buyer.email],
                    ['Seller', purchase.seller.email],
                    ['Created', new Date(purchase.createdAt).toLocaleDateString()],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--lc-border-subtle)' }}>
                      <span style={{ color: 'var(--lc-text-muted)' }}>{label}</span>
                      <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
                    </div>
                  ))}
                  {/* Trust score in sidebar */}
                  {score !== null && (
                    <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: TRUST_BG[level] }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--lc-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trust Score</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${score}%`, background: TRUST_COLOR[level], borderRadius: 999, transition: 'width 0.5s ease' }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: TRUST_COLOR[level] }}>{score}%</span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: TRUST_COLOR[level], marginTop: 4 }}>{TRUST_LABEL[level]}</div>
                    </div>
                  )}
                </div>

                {/* Transaction history */}
                {purchase.transactions && purchase.transactions.length > 0 && (
                  <div className="lc-card" style={{ padding: '18px 20px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lc-text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Transactions
                    </div>
                    {purchase.transactions.map((tx) => (
                      <div key={tx.id} style={{ fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--lc-border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--lc-text-muted)' }}>{tx.type.replace(/_/g, ' ')}</span>
                        <span style={{ fontWeight: 500 }}>{fmt(Number(tx.amount))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat widget */}
          {!isTerminal && id && <ChatWidget purchaseId={id} />}
        </>
      ) : null}
    </AppShell>
  );
};
