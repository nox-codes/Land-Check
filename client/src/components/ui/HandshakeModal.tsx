import React, { useEffect } from 'react';
import { Button } from './Button';

interface HandshakeModalProps {
  onContinue: () => void;
}

export const HandshakeModal: React.FC<HandshakeModalProps> = ({ onContinue }) => {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'handshake-keyframes';
    style.textContent = `
      @keyframes hs-bounce-in {
        0%   { transform: scale(0.3) rotate(-15deg); opacity: 0; }
        60%  { transform: scale(1.18) rotate(5deg); opacity: 1; }
        80%  { transform: scale(0.93) rotate(-3deg); }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      @keyframes hs-ring {
        0%, 100% { box-shadow: 0 0 0 0 rgba(61,179,73,0.3); }
        50%       { box-shadow: 0 0 0 18px rgba(61,179,73,0); }
      }
      @keyframes hs-fade-up {
        from { transform: translateY(10px); opacity: 0; }
        to   { transform: translateY(0); opacity: 1; }
      }
    `;
    if (!document.getElementById('handshake-keyframes')) {
      document.head.appendChild(style);
    }
    return () => {
      document.getElementById('handshake-keyframes')?.remove();
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(10,20,40,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="lc-card" style={{
        padding: '48px 52px', maxWidth: 460, width: '90%',
        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
      }}>
        {/* Emoji with bounce-in animation */}
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(61,179,73,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'hs-ring 2s ease-in-out infinite',
        }}>
          <span style={{
            fontSize: 56, lineHeight: 1,
            display: 'block',
            animation: 'hs-bounce-in 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}>
            🤝
          </span>
        </div>

        <div style={{ animation: 'hs-fade-up 0.5s ease 0.3s both' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--lc-text)', marginBottom: 10, letterSpacing: '-0.02em' }}>
            Deal Accepted!
          </div>
          <div style={{ fontSize: 14, color: 'var(--lc-text-muted)', lineHeight: 1.7, maxWidth: 340 }}>
            The seller has accepted your purchase offer. You can now upload documents for AI verification and lock funds in escrow to proceed.
          </div>
        </div>

        <div style={{ width: '100%', animation: 'hs-fade-up 0.5s ease 0.5s both' }}>
          <Button size="lg" onClick={onContinue} fullWidth>
            Continue to Purchase Session →
          </Button>
        </div>
      </div>
    </div>
  );
};
