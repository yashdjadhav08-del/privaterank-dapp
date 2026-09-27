// 1AM Wallet DApp Connector & Midnight Network Types (Preprod Testnet ONLY)
// Based on @midnight-ntwrk/dapp-connector-api WalletConnectedAPI

export type MidnightNetwork = 'preprod';

export interface ShieldedAddress {
  address: string;
  viewingKey?: string;
}

export interface SignDataOptions {
  encoding: 'hex' | 'base64' | 'text';
  keyType?: 'unshielded' | 'payment' | 'stake';
}

/** @deprecated Use signData(data, options) directly — kept for internal type compatibility */
export interface SignDataPayload {
  data: string;
  options: SignDataOptions;
}

export interface SignDataResult {
  signature: string;
  publicKey?: string;
  algorithm?: string;
}

export interface HistoryEntry {
  txHash: string;
  txStatus: TxStatus;
}

export type TxStatus =
  | { status: 'finalized'; executionStatus: Record<number, 'Success' | 'Failure'> }
  | { status: 'confirmed'; executionStatus: Record<number, 'Success' | 'Failure'> }
  | { status: 'pending' }
  | { status: 'discarded' };

export interface Configuration {
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri?: string;
  substrateNodeUri: string;
  networkId: string;
}

/**
 * Full 1AM Wallet ConnectedAPI based on @midnight-ntwrk/dapp-connector-api.
 * All methods available through the 1AM Wallet extension.
 */
export interface MidnightConnectedAPI {
  getShieldedAddresses(): Promise<string[]>;
  getUnshieldedAddress(): Promise<string>;
  getDustAddress?(): Promise<string>;
  getShieldedBalances?(): Promise<Record<string, bigint>>;
  getDustBalance?(): Promise<bigint>;
  // Full WalletConnectedAPI from @midnight-ntwrk/dapp-connector-api
  getTxHistory?(pageNumber: number, pageSize: number): Promise<HistoryEntry[]>;
  balanceUnsealedTransaction?(tx: string, options?: { payFees?: boolean }): Promise<{ tx: string }>;
  balanceSealedTransaction?(tx: string, options?: { payFees?: boolean }): Promise<{ tx: string }>;
  makeTransfer?(desiredOutputs: unknown[], options?: { payFees?: boolean }): Promise<{ tx: string }>;
  makeIntent?(desiredInputs: unknown[], desiredOutputs: unknown[], options: { intentId: number | 'random'; payFees: boolean }): Promise<{ tx: string }>;
  // Official Midnight DApp Connector API: signData(data: string, options: SignDataOptions)
  signData(data: string, options: SignDataOptions): Promise<{ data: string; signature: string; verifyingKey: string }>;
  // Submit a balanced, sealed transaction to the network
  submitTransaction(tx: string): Promise<void | string | { txHash?: string; id?: string }>;
  getProvingProvider?(keyMaterialProvider: KeyMaterialProvider): Promise<{ check: (serializedPreimage: Uint8Array, keyLocation: string) => Promise<(bigint | undefined)[]>; prove: (serializedPreimage: Uint8Array, keyLocation: string, overwriteBindingInput?: bigint) => Promise<Uint8Array> }>;
  getConfiguration?(): Promise<Configuration>;
  getConnectionStatus?(): Promise<{ status: 'connected'; networkId: string } | { status: 'disconnected' }>;
  getNetwork?(): Promise<string>;
}

export interface KeyMaterialProvider {
  getZKIR(circuitKeyLocation: string): Promise<Uint8Array>;
  getProverKey(circuitKeyLocation: string): Promise<Uint8Array>;
  getVerifierKey(circuitKeyLocation: string): Promise<Uint8Array>;
}

export interface OneAmWalletProvider {
  name: string;
  icon?: string;
  apiVersion: string;
  connect(networkId: MidnightNetwork | string): Promise<MidnightConnectedAPI>;
  isConnected?(): Promise<boolean>;
  getNetwork?(): Promise<string>;
  switchNetwork?(networkId: MidnightNetwork | string): Promise<void>;
}

declare global {
  interface Window {
    midnight?: {
      '1am'?: OneAmWalletProvider;
      [key: string]: unknown;
    };
  }
}

export interface WalletAuthState {
  isConnected: boolean;
  isConnecting: boolean;
  isSigning: boolean;
  network: MidnightNetwork;
  isWrongNetwork: boolean;
  detectedNetwork: string | null;
  unshieldedAddress: string | null;
  shieldedAddress: string | null;
  dustBalance: string;
  signature: string | null;
  isSimulator: boolean;
  error: string | null;
}
