import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NETWORK, NETWORK_NAME, PREPROD_CONFIG, isPreprodNetwork, getPreprodConfig } from '../src/config/network';
import { OneAmConnector } from '../src/wallet/oneAmConnector';
import { MidnightConnectedAPI, OneAmWalletProvider } from '../src/wallet/types';

describe('Midnight Preprod Testnet Network Requirement & Validation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    OneAmConnector.setConnectedApi(null);
  });

  it('should strictly define NETWORK as preprod and have complete Preprod config', () => {
    expect(NETWORK).toBe('preprod');
    expect(NETWORK_NAME).toBe('Midnight Preprod Testnet');
    expect(PREPROD_CONFIG.networkId).toBe('preprod');
    // Initially null/empty before first deployment
    expect(PREPROD_CONFIG.contractAddress).toBe('');
    expect(PREPROD_CONFIG.rpcUrl).toContain('preprod');
  });

  it('isPreprodNetwork should accept only Midnight Preprod Testnet and reject all others', () => {
    // Valid preprod variants
    expect(isPreprodNetwork('preprod')).toBe(true);
    expect(isPreprodNetwork('Midnight Preprod')).toBe(true);
    expect(isPreprodNetwork('Midnight Preprod Testnet')).toBe(true);
    expect(isPreprodNetwork('midnight-preprod')).toBe(true);

    // Invalid networks must return false
    expect(isPreprodNetwork('mainnet')).toBe(false);
    expect(isPreprodNetwork('testnet')).toBe(false);
    expect(isPreprodNetwork('devnet')).toBe(false);
    expect(isPreprodNetwork('localnet')).toBe(false);
    expect(isPreprodNetwork('ethereum')).toBe(false);
    expect(isPreprodNetwork('polygon')).toBe(false);
    expect(isPreprodNetwork('sepolia')).toBe(false);
    expect(isPreprodNetwork('')).toBe(false);
    expect(isPreprodNetwork(null)).toBe(false);
    expect(isPreprodNetwork(undefined)).toBe(false);
  });

  it('getPreprodConfig should return complete Preprod network configuration when address is set', () => {
    const canonicalAddr = '0200' + '1234567890abcdef'.repeat(3) + '1234567890ab';
    PREPROD_CONFIG.contractAddress = canonicalAddr;
    const config = getPreprodConfig();
    expect(config.networkId).toBe('preprod');
    expect(config.contractAddress).toBe(canonicalAddr);
    expect(config.rpcUrl).toContain('preprod.midnight.network');
    expect(config.indexerUrl).toContain('indexer.preprod.midnight.network');
  });

  it('OneAmConnector should connect with preprod and detect when wallet is on preprod', async () => {
    const mockApi: MidnightConnectedAPI = {
      getShieldedAddresses: async () => ['mn_shielded_preprod_1'],
      getUnshieldedAddress: async () => '0x71C8366420A092679b54538490758BDE353613AC',
      getDustBalance: async () => 1000000n,
      getNetwork: async () => 'preprod',
      signData: vi.fn(),
      submitTransaction: vi.fn().mockResolvedValue(undefined)
    };

    const mockProvider: OneAmWalletProvider = {
      name: '1AM Wallet',
      apiVersion: '1.0.0',
      connect: vi.fn().mockResolvedValue(mockApi),
      getNetwork: vi.fn().mockResolvedValue('preprod')
    };

    // Attach to window
    (window as unknown as { midnight: { '1am': OneAmWalletProvider } }).midnight = {
      '1am': mockProvider
    };

    const result = await OneAmConnector.connectRealWallet();
    expect(mockProvider.connect).toHaveBeenCalledWith('preprod');
    expect(result.isPreprod).toBe(true);
    expect(result.detectedNetwork).toBe('preprod');
    expect(result.unshieldedAddress).toBe('0x71C8366420A092679b54538490758BDE353613AC');
  });

  it('OneAmConnector should detect when wallet is on an invalid network (e.g. mainnet or devnet)', async () => {
    const mockApi: MidnightConnectedAPI = {
      getShieldedAddresses: async () => [],
      getUnshieldedAddress: async () => '0x71C8366420A092679b54538490758BDE353613AC',
      getNetwork: async () => 'mainnet',
      signData: vi.fn(),
      submitTransaction: vi.fn().mockResolvedValue(undefined)
    };

    const mockProvider: OneAmWalletProvider = {
      name: '1AM Wallet',
      apiVersion: '1.0.0',
      connect: vi.fn().mockResolvedValue(mockApi),
      getNetwork: vi.fn().mockResolvedValue('mainnet')
    };

    (window as unknown as { midnight: { '1am': OneAmWalletProvider } }).midnight = {
      '1am': mockProvider
    };

    const result = await OneAmConnector.connectRealWallet();
    expect(result.isPreprod).toBe(false);
    expect(result.detectedNetwork).toBe('mainnet');
  });

  it('OneAmConnector should support programmatic network switching to Preprod', async () => {
    const mockSwitchNetwork = vi.fn().mockResolvedValue(undefined);
    const mockProvider: OneAmWalletProvider = {
      name: '1AM Wallet',
      apiVersion: '1.0.0',
      connect: vi.fn(),
      switchNetwork: mockSwitchNetwork
    };

    (window as unknown as { midnight: { '1am': OneAmWalletProvider } }).midnight = {
      '1am': mockProvider
    };

    const switched = await OneAmConnector.switchToPreprod();
    expect(switched).toBe(true);
    expect(mockSwitchNetwork).toHaveBeenCalledWith('preprod');
  });
});
