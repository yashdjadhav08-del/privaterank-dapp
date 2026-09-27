import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MidnightTransactionService } from '../src/contracts/midnightTransactionService';
import { ContractService } from '../src/contracts/contractService';
import { AuthService } from '../src/wallet/authService';
import { OneAmConnector } from '../src/wallet/oneAmConnector';
import { RankTier, TournamentLocation, TournamentSchedule, TransactionProgress } from '../src/types';
import { __setMockDeploymentStatus, __setMockTxVerification } from '../src/config/network';

describe('Tournament Creation State Machine & Deserialization Failure Handling', () => {
  const organizerAddress = 'mn_addr_preprod1c35njcpvrtjdpjlghvcfnj7wda6d7a672armpjkm98hfwfxc2qksqsvlst';

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
    vi.restoreAllMocks();
    localStorage.clear();
    __setMockTxVerification(null);
    __setMockDeploymentStatus({
      isDeployed: true,
      // Synthetic PrivateRank contract address — not the a4f5e2b8 exploit-bounty contract
      contractAddress: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      state: '{}'
    });
    AuthService.selectRole("ORGANIZER");
    MidnightTransactionService.resetProgress();
    (window as any).__TEST_FAST_POLL__ = true;
  });

  it('MUST transition to FAILED and NEVER mark CONFIRMED when 1AM Wallet rejects submission with deserialization error', async () => {
    const stepsObserved: TransactionProgress[] = [];
    const unsubscribe = MidnightTransactionService.subscribeProgress(progress => {
      stepsObserved.push({ ...progress });
    });

    const mockApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue(organizerAddress),
      getShieldedAddresses: vi.fn().mockResolvedValue([]),
      balanceUnsealedTransaction: vi.fn().mockResolvedValue({
        tx: 'midnight:transaction[v9](signature[v1],proof,pedersen-12345):balancedHex'
      }),
      // Simulate exact 1AM Wallet error observed by user:
      submitTransaction: vi.fn().mockRejectedValue(
        new Error("Unable to deserialize Transaction. expected header tag 'midnight:transaction[v9](signature[v1],proof,pedersen-...)'")
      )
    };
    OneAmConnector.setConnectedApi(mockApi as any);

    const initialTournaments = ContractService.getTournaments();
    expect(initialTournaments.length).toBe(0);

    // Act & Assert rejection
    await expect(
      MidnightTransactionService.createTournament({
        name: 'Failed BGMI Cup',
        description: 'Should fail immediately',
        gameTitle: 'BGMI',
        organizerAddress,
        organizerName: 'Alpha Org',
        tournamentType: 'SOLO',
        requirements: {
          minimumRank: RankTier.GOLD,
          minimumScore: 1000,
          minimumWins: 5
        },
        prizePool: '1,000 DUST',
        schedule: defaultSchedule,
        location: defaultLocation
      })
    ).rejects.toThrow(/1AM Wallet submission failed/);

    unsubscribe();

    const statusList = stepsObserved.map(s => s.status);
    expect(statusList).toContain('PREPARING');
    expect(statusList).toContain('AWAITING_WALLET_APPROVAL');
    expect(statusList).toContain('SUBMITTING');
    expect(statusList).toContain('FAILED');
    expect(statusList).not.toContain('CONFIRMED');

    // UI must NEVER have stored the tournament in ContractService or localStorage
    const tournamentsAfterFailure = ContractService.getTournaments();
    expect(tournamentsAfterFailure.length).toBe(0);

    // Current progress must be FAILED with the exact wallet error
    const finalProgress = MidnightTransactionService.getCurrentProgress();
    expect(finalProgress?.status).toBe('FAILED');
    expect(finalProgress?.error).toContain("Unable to deserialize Transaction");
  });

  it('MUST transition to FAILED if transaction is broadcast but cannot be verified by Preprod indexer', async () => {
    const stepsObserved: TransactionProgress[] = [];
    const unsubscribe = MidnightTransactionService.subscribeProgress(progress => {
      stepsObserved.push({ ...progress });
    });

    const mockApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue(organizerAddress),
      getShieldedAddresses: vi.fn().mockResolvedValue([]),
      balanceUnsealedTransaction: vi.fn().mockResolvedValue({
        tx: 'midnight:transaction[v9](signature[v1],proof,pedersen-12345):balancedHex'
      }),
      submitTransaction: vi.fn().mockResolvedValue('0x14262b9026803f77399621e202227e9c5222fa2057c16cf836bf72580f6a9894')
    };
    OneAmConnector.setConnectedApi(mockApi as any);

    // Mock indexer returning false (tx does not exist on Preprod indexer)
    __setMockTxVerification(() => ({ exists: false }));

    await expect(
      MidnightTransactionService.createTournament({
        name: 'Unindexed Tournament',
        description: 'Should fail block inclusion timeout',
        gameTitle: 'Valorant',
        organizerAddress,
        organizerName: 'Alpha Org',
        tournamentType: 'SOLO',
        requirements: {
          minimumRank: RankTier.DIAMOND,
          minimumScore: 2000,
          minimumWins: 15
        },
        prizePool: '5,000 DUST',
        schedule: defaultSchedule,
        location: defaultLocation
      })
    ).rejects.toThrow(/not included in a block/);

    unsubscribe();

    const statusList = stepsObserved.map(s => s.status);
    expect(statusList).toContain('FAILED');
    expect(statusList).not.toContain('CONFIRMED');
    expect(ContractService.getTournaments().length).toBe(0);
  });

  it('MUST use real indexer block height and real tx hash ONLY after indexer verification succeeds', async () => {
    const stepsObserved: TransactionProgress[] = [];
    const unsubscribe = MidnightTransactionService.subscribeProgress(progress => {
      stepsObserved.push({ ...progress });
    });

    const realTxHash = '0x88882b9026803f77399621e202227e9c5222fa2057c16cf836bf72580f6a8888';
    const realIndexerBlockHeight = 2716750;

    const mockApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue(organizerAddress),
      getShieldedAddresses: vi.fn().mockResolvedValue([]),
      balanceUnsealedTransaction: vi.fn().mockResolvedValue({
        tx: 'midnight:transaction[v9](signature[v1],proof,pedersen-12345):balancedHex'
      }),
      submitTransaction: vi.fn().mockResolvedValue(realTxHash)
    };
    OneAmConnector.setConnectedApi(mockApi as any);

    // Mock indexer confirming transaction
    __setMockTxVerification((hash) => ({
      exists: true,
      blockHeight: realIndexerBlockHeight,
      blockHash: '0xreal_block_hash_preprod'
    }));

    const result = await MidnightTransactionService.createTournament({
      name: 'Real Confirmed Tournament',
      description: 'Confirmed on Preprod indexer',
      gameTitle: 'BGMI',
      organizerAddress,
      organizerName: 'Alpha Org',
      tournamentType: 'SOLO',
      requirements: {
        minimumRank: RankTier.GOLD,
        minimumScore: 1000,
        minimumWins: 5
      },
      prizePool: '2,000 DUST',
      schedule: defaultSchedule,
      location: defaultLocation
    });

    unsubscribe();

    // Verify state machine progression:
    // PREPARE_TX -> 1AM_APPROVAL -> BROADCAST -> BLOCK_INCLUSION -> INDEXER_VERIFICATION -> CONFIRMED
    const statusList = stepsObserved.map(s => s.status);
    expect(statusList).toContain('PREPARING');
    expect(statusList).toContain('AWAITING_WALLET_APPROVAL');
    expect(statusList).toContain('SUBMITTING');
    expect(statusList).toContain('CONFIRMING');
    expect(statusList).toContain('INDEXER_VERIFICATION');
    expect(statusList).toContain('CONFIRMED');

    // Receipt must contain REAL indexer block height, NOT a timestamp
    expect(result.receipt.blockHeight).toBe(realIndexerBlockHeight);
    expect(result.receipt.blockHeight).not.toBe(1790416336);
    expect(result.receipt.txHash).toBe(realTxHash);
    expect(result.receipt.status).toBe('CONFIRMED');

    // Only now is tournament stored
    expect(ContractService.getTournaments().length).toBe(1);
    expect(ContractService.getTournaments()[0].name).toBe('Real Confirmed Tournament');
  });
});
