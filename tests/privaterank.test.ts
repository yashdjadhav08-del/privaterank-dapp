import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getContractAddress,
  isContractConfigured,
  createTournamentOnChain,
  closeTournamentOnChain,
  archiveTournamentOnChain,
  getTournamentOnChainState
} from '../src/utils/contract';
import { zkProver, ZkProverService } from '../src/contracts/zkProver';
import { ContractService } from '../src/contracts/contractService';
import { MidnightTransactionService } from '../src/contracts/midnightTransactionService';
import { OneAmConnector } from '../src/wallet/oneAmConnector';
import { AuthService } from '../src/wallet/authService';
import { __setMockDeploymentStatus, PREPROD_CONTRACT_ADDRESS } from '../src/config/network';
import { TournamentRequirements, PlayerCredentials, RankTier } from '../src/types';

describe('PrivateRank — Midnight Network Contract & Circuit Invariants', () => {
  const organizerAddress = 'addr_test1midnight_organizer_alpha';
  const playerAddress = 'addr_test1midnight_player_alpha';

  const mockRequirements: TournamentRequirements = {
    minimumRank: RankTier.DIAMOND,
    minimumScore: 2000,
    minimumWins: 10
  };

  const validCredentials: PlayerCredentials = {
    rank: RankTier.MASTER,
    score: 2500,
    wins: 15,
    losses: 2,
    achievements: ['Champion Tier'],
    gameTitle: 'BGMI',
    verifiedAt: new Date().toISOString()
  };

  const invalidCredentials: PlayerCredentials = {
    rank: RankTier.SILVER,
    score: 1200,
    wins: 4,
    losses: 8,
    achievements: [],
    gameTitle: 'BGMI',
    verifiedAt: new Date().toISOString()
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();

    __setMockDeploymentStatus({
      isDeployed: true,
      contractAddress: 'ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde',
      state: '{}'
    });

    AuthService.selectRole('ORGANIZER');
    MidnightTransactionService.resetProgress();

    const mockApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue(organizerAddress),
      getShieldedAddresses: vi.fn().mockResolvedValue([]),
      signData: vi.fn().mockImplementation(async (data: string, options: { encoding: string }) => {
        return {
          signature: '0x' + Array.from({ length: 64 }, () => 'a').join(''),
          publicKey: '0xpubkey'
        };
      })
    };
    OneAmConnector.setConnectedApi(mockApi as any);
  });

  describe('1. Contract Configuration & Network Target', () => {
    it('should have the canonical Midnight Preprod contract address configured', () => {
      const address = getContractAddress();
      expect(address).toBeDefined();
      expect(address.length).toBe(64);
      expect(isContractConfigured()).toBe(true);
    });

    it('should strictly target Midnight Preprod and not mainnet or evm networks', () => {
      const address = getContractAddress();
      expect(address).not.toMatch(/^0x/); // Not EVM format
      expect(address).toMatch(/^[0-9a-fA-F]{64}$/); // Midnight 32-byte hex hash
    });
  });

  describe('2. Zero-Knowledge Proofs for PrivateRank', () => {
    it('should generate a valid ZK proof when player meets tournament criteria', async () => {
      AuthService.selectRole('PLAYER');

      const proof = await zkProver.generateEligibilityProof(validCredentials, mockRequirements, undefined, playerAddress);
      expect(proof).toBeDefined();
      expect(proof.proofHash).toBeDefined();
      expect(proof.circuit).toBe('joinTournament');
      expect(proof.publicInputs.meetsRank).toBe(true);
      expect(proof.publicInputs.meetsScore).toBe(true);
      expect(proof.publicInputs.meetsWins).toBe(true);

      const isValid = await zkProver.verifyEligibilityProof(proof, mockRequirements);
      expect(isValid).toBe(true);
    });

    it('should reject proof generation when player fails tournament criteria', async () => {
      AuthService.selectRole('PLAYER');

      await expect(
        zkProver.generateEligibilityProof(invalidCredentials, mockRequirements, undefined, playerAddress)
      ).rejects.toThrow();
    });
  });

  describe('3. Contract Interaction Helpers (contract.ts)', () => {
    it('should execute createTournamentOnChain helper successfully', async () => {
      AuthService.selectRole('ORGANIZER');

      const result = await createTournamentOnChain({
        tournamentId: 't-test-privaterank-1',
        name: 'Apex Midnight Cup',
        organizerAddress,
        requirements: mockRequirements
      });

      expect(result).toBeDefined();
      expect(result.tournament).toBeDefined();
      expect(result.tournament.name).toBe('Apex Midnight Cup');
      expect(result.receipt).toBeDefined();
      expect(result.receipt.status).toBe('CONFIRMED');
    });

    it('should validate tournament schedule invariants via ContractService', () => {
      expect(() => {
        ContractService.validateSchedule({
          registrationStart: '2026-10-15T00:00:00Z',
          registrationEnd: '2026-10-10T00:00:00Z',
          tournamentStart: '2026-10-18T00:00:00Z',
          tournamentEnd: '2026-10-20T00:00:00Z'
        });
      }).toThrow('Registration Start must be before Registration End.');
    });

    it('should execute close and archive tournament lifecycle circuits', async () => {
      AuthService.selectRole('ORGANIZER');

      // Create tournament first
      const createRes = await createTournamentOnChain({
        tournamentId: 't-lifecycle-test',
        name: 'Lifecycle Tournament',
        organizerAddress,
        requirements: mockRequirements
      });

      const tournamentId = createRes.tournament.id;

      // Close tournament
      const closeRes = await closeTournamentOnChain(tournamentId, organizerAddress);
      expect(closeRes).toBeDefined();
      expect(closeRes.success).toBe(true);

      // Archive tournament
      const archiveRes = await archiveTournamentOnChain(tournamentId, organizerAddress);
      expect(archiveRes).toBeDefined();
      expect(archiveRes.success).toBe(true);
    });
  });
});
