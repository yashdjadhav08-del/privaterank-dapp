// 1AM Wallet DApp Connector & Midnight Network Types (Preprod Testnet ONLY)

export type MidnightNetwork = 'preprod';

export interface ShieldedAddress {
  address: string;
  viewingKey?: string;
}

export interface SignDataPayload {
  data: string;
  options: {
    encoding: 'hex' | 'base64' | 'text';
  };
}

export interface SignDataResult {
  signature: string;
  publicKey?: string;
  algorithm?: string;
}

export interface MidnightConnectedAPI {
  getShieldedAddresses(): Promise<string[]>;
  getUnshieldedAddress(): Promise<string>;
  getDustAddress?(): Promise<string>;
  getShieldedBalances?(): Promise<Record<string, bigint>>;
  getDustBalance?(): Promise<bigint>;
  signData(payloadOrAddress: unknown, maybePayload?: unknown): Promise<SignDataResult | string>;
  submitTx?(txPayload: unknown): Promise<{ txHash: string }>;
  getNetwork?(): Promise<string>;
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
