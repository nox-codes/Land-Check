import React, { useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Section, Button } from '../../components/ui';
import { Checkbox } from '../../components/ui/Checkbox';

const PREF_KEY = 'lc_settings';

interface Prefs {
  notifyVerification: boolean;
  notifyPayment: boolean;
  notifyDocument: boolean;
  compactView: boolean;
}

const DEFAULT_PREFS: Prefs = {
  notifyVerification: true,
  notifyPayment: true,
  notifyDocument: true,
  compactView: false,
};

function loadPrefs(): Prefs {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') }; }
  catch { return DEFAULT_PREFS; }
}

export const SettingsPage: React.FC = () => {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Prefs>(k: K) => (v: boolean) => {
    setPrefs((p) => ({ ...p, [k]: v }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppShell title="Settings" subtitle="Manage your preferences">
      <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 20 }}>

        <Section title="Notification Preferences">
          <div className="lc-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Checkbox
              checked={prefs.notifyVerification}
              onChange={set('notifyVerification')}
              label="Verification status updates"
            />
            <Checkbox
              checked={prefs.notifyPayment}
              onChange={set('notifyPayment')}
              label="Escrow and payment activity"
            />
            <Checkbox
              checked={prefs.notifyDocument}
              onChange={set('notifyDocument')}
              label="Document analysis results"
            />
          </div>
        </Section>

        <Section title="Display">
          <div className="lc-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Checkbox
              checked={prefs.compactView}
              onChange={set('compactView')}
              label="Compact verification list view"
            />
          </div>
        </Section>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Button onClick={handleSave}>Save Preferences</Button>
          {saved && <span style={{ fontSize: 13, color: 'var(--lc-primary)', fontWeight: 500 }}>Saved!</span>}
        </div>

      </div>
    </AppShell>
  );
};
