import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { ShieldAlert, ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';

export const AccessDeniedModal: React.FC = () => {
  const { authState, activeRole, isOrganizerAuthorized, disconnectWallet } = useWallet();

  // Show modal popup on ALL pages whenever active role is ORGANIZER but connected wallet is not authorized
  const showModal = authState.isConnected && activeRole === 'ORGANIZER' && !isOrganizerAuthorized;

  if (!showModal) {
    return null;
  }

  const handleDisconnect = () => {
    disconnectWallet();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '36px 28px',
          textAlign: 'center',
          borderRadius: '16px',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          background: 'linear-gradient(180deg, rgba(24, 13, 20, 0.98) 0%, rgba(12, 9, 20, 0.98) 100%)',
          boxShadow: '0 0 45px rgba(239, 68, 68, 0.25)'
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            color: '#ef4444'
          }}
        >
          <ShieldAlert size={30} />
        </div>

        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#f8fafc',
            letterSpacing: '-0.02em',
            marginBottom: '8px'
          }}
        >
          ACCESS DENIED
        </h2>

        <p
          style={{
            fontSize: '0.92rem',
            color: '#cbd5e1',
            lineHeight: 1.5,
            marginBottom: '20px'
          }}
        >
          Organizer access is restricted to authorized wallets.
        </p>

        {authState.unshieldedAddress && (
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '18px',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Connected Wallet:
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                color: '#f87171',
                wordBreak: 'break-all'
              }}
            >
              {authState.unshieldedAddress}
            </div>
          </div>
        )}

        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Shield size={16} />
          <span>This wallet does not have Organizer permissions.</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleDisconnect}
            className="btn-secondary"
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: '0.92rem',
              fontWeight: 600,
              justifyContent: 'center',
              border: '1px solid rgba(239, 68, 68, 0.4)'
            }}
          >
            <ArrowLeft size={16} /> Disconnect / Switch Wallet
          </button>
        </div>
      </div>
    </div>
  );
};
