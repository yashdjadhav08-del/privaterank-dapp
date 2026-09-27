import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthService } from '../src/wallet/authService';
import { ContractService } from '../src/contracts/contractService';
import { DESIGNATED_ORGANIZER_WALLETS, getRoleForWallet, bindWalletRole } from '../src/config/organizers';
import { WalletProvider, useWallet } from '../src/context/WalletContext';
import { TournamentSchedule, TournamentLocation, RankTier } from '../src/types';

describe('PrivateRank Permanent Wallet-to-Role Binding & Access Control', () => {
  const organizerWalletA = 'mn_addr_preprod1aaaa1111222233334444555566667777888899990000aaaa1111222233334444';
  const playerWalletB = 'mn_addr_preprod1bbbb1111222233334444555566667777888899990000bbbb1111222233334444';
  const designatedOrganizerWallet = 'mn_addr_preprod1c35njcpvrtjdpjlghvcfnj7wda6d7a672armpjkm98hfwfxc2qksqsvlst';

  const defaultSchedule: TournamentSchedule = {
    registrationStart: new Date().toISOString(),
    registrationEnd: new Date(Date.now() + 86400000 * 5).toISOString(),
    tournamentStart: new Date(Date.now() + 86400000 * 7).toISOString(),
    tournamentEnd: new Date(Date.now() + 86400000 * 8).toISOString()
  };

  const defaultLocation: TournamentLocation = {
    locationType: 'ONLINE',
    onlinePlatform: 'Midnight Network Preprod'
  };

  beforeEach(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // noop
    }
    AuthService.clearRole();
    vi.restoreAllMocks();
  });

  it('TEST 1: New wallet → role selection is required (unbound state)', () => {
    const newWallet = 'mn_addr_preprod1newwallet_unbound_9999999999999999999999999999999999';
    expect(AuthService.getRoleForWallet(newWallet)).toBeNull();
    expect(AuthService.isWalletBound(newWallet)).toBe(false);
  });

  it('TEST 2: Select ORGANIZER → wallet permanently resolves to ORGANIZER', () => {
    const bound = AuthService.bindRole(organizerWalletA, 'ORGANIZER');
    expect(bound).toBe('ORGANIZER');
    expect(AuthService.getRoleForWallet(organizerWalletA)).toBe('ORGANIZER');
    expect(AuthService.isOrganizer(organizerWalletA)).toBe(true);
    expect(AuthService.isPlayer(organizerWalletA)).toBe(false);
    expect(AuthService.getActiveRole(organizerWalletA)).toBe('ORGANIZER');
  });

  it('TEST 3: Reconnect same wallet → automatically resolves to ORGANIZER', () => {
    // 1. Initial bind
    AuthService.bindRole(organizerWalletA, 'ORGANIZER');
    // 2. Disconnect
    AuthService.clearRole();
    // 3. Reconnect & read role
    expect(AuthService.getRoleForWallet(organizerWalletA)).toBe('ORGANIZER');
    expect(AuthService.getActiveRole(organizerWalletA)).toBe('ORGANIZER');
    expect(AuthService.isOrganizer(organizerWalletA)).toBe(true);
  });

  it('TEST 4: Same wallet cannot become PLAYER (role immutability)', () => {
    // 1. Bind to ORGANIZER
    AuthService.bindRole(organizerWalletA, 'ORGANIZER');
    expect(AuthService.getRoleForWallet(organizerWalletA)).toBe('ORGANIZER');

    // 2. Attempt to bind or switch to PLAYER
    const secondBindResult = AuthService.bindRole(organizerWalletA, 'PLAYER');
    expect(secondBindResult).toBe('ORGANIZER'); // Rejects overwrite, returns existing binding
    expect(AuthService.getRoleForWallet(organizerWalletA)).toBe('ORGANIZER');
    expect(AuthService.isOrganizer(organizerWalletA)).toBe(true);
    expect(AuthService.isPlayer(organizerWalletA)).toBe(false);
  });

  it('TEST 5: New wallet can select PLAYER', () => {
    const bound = AuthService.bindRole(playerWalletB, 'PLAYER');
    expect(bound).toBe('PLAYER');
    expect(AuthService.getRoleForWallet(playerWalletB)).toBe('PLAYER');
    expect(AuthService.isPlayer(playerWalletB)).toBe(true);
    expect(AuthService.isOrganizer(playerWalletB)).toBe(false);
    expect(AuthService.getActiveRole(playerWalletB)).toBe('PLAYER');
  });

  it('TEST 6: Reconnect Player wallet → automatically resolves to PLAYER', () => {
    AuthService.bindRole(playerWalletB, 'PLAYER');
    AuthService.clearRole();

    expect(AuthService.getRoleForWallet(playerWalletB)).toBe('PLAYER');
    expect(AuthService.getActiveRole(playerWalletB)).toBe('PLAYER');
    expect(AuthService.isPlayer(playerWalletB)).toBe(true);
  });

  it('TEST 7: Player wallet cannot become ORGANIZER (role immutability)', () => {
    AuthService.bindRole(playerWalletB, 'PLAYER');
    expect(AuthService.getRoleForWallet(playerWalletB)).toBe('PLAYER');

    const secondBindResult = AuthService.bindRole(playerWalletB, 'ORGANIZER');
    expect(secondBindResult).toBe('PLAYER'); // Rejects overwrite, returns existing binding
    expect(AuthService.getRoleForWallet(playerWalletB)).toBe('PLAYER');
    expect(AuthService.isPlayer(playerWalletB)).toBe(true);
    expect(AuthService.isOrganizer(playerWalletB)).toBe(false);
  });

  it('TEST 8: Switching Wallet A → Wallet B preserves independent roles', () => {
    AuthService.bindRole(organizerWalletA, 'ORGANIZER');
    AuthService.bindRole(playerWalletB, 'PLAYER');

    // Wallet A session
    AuthService.selectRole('ORGANIZER', organizerWalletA);
    expect(AuthService.getActiveRole(organizerWalletA)).toBe('ORGANIZER');

    // Disconnect & Switch to Wallet B
    AuthService.clearRole();
    AuthService.selectRole('PLAYER', playerWalletB);
    expect(AuthService.getActiveRole(playerWalletB)).toBe('PLAYER');
    expect(AuthService.isPlayer(playerWalletB)).toBe(true);
    expect(AuthService.isOrganizer(playerWalletB)).toBe(false);
  });

  it('TEST 9: Switching back to Wallet A restores ORGANIZER', () => {
    AuthService.bindRole(organizerWalletA, 'ORGANIZER');
    AuthService.bindRole(playerWalletB, 'PLAYER');

    // Currently on Wallet B
    AuthService.selectRole('PLAYER', playerWalletB);
    expect(AuthService.getActiveRole(playerWalletB)).toBe('PLAYER');

    // Switch back to Wallet A
    AuthService.clearRole();
    AuthService.selectRole('ORGANIZER', organizerWalletA);
    expect(AuthService.getActiveRole(organizerWalletA)).toBe('ORGANIZER');
    expect(AuthService.isOrganizer(organizerWalletA)).toBe(true);
    expect(AuthService.isPlayer(organizerWalletA)).toBe(false);
  });

  it('TEST 10: Current designated wallet is permanently pre-seeded as ORGANIZER', () => {
    expect(DESIGNATED_ORGANIZER_WALLETS).toContain(designatedOrganizerWallet);
    expect(AuthService.getRoleForWallet(designatedOrganizerWallet)).toBe('ORGANIZER');
    expect(AuthService.isOrganizer(designatedOrganizerWallet)).toBe(true);
    expect(AuthService.isPlayer(designatedOrganizerWallet)).toBe(false);
    expect(AuthService.getActiveRole(designatedOrganizerWallet)).toBe('ORGANIZER');

    // Case-insensitivity verification
    const upperCaseAddr = designatedOrganizerWallet.toUpperCase();
    expect(AuthService.getRoleForWallet(upperCaseAddr)).toBe('ORGANIZER');
    expect(AuthService.isOrganizer(upperCaseAddr)).toBe(true);
  });

  it('TEST 11: Organizer can access Create Tournament', () => {
    AuthService.bindRole(organizerWalletA, 'ORGANIZER');
    AuthService.selectRole('ORGANIZER', organizerWalletA);

    const tourney = ContractService.createTournament({
      name: 'Midnight Valorant Cup',
      description: 'Championship for verified organizers',
      gameTitle: 'Valorant',
      organizerAddress: organizerWalletA,
      organizerName: 'Alpha Org',
      tournamentType: 'SOLO',
      requirements: { minimumRank: RankTier.GOLD, minimumScore: 1000, minimumWins: 5 },
      prizePool: '5,000 DUST',
      schedule: defaultSchedule,
      location: defaultLocation
    });

    expect(tourney).toBeDefined();
    expect(tourney.name).toBe('Midnight Valorant Cup');
    expect(tourney.organizerAddress).toBe(organizerWalletA);
  });

  it('TEST 12: Player cannot access Create Tournament', () => {
    AuthService.bindRole(playerWalletB, 'PLAYER');
    AuthService.selectRole('PLAYER', playerWalletB);

    expect(() => {
      ContractService.createTournament({
        name: 'Illegal Tournament',
        description: 'Should fail because caller is PLAYER',
        gameTitle: 'Valorant',
        organizerAddress: playerWalletB,
        organizerName: 'Player Trying to Organize',
        tournamentType: 'SOLO',
        requirements: { minimumRank: RankTier.GOLD, minimumScore: 1000, minimumWins: 5 },
        prizePool: '1,000 DUST',
        schedule: defaultSchedule,
        location: defaultLocation
      });
    }).toThrow(/Access Denied/);
  });
});
