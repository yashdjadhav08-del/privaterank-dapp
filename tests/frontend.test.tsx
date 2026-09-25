import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomePage } from '../src/pages/HomePage';
import { ExplorePage } from '../src/pages/ExplorePage';
import { DashboardPage } from '../src/pages/DashboardPage';
import { Navbar } from '../src/components/common/Navbar';
import { WrongNetworkAlert } from '../src/components/common/WrongNetworkAlert';
import { WalletProvider } from '../src/context/WalletContext';
import { TournamentProvider } from '../src/context/TournamentContext';
import { StatusBadge } from '../src/components/common/StatusBadge';
import { RankBadge } from '../src/components/common/RankBadge';
import { RankTier } from '../src/types';

describe('Clean Game-Focused UI Verification (Real Data & Honest States)', () => {
  it('renders home page with game-focused headline and explore CTA', () => {
    render(
      <WalletProvider>
        <TournamentProvider>
          <HomePage onNavigate={() => {}} />
        </TournamentProvider>
      </WalletProvider>
    );

    expect(screen.getByText(/Privacy-Preserving Gaming Tournaments/i)).toBeInTheDocument();
    expect(screen.getByText(/Available Tournaments/i)).toBeInTheDocument();
  });

  it('renders explore page with category filters and search', () => {
    render(
      <WalletProvider>
        <TournamentProvider>
          <ExplorePage onNavigate={() => {}} />
        </TournamentProvider>
      </WalletProvider>
    );

    expect(screen.getByText(/Explore Games & Tournaments/i)).toBeInTheDocument();
    expect(screen.getByText(/FPS/i)).toBeInTheDocument();
    expect(screen.getByText(/MOBA/i)).toBeInTheDocument();
    expect(screen.getByText(/Battle Royale/i)).toBeInTheDocument();
    expect(screen.getByText(/Sports/i)).toBeInTheDocument();
  });

  it('renders dashboard with connect wallet prompt when disconnected', () => {
    render(
      <WalletProvider>
        <TournamentProvider>
          <DashboardPage onNavigate={() => {}} />
        </TournamentProvider>
      </WalletProvider>
    );

    expect(screen.getByText(/Connect Your Wallet/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect 1AM Wallet/i)).toBeInTheDocument();
  });

  it('renders StatusBadge and RankBadge accurately', () => {
    const { rerender } = render(<StatusBadge status="OPEN" />);
    expect(screen.getByText(/OPEN/i)).toBeInTheDocument();

    rerender(<RankBadge rank={RankTier.DIAMOND} />);
    expect(screen.getByText(/Diamond \(Tier 5\)/i)).toBeInTheDocument();
  });

  it('renders fixed Preprod Testnet indicator in Navbar and no multi-chain options', () => {
    render(
      <WalletProvider>
        <Navbar currentView="home" onNavigate={() => {}} />
      </WalletProvider>
    );

    // Only Preprod Testnet is shown
    expect(screen.getAllByText(/Preprod Testnet/i).length).toBeGreaterThan(0);

    // Verify multi-chain options are completely removed
    expect(screen.queryByText(/Ethereum/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Polygon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sepolia/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mainnet/i)).not.toBeInTheDocument();
  });
});
