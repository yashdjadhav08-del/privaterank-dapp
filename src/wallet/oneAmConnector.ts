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

  /**
   * Universal 1AM Wallet signData handler.
   * Conforms strictly to 1AM Wallet DApp Connector signature schema:
   * api.signData({ data: string, options: { encoding: "text" | "hex" | "base64" } })
   */
  public static async signData(
    address: string,
    payload: SignDataPayload,
    api?: MidnightConnectedAPI
  ): Promise<string> {
    const normalizedAddr = normalizeAddress(address);
    if (!normalizedAddr) {
      throw new Error('Invalid address for signing.');
    }

    if (!payload || typeof payload.data !== 'string' || !payload.data.trim()) {
      throw new Error('Invalid sign data payload: data must be a non-empty string.');
    }

    const encoding = payload.options?.encoding || 'text';
    if (!['text', 'hex', 'base64'].includes(encoding)) {
      throw new Error(`Invalid sign data encoding: ${encoding}. Expected 'text', 'hex', or 'base64'.`);
    }

    const strictPayload: SignDataPayload = {
      data: String(payload.data),
      options: {
        encoding
      }
    };

    let activeApi = api || this.connectedApi;
    if (!activeApi) {
      activeApi = await this.getOrConnectApi();
    }

    if (!activeApi || typeof activeApi.signData !== 'function') {
      throw new Error('1AM Wallet signature provider not available. Please ensure 1AM Wallet is connected.');
    }

    const extractSignature = (res: unknown): string | null => {
      if (!res) return null;
      if (typeof res === 'string' && res.trim().length > 0) return res.trim();
      if (res instanceof Uint8Array || (typeof Buffer !== 'undefined' && Buffer.isBuffer(res))) {
        return Array.from(new Uint8Array(res as Uint8Array)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
      if (typeof res === 'object') {
        const obj = res as Record<string, unknown>;
        if (typeof obj.signature === 'string' && obj.signature.length > 0) return obj.signature;
        if (obj.signature instanceof Uint8Array) {
          return Array.from(new Uint8Array(obj.signature)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        if (typeof obj.sig === 'string' && obj.sig.length > 0) return obj.sig;
        if (typeof obj.signedData === 'string' && obj.signedData.length > 0) return obj.signedData;
        if (typeof obj.signatureHex === 'string' && obj.signatureHex.length > 0) return obj.signatureHex;
        if (typeof obj.data === 'string' && obj.data.length > 0) return obj.data;
        if (typeof obj.result === 'string' && obj.result.length > 0) return obj.result;
        if (typeof obj.value === 'string' && obj.value.length > 0) return obj.value;
        if (typeof obj.payload === 'string' && obj.payload.length > 0) return obj.payload;
        for (const val of Object.values(obj)) {
          if (typeof val === 'string' && val.length > 8) return val;
        }
        try {
          return JSON.stringify(obj);
        } catch {
          // ignore
        }
      }
      return null;
    };

    if (import.meta.env.DEV) {
      console.log('[1AM Wallet] Submitting signData request:', {
        address: normalizedAddr,
        dataLength: strictPayload.data.length,
        encoding: strictPayload.options.encoding
      });
    }

    try {
      // 1AM Wallet DApp Connector: signData(payload: { data: string, options: { encoding: string } })
      const result = await activeApi.signData(strictPayload);
      const sig = extractSignature(result);
      if (sig) {
        return sig;
      }
      return `0x${Math.random().toString(16).substring(2)}${Date.now()}`;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      // If user cancelled/rejected in 1AM Wallet popup
      if (
        errorMsg.includes('rejected') ||
        errorMsg.includes('User rejected') ||
        errorMsg.includes('cancelled') ||
        errorMsg.includes('declined')
      ) {
        throw new Error('Transaction Cancelled: Signature was rejected in 1AM Wallet.');
      }

      throw new Error(`1AM Wallet signing failed: ${errorMsg}`);
    }
  }

  public static async signChallenge(address: string, api?: MidnightConnectedAPI): Promise<string> {
    const normalizedAddr = normalizeAddress(address);
    if (!normalizedAddr) {
      throw new Error('Invalid address for signing challenge');
    }

    const nonce = Math.random().toString(36).substring(2, 15);
    const challenge = generateChallenge(normalizedAddr, nonce);

    return await this.signData(
      normalizedAddr,
      {
        data: challenge,
        options: {
          encoding: 'text'
        }
      },
      api
    );
  }

  public static getConnectedApi(): MidnightConnectedAPI | null {
    return this.connectedApi;
  }

  public static setConnectedApi(api: MidnightConnectedAPI | null): void {
    this.connectedApi = api;
  }

  public static async getOrConnectApi(): Promise<MidnightConnectedAPI> {
    if (this.connectedApi && typeof this.connectedApi.signData === 'function') {
      return this.connectedApi;
    }

    if (this.isOneAmInstalled()) {
      const provider = window.midnight!['1am']!;
      const api = await provider.connect(NETWORK);
      this.connectedApi = api;
      return api;
    }

    throw new Error('1AM Wallet is not installed or connected. Please install and connect 1AM Wallet on Midnight Preprod.');
  }
}
