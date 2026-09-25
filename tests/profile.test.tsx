import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { ProfileService } from '../src/services/profileService';
import { ProfilePage } from '../src/pages/ProfilePage';
import { WalletProvider, useWallet } from '../src/context/WalletContext';
import { TournamentProvider, useTournament } from '../src/context/TournamentContext';
import { OneAmConnector } from '../src/wallet/oneAmConnector';
import { RankTier } from '../src/types';

const WALLET_A = '0x71C8366420A092679b54538490758BDE353613AC';
const WALLET_B = '0x8888999900001111222233334444555566667777';

describe('PrivateRank User Profile & Gaming Credentials Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('TEST 1: ProfileService creates, validates and persists per-wallet gaming credentials', () => {
    // 1. Initial retrieval creates default profile for WALLET_A
    const profileA = ProfileService.getProfile(WALLET_A);
    expect(profileA.walletAddress.toLowerCase()).toBe(WALLET_A.toLowerCase());
    expect(profileA.anonymousId).toBe('PR-71C8');

    // 2. Save gaming credentials updates for WALLET_A
    profileA.gamingCredentials.rank = RankTier.DIAMOND;
    profileA.gamingCredentials.score = 2450;
    profileA.gamingCredentials.wins = 180;
    profileA.gamingCredentials.losses = 40;
    profileA.gamingCredentials.gameTitle = 'Midnight Apex Rivals';

    ProfileService.saveProfile(profileA);

    // 3. Reload from storage
    const loadedA = ProfileService.getProfile(WALLET_A);
    expect(loadedA.gamingCredentials.rank).toBe(RankTier.DIAMOND);
    expect(loadedA.gamingCredentials.score).toBe(2450);
    expect(loadedA.gamingCredentials.wins).toBe(180);
    expect(loadedA.gamingCredentials.losses).toBe(40);
    expect(loadedA.gamingCredentials.gameTitle).toBe('Midnight Apex Rivals');
  });

  it('TEST 2 & 4: Wallet Switching isolation — Wallet B does not see Wallet A gaming credentials', () => {
    // Save profile for Wallet A
    const profileA = ProfileService.getProfile(WALLET_A);
    profileA.gamingCredentials.rank = RankTier.GRANDMASTER;
    profileA.gamingCredentials.score = 3500;
    ProfileService.saveProfile(profileA);

    // Save profile for Wallet B
    const profileB = ProfileService.getProfile(WALLET_B);
    profileB.gamingCredentials.rank = RankTier.GOLD;
    profileB.gamingCredentials.score = 1200;
    ProfileService.saveProfile(profileB);

    // Verify isolation
    const loadedA = ProfileService.getProfile(WALLET_A);
    const loadedB = ProfileService.getProfile(WALLET_B);

    expect(loadedA.gamingCredentials.score).toBe(3500);
    expect(loadedB.gamingCredentials.score).toBe(1200);
    expect(loadedB.gamingCredentials.score).not.toBe(3500);
  });

  it('TEST 3 & 5: Validation prevents invalid inputs (negative score, bad rank, negative wins)', () => {
    const invalidProfile = {
      walletAddress: WALLET_A,
      anonymousId: 'PR-71C8',
      gamingCredentials: {
        rank: 99 as any,
        score: -50,
        wins: -5,
        losses: 0,
        achievements: [],
        gameTitle: 'Esports',
        verifiedAt: new Date().toISOString()
      }
    };

    const validation = ProfileService.validateProfile(invalidProfile);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.rank).toBeDefined();
    expect(validation.errors.score).toBeDefined();
    expect(validation.errors.wins).toBeDefined();
  });

  it('TEST 6: Disconnecting wallet clears profile from active context state', async () => {
    vi.spyOn(OneAmConnector, 'connectRealWallet').mockResolvedValue({
      api: {} as any,
      unshieldedAddress: WALLET_A,
      shieldedAddress: '0xshielded',
      dustBalance: '50',
      detectedNetwork: 'Midnight Preprod Testnet',
      isPreprod: true
    });

    const TestComponent = () => {
      const { authState, playerProfile, connectWallet, disconnectWallet } = useWallet();
      return (
        <div>
          <button onClick={() => connectWallet()}>Connect</button>
          <button onClick={() => disconnectWallet()}>Disconnect</button>
          <div data-testid="wallet-status">{authState.isConnected ? 'Connected' : 'Disconnected'}</div>
          <div data-testid="profile-name">{playerProfile ? playerProfile.anonymousId : 'No Profile'}</div>
        </div>
      );
    };

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    );

    expect(screen.getByTestId('profile-name').textContent).toBe('No Profile');

    // Connect
    await act(async () => {
      fireEvent.click(screen.getByText('Connect'));
    });

    expect(screen.getByTestId('wallet-status').textContent).toBe('Connected');
    expect(screen.getByTestId('profile-name').textContent).toContain('PR-');

    // Disconnect
    await act(async () => {
      fireEvent.click(screen.getByText('Disconnect'));
    });

    expect(screen.getByTestId('wallet-status').textContent).toBe('Disconnected');
    expect(screen.getByTestId('profile-name').textContent).toBe('No Profile');
  });

  it('TEST 7: ProfilePage edit form allows user to edit and save updated gaming credentials', async () => {
    vi.spyOn(OneAmConnector, 'connectRealWallet').mockResolvedValue({
      api: {} as any,
      unshieldedAddress: WALLET_A,
      shieldedAddress: '0xshielded',
      dustBalance: '50',
      detectedNetwork: 'Midnight Preprod Testnet',
      isPreprod: true
    });

    const Wrapper = () => {
      const { connectWallet } = useWallet();
      return (
        <div>
          <button onClick={() => connectWallet()}>Connect Wallet</button>
          <ProfilePage onNavigate={() => {}} />
        </div>
      );
    };

    render(
      <WalletProvider>
        <TournamentProvider>
          <Wrapper />
        </TournamentProvider>
      </WalletProvider>
    );

    // 1. Connect
    await act(async () => {
      fireEvent.click(screen.getByText('Connect Wallet'));
    });

    expect(screen.getByText(/MY PROFILE/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Gaming Credentials/i })).toBeInTheDocument();

    // 2. Click Edit Profile
    const editBtn = screen.getByRole('button', { name: /Edit Gaming Credentials/i });
    await act(async () => {
      fireEvent.click(editBtn);
    });

    // 3. Fill in gaming credential fields
    const scoreInput = screen.getByPlaceholderText(/e.g. 2450/i);
    const winsInput = screen.getByPlaceholderText(/e.g. 180/i);
    const lossesInput = screen.getByPlaceholderText(/e.g. 40/i);

    fireEvent.change(scoreInput, { target: { value: '2450' } });
    fireEvent.change(winsInput, { target: { value: '180' } });
    fireEvent.change(lossesInput, { target: { value: '40' } });

    // 4. Save
    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // Wait for save toast
    await waitFor(() => {
      expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
    });

    // Verify view mode values
    expect(screen.getByText(/2450 pts/i)).toBeInTheDocument();
    expect(screen.getByText(/180 Wins/i)).toBeInTheDocument();
  });
});
