import React, { ReactNode } from 'react';
import { Navbar } from './common/Navbar';
import { WrongNetworkAlert } from './common/WrongNetworkAlert';
import { useWallet } from '../context/WalletContext';
import { Shield, ExternalLink, Cpu } from 'lucide-react';
import { NETWORK_NAME, PREPROD_RPC_URL, PREPROD_CONTRACT_ADDRESS } from '../config/network';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  const { authState } = useWallet();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#040d1a',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Network Alert if user is connected to non-preprod */}
      {authState.isWrongNetwork && <WrongNetworkAlert />}

      {/* Main Top Navigation */}
      <Navbar currentView={currentView} onNavigate={onNavigate} />

      {/* Main Body View */}
      <main style={{ flex: 1, padding: '24px 20px', maxWidth: '1240px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(10, 14, 23, 0.95)',
          padding: '24px 20px',
          marginTop: 'auto'
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '0.85rem',
            color: '#64748b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="#00f2fe" />
            <span>PrivateRank • Zero-Knowledge Esports Verification</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              {NETWORK_NAME}
            </span>
            <a
              href={`https://preprod.midnight.network`}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Midnight Docs <ExternalLink size={12} />
            </a>
            <a
              href="https://privaterank-dapp.vercel.app"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#00f2fe', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Vercel Live <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
