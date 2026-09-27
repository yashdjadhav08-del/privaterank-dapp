import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { shortenAddress } from '../../utils/crypto';
import { Trophy, User, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

export const RoleSelectionModal: React.FC = () => {
  const { authState, isRoleSelectionRequired, selectRole } = useWallet();

  if (!authState.isConnected || !authState.unshieldedAddress || !isRoleSelectionRequired) {
    return null;
  }

  const walletDisplay = shortenAddress(authState.unshieldedAddress, 6);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          padding: '36px 32px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(7, 10, 18, 0.98))',
          border: '1px solid rgba(0, 242, 254, 0.25)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 242, 254, 0.1)',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '20px',
              background: 'rgba(0, 242, 254, 0.1)',
              color: '#00f2fe',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '12px',
              border: '1px solid rgba(0, 242, 254, 0.25)'
            }}
          >
            <Sparkles size={13} /> FIRST-TIME SETUP
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Choose Your Role
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.5 }}>
            Welcome! Select your identity for wallet <strong style={{ color: '#00f2fe', fontFamily: 'monospace' }}>{walletDisplay}</strong>. This choice permanently binds your wallet to your chosen role.
          </p>
        </div>

        {/* Selection Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          {/* Option: Organizer */}
          <div
            onClick={() => selectRole('ORGANIZER')}
            style={{
              borderRadius: '16px',
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(15, 23, 42, 0.8))',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              transition: 'all 0.2s ease',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#c084fc';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(168, 85, 247, 0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
            }}
          >
            <div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(168, 85, 247, 0.2)',
                  color: '#c084fc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}
              >
                <Trophy size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
                🎮 Organizer
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.45 }}>
                Host and manage gaming tournaments, set prize pools, review participant registrations, and publish brackets on Midnight.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#c084fc', fontWeight: 600, marginBottom: '12px' }}>
                <ShieldCheck size={14} /> Permanent Organizer Binding
              </div>
              <button
                className="btn-purple"
                style={{ width: '100%', padding: '10px 16px', fontSize: '0.9rem', justifyContent: 'center' }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectRole('ORGANIZER');
                }}
              >
                Select Organizer <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Option: Player */}
          <div
            onClick={() => selectRole('PLAYER')}
            style={{
              borderRadius: '16px',
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08), rgba(15, 23, 42, 0.8))',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              transition: 'all 0.2s ease',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#00f2fe';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 242, 254, 0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
            }}
          >
            <div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(0, 242, 254, 0.18)',
                  color: '#00f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}
              >
                <User size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
                👤 Player
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.45 }}>
                Browse esports tournaments, generate Zero-Knowledge rank eligibility proofs, create or join teams, and compete anonymously.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#00f2fe', fontWeight: 600, marginBottom: '12px' }}>
                <ShieldCheck size={14} /> Permanent Player Binding
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '10px 16px', fontSize: '0.9rem', justifyContent: 'center' }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectRole('PLAYER');
                }}
              >
                Select Player <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
