import { useWallet } from '../context/WalletContext';
import { useTournament } from '../context/TournamentContext';
import { zkProver, ProofResult } from '../contracts/zkProver';
import { ContractService } from '../contracts/contractService';
import { MidnightTransactionService } from '../contracts/midnightTransactionService';
import {
  NETWORK_NAME,
  PREPROD_RPC_URL,
  PREPROD_INDEXER_URL,
  PREPROD_PROOF_SERVER_URL,
  PREPROD_CONTRACT_ADDRESS,
  isPreprodNetwork
} from '../config/network';
import { GamingCredentials, TournamentRequirements } from '../types';

/**
 * useMidnight — Unified hook for Midnight Network interaction,
 * 1AM Wallet state, Zero-Knowledge proof generation, and smart contract circuits.
 */
export function useMidnight() {
  const {
    authState,
    activeRole,
    playerProfile,
    connectWallet,
    disconnectWallet,
    switchToPreprod,
    selectRole
  } = useWallet();

  const {
    tournaments,
    applications,
    teams,
    userProofs,
    isLoading,
    error,
    refreshData
  } = useTournament();

  return {
    // 1AM Wallet & Auth State
    wallet: {
      isConnected: authState.isConnected,
      isConnecting: authState.isConnecting,
      address: authState.unshieldedAddress,
      network: authState.network,
      isWrongNetwork: authState.isWrongNetwork,
      activeRole,
      connect: connectWallet,
      disconnect: disconnectWallet,
      switchToPreprod,
      selectRole
    },

    // Midnight Preprod Network Information
    network: {
      name: NETWORK_NAME,
      isPreprod: isPreprodNetwork(authState.network || ''),
      rpcUrl: PREPROD_RPC_URL,
      indexerUrl: PREPROD_INDEXER_URL,
      proofServerUrl: PREPROD_PROOF_SERVER_URL,
      contractAddress: PREPROD_CONTRACT_ADDRESS
    },

    // Player Credentials & Privacy
    credentials: playerProfile?.gamingCredentials,
    playerProfile,

    // Zero-Knowledge Circuit Prover
    zk: {
      prover: zkProver,
      generateEligibilityProof: async (
        creds: GamingCredentials,
        reqs: TournamentRequirements
      ): Promise<ProofResult> => {
        return zkProver.generateEligibilityProof(
          creds,
          reqs,
          playerProfile?.personalInfo,
          authState.unshieldedAddress || undefined
        );
      },
      verifyEligibilityProof: async (
        proof: ProofResult,
        reqs: TournamentRequirements
      ): Promise<boolean> => {
        return zkProver.verifyEligibilityProof(proof, reqs);
      }
    },

    // On-Chain Tournament State & Actions
    tournaments: {
      list: tournaments,
      applications,
      teams,
      userProofs,
      loading: isLoading,
      error,
      refresh: refreshData
    },

    // Direct Services Access
    services: {
      contract: ContractService,
      tx: MidnightTransactionService,
      zk: zkProver
    }
  };
}

export default useMidnight;
