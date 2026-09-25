import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { shortenAddress } from '../../utils/crypto';
import { ChevronDown, Wallet, Gamepad2, Globe, AlertCircle, Menu, X, LogOut, User, Shield } from 'lucide-react';
import { NETWORK_NAME } from '../../config/network';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { authState, activeRole, isOrganizerAuthorized, connectWallet, disconnectWallet } = useWallet();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: 'rgba(10, 14, 23, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          {/* Left: Logo */}
          <div
            onClick={() => onNavigate('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00f2fe 0%, #7928ca 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(0, 242, 254, 0.3)'
              }}
            >
              <Gamepad2 size={20} color="#040d1a" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              Private<span style={{ color: '#00f2fe' }}>Rank</span>
            </span>
          </div>

          {/* Center: Navigation based on strict role */}
          <nav
            className="desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '4px 8px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <button
              onClick={() => onNavigate('home')}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                background: currentView === 'home' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                color: currentView === 'home' ? '#00f2fe' : '#94a3b8',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Home
            </button>

            {/* Players see Explore, Organizers focus on Managed Tournaments */}
            {!isOrganizerAuthorized && (
              <button
                onClick={() => onNavigate('explore')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: currentView === 'explore' || currentView === 'game_details' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                  color: currentView === 'explore' || currentView === 'game_details' ? '#00f2fe' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Explore
              </button>
            )}

            <button
              onClick={() => onNavigate('dashboard')}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                background: currentView === 'dashboard' ? (isOrganizerAuthorized ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0, 242, 254, 0.15)') : 'transparent',
                color: currentView === 'dashboard' ? (isOrganizerAuthorized ? '#c084fc' : '#00f2fe') : '#94a3b8',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isOrganizerAuthorized ? 'Organizer Dashboard' : 'Dashboard'}
            </button>

            {/* Profile is ONLY available for Players */}
            {authState.isConnected && !isOrganizerAuthorized && (
              <button
                onClick={() => onNavigate('profile')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: currentView === 'profile' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                  color: currentView === 'profile' ? '#00f2fe' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                My Profile
              </button>
            )}
          </nav>

          {/* Right Side Controls */}
          <div className="desktop-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* 1. Connected Role Badge (Strictly derived from wallet) */}
            {authState.isConnected && (
              <div
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isOrganizerAuthorized ? 'rgba(168, 85, 247, 0.15)' : 'rgba(0, 242, 254, 0.15)',
                  border: isOrganizerAuthorized ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(0, 242, 254, 0.3)',
                  color: isOrganizerAuthorized ? '#c084fc' : '#00f2fe'
                }}
              >
                {isOrganizerAuthorized ? <Shield size={14} /> : <Gamepad2 size={14} />}
                <span>{isOrganizerAuthorized ? 'Organizer Portal' : 'Player Portal'}</span>
              </div>
            )}

            {/* 2. Real Wallet Address or Connect Button */}
            {authState.isConnected && authState.unshieldedAddress ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  className="btn-secondary"
                  style={{
                    padding: '7px 14px',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(15, 23, 42, 0.8)'
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: authState.isWrongNetwork ? '#ef4444' : '#10b981' }}></div>
                  <span>{shortenAddress(authState.unshieldedAddress, 4)}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {showWalletMenu && (
                  <div
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '115%',
                      width: '260px',
                      padding: '12px',
                      background: '#0d1322',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      zIndex: 2000,
                      borderRadius: '10px'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Connected 1AM Wallet:</div>
                    <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#f8fafc', wordBreak: 'break-all', background: 'rgba(0,0,0,0.4)', padding: '6px', borderRadius: '6px', marginBottom: '10px' }}>
                      {authState.unshieldedAddress}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>
                      Identity: <strong style={{ color: isOrganizerAuthorized ? '#c084fc' : '#00f2fe' }}>{isOrganizerAuthorized ? 'Authorized Organizer' : 'Verified Player'}</strong>
                    </div>

                    {!isOrganizerAuthorized && (
                      <button
                        onClick={() => {
                          onNavigate('profile');
                          setShowWalletMenu(false);
                        }}
                        className="btn-secondary"
                        style={{ width: '100%', padding: '6px', fontSize: '0.8rem', justifyContent: 'center', marginBottom: '6px' }}
                      >
                        <User size={13} /> View My Profile
                      </button>
                    )}

                    <button
                      onClick={() => {
                        disconnectWallet();
                        setShowWalletMenu(false);
                      }}
                      className="btn-danger"
                      style={{ width: '100%', padding: '6px', fontSize: '0.8rem', justifyContent: 'center' }}
                    >
                      <LogOut size={13} /> Disconnect Wallet
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => connectWallet()}
                disabled={authState.isConnecting}
                className="btn-primary"
                style={{ padding: '7px 16px', fontSize: '0.85rem' }}
              >
                <Wallet size={15} /> {authState.isConnecting ? 'Connecting...' : 'Connect 1AM Wallet'}
              </button>
            )}

            {/* 3. Non-Editable Preprod Testnet Network Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: 'rgba(0, 242, 254, 0.06)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#e2e8f0',
                userSelect: 'none'
              }}
              title="Midnight Preprod Testnet"
            >
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: authState.isWrongNetwork ? '#ef4444' : '#00f2fe',
                  boxShadow: authState.isWrongNetwork ? '0 0 8px #ef4444' : '0 0 8px #00f2fe'
                }}
              />
              <span style={{ color: '#00f2fe', letterSpacing: '0.01em' }}>
                Preprod Testnet
              </span>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="mobile-toggle"
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {showMobileMenu && (
          <div
            style={{
              padding: '16px 20px',
              background: '#070a12',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <button
              onClick={() => {
                onNavigate('home');
                setShowMobileMenu(false);
              }}
              className="btn-secondary"
              style={{ justifyContent: 'flex-start' }}
            >
              Home
            </button>
            {!isOrganizerAuthorized && (
              <button
                onClick={() => {
                  onNavigate('explore');
                  setShowMobileMenu(false);
                }}
                className="btn-secondary"
                style={{ justifyContent: 'flex-start' }}
              >
                Explore
              </button>
            )}
            <button
              onClick={() => {
                onNavigate('dashboard');
                setShowMobileMenu(false);
              }}
              className="btn-secondary"
              style={{ justifyContent: 'flex-start' }}
            >
              Dashboard
            </button>
            {authState.isConnected && !isOrganizerAuthorized && (
              <button
                onClick={() => {
                  onNavigate('profile');
                  setShowMobileMenu(false);
                }}
                className="btn-secondary"
                style={{
                  justifyContent: 'flex-start',
                  background: currentView === 'profile' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                  color: currentView === 'profile' ? '#00f2fe' : '#f8fafc'
                }}
              >
                My Profile
              </button>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {authState.isConnected ? (
                <button
                  onClick={() => {
                    disconnectWallet();
                    setShowMobileMenu(false);
                  }}
                  className="btn-danger"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '8px 12px' }}
                >
                  Disconnect ({isOrganizerAuthorized ? 'Organizer' : 'Player'})
                </button>
              ) : (
                <button
                  onClick={() => {
                    connectWallet();
                    setShowMobileMenu(false);
                  }}
                  className="btn-primary"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '8px 12px' }}
                >
                  Connect 1AM Wallet
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Wallet Connection Error Banner */}
      {authState.error && !authState.isWrongNetwork && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '10px 20px',
            fontSize: '0.85rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <AlertCircle size={16} />
          <span>{authState.error}</span>
        </div>
      )}
    </>
  );
};
