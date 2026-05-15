import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Button, Input, Select, StepIndicator, Toast } from '../../components/ui';
import { I } from '../../components/icons';
import { createVerification } from '../../api/verifications';

const STEPS = ['Property Details', 'Seller Information', 'Review & Submit'];

interface FormState {
  parcelNumber: string;
  location: string;
  ownerName: string;
}

const NeedHelp: React.FC = () => (
  <div style={{ background: 'var(--lc-primary-50)', borderRadius: 10, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--lc-primary-700)' }}>
    <I name="info" size={16} stroke="var(--lc-primary)" />
    Need help?{' '}
    <a href="/contact" style={{ fontWeight: 600, color: 'var(--lc-accent)' }}>Contact Support</a>
  </div>
);

const STATES = ['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Oyo', 'Kano', 'Enugu', 'Delta', 'Edo', 'Anambra'];

const Step1: React.FC<{ form: FormState; set: (k: keyof FormState) => (v: string) => void }> = ({ form, set }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Property Details</h3>
    <p style={{ fontSize: 13, color: 'var(--lc-text-muted)', marginTop: -12 }}>Enter the land parcel details exactly as they appear on the document.</p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <Input label="Parcel Number (e.g. LG-IKJ-2021-00127)" value={form.parcelNumber} onChange={set('parcelNumber')} />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Input label="Property Location / Address" value={form.location} onChange={set('location')} />
      </div>
    </div>
  </div>
);

const Step2: React.FC<{ form: FormState; set: (k: keyof FormState) => (v: string) => void }> = ({ form, set }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Seller / Owner Information</h3>
    <p style={{ fontSize: 13, color: 'var(--lc-text-muted)', marginTop: -12 }}>Enter the full name of the registered owner or seller.</p>
    <Input label="Owner / Seller Full Name" value={form.ownerName} onChange={set('ownerName')} leading={<I name="user" size={16} />} />
  </div>
);

const Step3: React.FC<{ form: FormState }> = ({ form }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Review & Submit</h3>
    <div className="lc-card" style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--lc-primary)' }}>Property Details</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[
          { label: 'Parcel Number', value: form.parcelNumber },
          { label: 'Location', value: form.location },
        ].map((r) => r.value && (
          <div key={r.label}>
            <div style={{ fontSize: 11, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.label}</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{r.value}</div>
          </div>
        ))}
      </div>
    </div>
    <div className="lc-card" style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--lc-primary)' }}>Owner Information</div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--lc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner Name</div>
        <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{form.ownerName || '—'}</div>
      </div>
    </div>
    <div style={{
      background: 'var(--lc-primary-50)', border: '1px solid var(--lc-primary)',
      borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12,
    }}>
      <I name="info" size={18} stroke="var(--lc-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontSize: 13, color: 'var(--lc-primary-700)', lineHeight: 1.6 }}>
        After submission, our AI will cross-reference the Lagos Land Registry and compute a trust score. You can upload supporting documents in Upload &amp; Chat to improve accuracy.
      </div>
    </div>
  </div>
);

export const StartVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({ parcelNumber: '', location: '', ownerName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registryMsg, setRegistryMsg] = useState('');

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canProceed = () => {
    if (step === 0) return form.parcelNumber.trim() && form.location.trim();
    if (step === 1) return form.ownerName.trim();
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await createVerification({
        parcelNumber: form.parcelNumber,
        location: form.location,
        ownerName: form.ownerName,
      });
      if (result.registryMessage) setRegistryMsg(result.registryMessage);
      navigate(`/app/report/${result.verification.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Start Verification">
      <div className="lc-card" style={{ padding: 32 }}>
        <StepIndicator steps={STEPS} current={step} />
        <div style={{ marginTop: 36 }}>
          {step === 0 && <Step1 form={form} set={set} />}
          {step === 1 && <Step2 form={form} set={set} />}
          {step === 2 && <Step3 form={form} />}
        </div>

        {error && (
          <div style={{ marginTop: 20, padding: '10px 14px', background: 'var(--lc-danger-tint)', borderRadius: 8, fontSize: 13, color: 'var(--lc-danger)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 36, paddingTop: 28, borderTop: '1px solid var(--lc-border-subtle)' }}>
          {step === 0 ? (
            <Button variant="secondary" onClick={() => navigate('/app/dashboard')}>Save & Exit</Button>
          ) : (
            <Button variant="outline" onClick={() => setStep(step - 1)} leading={<I name="arrowLeft" size={16} />}>Back</Button>
          )}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <NeedHelp />
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} trailing={<I name="arrowRight" size={16} />}>
                {step === 0 ? 'Continue to Owner Info' : 'Review & Submit'}
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={loading} trailing={<I name="shieldCheck" size={16} />}>
                Submit for Verification
              </Button>
            )}
          </div>
        </div>
      </div>
      {registryMsg && <Toast message={registryMsg} tone="caution" onClose={() => setRegistryMsg('')} />}
    </AppShell>
  );
};
