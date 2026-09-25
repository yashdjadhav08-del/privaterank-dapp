import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { WalletProvider } from './context/WalletContext';
import { TournamentProvider } from './context/TournamentContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <WalletProvider>
        <TournamentProvider>
          <App />
        </TournamentProvider>
      </WalletProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
