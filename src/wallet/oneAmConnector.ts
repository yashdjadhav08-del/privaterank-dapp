import { MidnightNetwork, MidnightConnectedAPI, SignDataPayload, SignDataResult } from './types';
import { generateChallenge, normalizeAddress } from '../utils/crypto';
import { NETWORK, isPreprodNetwork } from '../config/network';

export interface ConnectWalletResult {
  api: MidnightConnectedAPI;
  unshieldedAddress: string;
  shieldedAddress: string;
  dustBalance: string;
  detectedNetwork: string;
  isPreprod: boolean;
}

// Fast timeout helper so sub-calls do not block wallet connection
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))
  ]).catch(() => fallback);
}

export class OneAmConnector {
  private static connectedApi: MidnightConnectedAPI | null = null;

  public static isOneAmInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.midnight && window.midnight['1am']);
  }

  public static async connectRealWallet(): Promise<ConnectWalletResult> {
    if (!this.isOneAmInstalled()) {
      throw new Error('1AM Wallet extension is not installed. Please install 1AM Wallet from the Chrome Web Store to connect.');
    }

    const provider = window.midnight!['1am']!;
    
    // 1. Connect to 1AM Wallet provider for Midnight Preprod
    const api = await provider.connect(NETWORK);
    this.connectedApi = api;

    // 2. Fetch network, addresses, and balances in parallel with fast timeouts
    const [networkResult, unshieldedResult, shieldedResult, dustResult] = await Promise.allSettled([
      // Network detection
      (async () => {
        if (typeof api.getNetwork === 'function') {
          return await api.getNetwork();
        }
        if (typeof provider.getNetwork === 'function') {
          return await provider.getNetwork();
        }
        return 'preprod';
      })(),

      // Unshielded address
      withTimeout(
        (async () => {
          if (typeof api.getUnshieldedAddress === 'function') {
            const raw = await api.getUnshieldedAddress();
            return normalizeAddress(raw);
          }
          return '';
        })(),
        3000,
        ''
      ),

      // Shielded addresses
      withTimeout(
        (async () => {
          if (typeof api.getShieldedAddresses === 'function') {
            const list = await api.getShieldedAddresses();
            if (Array.isArray(list) && list.length > 0) {
              return normalizeAddress(list[0]);
            }
          }
          return '';
        })(),
        3000,
        ''
      ),

      // Dust balance
      withTimeout(
        (async () => {
          if (typeof api.getDustBalance === 'function') {
            const bal = await api.getDustBalance();
            return bal ? bal.toString() : '0';
          }
          return '0';
        })(),
        2500,
        '0'
      )
    ]);

    const rawDetectedNetwork = networkResult.status === 'fulfilled' ? networkResult.value : 'preprod';
    const detectedNetwork = typeof rawDetectedNetwork === 'string' ? rawDetectedNetwork : 'preprod';
    const isPreprod = isPreprodNetwork(detectedNetwork);

    let unshieldedAddress = unshieldedResult.status === 'fulfilled' ? unshieldedResult.value : '';
    const shieldedAddress = shieldedResult.status === 'fulfilled' ? shieldedResult.value : '';
    const dustBalance = dustResult.status === 'fulfilled' ? dustResult.value : '0';

    // If unshielded address is empty (e.g. shielded-only account), use shielded address as identifier
    if (!unshieldedAddress && shieldedAddress) {
      unshieldedAddress = shieldedAddress;
    }

    if (!unshieldedAddress) {
      try {
        if (typeof api.getUnshieldedAddress === 'function') {
          const direct = await api.getUnshieldedAddress();
          unshieldedAddress = normalizeAddress(direct);
        }
      } catch {
        // ignore
      }
    }

    return {
      api,
      unshieldedAddress: unshieldedAddress || '0xConnectedAccount',
      shieldedAddress,
      dustBalance,
      detectedNetwork,
      isPreprod
    };
  }

  public static async switchToPreprod(): Promise<boolean> {
    if (!this.isOneAmInstalled()) {
      throw new Error('1AM Wallet is not installed.');
    }

    const provider = window.midnight!['1am']!;

    if (typeof provider.switchNetwork === 'function') {
      await provider.switchNetwork(NETWORK);
      return true;
    }

    // Re-request connect with preprod
    await provider.connect(NETWORK);
    return true;
  }

  public static async signChallenge(address: string, api?: MidnightConnectedAPI): Promise<string> {
    const normalizedAddr = normalizeAddress(address);
    if (!normalizedAddr) {
      throw new Error('Invalid address for signing challenge');
    }

    const nonce = Math.random().toString(36).substring(2, 15);
    const challenge = generateChallenge(normalizedAddr, nonce);

    const activeApi = api || this.connectedApi;
    if (!activeApi || typeof activeApi.signData !== 'function') {
      throw new Error('1AM Wallet signature provider not available. Please ensure wallet is connected.');
    }

    // 1AM Wallet signData payload schema:
    // Requires: { data: string, options: { encoding: "text" | "hex" | "base64" } }
    const signPayload: SignDataPayload = {
      data: challenge,
      options: {
        encoding: 'text'
      }
    };

    const extractSignature = (res: unknown): string | null => {
      if (!res) return null;
      if (typeof res === 'string' && res.length > 0) return res;
      if (typeof res === 'object') {
        const obj = res as Record<string, unknown>;
        if (typeof obj.signature === 'string') return obj.signature;
        if (typeof obj.sig === 'string') return obj.sig;
        if (typeof obj.data === 'string') return obj.data;
      }
      return null;
    };

    try {
      // 1AM Wallet standard call: api.signData(payload)
      const result = await activeApi.signData(signPayload);
      const sig = extractSignature(result);
      if (sig) return sig;
      throw new Error('Signature response was empty or invalid.');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (
        errorMsg.includes('rejected') ||
        errorMsg.includes('User rejected') ||
        errorMsg.includes('cancelled') ||
        errorMsg.includes('declined')
      ) {
        throw new Error('Signature request was rejected in 1AM Wallet.');
      }

      // If the specific provider implementation required (address, payload) instead of (payload)
      if (errorMsg.includes('requires') || errorMsg.includes('Invalid sign data payload')) {
        try {
          const fallbackResult = await activeApi.signData(normalizedAddr, signPayload);
          const fallbackSig = extractSignature(fallbackResult);
          if (fallbackSig) return fallbackSig;
        } catch {
          // preserve original error
        }
      }

      throw new Error(`1AM Wallet signing failed: ${errorMsg}`);
    }
  }

  public static getConnectedApi(): MidnightConnectedAPI | null {
    return this.connectedApi;
  }
}
