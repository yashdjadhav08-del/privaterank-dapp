// Centralized Network Configuration — Midnight Preprod Testnet ONLY

// Read optional Vite environment variables or use official Preprod endpoints
const env = (((import.meta as unknown) as { env?: Record<string, string> })?.env || {}) as Record<string, string>;

const envNetwork = (env.VITE_NETWORK || env.NETWORK || 'preprod').toLowerCase();
if (envNetwork !== 'preprod') {
  console.warn(`[Network Config] Overriding configured network '${envNetwork}' to 'preprod' (Preprod Testnet ONLY is supported).`);
}

export const NETWORK = 'preprod' as const;
export type SupportedNetwork = typeof NETWORK;

export const NETWORK_NAME = 'Midnight Preprod Testnet';

export interface PreprodNetworkConfig {
  networkId: 'preprod';
  name: string;
  rpcUrl: string;
  indexerUrl: string;
  proofServerUrl: string;
  contractAddress: string;
}

export const PREPROD_CONFIG: PreprodNetworkConfig = {
  networkId: 'preprod',
  name: 'Midnight Preprod Testnet',
  rpcUrl: env.VITE_PREPROD_RPC_URL || env.PREPROD_RPC_URL || 'https://rpc.preprod.midnight.network',
  indexerUrl: env.VITE_PREPROD_INDEXER_URL || env.PREPROD_INDEXER_URL || 'https://indexer.preprod.midnight.network/api/v1/graphql',
  proofServerUrl: env.VITE_PREPROD_PROOF_SERVER_URL || env.PREPROD_PROOF_SERVER_URL || 'http://127.0.0.1:6300',
  contractAddress: env.VITE_PREPROD_CONTRACT_ADDRESS || env.PREPROD_CONTRACT_ADDRESS || '0200preprod_privaterank_midnight_contract_v1'
};

/**
 * Validates if the given network identifier matches Midnight Preprod Testnet.
 */
export function isPreprodNetwork(networkNameOrId?: string | null): boolean {
  if (!networkNameOrId) return false;
  const normalized = networkNameOrId.trim().toLowerCase();
  return (
    normalized === 'preprod' ||
    normalized === 'midnight preprod' ||
    normalized === 'midnight preprod testnet' ||
    normalized === 'midnight-preprod'
  );
}

/**
 * Retrieves the Preprod configuration or throws an explicit configuration error.
 */
export function getPreprodConfig(): PreprodNetworkConfig {
  if (!PREPROD_CONFIG.contractAddress) {
    throw new Error('Explicit Configuration Error: Missing required Midnight Preprod Testnet contract address.');
  }
  if (!PREPROD_CONFIG.rpcUrl) {
    throw new Error('Explicit Configuration Error: Missing required Midnight Preprod Testnet RPC URL.');
  }
  return PREPROD_CONFIG;
}
