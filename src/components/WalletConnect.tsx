import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { shortenAddress } from '../utils/crypto';
import { ChevronDown, Wallet, LogOut, Shield, Gamepad2, AlertCircle, Copy, Check } from 'lucide-react';
import { NETWORK_NAME } from '../config/network';

interface WalletConnectProps {
  className?: string;
  showRoleBadge?: boolean;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  className = '',
  showRoleBadge = true
}) => {
  const { authState, activeRole, connectWallet, disconnectWallet } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (authState.unshieldedAddress) {
      navigator.clipboard.writeText(authState.unshieldedAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!authState.isConnected) {
    return (
      <div className={`wallet-connect-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={connectWallet}
          disabled={authState.isConnecting}
          className="btn-primary"
          style={{
            padding: '8px 18px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            color: '#040d1a',
            fontWeight: 700,
            borderRadius: '8px',
            cursor: authState.isConnecting ? 'wait' : 'pointer'
          }}
        >
          <Wallet size={16} />
          <span>{authState.isConnecting ? 'Connecting 1AM...' : 'Connect 1AM Wallet'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`wallet-connect-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
      {showRoleBadge && activeRole && (
        <div
          style={{
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: activeRole === 'ORGANIZER' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(0, 242, 254, 0.15)',
            border: activeRole === 'ORGANIZER' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(0, 242, 254, 0.3)',
            color: activeRole === 'ORGANIZER' ? '#c084fc' : '#00f2fe'
          }}
        >
          {activeRole === 'ORGANIZER' ? <Shield size={14} /> : <Gamepad2 size={14} />}
          <span>{activeRole === 'ORGANIZER' ? 'Organizer' : 'Player'}</span>
        </div>
      )}

      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="btn-secondary"
        style={{
          padding: '7px 14px',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-mono, monospace)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '8px',
          color: '#f8fafc',
          cursor: 'pointer'
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: authState.isWrongNetwork ? '#ef4444' : '#10b981'
          }}
        />
        <span>{authState.unshieldedAddress ? shortenAddress(authState.unshieldedAddress, 4) : 'Connected'}</span>
        <ChevronDown size={14} style={{ color: '#94a3b8' }} />
      </button>

      {showDropdown && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            right: 0,
            top: '120%',
            width: '270px',
            padding: '14px',
            background: '#0d1322',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            zIndex: 2000,
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
            Connected Network:
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: authState.isWrongNetwork ? '#ef4444' : '#10b981',
              marginBottom: '10px',
              fontWeight: 600
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: authState.isWrongNetwork ? '#ef4444' : '#10b981' }} />
            {authState.isWrongNetwork ? 'Wrong Network (Switch to Preprod)' : NETWORK_NAME}
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
            1AM Wallet Address:
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono, monospace)',
              color: '#f8fafc',
              wordBreak: 'break-all',
              background: 'rgba(0,0,0,0.4)',
              padding: '6px 8px',
              borderRadius: '6px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '4px'
            }}
          >
            <span>{authState.unshieldedAddress}</span>
            <button
              onClick={handleCopy}
              title="Copy Address"
              style={{
                background: 'none',
                border: 'none',
                color: copied ? '#10b981' : '#94a3b8',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>

          <button
            onClick={() => {
              setShowDropdown(false);
              disconnectWallet();
            }}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <LogOut size={14} />
            <span>Disconnect Wallet</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
