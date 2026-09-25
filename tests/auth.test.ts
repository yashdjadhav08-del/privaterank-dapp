import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../src/wallet/authService';
import { OneAmConnector } from '../src/wallet/oneAmConnector';
import { generateChallenge, shortenAddress, normalizeAddress, safeAddressCompare } from '../src/utils/crypto';
import { MidnightConnectedAPI } from '../src/wallet/types';

describe('1AM Wallet Connector & Address Normalization (No toLowerCase Errors)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should normalize addresses of all formats (string, object, array, null, undefined)', () => {
    expect(normalizeAddress('0xABC123')).toBe('0xABC123');
    expect(normalizeAddress({ address: '0xABC123' })).toBe('0xABC123');
    expect(normalizeAddress({ unshieldedAddress: '0xABC123' })).toBe('0xABC123');
    expect(normalizeAddress({ shieldedAddress: 'mn_shielded123' })).toBe('mn_shielded123');
    expect(normalizeAddress({ bech32: 'addr_test123' })).toBe('addr_test123');
    expect(normalizeAddress(['0xABC123'])).toBe('0xABC123');
    expect(normalizeAddress(null)).toBe('');
    expect(normalizeAddress(undefined)).toBe('');
  });

  it('should safely compare addresses without throwing toLowerCase error', () => {
    expect(safeAddressCompare('0xAbCd123', '0xabcd123')).toBe(true);
    expect(safeAddressCompare({ address: '0xAbCd123' }, '0xabcd123')).toBe(true);
    expect(safeAddressCompare('0xAbCd123', { unshieldedAddress: '0xabcd123' })).toBe(true);
    expect(safeAddressCompare(null, '0xabcd123')).toBe(false);
    expect(safeAddressCompare(undefined, undefined)).toBe(false);
  });

  it('should register and authorize organizer address dynamically without toLowerCase errors', () => {
    const orgAddress = '0x992aF014bB5C3d49B4567890123456789abcdef9';
    expect(AuthService.isOrganizerAuthorized(orgAddress)).toBe(false);

    // Test with object address input
    AuthService.registerOrganizer(orgAddress, 'Midnight League', 'Midnight DAO');
    expect(AuthService.isOrganizerAuthorized({ address: orgAddress })).toBe(true);
    expect(AuthService.isOrganizerAuthorized(orgAddress)).toBe(true);
  });

  it('should reject unauthorized wallets safely', () => {
    expect(AuthService.isOrganizerAuthorized('0xUnregistered123')).toBe(false);
    expect(AuthService.isOrganizerAuthorized(null)).toBe(false);
    expect(AuthService.isOrganizerAuthorized(undefined)).toBe(false);
    expect(AuthService.isOrganizerAuthorized({ foo: 'bar' })).toBe(false);
  });

  it('should call signData with the exact schema { data: string, options: { encoding: "text" } }', async () => {
    const mockSignData = vi.fn().mockResolvedValue({
      signature: '0xsignature12345',
      publicKey: '0xpubkey'
    });

    const mockApi: MidnightConnectedAPI = {
      getShieldedAddresses: async () => ['mn_shielded123'],
      getUnshieldedAddress: async () => '0x71C8366420A092679b54538490758BDE353613AC',
      signData: mockSignData
    };

    const signature = await OneAmConnector.signChallenge('0x71C8366420A092679b54538490758BDE353613AC', mockApi);
    expect(signature).toBe('0xsignature12345');
    expect(mockSignData).toHaveBeenCalledTimes(1);

    // Checks that the payload was passed as 2nd arg or 1st arg
    const payload = mockSignData.mock.calls[0][1] || mockSignData.mock.calls[0][0];
    expect(typeof payload).toBe('object');
    expect(typeof payload.data).toBe('string');
    expect(payload.data.length).toBeGreaterThan(0);
    expect(payload.options).toEqual({ encoding: 'text' });
  });

  it('should safely handle user rejection without crashing', async () => {
    const mockRejectApi: MidnightConnectedAPI = {
      getShieldedAddresses: async () => [],
      getUnshieldedAddress: async () => '0x71C8366420A092679b54538490758BDE353613AC',
      signData: vi.fn().mockRejectedValue(new Error('User rejected the transaction'))
    };

    await expect(
      OneAmConnector.signChallenge('0x71C8366420A092679b54538490758BDE353613AC', mockRejectApi)
    ).rejects.toThrow(/rejected in 1AM Wallet/);
  });

  it('should correctly shorten wallet addresses of any type', () => {
    expect(shortenAddress('0x71C8366420A092679b54538490758BDE353613AC', 4)).toBe('0x71C8...13AC');
    expect(shortenAddress({ address: '0x71C8366420A092679b54538490758BDE353613AC' }, 4)).toBe('0x71C8...13AC');
    expect(shortenAddress(null)).toBe('');
  });
});
