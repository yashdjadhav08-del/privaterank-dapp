import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AuthService } from '../src/wallet/authService';
import { ContractService } from '../src/contracts/contractService';
import { ZkProverService } from '../src/contracts/zkProver';
import { AccessDenied } from '../src/components/common/AccessDenied';
import { WalletProvider, useWallet } from '../src/context/WalletContext';
import { OneAmConnector } from '../src/wallet/oneAmConnector';
import { RankTier } from '../src/types';

const PLAYER_WALLET = '0x71C8366420A092679b54538490758BDE353613AC';
const ORGANIZER_WALLET_A = '0x892aF014bB5C3d49B4567890123456789abcdef0';
const ORGANIZER_WALLET_B = '0x1A4b8E94c5C6d7E8F0123456789abcdef0123456';

describe('PrivateRank Strict Role Separation — Organizer vs Player', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('TEST 1: Strict Role Detection & Authorization allowlist verification', () => {
    // Normal player wallet
    expect(AuthService.isOrganizerAuthorized(PLAYER_WALLET)).toBe(false);
    expect(AuthService.isPlayer(PLAYER_WALLET)).toBe(true);
    expect(AuthService.getUserRole(PLAYER_WALLET)).toBe('PLAYER');

    // Default registered organizer wallet
    expect(AuthService.isOrganizerAuthorized(ORGANIZER_WALLET_A)).toBe(true);
    expect(AuthService.isPlayer(ORGANIZER_WALLET_A)).toBe(false);
    expect(AuthService.getUserRole(ORGANIZER_WALLET_A)).toBe('ORGANIZER');

    // Unknown/unconnected wallet
    expect(AuthService.getUserRole(null)).toBe('UNKNOWN');
    expect(AuthService.getUserRole(undefined)).toBe('UNKNOWN');
  });

  it('TEST 2: Player wallet attempting organizer actions throws Access Denied', () => {
    expect(() => {
      ContractService.createTournament({
        name: 'Unauthorized Championship',
        description: 'Hacked tournament',
        gameTitle: 'Valorant',
        organizerAddress: PLAYER_WALLET,
        organizerName: 'Player Trying to Hack',
        requirements: {
          minimumRank: RankTier.DIAMOND,
          minimumScore: 2000,
          minimumWins: 10
        },
        prizePool: '$10,000',
        maxParticipants: 32,
        applicationDeadline: new Date(Date.now() + 86400000).toISOString(),
        startDate: new Date(Date.now() + 86400000 * 2).toISOString()
      });
    }).toThrow(/Access Denied: Caller address is not an authorized organizer/i);
  });

  it('TEST 3: Organizer wallet attempting player actions is strictly rejected', async () => {
    const tourney = ContractService.createTournament({
      name: 'Midnight Pro League',
      description: 'Official tournament',
      gameTitle: 'Valorant',
      organizerAddress: ORGANIZER_WALLET_A,
      organizerName: 'Midnight Esports League',
      tournamentType: 'TEAM',
      teamSize: 4,
      maxTeams: 16,
      requirements: {
        minimumRank: RankTier.GOLD,
        minimumScore: 1000,
        minimumWins: 5
      },
      prizePool: '5,000 DUST'
    });

    // 1. Organizer attempts to create a team as player -> Rejected
    expect(() => {
      ContractService.createTeam({
        tournamentId: tourney.id,
        captainWalletAddress: ORGANIZER_WALLET_A,
        captainAnonymousId: 'PR-ORG1',
        teamName: 'Organizer Team',
        gamingCredentials: {
          rank: RankTier.PLATINUM,
          score: 1500,
          wins: 10,
          losses: 2,
          achievements: [],
          gameTitle: 'Valorant',
          verifiedAt: new Date().toISOString()
        }
      });
    }).toThrow(/Access Restricted: Organizer wallets are not permitted to participate as players or join teams/i);

    // 2. Organizer attempts to join a team -> Rejected
    expect(() => {
      ContractService.joinTeam({
        tournamentId: tourney.id,
        teamId: 'team-dummy',
        playerWalletAddress: ORGANIZER_WALLET_A,
        anonymousPlayerId: 'PR-ORG1',
        gamingCredentials: {
          rank: RankTier.PLATINUM,
          score: 1500,
          wins: 10,
          losses: 2,
          achievements: [],
          gameTitle: 'Valorant',
          verifiedAt: new Date().toISOString()
        }
      });
    }).toThrow(/Access Restricted: Organizer wallets are not permitted to participate as players or join teams/i);

    // 3. Organizer attempts to generate player eligibility proof -> Rejected
    await expect(
      ZkProverService.generateEligibilityProof({
        tournamentId: tourney.id,
        requirements: tourney.requirements,
        gamingCredentials: {
          rank: RankTier.PLATINUM,
          score: 1500,
          wins: 10,
          losses: 2,
          achievements: [],
          gameTitle: 'Valorant',
          verifiedAt: new Date().toISOString()
        },
        personalInfo: {
          fullName: 'Organizer Person',
          email: 'org@example.com',
          phone: '1234567890',
          country: 'US',
          dateOfBirth: '1990-01-01'
        },
        walletAddress: ORGANIZER_WALLET_A
      })
    ).rejects.toThrow(/Access Restricted: Organizer wallets cannot generate player eligibility proofs/i);
  });

  it('TEST 4: Authorized Organizer wallet creates and manages tournament successfully', () => {
    const tournament = ContractService.createTournament({
      name: 'Midnight Apex Legends Open',
      description: 'Official tournament',
      gameTitle: 'Apex Legends',
      organizerAddress: ORGANIZER_WALLET_A,
      organizerName: 'Midnight Esports League',
      requirements: {
        minimumRank: RankTier.PLATINUM,
        minimumScore: 1500,
        minimumWins: 5
      },
      prizePool: '$5,000',
      maxParticipants: 64,
      applicationDeadline: new Date(Date.now() + 86400000).toISOString(),
      startDate: new Date(Date.now() + 86400000 * 2).toISOString()
    });

    expect(tournament).toBeDefined();
    expect(tournament.organizerAddress).toBe(ORGANIZER_WALLET_A);
    expect(tournament.status).toBe('OPEN');

    // Organizer A can publish/close their tournament
    const closed = ContractService.closeTournament(tournament.id, ORGANIZER_WALLET_A);
    expect(closed.status).toBe('CLOSED');
  });

  it('TEST 5: Organizer B cannot close or manage Organizer A tournament (Ownership Invariant)', () => {
    const tournament = ContractService.createTournament({
      name: 'Organizer A League',
      description: 'Owned by Organizer A',
      gameTitle: 'Valorant',
      organizerAddress: ORGANIZER_WALLET_A,
      organizerName: 'Midnight Esports League',
      requirements: {
        minimumRank: RankTier.GOLD,
        minimumScore: 1000,
        minimumWins: 0
      },
      prizePool: '$2,500',
      maxParticipants: 16,
      applicationDeadline: new Date(Date.now() + 86400000).toISOString(),
      startDate: new Date(Date.now() + 86400000 * 2).toISOString()
    });

    // Organizer B attempts to close Organizer A tournament -> Rejected
    expect(() => {
      ContractService.closeTournament(tournament.id, ORGANIZER_WALLET_B);
    }).toThrow(/Unauthorized: Only tournament creator can close this tournament/i);
  });

  it('TEST 6: Wallet Switching from Organizer to Player updates role immediately', () => {
    // 1. Organizer connected
    expect(AuthService.isOrganizerAuthorized(ORGANIZER_WALLET_A)).toBe(true);
    expect(AuthService.getUserRole(ORGANIZER_WALLET_A)).toBe('ORGANIZER');

    // 2. User switches account to player in 1AM wallet
    expect(AuthService.isOrganizerAuthorized(PLAYER_WALLET)).toBe(false);
    expect(AuthService.getUserRole(PLAYER_WALLET)).toBe('PLAYER');
  });

  it('TEST 7: Dynamic registration and revocation of organizers', () => {
    const dynamicAddress = '0x9999888877776666555544443333222211110000';
    expect(AuthService.isOrganizerAuthorized(dynamicAddress)).toBe(false);

    // Register
    AuthService.registerOrganizer(dynamicAddress, 'New Esports Org', 'Tournament Series');
    expect(AuthService.isOrganizerAuthorized(dynamicAddress)).toBe(true);
    expect(AuthService.getUserRole(dynamicAddress)).toBe('ORGANIZER');

    // Revoke
    AuthService.revokeOrganizer(dynamicAddress);
    expect(AuthService.isOrganizerAuthorized(dynamicAddress)).toBe(false);
    expect(AuthService.getUserRole(dynamicAddress)).toBe('PLAYER');
  });

  it('TEST 8: AccessDenied component renders clear error message for unauthorized organizer access', () => {
    const handleBack = vi.fn();
    render(<AccessDenied connectedAddress={PLAYER_WALLET} onBackToUserPortal={handleBack} />);

    expect(screen.getByText('ACCESS DENIED')).toBeInTheDocument();
    expect(screen.getByText(/Organizer access is restricted to authorized wallets/i)).toBeInTheDocument();
    expect(screen.getByText(PLAYER_WALLET)).toBeInTheDocument();
    expect(screen.getByText(/This wallet does not have Organizer permissions/i)).toBeInTheDocument();

    const returnBtn = screen.getByRole('button', { name: /Return to User Portal/i });
    fireEvent.click(returnBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
