import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui';
import { I } from '../../components/icons';
import { getMyWallet, ensureWallet, initiateTopup, verifyTopup, withdraw } from '../../api/wallet';
import type { Wallet, WalletTransaction } from '../../types';

const TX_LABELS: Record<string, string> = {
  FUND: 'Wallet Top-up',
  ESCROW_HOLD: 'Escrow Hold',
  ESCROW_RELEASE: 'Escrow Released',
  ADMIN_CREDIT: 'Admin Credit',
  ADMIN_DEBIT: 'Admin Debit',
};

const TX_COLORS: Record<string, string> = {
  FUND: 'var(--lc-success)',
  ESCROW_HOLD: '#F59E0B',
  ESCROW_RELEASE: 'var(--lc-success)',
  ADMIN_CREDIT: 'var(--lc-success)',
  ADMIN_DEBIT: 'var(--lc-danger)',
};

const QUICK_AMOUNTS = [1000, 5000, 10000, 50000];

function isCreditTx(tx: WalletTransaction, walletId: string) {
  return tx.toWalletId === walletId;
}

export const WalletPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Top-up state
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingRef, setPendingRef] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawName, setWithdrawName] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  const firstLoad = useRef(false);
  const verifyInProgress = useRef(false);

  const load = useCallback(async () => {
    // Only show loading spinner on first load — background polls are silent
    const isFirst = !firstLoad.current;
    if (isFirst) setLoading(true);
    try {
      let w = await getMyWallet().catch(() => null);
      if (!w) w = await ensureWallet();
      setWallet(w);
      firstLoad.current = true;
    } catch (e: unknown) {
      if (isFirst) setError((e as Error).message ?? 'Failed to load wallet');
    } finally {
      if (isFirst) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  const autoVerify = useCallback(async (ref: string) => {
    setVerifyLoading(true);
    setVerifyMsg('Verifying your payment…');
    try {
      const result = await verifyTopup(ref);
      localStorage.removeItem('lc_pending_topup_ref');
      setPendingRef('');
      if (result.alreadyCredited) {
        setVerifyMsg('✓ Payment already credited — balance updated.');
      } else {
        setVerifyMsg(`✓ ${fmt(result.amountCredited)} credited to your wallet!`);
      }
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      if (msg.toLowerCase().includes('already')) {
        setVerifyMsg('✓ Payment already credited — balance updated.');
        localStorage.removeItem('lc_pending_topup_ref');
        setPendingRef('');
        await load();
      } else {
        // Verification failed — keep pendingRef so user can retry manually
        setVerifyMsg('Could not auto-verify. Use the button below to retry.');
      }
    } finally {
      setVerifyLoading(false);
    }
  }, [load]); // fmt is stable; load is memoized

  // Squad redirects back with ?topup=success — Squad doesn't reliably echo the ref
  // in the callback URL, so we retrieve it from localStorage (saved before redirect).
  useEffect(() => {
    if (searchParams.get('topup') !== 'success') return;
    // Guard against React StrictMode double-invoke (dev only)
    if (verifyInProgress.current) return;
    verifyInProgress.current = true;

    setSearchParams({}, { replace: true });
    setShowSuccess(true);

    // 1. Try localStorage (most reliable)
    // 2. Try Squad's URL param names as fallback
    const ref =
      localStorage.getItem('lc_pending_topup_ref') ??
      searchParams.get('transactionref') ??
      searchParams.get('transaction_ref') ??
      '';

    if (ref) {
      autoVerify(ref);
    } else {
      // No ref found — just reload the balance after a short wait
      setTimeout(load, 2500);
    }
  }, []); // run once on mount only — exhaustive-deps intentionally omitted

  const handleVerify = async () => {
    if (!pendingRef) return;
    await autoVerify(pendingRef);
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount < 100) { setWithdrawError('Minimum withdrawal is ₦100'); return; }
    if (!withdrawAccount || !withdrawBank || !withdrawName) { setWithdrawError('Fill in all bank details'); return; }
    setWithdrawError('');
    setWithdrawSuccess('');
    setWithdrawLoading(true);
    try {
      const result = await withdraw({ amount, accountNumber: withdrawAccount, bankCode: withdrawBank, accountName: withdrawName });
      setWithdrawSuccess(`Withdrawal initiated! Reference: ${result.reference}`);
      setWithdrawAmount(''); setWithdrawAccount(''); setWithdrawBank(''); setWithdrawName('');
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Withdrawal failed';
      setWithdrawError(msg);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleTopup = async () => {
    const amount = Number(topupAmount);
    if (!amount || amount < 100) {
      setTopupError('Minimum top-up is ₦100');
      return;
    }
    setTopupError('');
    setTopupLoading(true);
    try {
      const { checkoutUrl, reference } = await initiateTopup(amount);
      // Save reference before leaving the page — Squad's callback URL doesn't
      // reliably echo it back, so localStorage is the safest handoff mechanism.
      localStorage.setItem('lc_pending_topup_ref', reference);
      window.location.href = checkoutUrl;
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to initiate top-up';
      setTopupError(msg);
      setTopupLoading(false);
    }
  };

  const allTxns: WalletTransaction[] = wallet
    ? [
        ...(wallet.sentTxns ?? []),
        ...(wallet.receivedTxns ?? []),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n);

  return (
    <AppShell title="My Wallet" subtitle="Fund your wallet and track transactions">
      {showSuccess && (
        <div style={{
          marginBottom: 20, padding: '14px 20px',
          background: verifyMsg.startsWith('Could not') ? 'rgba(239,68,68,0.06)' : 'rgba(61,179,73,0.1)',
          border: `1px solid ${verifyMsg.startsWith('Could not') ? 'rgba(239,68,68,0.3)' : 'rgba(61,179,73,0.3)'}`,
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
          color: verifyMsg.startsWith('Could not') ? 'var(--lc-danger)' : 'var(--lc-primary)',
          fontSize: 14, fontWeight: 500,
        }}>
          <I
            name={verifyLoading ? 'spinner' : verifyMsg.startsWith('Could not') ? 'alertTriangle' : 'checkCircle'}
            size={20}
            stroke={verifyMsg.startsWith('Could not') ? 'var(--lc-danger)' : 'var(--lc-primary)'}
          />
          {verifyLoading ? 'Verifying your payment…' : verifyMsg || 'Payment received! Crediting your wallet…'}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--lc-text-muted)' }}>Loading wallet…</div>
      ) : error ? (
        <div style={{ color: 'var(--lc-danger)', padding: 24 }}>{error}</div>
      ) : wallet ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Balance card */}
            <div className="lc-card" style={{
              padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 24,
              background: 'var(--lc-navy)', color: '#fff',
            }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I name="wallet" size={28} stroke="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Available Balance</div>
                <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px' }}>
                  {fmt(Number(wallet.balance))}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', background: 'transparent' }}
                onClick={load}
              >
                Refresh
              </Button>
            </div>

            {/* Transaction history */}
            <div className="lc-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--lc-border-subtle)', fontWeight: 600, fontSize: 14 }}>
                Transaction History
              </div>
              {allTxns.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--lc-text-muted)', fontSize: 13 }}>
                  No transactions yet. Fund your wallet to get started.
                </div>
              ) : (
                <div>
                  {allTxns.map((tx) => {
                    const credit = isCreditTx(tx, wallet.id);
                    return (
                      <div key={tx.id} style={{
                        padding: '14px 20px', borderBottom: '1px solid var(--lc-border-subtle)',
                        display: 'flex', alignItems: 'center', gap: 14,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: credit ? 'rgba(61,179,73,0.1)' : 'rgba(239,68,68,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <I name={credit ? 'arrowDown' : 'arrowUp'} size={16} stroke={credit ? 'var(--lc-success)' : 'var(--lc-danger)'} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{TX_LABELS[tx.type] ?? tx.type}</div>
                          <div style={{ fontSize: 12, color: 'var(--lc-text-muted)', marginTop: 2 }}>
                            {tx.note ?? tx.reference.slice(0, 16) + '…'} · {new Date(tx.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: TX_COLORS[tx.type] ?? 'inherit' }}>
                          {credit ? '+' : '-'}{fmt(Number(tx.amount))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Fund Wallet */}
          <div className="lc-card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Fund Wallet</div>
              <div style={{ fontSize: 12, color: 'var(--lc-text-muted)' }}>
                Pay securely via Squad. Funds reflect within seconds after payment.
              </div>
            </div>

            {/* Quick amount buttons */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Quick amounts
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTopupAmount(String(amt))}
                    style={{
                      padding: '10px 8px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      border: `1.5px solid ${topupAmount === String(amt) ? 'var(--lc-primary)' : 'var(--lc-border)'}`,
                      background: topupAmount === String(amt) ? 'rgba(61,179,73,0.08)' : '#fff',
                      color: topupAmount === String(amt) ? 'var(--lc-primary)' : 'var(--lc-text)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {fmt(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Or enter custom amount (₦)
              </div>
              <input
                type="number"
                min="100"
                placeholder="e.g. 25000"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 14px',
                  border: '1.5px solid var(--lc-border)', borderRadius: 10, fontSize: 14,
                  outline: 'none', background: 'var(--lc-surface)', color: 'var(--lc-text)',
                }}
              />
              {topupAmount && Number(topupAmount) >= 100 && (
                <div style={{ fontSize: 12, color: 'var(--lc-text-muted)', marginTop: 6 }}>
                  You will be charged <strong>{fmt(Number(topupAmount))}</strong>
                </div>
              )}
            </div>

            {topupError && (
              <div style={{ fontSize: 13, color: 'var(--lc-danger)', padding: '10px 12px', background: 'var(--lc-danger-tint)', borderRadius: 8 }}>
                {topupError}
              </div>
            )}

            <Button
              fullWidth
              size="lg"
              onClick={handleTopup}
              loading={topupLoading}
              disabled={!topupAmount || Number(topupAmount) < 100 || topupLoading}
              leading={<I name="wallet" size={18} />}
            >
              {topupLoading ? 'Redirecting to Squad…' : 'Pay with Squad'}
            </Button>

            <div style={{ fontSize: 11, color: 'var(--lc-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
              You'll be redirected to Squad's secure payment page. After payment, you'll return here automatically.
            </div>

            {/* Sandbox note */}
            <div style={{ padding: '10px 12px', background: 'rgba(124,74,201,0.08)', borderRadius: 8, fontSize: 12, color: '#7C4AC9', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <I name="info" size={14} stroke="#7C4AC9" />
              <span><strong>Sandbox mode:</strong> Use test card <code>4084084084084081</code>, any future expiry, CVV <code>408</code>.</span>
            </div>

            {/* Manual verify (dev fallback) */}
            {(pendingRef || verifyMsg) && (
              <div style={{ borderTop: '1px solid var(--lc-border-subtle)', paddingTop: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--lc-text-muted)', marginBottom: 8 }}>
                  Balance not updated? Manually verify your payment:
                </div>
                {pendingRef && (
                  <Button size="sm" variant="outline" fullWidth loading={verifyLoading} onClick={handleVerify}>
                    Verify Payment ({pendingRef.slice(0, 12)}…)
                  </Button>
                )}
                {verifyMsg && (
                  <div style={{ fontSize: 12, marginTop: 8, color: verifyMsg.startsWith('Error') ? 'var(--lc-danger)' : 'var(--lc-primary)' }}>
                    {verifyMsg}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Withdraw */}
          <div className="lc-card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Withdraw to Bank</div>
              <div style={{ fontSize: 12, color: 'var(--lc-text-muted)' }}>
                Withdraw your wallet balance to a Nigerian bank account via Squad.
              </div>
            </div>
            {[
              { label: 'Amount (₦)', value: withdrawAmount, setter: setWithdrawAmount, type: 'number', placeholder: 'e.g. 5000' },
              { label: 'Account Number', value: withdrawAccount, setter: setWithdrawAccount, type: 'text', placeholder: '0123456789' },
              { label: 'Bank Code', value: withdrawBank, setter: setWithdrawBank, type: 'text', placeholder: 'e.g. 058 (GTB)' },
              { label: 'Account Name', value: withdrawName, setter: setWithdrawName, type: 'text', placeholder: 'John Doe' },
            ].map(({ label, value, setter, type, placeholder }) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  {label}
                </div>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '9px 12px',
                    border: '1.5px solid var(--lc-border)', borderRadius: 8, fontSize: 13,
                    outline: 'none', background: 'var(--lc-surface)', color: 'var(--lc-text)',
                  }}
                />
              </div>
            ))}
            {withdrawError && (
              <div style={{ fontSize: 13, color: 'var(--lc-danger)', padding: '8px 12px', background: 'var(--lc-danger-tint)', borderRadius: 8 }}>
                {withdrawError}
              </div>
            )}
            {withdrawSuccess && (
              <div style={{ fontSize: 13, color: 'var(--lc-primary)', padding: '8px 12px', background: 'rgba(61,179,73,0.08)', borderRadius: 8 }}>
                {withdrawSuccess}
              </div>
            )}
            <Button fullWidth loading={withdrawLoading} onClick={handleWithdraw} variant="outline">
              Withdraw Funds
            </Button>
          </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
};
