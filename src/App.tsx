import React, { useState } from 'react';
import { Navbar } from './components/common/Navbar';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { DashboardPage } from './pages/DashboardPage';
import { GameDetailsPage } from './pages/GameDetailsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { WrongNetworkAlert } from './components/common/WrongNetworkAlert';
import { AccessDeniedModal } from './components/common/AccessDeniedModal';
import { useWallet } from './context/WalletContext';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('t-midnight-champ-2026');
  const { authState, isOrganizerAuthorized, signMessage, clearError } = useWallet();


  const handleNavigate = (view: string, extra?: { tournamentId?: string }) => {
    if (extra?.tournamentId) {
      setSelectedTournamentId(extra.tournamentId);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;

      case 'explore':
        return <ExplorePage onNavigate={handleNavigate} />;

      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;

      case 'profile':
        if (authState.isConnected && isOrganizerAuthorized) {
          return (
            <div style={{ maxWidth: '800px', margin: '60px auto', padding: '20px', textAlign: 'center' }}>
              <div className="glass-panel" style={{ padding: '40px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
                  Access Restricted
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>
                  This wallet is an authorized <strong>Organizer</strong>. Player profiles are only available for Player accounts.
                </p>
                <button onClick={() => handleNavigate('dashboard')} className="btn-purple" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                  Go to Organizer Dashboard
                </button>
              </div>
            </div>
          );
        }
        return <ProfilePage onNavigate={handleNavigate} />;

      case 'game_details':
        return <GameDetailsPage tournamentId={selectedTournamentId} onNavigate={handleNavigate} />;

      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };


  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#070a12' }}>
        <Navbar currentView={currentView} onNavigate={handleNavigate} />
        
        {/* Wrong Network Overlay Modal */}
        <WrongNetworkAlert />

        {/* Global Access Denied Popup Modal across all pages */}
        <AccessDeniedModal />

        {/* Optional Signature Pending Banner / Retry if connected but sign was cancelled */}
        {authState.isConnected && !authState.signature && authState.error && !authState.isWrongNetwork && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '10px 20px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} className="text-rose-400" />
              <span>{authState.error}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => signMessage()}
                disabled={authState.isSigning}
                className="btn-primary"
                style={{ padding: '4px 12px', fontSize: '0.78rem' }}
              >
                <RefreshCw size={13} className={authState.isSigning ? 'animate-spin' : ''} />
                {authState.isSigning ? 'Waiting for Approval...' : 'Sign Authentication Message'}
              </button>
              <button
                onClick={() => clearError()}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#94a3b8',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <main style={{ flex: 1 }}>
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </main>

        {/* Clean Minimal Footer */}
        <footer
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(5, 7, 12, 0.95)',
            padding: '20px',
            marginTop: 'auto',
            fontSize: '0.8rem',
            color: '#64748b'
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ color: '#cbd5e1', fontWeight: 600 }}>
              PrivateRank — Privacy-Preserving Gaming Tournament Platform
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f2fe' }}></span>
              <span>Midnight Preprod Testnet</span>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};
