import React, { useState, useRef, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Button, Spinner } from '../../components/ui';
import { Select } from '../../components/ui/Select';
import { I } from '../../components/icons';
import { listVerifications } from '../../api/verifications';
import { uploadDocument } from '../../api/documents';
import type { Verification, DocumentType } from '../../types';
import { useIsMobile } from '../../hooks/useIsMobile';

interface Message {
  id: number;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const DOC_TYPES: { label: string; value: DocumentType }[] = [
  { label: 'Certificate of Occupancy (C of O)', value: 'C_OF_O' },
  { label: 'Deed of Assignment', value: 'DEED' },
  { label: 'Survey Plan', value: 'SURVEY_PLAN' },
  { label: 'Power of Attorney', value: 'POWER_OF_ATTORNEY' },
];

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Render basic markdown: **bold**, `code`, and newlines
function renderMarkdown(text: string): React.ReactNode {
  return text.split('\n').map((line, li) => {
    if (!line) return <div key={li} style={{ height: '0.4em' }} />;
    // Split on **bold** tokens
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    const rendered = parts.map((part, pi) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pi}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={pi} style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 4, padding: '1px 5px', fontSize: '0.92em', fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
      }
      return part;
    });
    return <div key={li}>{rendered}</div>;
  });
}

const TypingIndicator: React.FC = () => (
  <div style={{ display: 'flex', gap: 5, padding: '10px 14px', background: 'var(--lc-surface-2)', borderRadius: 12, width: 'fit-content' }}>
    {[0, 1, 2].map((i) => (
      <span key={i} style={{
        width: 8, height: 8, borderRadius: 999, background: 'var(--lc-text-muted)',
        animation: `lc-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        display: 'inline-block',
      }} />
    ))}
  </div>
);

export const UploadChatPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [selectedVerifId, setSelectedVerifId] = useState('');
  const [docType, setDocType] = useState<DocumentType>('C_OF_O');
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'ai', text: 'Hello! Select a verification case and upload documents. Our AI will analyze them and report findings here.', timestamp: now() },
  ]);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [typing, setTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listVerifications()
      .then((list) => {
        setVerifications(list);
        if (list.length > 0) setSelectedVerifId(list[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const addMessage = (msg: Omit<Message, 'id'>) =>
    setMessages((prev) => [...prev, { ...msg, id: Date.now() + Math.random() }]);

  const handleFile = (f: File) => {
    setStagedFile(f);
    addMessage({ role: 'user', text: `Staged "${f.name}" (${(f.size / 1024).toFixed(0)} KB) for upload.`, timestamp: now() });
  };

  const handleSend = async () => {
    if (!stagedFile) return;
    if (!selectedVerifId) {
      addMessage({ role: 'ai', text: 'Please select a verification case first.', timestamp: now() });
      return;
    }

    const file = stagedFile;
    setStagedFile(null);
    setUploading(true);
    setUploadProgress(0);
    addMessage({ role: 'user', text: `Uploading "${file.name}" as ${DOC_TYPES.find((d) => d.value === docType)?.label}…`, timestamp: now() });
    setTyping(true);

    try {
      const doc = await uploadDocument(selectedVerifId, file, docType, setUploadProgress);
      setTyping(false);

      const result = doc.analysisResult;
      if (result) {
        const score = result.authenticityScore ?? 'N/A';
        const suspicious = result.isSuspicious;
        const findings = result.findings ?? [];

        let aiText = `**Document analyzed: ${docType.replace(/_/g, ' ')}**\n\n`;
        aiText += `Authenticity Score: **${score}%**\n`;
        aiText += `Status: **${suspicious ? '⚠ Suspicious' : '✓ Looks OK'}**\n`;

        if (findings.length > 0) {
          aiText += `\nFindings:\n${findings.map((f) => `• ${f}`).join('\n')}`;
        } else {
          aiText += '\nNo specific findings to report.';
        }

        addMessage({ role: 'ai', text: aiText, timestamp: now() });
      } else {
        addMessage({ role: 'ai', text: `Document uploaded successfully. AI analysis is queued — check back shortly for results.`, timestamp: now() });
      }
    } catch (err: unknown) {
      setTyping(false);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Upload failed. Please try again.';
      addMessage({ role: 'ai', text: `Error: ${msg}`, timestamp: now() });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const verifOptions = verifications.map((v) => ({
    label: `${v.parcelNumber} — ${v.location}`,
    value: v.id,
  }));

  return (
    <AppShell title="Upload & Chat" subtitle="Upload documents and receive AI analysis">
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 20, height: isMobile ? 'auto' : 'calc(100vh - 160px)', minHeight: 500 }}>
        {/* Chat */}
        <div className="lc-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Chat messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
                <div style={{
                  maxWidth: '76%', padding: '12px 16px',
                  background: msg.role === 'user' ? 'var(--lc-primary)' : 'var(--lc-surface-2)',
                  color: msg.role === 'user' ? '#fff' : 'var(--lc-text)',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  fontSize: 13, lineHeight: 1.65,
                }}>
                  {msg.role === 'ai' ? renderMarkdown(msg.text) : msg.text}
                </div>
                <span style={{ fontSize: 11, color: 'var(--lc-text-muted)' }}>{msg.timestamp}</span>
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                <TypingIndicator />
                <span style={{ fontSize: 11, color: 'var(--lc-text-muted)' }}>LandCheck AI is analyzing…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Upload progress bar */}
          {uploading && (
            <div style={{ height: 3, background: 'var(--lc-border)', margin: '0 20px' }}>
              <div style={{ height: '100%', background: 'var(--lc-primary)', width: `${uploadProgress}%`, transition: 'width 0.2s' }} />
            </div>
          )}

          {/* Input area */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--lc-border-subtle)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, background: 'var(--lc-surface-2)', color: 'var(--lc-text-muted)', flexShrink: 0 }}>
              <I name="upload" size={18} />
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
            </label>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--lc-text-muted)', padding: '0 8px' }}>
              {stagedFile
                ? <span style={{ color: 'var(--lc-primary)', fontWeight: 500 }}>{stagedFile.name}</span>
                : 'Click the upload icon to attach a document…'
              }
            </div>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!stagedFile || uploading || !selectedVerifId}
              loading={uploading}
              style={{ height: 40, flexShrink: 0, paddingInline: 16 }}
            >
              {uploading ? `${uploadProgress}%` : 'Analyze'}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Verification selector */}
          <div className="lc-card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Verification Case</div>
            {verifications.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--lc-text-muted)' }}>No verifications found. Create one first.</div>
            ) : (
              <Select
                value={selectedVerifId}
                onChange={setSelectedVerifId}
                options={verifOptions}
                placeholder="Select verification…"
              />
            )}
          </div>

          {/* Document type selector */}
          <div className="lc-card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Document Type</div>
            <Select
              value={docType}
              onChange={(v) => setDocType(v as DocumentType)}
              options={DOC_TYPES}
            />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            className="lc-card"
            style={{
              padding: 24, textAlign: 'center', flex: 1,
              border: `2px dashed ${drag ? 'var(--lc-primary)' : 'var(--lc-border)'}`,
              background: drag ? 'var(--lc-primary-50)' : '#fff',
              cursor: 'pointer', transition: 'all var(--lc-dur)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onClick={() => document.getElementById('drop-file-input')?.click()}
          >
            <I name="cloud" size={28} stroke={drag ? 'var(--lc-primary)' : 'var(--lc-text-muted)'} />
            <p style={{ fontSize: 13, fontWeight: 500, color: drag ? 'var(--lc-primary)' : 'var(--lc-text)' }}>Drop file here</p>
            <p style={{ fontSize: 12, color: 'var(--lc-text-muted)' }}>PDF, JPG, PNG · max 10MB</p>
            <input
              id="drop-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
          </div>

          {stagedFile && (
            <div className="lc-card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staged</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <I name="document" size={16} stroke="var(--lc-primary)" />
                <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stagedFile.name}</span>
                <button onClick={() => setStagedFile(null)} style={{ color: 'var(--lc-danger)' }}>
                  <I name="trash" size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
