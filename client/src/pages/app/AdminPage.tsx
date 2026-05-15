import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Button, Section } from '../../components/ui';
import { Spinner } from '../../components/ui/Spinner';
import { I } from '../../components/icons';
import * as adminApi from '../../api/admin';
import type { AdminConfigItem, ScraperResult } from '../../api/admin';
import { adminCreditWallet, adminDebitWallet, adminGetAllWallets } from '../../api/wallet';
import type { Wallet } from '../../types';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n);

export const AdminPage: React.FC = () => {
  const [config, setConfig] = useState<AdminConfigItem[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [scraperRunning, setScraperRunning] = useState(false);
  const [scraperResult, setScraperResult] = useState<ScraperResult | null>(null);
  const [scraperError, setScraperError] = useState('');

  // Wallet management
  const [wallets, setWallets] = useState<(Wallet & { user: { id: string; email: string } })[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [selectedWalletUserId, setSelectedWalletUserId] = useState('');
  const [walletAmount, setWalletAmount] = useState('');
  const [walletNote, setWalletNote] = useState('');
  const [walletActionLoading, setWalletActionLoading] = useState(false);
  const [walletMsg, setWalletMsg] = useState('');

  const loadWallets = async () => {
    setWalletsLoading(true);
    try {
      const w = await adminGetAllWallets();
      setWallets(w);
    } catch { /* ignore */ } finally {
      setWalletsLoading(false);
    }
  };

  useEffect(() => {
    adminApi.getAdminConfig()
      .then((c) => {
        setConfig(c);
        setEditing(Object.fromEntries(c.map((item) => [item.key, item.value])));
      })
      .catch(() => setSaveMsg('Failed to load config.'))
      .finally(() => setLoading(false));
    loadWallets();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    const updates = config.map((item) => ({ key: item.key, value: editing[item.key] ?? item.value }));
    try {
      await adminApi.updateAdminConfig(updates);
      setSaveMsg('Saved successfully.');
    } catch {
      setSaveMsg('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleWalletAction = async (action: 'credit' | 'debit') => {
    if (!selectedWalletUserId || !walletAmount || Number(walletAmount) <= 0) return;
    setWalletActionLoading(true);
    setWalletMsg('');
    try {
      if (action === 'credit') {
        await adminCreditWallet(selectedWalletUserId, Number(walletAmount), walletNote || undefined);
        setWalletMsg('Credited successfully.');
      } else {
        await adminDebitWallet(selectedWalletUserId, Number(walletAmount), walletNote || undefined);
        setWalletMsg('Debited successfully.');
      }
      setWalletAmount('');
      setWalletNote('');
      await loadWallets();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Action failed.';
      setWalletMsg(msg);
    } finally {
      setWalletActionLoading(false);
    }
  };

  const handleScraper = async () => {
    setScraperRunning(true);
    setScraperResult(null);
    setScraperError('');
    try {
      const result = await adminApi.runScraper();
      setScraperResult(result);
    } catch {
      setScraperError('Scraper failed. Check server logs.');
    } finally {
      setScraperRunning(false);
    }
  };

  return (
    <AppShell title="Admin Panel" subtitle="System configuration and management">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        <Section title="System Configuration">
          <div className="lc-card" style={{ padding: '20px 24px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                <Spinner size={28} color="var(--lc-primary)" />
              </div>
            ) : config.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--lc-text-muted)' }}>No configuration entries found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {config.map((item) => (
                  <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--lc-text)', fontFamily: 'monospace' }}>{item.key}</div>
                    <input
                      value={editing[item.key] ?? item.value}
                      onChange={(e) => setEditing((prev) => ({ ...prev, [item.key]: e.target.value }))}
                      style={{
                        width: '100%', padding: '8px 12px', boxSizing: 'border-box',
                        border: '1px solid var(--lc-border)', borderRadius: 8,
                        fontSize: 13, fontFamily: 'monospace',
                        background: 'var(--lc-surface-2)', color: 'var(--lc-text)',
                        outline: 'none',
                      }}
                    />
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--lc-border-subtle)' }}>
                  <Button onClick={handleSave} loading={saving} leading={<I name="check" size={16} />}>
                    Save Changes
                  </Button>
                  {saveMsg && (
                    <span style={{ fontSize: 13, color: saveMsg.includes('success') ? 'var(--lc-primary)' : 'var(--lc-danger)' }}>
                      {saveMsg}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section title="Wallet Management (Testing)">
          <div className="lc-card" style={{ padding: '20px 24px' }}>
            <p style={{ fontSize: 13, color: 'var(--lc-text-secondary)', marginTop: 0, marginBottom: 16 }}>
              Credit or debit any user's wallet for testing purposes.
            </p>

            {/* All wallets table */}
            <div style={{ marginBottom: 20, overflowX: 'auto' }}>
              {walletsLoading ? (
                <Spinner size={20} color="var(--lc-primary)" />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--lc-border)' }}>
                      {['Email', 'Balance', ''].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--lc-text-muted)', fontWeight: 600, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.map((w) => (
                      <tr key={w.id} style={{ borderBottom: '1px solid var(--lc-border-subtle)' }}>
                        <td style={{ padding: '8px 8px' }}>{w.user.email}</td>
                        <td style={{ padding: '8px 8px', fontWeight: 600, color: 'var(--lc-primary)' }}>{fmt(Number(w.balance))}</td>
                        <td style={{ padding: '8px 8px' }}>
                          <button
                            onClick={() => setSelectedWalletUserId(w.user.id)}
                            style={{ fontSize: 12, color: 'var(--lc-primary)', fontWeight: 500, cursor: 'pointer', textDecoration: selectedWalletUserId === w.user.id ? 'underline' : 'none' }}
                          >
                            {selectedWalletUserId === w.user.id ? '✓ Selected' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {wallets.length === 0 && (
                      <tr><td colSpan={3} style={{ padding: '16px 8px', color: 'var(--lc-text-muted)', textAlign: 'center' }}>No wallets found. Users need to visit their wallet page first.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {selectedWalletUserId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', background: 'var(--lc-surface-2)', borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lc-text-muted)' }}>
                  Selected: {wallets.find((w) => w.user.id === selectedWalletUserId)?.user.email}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="number"
                    placeholder="Amount (NGN)"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--lc-border)', borderRadius: 8, fontSize: 13, outline: 'none' }}
                  />
                  <input
                    placeholder="Note (optional)"
                    value={walletNote}
                    onChange={(e) => setWalletNote(e.target.value)}
                    style={{ flex: 1.5, padding: '8px 12px', border: '1px solid var(--lc-border)', borderRadius: 8, fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button size="sm" onClick={() => handleWalletAction('credit')} loading={walletActionLoading} leading={<I name="plus" size={14} />}>
                    Credit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleWalletAction('debit')} loading={walletActionLoading} leading={<I name="minus" size={14} />}>
                    Debit
                  </Button>
                </div>
                {walletMsg && (
                  <div style={{ fontSize: 13, color: walletMsg.includes('success') ? 'var(--lc-primary)' : 'var(--lc-danger)' }}>
                    {walletMsg}
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>

        <Section title="Land Registry Scraper">
          <div className="lc-card" style={{ padding: '20px 24px' }}>
            <p style={{ fontSize: 13, color: 'var(--lc-text-secondary)', marginBottom: 16, marginTop: 0 }}>
              Trigger a manual run of the land registry scraper to fetch and upsert the latest parcel data from official sources.
            </p>
            <Button
              onClick={handleScraper}
              loading={scraperRunning}
              variant="secondary"
              leading={<I name="radar" size={16} />}
            >
              {scraperRunning ? 'Running…' : 'Run Scraper Now'}
            </Button>
            {scraperResult && (
              <div style={{ marginTop: 14, padding: '12px 16px', background: 'var(--lc-primary-50)', borderRadius: 8, fontSize: 13, color: 'var(--lc-primary-700)' }}>
                Completed: <strong>{scraperResult.upserted}</strong> records upserted, <strong>{scraperResult.errors}</strong> errors.
              </div>
            )}
            {scraperError && (
              <div style={{ marginTop: 14, padding: '12px 16px', background: 'var(--lc-danger-tint)', borderRadius: 8, fontSize: 13, color: 'var(--lc-danger)' }}>
                {scraperError}
              </div>
            )}
          </div>
        </Section>

      </div>
    </AppShell>
  );
};
