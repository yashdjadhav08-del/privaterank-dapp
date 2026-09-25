import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MidnightTransactionService } from '../src/contracts/midnightTransactionService';
import { ContractService } from '../src/contracts/contractService';
import { AuthService } from '../src/wallet/authService';
import { OneAmConnector } from '../src/wallet/oneAmConnector';
import { RankTier, TournamentLocation, TournamentSchedule } from '../src/types';
import { ZkProverService } from '../src/contracts/zkProver';

describe('MidnightTransactionService — 1AM Wallet & Midnight Preprod On-Chain Lifecycle', () => {
  const organizerAddress = 'addr_test1midnight_organizer_alpha';
  const player1Address = 'addr_test1midnight_player_beta';
  const player2Address = 'addr_test1midnight_player_gamma';

  const defaultSchedule: TournamentSchedule = {
    registrationStart: new Date(Date.now() - 3600000).toISOString(),
    registrationEnd: new Date(Date.now() + 86400000 * 5).toISOString(),
    tournamentStart: new Date(Date.now() + 86400000 * 7).toISOString(),
    tournamentEnd: new Date(Date.now() + 86400000 * 8).toISOString()
  };

  const defaultLocation: TournamentLocation = {
    locationType: 'ONLINE',
    onlinePlatform: 'Discord / BGMI',
    serverRegion: 'Asia'
  };

  beforeEach(() => {
    localStorage.clear();
    AuthService.registerOrganizer(organizerAddress, 'Alpha Org', 'Midnight Esports');
    MidnightTransactionService.resetProgress();

    const mockApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue(organizerAddress),
      getShieldedAddresses: vi.fn().mockResolvedValue([]),
      signData: vi.fn().mockImplementation(async (payload: unknown) => {
        return {
          signature: '0x' + Array.from({ length: 64 }, () => 'a').join(''),
          publicKey: '0xpubkey'
        };
      })
    };
    OneAmConnector.setConnectedApi(mockApi as any);
  });

  it('should successfully prepare, sign, broadcast and confirm a CREATE_TOURNAMENT (TEAM) transaction', async () => {
    const stepsObserved: string[] = [];
    const unsubscribe = MidnightTransactionService.subscribeProgress(progress => {
      stepsObserved.push(progress.status);
    });

    const result = await MidnightTransactionService.createTournament({
      name: 'Midnight BGMI Squad Cup',
      description: 'Official on-chain squad championship',
      gameTitle: 'BGMI',
      organizerAddress,
      organizerName: 'Alpha Org',
      tournamentType: 'TEAM',
      teamSize: 4,
      maxTeams: 16,
      requirements: {
        minimumRank: RankTier.PLATINUM,
        minimumScore: 1500,
        minimumWins: 10
      },
      prizePool: '10,000 DUST',
      schedule: defaultSchedule,
      location: defaultLocation
    });

    unsubscribe();

    expect(result.tournament).toBeDefined();
    expect(result.tournament.name).toBe('Midnight BGMI Squad Cup');
    expect(result.tournament.tournamentType).toBe('TEAM');
    expect(result.tournament.teamSize).toBe(4);
    expect(result.tournament.maxTeams).toBe(16);
    expect(result.tournament.maxParticipants).toBe(64); // 4 * 16
    expect(result.receipt).toBeDefined();
    expect(result.receipt.txHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(result.receipt.status).toBe('CONFIRMED');
    expect(result.receipt.action).toBe('CREATE_TOURNAMENT');
    expect(result.receipt.network).toBe('Midnight Preprod Testnet');
    expect(result.receipt.blockHeight).toBeGreaterThan(1800000);

    expect(stepsObserved).toContain('PREPARING');
    expect(stepsObserved).toContain('AWAITING_WALLET_APPROVAL');
    expect(stepsObserved).toContain('SUBMITTING');
    expect(stepsObserved).toContain('CONFIRMING');
    expect(stepsObserved).toContain('CONFIRMED');
  });

  it('should execute CREATE_TEAM and JOIN_TEAM on-chain via 1AM Wallet', async () => {
    const tourney = ContractService.createTournament({
      name: 'Midnight Duo Cup',
      description: 'Duo matches on Midnight',
      gameTitle: 'Free Fire',
      organizerAddress,
      organizerName: 'Alpha Org',
      tournamentType: 'TEAM',
      teamSize: 2,
      maxTeams: 8,
      requirements: {
        minimumRank: RankTier.GOLD,
        minimumScore: 1000,
        minimumWins: 5
      },
      prizePool: '5,000 DUST',
      schedule: defaultSchedule,
      location: defaultLocation
    });

    // 1. Player 1 creates team
    const createTeamRes = await MidnightTransactionService.createTeam({
      tournamentId: tourney.id,
      captainWalletAddress: player1Address,
      captainAnonymousId: 'PR-P101',
      teamName: 'Midnight Tigers',
      gamingCredentials: {
        rank: RankTier.PLATINUM,
        score: 1800,
        wins: 20,
        losses: 4,
        achievements: ['Grand Champion'],
        gameTitle: 'Free Fire',
        verifiedAt: new Date().toISOString()
      }
    });

    expect(createTeamRes.team.name).toBe('Midnight Tigers');
    expect(createTeamRes.team.status).toBe('RECRUITING');
    expect(createTeamRes.receipt.action).toBe('CREATE_TEAM');
    expect(createTeamRes.receipt.status).toBe('CONFIRMED');
    expect(createTeamRes.receipt.txHash).toMatch(/^0x[a-f0-9]{64}$/);

    // 2. Player 2 joins team
    const joinTeamRes = await MidnightTransactionService.joinTeam({
      tournamentId: tourney.id,
      teamId: createTeamRes.team.id,
      playerWalletAddress: player2Address,
      anonymousPlayerId: 'PR-P202',
      gamingCredentials: {
        rank: RankTier.GOLD,
        score: 1200,
        wins: 10,
        losses: 3,
        achievements: [],
        gameTitle: 'Free Fire',
        verifiedAt: new Date().toISOString()
      }
    });

    expect(joinTeamRes.team.members.length).toBe(2);
    expect(joinTeamRes.team.status).toBe('READY');
    expect(joinTeamRes.receipt.action).toBe('JOIN_TEAM');
    expect(joinTeamRes.receipt.status).toBe('CONFIRMED');

    // 3. Captain finalizes team
    const finalizeRes = await MidnightTransactionService.finalizeTeam({
      tournamentId: tourney.id,
      teamId: createTeamRes.team.id,
      captainWalletAddress: player1Address
    });

    expect(finalizeRes.team.status).toBe('FINALIZED');
    expect(finalizeRes.receipt.action).toBe('FINALIZE_TEAM');
    expect(finalizeRes.receipt.status).toBe('CONFIRMED');
  });

  it('should handle wallet rejection cleanly without committing state', async () => {
    const mockRejectApi = {
      signData: vi.fn().mockRejectedValue(new Error('User rejected the transaction signature.'))
    };
    vi.spyOn(OneAmConnector, 'getConnectedApi').mockReturnValue(mockRejectApi as any);

    await expect(
      MidnightTransactionService.createTournament({
        name: 'Rejected Cup',
        description: 'Should fail',
        gameTitle: 'Valorant',
        organizerAddress,
        organizerName: 'Alpha Org',
        tournamentType: 'SOLO',
        requirements: {
          minimumRank: RankTier.GOLD,
          minimumScore: 1000,
          minimumWins: 0
        },
        prizePool: '1,000 DUST',
        schedule: defaultSchedule,
        location: defaultLocation
      })
    ).rejects.toThrow('Transaction Cancelled: You rejected the transaction in 1AM Wallet.');

    const progress = MidnightTransactionService.getCurrentProgress();
    expect(progress?.status).toBe('REJECTED');

    const list = ContractService.listTournaments();
    vi.restoreAllMocks();
  });

  it('should abort immediately and NOT create tournament if wallet signing fails', async () => {
    const mockFailingApi = {
      signData: vi.fn().mockRejectedValue(new Error('Sign Data failed: Invalid sign data payload'))
    };
    OneAmConnector.setConnectedApi(mockFailingApi as any);

    await expect(
      MidnightTransactionService.createTournament({
        name: 'Failed Payload Cup',
        description: 'Should not exist',
        gameTitle: 'BGMI',
        organizerAddress,
        organizerName: 'Alpha Org',
        tournamentType: 'SOLO',
        requirements: {
          minimumRank: RankTier.GOLD,
          minimumScore: 1000,
          minimumWins: 0
        },
        prizePool: '1,000 DUST',
        schedule: defaultSchedule,
        location: defaultLocation
      })
    ).rejects.toThrow(/1AM Wallet signing failed/);

    const progress = MidnightTransactionService.getCurrentProgress();
    expect(progress?.status).toBe('FAILED');

    const list = ContractService.listTournaments();
    expect(list.find(t => t.name === 'Failed Payload Cup')).toBeUndefined();
  });

  it('should submit solo application with ZK proof and 1AM wallet signature', async () => {
    const tourney = ContractService.createTournament({
      name: 'Midnight Apex Solo',
      description: 'Solo bracket with ZK rank verification',
      gameTitle: 'Apex Legends',
      organizerAddress,
      organizerName: 'Alpha Org',
      tournamentType: 'SOLO',
      maxParticipants: 32,
      requirements: {
        minimumRank: RankTier.GOLD,
        minimumScore: 1000,
        minimumWins: 5
      },
      prizePool: '5,000 DUST',
      schedule: defaultSchedule,
      location: defaultLocation
    });

    const proof = await ZkProverService.generateEligibilityProof({
      tournamentId: tourney.id,
      requirements: tourney.requirements,
      gamingCredentials: {
        rank: RankTier.PLATINUM,
        score: 2200,
        wins: 15,
        losses: 3,
        achievements: ['Champion'],
        gameTitle: 'Apex Legends',
        verifiedAt: new Date().toISOString()
      },
      personalInfo: {
        fullName: 'Player Zero',
        email: 'zero@example.com',
        phone: '1234567890',
        country: 'US',
        dateOfBirth: '2000-01-01'
      },
      walletAddress: player1Address
    });

    const result = await MidnightTransactionService.submitApplication({
      tournamentId: tourney.id,
      playerWalletAddress: player1Address,
      anonymousPlayerId: 'PR-A1B2',
      gamingCredentials: {
        rank: RankTier.PLATINUM,
        score: 2200,
        wins: 15,
        losses: 3,
        achievements: ['Champion'],
        gameTitle: 'Apex Legends',
        verifiedAt: new Date().toISOString()
      },
      proof
    });

    expect(result.application).toBeDefined();
    expect(result.application.status).toBe('PENDING_REVIEW');
    expect(result.receipt.action).toBe('SUBMIT_APPLICATION');
    expect(result.receipt.status).toBe('CONFIRMED');
  });

  it('should execute DELETE_TOURNAMENT on-chain with 1AM Wallet signing and confirmation', async () => {
    // 1. Create a tournament whose end date has passed (COMPLETED)
    const completedSchedule: TournamentSchedule = {
      registrationStart: new Date(Date.now() - 86400000 * 10).toISOString(),
      registrationEnd: new Date(Date.now() - 86400000 * 8).toISOString(),
      tournamentStart: new Date(Date.now() - 86400000 * 5).toISOString(),
      tournamentEnd: new Date(Date.now() - 86400000 * 2).toISOString()
    };

    const tourney = ContractService.createTournament({
      name: 'Completed Rocket League Cup',
      description: 'Finished tournament',
      gameTitle: 'Rocket League',
      organizerAddress,
      organizerName: 'Alpha Org',
      tournamentType: 'SOLO',
      requirements: {
        minimumRank: RankTier.GOLD,
        minimumScore: 1000,
        minimumWins: 5
      },
      prizePool: '3,000 DUST',
      schedule: completedSchedule,
      location: defaultLocation
    });

    const stepsObserved: string[] = [];
    const unsubscribe = MidnightTransactionService.subscribeProgress(p => {
      stepsObserved.push(p.status);
    });

    const result = await MidnightTransactionService.deleteTournament(tourney.id, organizerAddress);
    unsubscribe();

    expect(result.tournament).toBeDefined();
    expect(result.tournament.status).toBe('ARCHIVED');
    expect(result.receipt).toBeDefined();
    expect(result.receipt.action).toBe('DELETE_TOURNAMENT');
    expect(result.receipt.status).toBe('CONFIRMED');
    expect(result.receipt.txHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(result.receipt.network).toBe('Midnight Preprod Testnet');

    expect(stepsObserved).toContain('PREPARING');
    expect(stepsObserved).toContain('AWAITING_WALLET_APPROVAL');
    expect(stepsObserved).toContain('SUBMITTING');
    expect(stepsObserved).toContain('CONFIRMING');
    expect(stepsObserved).toContain('CONFIRMED');
  });
});
