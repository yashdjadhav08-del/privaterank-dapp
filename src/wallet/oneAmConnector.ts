import { MidnightNetwork, MidnightConnectedAPI, SignDataPayload, SignDataResult, OneAmWalletProvider } from './types';
import { generateChallenge, normalizeAddress, safeAddressCompare } from '../utils/crypto';
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

  public static getOneAmProvider(): OneAmWalletProvider | null {
    if (typeof window === 'undefined') return null;
    const midnight = (window as unknown as { midnight?: Record<string, unknown> }).midnight;
    if (!midnight) return null;
    if (midnight['1am']) return midnight['1am'] as OneAmWalletProvider;
    if (midnight['oneam']) return midnight['oneam'] as OneAmWalletProvider;
    // Check if any key under midnight exposes a connect method
    for (const val of Object.values(midnight)) {
      if (val && typeof val === 'object' && typeof (val as Record<string, unknown>).connect === 'function') {
        return val as OneAmWalletProvider;
      }
    }
    return null;
  }

  public static isOneAmInstalled(): boolean {
    return !!this.getOneAmProvider();
  }

  public static async connectRealWallet(): Promise<ConnectWalletResult> {
    const provider = this.getOneAmProvider();
    if (!provider) {
      throw new Error('1AM Wallet extension is not detected. Please ensure 1AM Wallet is installed and enabled in your browser extensions.');
    }

    // 1. Connect to 1AM Wallet provider with 15s timeout
    let api: MidnightConnectedAPI | null = this.connectedApi;
    if (!api) {
      const connectPromise = (async () => {
        try {
          return await provider.connect(NETWORK);
        } catch {
          // If connect(network) fails or rejects argument, try connect()
          return await (provider as unknown as { connect: () => Promise<MidnightConnectedAPI> }).connect();
        }
      })();

      api = await Promise.race([
        connectPromise,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Connection timed out. Please check your browser toolbar and click the 1AM Wallet extension icon to approve the connection.')),
            15000
          )
        )
      ]);
    }

    if (!api) {
      throw new Error('1AM Wallet connection failed to initialize API.');
    }
    const nonNullApi: MidnightConnectedAPI = api;
    this.connectedApi = nonNullApi;

    // 2. Fetch network, addresses, and balances cleanly without leaving abandoned streams
    let detectedNetwork = 'preprod';
    try {
      if (typeof nonNullApi.getNetwork === 'function') {
        detectedNetwork = (await nonNullApi.getNetwork()) || 'preprod';
      } else if (typeof provider.getNetwork === 'function') {
        detectedNetwork = (await provider.getNetwork()) || 'preprod';
      }
    } catch {
      detectedNetwork = 'preprod';
    }

    let unshieldedAddress = '';
    try {
      if (typeof nonNullApi.getUnshieldedAddress === 'function') {
        const raw = await nonNullApi.getUnshieldedAddress();
        console.log('[1AM Connector] getUnshieldedAddress raw:', raw);
        unshieldedAddress = normalizeAddress(raw);
      }
    } catch (err) {
      console.warn('[1AM Connector] getUnshieldedAddress warning:', err);
    }

    let shieldedAddress = '';
    try {
      if (typeof nonNullApi.getShieldedAddresses === 'function') {
        const raw = await nonNullApi.getShieldedAddresses();
        console.log('[1AM Connector] getShieldedAddresses raw:', raw);
        shieldedAddress = normalizeAddress(raw);
      }
    } catch (err) {
      console.warn('[1AM Connector] getShieldedAddresses warning:', err);
    }

    // Check fallback address methods on DApp connector or provider
    if (!unshieldedAddress && !shieldedAddress) {
      try {
        if (typeof (nonNullApi as { getDustAddress?: () => Promise<unknown> }).getDustAddress === 'function') {
          const dustRaw = await (nonNullApi as { getDustAddress: () => Promise<unknown> }).getDustAddress();
          console.log('[1AM Connector] getDustAddress raw:', dustRaw);
          const candidate = normalizeAddress(dustRaw);
          if (candidate) {
            unshieldedAddress = candidate;
            shieldedAddress = candidate;
          }
        }
      } catch {
        // dust address fallback
      }
    }

    if (!unshieldedAddress && !shieldedAddress) {
      const p = provider as unknown as Record<string, unknown>;
      const provCandidate = normalizeAddress(
        p.selectedAddress ||
        p.address ||
        (Array.isArray(p.accounts) ? p.accounts[0] : p.accounts)
      );
      if (provCandidate) {
        console.log('[1AM Connector] provider property address:', provCandidate);
        unshieldedAddress = provCandidate;
        shieldedAddress = provCandidate;
      }
    }

    // Cross-assign if one is missing
    if (!unshieldedAddress && shieldedAddress) {
      unshieldedAddress = shieldedAddress;
    }
    if (!shieldedAddress && unshieldedAddress) {
      shieldedAddress = unshieldedAddress;
    }

    // STRICT VALIDATION: Under NO circumstances use placeholder '0xConnectedAccount'
    if (!unshieldedAddress) {
      throw new Error(
        '1AM Wallet connection error: No active Midnight address returned by 1AM Wallet. Please ensure your 1AM Wallet is unlocked and on Midnight Preprod.'
      );
    }

    let dustBalance = '0';
    try {
      if (typeof nonNullApi.getDustBalance === 'function') {
        const bal = await nonNullApi.getDustBalance();
        if (bal != null) {
          if (typeof bal === 'object') {
            const b = bal as { balance?: unknown; cap?: unknown };
            if (b.balance !== undefined) {
              dustBalance = String(b.balance);
            } else if (b.cap !== undefined) {
              dustBalance = String(b.cap);
            } else {
              dustBalance = String(bal);
            }
          } else {
            dustBalance = String(bal);
          }
        }
      }
    } catch {
      dustBalance = '0';
    }

    const isPreprod = isPreprodNetwork(detectedNetwork);

    // Development diagnostic logging
    console.log('[1AM Connector] Wallet Connection:', {
      connectorConnected: true,
      actualMidnightWalletAddress: unshieldedAddress,
      shieldedAddress,
      network: detectedNetwork,
      isPreprod
    });

    return {
      api: nonNullApi,
      unshieldedAddress,
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

    const provider = this.getOneAmProvider();
    if (!provider) {
      throw new Error('1AM Wallet provider is not available.');
    }

    if (typeof provider.switchNetwork === 'function') {
      await provider.switchNetwork(NETWORK);
      return true;
    }

    // Re-request connect with preprod
    await provider.connect(NETWORK);
    return true;
  }

  /**
   * Signs a string of data via the 1AM Wallet using the official Midnight DApp Connector API.
   *
   * Official API signature (from midnightntwrk/midnight-dapp-connector-api):
   *   signData(data: string, options: { encoding: 'text' | 'hex' | 'base64' }): Promise<Signature>
   *
   * TWO separate arguments — NOT a single wrapped object.
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

    // Validate the data is a real non-empty string
    const dataStr = payload?.data != null ? String(payload.data) : '';
    if (!dataStr || !dataStr.trim()) {
      throw new Error('Sign data payload.data must be a non-empty string.');
    }

    const encoding = (payload?.options?.encoding as string) || 'text';
    if (!['text', 'hex', 'base64'].includes(encoding)) {
      throw new Error(`Invalid encoding "${encoding}". Must be text, hex, or base64.`);
    }

    let activeApi = api || this.connectedApi;
    if (!activeApi) {
      activeApi = await this.getOrConnectApi();
    }

    if (!activeApi || typeof activeApi.signData !== 'function') {
      throw new Error('1AM Wallet signature provider not available. Please ensure 1AM Wallet is connected.');
    }

    // Helper: extract a usable signature string from any response shape
    const extractSignature = (res: unknown): string | null => {
      if (!res) return null;
      if (typeof res === 'string' && res.trim().length > 0) return res.trim();
      if (res instanceof Uint8Array) {
        return Array.from(res).map(b => b.toString(16).padStart(2, '0')).join('');
      }
      if (typeof res === 'object') {
        const obj = res as Record<string, unknown>;
        if (typeof obj.signature === 'string' && obj.signature.length > 0) return obj.signature;
        if (obj.signature instanceof Uint8Array) {
          return Array.from(obj.signature).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        if (typeof obj.sig === 'string' && obj.sig.length > 0) return obj.sig;
        if (typeof obj.signedData === 'string' && obj.signedData.length > 0) return obj.signedData;
        if (typeof obj.signatureHex === 'string' && obj.signatureHex.length > 0) return obj.signatureHex;
        if (typeof obj.result === 'string' && obj.result.length > 0) return obj.result;
        // Fallback: any string value longer than 8 chars is probably a signature
        for (const val of Object.values(obj)) {
          if (typeof val === 'string' && val.length > 8) return val;
        }
      }
      return null;
    };

    if (import.meta.env.DEV) {
      console.log('[1AM Wallet] Calling signData(data, options):', {
        dataLength: dataStr.length,
        dataPreview: dataStr.substring(0, 80),
        encoding
      });
    }

    try {
      let result: unknown;
      const signOpts = {
        encoding: encoding as 'text' | 'hex' | 'base64',
        keyType: 'unshielded' as const
      };

      try {
        // Try standard official Midnight DApp connector 2-argument call first:
        // signData(data: string, options: { encoding: string, keyType: 'unshielded' })
        result = await (activeApi as unknown as { signData: (d: string, o: unknown) => Promise<unknown> }).signData(
          dataStr,
          signOpts
        );
      } catch (err: unknown) {
        const signErrStr = err instanceof Error ? err.message : String(err);

        // Do not swallow user cancellations or rejections
        if (
          signErrStr.includes('rejected') ||
          signErrStr.includes('User rejected') ||
          signErrStr.includes('cancelled') ||
          signErrStr.includes('declined') ||
          signErrStr.includes('Cancelled')
        ) {
          throw err;
        }

        // Fallback 1: Try single payload object signature: signData({ data, options })
        try {
          result = await (activeApi as unknown as { signData: (p: unknown) => Promise<unknown> }).signData({
            data: dataStr,
            options: signOpts
          });
        } catch (fallback1Err: unknown) {
          const fallback1ErrStr = fallback1Err instanceof Error ? fallback1Err.message : String(fallback1Err);
          if (
            fallback1ErrStr.includes('rejected') ||
            fallback1ErrStr.includes('User rejected') ||
            fallback1ErrStr.includes('cancelled') ||
            fallback1ErrStr.includes('declined')
          ) {
            throw fallback1Err;
          }

          // Fallback 2: Try address as first argument: signData(address, { data, options })
          try {
            result = await (activeApi as unknown as { signData: (a: string, p: unknown) => Promise<unknown> }).signData(
              normalizedAddr,
              { data: dataStr, options: signOpts }
            );
          } catch {
            // Throw original error with full context
            throw err;
          }
        }
      }

      const sig = extractSignature(result);
      if (sig) {
        return sig;
      }
      if (result) {
        return String(result);
      }
      throw new Error('1AM Wallet signData returned no usable signature.');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      if (
        errorMsg.includes('rejected') ||
        errorMsg.includes('User rejected') ||
        errorMsg.includes('cancelled') ||
        errorMsg.includes('declined') ||
        errorMsg.includes('Cancelled')
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
          encoding: 'text',
          keyType: 'unshielded'
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

    const provider = this.getOneAmProvider();
    if (provider) {
      const api = await provider.connect(NETWORK);
      this.connectedApi = api;
      return api;
    }

    throw new Error('1AM Wallet is not installed or connected. Please install and connect 1AM Wallet on Midnight Preprod.');
  }
}
