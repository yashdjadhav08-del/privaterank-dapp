/**
 * contract.ts — Contract interaction helpers for Midnight Network Preprod.
 * Bridges application views and components to Midnight Compact contract circuits.
 */

import { ContractService } from '../contracts/contractService';
import { MidnightTransactionService } from '../contracts/midnightTransactionService';
import { ZkProverService, zkProver, ProofResult } from '../contracts/zkProver';
import {
  PREPROD_CONTRACT_ADDRESS,
  PREPROD_RPC_URL,
  PREPROD_INDEXER_URL,
  PREPROD_PROOF_SERVER_URL,
  DEFAULT_CANONICAL_CONTRACT_ADDRESS,
  getCanonicalContractAddress,
  verifyContractDeployedOnPreprod
} from '../config/network';
import { Tournament, TournamentRequirements, PlayerCredentials } from '../types';

/**
 * Returns the active Midnight Preprod contract address.
 */
export function getContractAddress(): string {
  return getCanonicalContractAddress() || PREPROD_CONTRACT_ADDRESS || DEFAULT_CANONICAL_CONTRACT_ADDRESS || 'ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde';
}

/**
 * Checks if the contract address is properly configured for Preprod.
 */
export function isContractConfigured(): boolean {
  const addr = getContractAddress();
  return Boolean(addr && addr.length === 64);
}

/**
 * Executes on-chain tournament creation circuit via MidnightTransactionService.
 */
export async function createTournamentOnChain(params: {
  tournamentId: string;
  name: string;
  organizerAddress: string;
  requirements: TournamentRequirements;
  deadline?: string;
}) {
  return MidnightTransactionService.createTournament({
    name: params.name,
    description: 'On-chain tournament created on Midnight Preprod',
    gameTitle: 'Competitive Esports',
    organizerAddress: params.organizerAddress,
    organizerName: 'Tournament Organizer',
    tournamentType: 'SOLO',
    teamSize: 1,
    maxTeams: 0,
    requirements: params.requirements,
    prizePool: '1,000 DUST',
    schedule: {
      registrationStart: new Date().toISOString(),
      registrationEnd: params.deadline || new Date(Date.now() + 86400000 * 3).toISOString(),
      tournamentStart: new Date(Date.now() + 86400000 * 4).toISOString(),
      tournamentEnd: new Date(Date.now() + 86400000 * 5).toISOString()
    },
    location: {
      locationType: 'ONLINE',
      onlinePlatform: 'Discord',
      serverRegion: 'Global'
    }
  });
}

/**
 * Executes on-chain join tournament circuit with Zero-Knowledge proof verification.
 */
export async function joinTournamentOnChain(params: {
  tournamentId: string;
  playerKey: string;
  proof: ProofResult | any;
  anonymousPlayerId?: string;
  credentials?: any;
}) {
  const creds = params.credentials || {
    rank: 5,
    score: 2000,
    wins: 10,
    losses: 0,
    achievements: ['Verified Player'],
    gameTitle: 'Competitive Esports',
    verifiedAt: new Date().toISOString()
  };

  return MidnightTransactionService.submitApplication({
    tournamentId: params.tournamentId,
    playerWalletAddress: params.playerKey,
    anonymousPlayerId: params.anonymousPlayerId || 'PR-ANON',
    gamingCredentials: creds,
    proof: params.proof
  });
}

/**
 * Executes on-chain close tournament circuit.
 */
export async function closeTournamentOnChain(tournamentId: string, organizerAddress: string) {
  const result = await MidnightTransactionService.closeTournamentOnChain(tournamentId, organizerAddress);
  return {
    success: result?.receipt?.status === 'CONFIRMED',
    tournament: result?.tournament,
    receipt: result?.receipt
  };
}

/**
 * Executes on-chain archive tournament circuit.
 */
export async function archiveTournamentOnChain(tournamentId: string, organizerAddress: string) {
  const result = await MidnightTransactionService.archiveTournamentOnChain(tournamentId, organizerAddress);
  return {
    success: result?.receipt?.status === 'CONFIRMED',
    tournament: result?.tournament,
    receipt: result?.receipt
  };
}

/**
 * Fetches the verified on-chain tournament state from Midnight Indexer / Contract Service.
 */
export async function getTournamentOnChainState(tournamentId: string) {
  return ContractService.getTournamentById(tournamentId);
}

/**
 * Verifies if a contract is deployed and reachable on Midnight Preprod network.
 */
export async function verifyContractReachable(contractAddress = getContractAddress()) {
  return verifyContractDeployedOnPreprod(contractAddress);
}

export default {
  getContractAddress,
  isContractConfigured,
  createTournamentOnChain,
  joinTournamentOnChain,
  closeTournamentOnChain,
  archiveTournamentOnChain,
  getTournamentOnChainState,
  verifyContractReachable
};
