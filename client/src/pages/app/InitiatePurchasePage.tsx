import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Button, Input } from '../../components/ui';
import { I } from '../../components/icons';
import { searchUsers, initiatePurchase } from '../../api/purchases';
import type { UserSearchResult } from '../../types';

type Step = 1 | 2 | 3;

export const InitiatePurchasePage: React.FC = () => {
  const navigate = useNavigate();

  // Step 1: Property details
  const [parcelNumber, setParcelNumber] = useState('');
  const [location, setLocation] = useState('');
  const [ownerName, setOwnerName] = useState('');

  // Step 2: Seller search
  const [sellerQuery, setSellerQuery] = useState('');
  const [sellerResults, setSellerResults] = useState<UserSearchResult[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<UserSearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Step 3: Review + amount
  const [agreedAmount, setAgreedAmount] = useState('');

  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const doSearch = useCallback(async (q: string) => {
    if (abortRef.current) abortRef.current.abort();
    if (q.length < 2) {
      setSellerResults([]);
      setShowDropdown(false);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const users = await searchUsers(q);
      setSellerResults(users);
      setShowDropdown(true);
    } catch {
      // ignore aborted requests
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(sellerQuery), 300);
    return () => clearTimeout(timer);
  }, [sellerQuery, doSearch]);

  const canStep1 = parcelNumber.trim() && location.trim() && ownerName.trim();
  const canStep2 = !!selectedSeller;
  const canStep3 = Number(agreedAmount) > 0;

  const handleSubmit = async () => {
    if (!selectedSeller || !canStep3) return;
    setError('');
    setSubmitting(true);
    try {
      const purchase = await initiatePurchase({
        parcelNumber,
        location,
        ownerName,
        sellerId: selectedSeller.id,
        agreedAmount: Number(agreedAmount),
      });
      navigate(`/app/purchases/${purchase.id}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to initiate purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n: string) => {
    const num = Number(n);
    if (isNaN(num)) return n;
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(num);
  };

  return (
    <AppShell title="Initiate Land Purchase" subtitle="Start a verified land purchase with another platform user">
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
          {([1, 2, 3] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 999,
                  background: step >= s ? 'var(--lc-primary)' : 'var(--lc-surface-2)',
                  color: step >= s ? '#fff' : 'var(--lc-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                }}>
                  {step > s ? <I name="check" size={14} stroke="#fff" /> : s}
                </div>
                <span style={{ fontSize: 11, color: step >= s ? 'var(--lc-primary)' : 'var(--lc-text-muted)', fontWeight: step === s ? 600 : 400 }}>
                  {['Property', 'Seller', 'Review'][i]}
                </span>
              </div>
              {i < 2 && (
                <div style={{ flex: 2, height: 2, background: step > s ? 'var(--lc-primary)' : 'var(--lc-border)', margin: '15px 0 auto', transition: 'background 0.2s' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Property info */}
        {step === 1 && (
          <div className="lc-card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Property Details</div>
            <Input label="Parcel / File Number" value={parcelNumber} onChange={setParcelNumber} placeholder="e.g. LG/001/2024" />
            <Input label="Property Location" value={location} onChange={setLocation} placeholder="e.g. 12 Broad Street, Lagos Island" />
            <Input label="Registered Owner Name" value={ownerName} onChange={setOwnerName} placeholder="Name on the title document" />
            <Button fullWidth size="lg" onClick={() => setStep(2)} disabled={!canStep1}>
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Seller search */}
        {step === 2 && (
          <div className="lc-card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Seller Information</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lc-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Search seller by email
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  value={sellerQuery}
                  autoComplete="off"
                  onChange={(e) => {
                    const q = e.target.value;
                    setSellerQuery(q);
                    setSelectedSeller(null);
                    if (q.length < 2) { setShowDropdown(false); setSellerResults([]); }
                  }}
                  onFocus={() => { if (sellerResults.length > 0 && !selectedSeller) setShowDropdown(true); }}
                  placeholder="Type at least 2 characters of their email…"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '10px 40px 10px 14px',
                    border: '1.5px solid var(--lc-border)', borderRadius: 10, fontSize: 14,
                    outline: 'none', background: 'var(--lc-surface)', color: 'var(--lc-text)',
                  }}
                />
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  {searchLoading
                    ? <I name="radar" size={16} stroke="var(--lc-primary)" />
                    : <I name="search" size={16} stroke="var(--lc-text-muted)" />
                  }
                </div>
              </div>
              {sellerQuery.length >= 2 && !selectedSeller && searchLoading && (
                <div style={{ fontSize: 12, color: 'var(--lc-text-muted)', marginTop: 6, padding: '0 4px' }}>Searching…</div>
              )}
              {showDropdown && !selectedSeller && sellerResults.length > 0 && (
                <div style={{ border: '1px solid var(--lc-border)', borderRadius: 10, marginTop: 4, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  {sellerResults.map((u) => (
                    <div
                      key={u.id}
                      onMouseDown={(e) => {
                        e.preventDefault(); // prevent input blur before click fires
                        setSelectedSeller(u);
                        setSellerQuery(u.email);
                        setShowDropdown(false);
                        setSellerResults([]);
                      }}
                      style={{
                        padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                        borderBottom: '1px solid var(--lc-border-subtle)',
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: '#fff',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--lc-surface-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      <I name="user" size={14} stroke="var(--lc-text-muted)" />
                      {u.email}
                    </div>
                  ))}
                </div>
              )}
              {showDropdown && !selectedSeller && sellerResults.length === 0 && !searchLoading && sellerQuery.length >= 2 && (
                <div style={{ fontSize: 12, color: 'var(--lc-text-muted)', marginTop: 6, padding: '8px 14px', border: '1px solid var(--lc-border)', borderRadius: 8 }}>
                  No users found matching "{sellerQuery}"
                </div>
              )}
            </div>

            {selectedSeller && (
              <div style={{ padding: '12px 14px', background: 'rgba(61,179,73,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <I name="check" size={16} stroke="var(--lc-primary)" />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--lc-primary)' }}>Seller: {selectedSeller.email}</span>
                <button onClick={() => { setSelectedSeller(null); setSellerQuery(''); setSellerResults([]); setShowDropdown(false); }} style={{ marginLeft: 'auto', color: 'var(--lc-text-muted)' }}>
                  <I name="x" size={14} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="outline" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!canStep2} style={{ flex: 2 }}>Continue</Button>
            </div>
          </div>
        )}

        {/* Step 3: Review and amount */}
        {step === 3 && (
          <div className="lc-card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Review & Payment Amount</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Parcel Number', parcelNumber],
                ['Location', location],
                ['Owner on Title', ownerName],
                ['Seller', selectedSeller?.email ?? ''],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--lc-border-subtle)' }}>
                  <span style={{ color: 'var(--lc-text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lc-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Agreed Purchase Amount (NGN)
              </div>
              <input
                type="number"
                value={agreedAmount}
                onChange={(e) => setAgreedAmount(e.target.value)}
                placeholder="e.g. 5000000"
                min="1"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 14px',
                  border: '1.5px solid var(--lc-border)', borderRadius: 10, fontSize: 14,
                  outline: 'none', background: 'var(--lc-surface)',
                }}
              />
              {agreedAmount && Number(agreedAmount) > 0 && (
                <div style={{ fontSize: 12, color: 'var(--lc-text-muted)', marginTop: 6 }}>= {fmt(agreedAmount)}</div>
              )}
            </div>

            {error && (
              <div style={{ fontSize: 13, color: 'var(--lc-danger)', padding: '10px 14px', background: 'var(--lc-danger-tint)', borderRadius: 8 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="outline" onClick={() => setStep(2)} style={{ flex: 1 }} disabled={submitting}>Back</Button>
              <Button onClick={handleSubmit} disabled={!canStep3 || submitting} loading={submitting} style={{ flex: 2 }}>
                Start Purchase Session
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
