import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const WrongNetworkAlert: React.FC = () => {
  const { authState, switchToPreprod } = useWallet();

  if (!authState.isWrongNetwork) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '32px 28px',
          textAlign: 'center',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 0 40px rgba(239, 68, 68, 0.25)',
          background: 'linear-gradient(180deg, #180d14 0%, #0c0914 100%)',
          borderRadius: '16px'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            color: '#ef4444'
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#f8fafc',
            marginBottom: '10px',
            letterSpacing: '-0.01em'
          }}
        >
          Wrong Network
        </h2>

        <p
          style={{
            fontSize: '0.95rem',
            color: '#cbd5e1',
            lineHeight: '1.5',
            marginBottom: '24px'
          }}
        >
          Please switch your wallet to <strong>Midnight Preprod Testnet</strong>.
        </p>

        {authState.detectedNetwork && (
          <div
            style={{
              display: 'inline-block',
              fontSize: '0.8rem',
              color: '#f87171',
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '4px 12px',
              borderRadius: '20px',
              marginBottom: '24px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            Detected: {authState.detectedNetwork}
          </div>
        )}

        <div>
          <button
            onClick={() => switchToPreprod()}
            disabled={authState.isConnecting}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: '0.95rem',
              fontWeight: 700,
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 242, 254, 0.35)'
            }}
          >
            {authState.isConnecting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Switching Network...
              </>
            ) : (
              'Switch to Preprod'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
