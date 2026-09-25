import React from 'react';
import { ShieldAlert, ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';
import { shortenAddress } from '../../utils/crypto';

interface AccessDeniedProps {
  connectedAddress: string | null;
  onBackToUserPortal: () => void;
  onAuthorizeOrganizer?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ connectedAddress, onBackToUserPortal, onAuthorizeOrganizer }) => {
  return (
    <div
      style={{
        maxWidth: '560px',
        margin: '60px auto',
        padding: '24px 20px',
        textAlign: 'center'
      }}
    >
      <div
        className="glass-panel"
        style={{
          padding: '44px 32px',
          borderRadius: '16px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          background: 'linear-gradient(180deg, rgba(24, 13, 20, 0.95) 0%, rgba(12, 9, 20, 0.95) 100%)',
          boxShadow: '0 0 35px rgba(239, 68, 68, 0.15)'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#ef4444'
          }}
        >
          <ShieldAlert size={32} />
        </div>

        <h2
          style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            color: '#f8fafc',
            letterSpacing: '-0.02em',
            marginBottom: '10px'
          }}
        >
          ACCESS DENIED
        </h2>

        <p
          style={{
            fontSize: '0.95rem',
            color: '#cbd5e1',
            lineHeight: 1.5,
            marginBottom: '20px'
          }}
        >
          Organizer access is restricted to authorized wallets.
        </p>

        {connectedAddress && (
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Connected Wallet:
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: '#f87171',
                wordBreak: 'break-all'
              }}
            >
              {connectedAddress}
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
            marginBottom: '28px',
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
          {onAuthorizeOrganizer && (
            <button
              onClick={onAuthorizeOrganizer}
              className="btn-purple"
              style={{
                width: '100%',
                padding: '12px 20px',
                fontSize: '0.95rem',
                fontWeight: 700,
                justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={16} /> Authorize Wallet as Organizer
            </button>
          )}

          <button
            onClick={onBackToUserPortal}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: '0.95rem',
              fontWeight: 700,
              justifyContent: 'center'
            }}
          >
            <ArrowLeft size={16} /> Return to User Portal
          </button>
        </div>
      </div>
    </div>
  );
};
