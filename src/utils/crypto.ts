// Cryptographic helpers for Midnight ZK commitments, anonymous ID generation, and signature challenges

export async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Safely normalizes any address value (string, object with address/bech32/hex property, array, etc.)
 * into a clean lowercase trimmed string. Never throws.
 */
export function normalizeAddress(rawAddress: unknown): string {
  if (rawAddress === null || rawAddress === undefined) {
    return '';
  }

  if (typeof rawAddress === 'string') {
    return rawAddress.trim();
  }

  if (Array.isArray(rawAddress)) {
    for (const item of rawAddress) {
      const normalized = normalizeAddress(item);
      if (normalized) return normalized;
    }
    return '';
  }

  if (typeof rawAddress === 'object') {
    const obj = rawAddress as Record<string, unknown>;

    // Check candidate address property names in order
    const candidateKeys = [
      'unshieldedAddress',
      'shieldedAddress',
      'address',
      'dustAddress',
      'bech32',
      'hex',
      'value'
    ];

    for (const key of candidateKeys) {
      const val = obj[key];
      if (typeof val === 'string' && val.trim().length > 0) {
        return val.trim();
      }
    }

    // Check nested address arrays
    if (Array.isArray(obj.addresses) && obj.addresses.length > 0) {
      const nested = normalizeAddress(obj.addresses);
      if (nested) return nested;
    }

    if (Array.isArray(obj.shieldedAddresses) && obj.shieldedAddresses.length > 0) {
      const nested = normalizeAddress(obj.shieldedAddresses);
      if (nested) return nested;
    }

    if (typeof obj.toString === 'function') {
      const str = obj.toString();
      if (str && str !== '[object Object]') return str.trim();
    }
  }

  return '';
}

/**
 * Safely compares two addresses case-insensitively without throwing.
 */
export function safeAddressCompare(addr1: unknown, addr2: unknown): boolean {
  const a = normalizeAddress(addr1).toLowerCase();
  const b = normalizeAddress(addr2).toLowerCase();
  return a.length > 0 && b.length > 0 && a === b;
}

export function generateAnonymousPlayerId(walletAddress: unknown, salt: string): string {
  const normalized = normalizeAddress(walletAddress);
  let hash = 0;
  const combined = `${normalized}:${salt}:midnight-privaterank`;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0').slice(-4);
  return `PR-${hex}`;
}

export function generateProofId(): string {
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  const hex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `PRF-${hex}`;
}

export function generateChallenge(walletAddress: unknown, nonce: string): string {
  const normalized = normalizeAddress(walletAddress);
  return `Sign this message to authenticate with PrivateRank DApp on Midnight Network (Preprod).\nWallet: ${normalized}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
}

export function shortenAddress(address: unknown, chars = 6): string {
  const normalized = normalizeAddress(address);
  if (!normalized) return '';
  if (normalized.length <= chars * 2 + 2) return normalized;
  return `${normalized.slice(0, chars + 2)}...${normalized.slice(-chars)}`;
}

export function formatDust(dust: bigint | string | number | unknown): string {
  const value = typeof dust === 'bigint' ? Number(dust) : Number(dust || 0);
  return (value / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' DUST';
}

/**
 * Format tournament prize pool in INR Rupees (₹).
 * Tournament prize pool is an application-level reward in Rupees (INR).
 * Midnight DUST is strictly reserved for blockchain transaction/gas fees.
 */
export function formatPrizePool(prize?: string | number | null): string {
  if (!prize) return '₹0';
  let str = String(prize).trim();

  // If already starts with ₹, return as is
  if (str.startsWith('₹')) return str;

  // Clean legacy test labels
  str = str.replace(/\s*(?:t?DUST|tokens?)\s*$/i, '').trim();
  str = str.replace(/\s*INR\s*$/i, '').trim();

  if (!str) return '₹0';

  // If pure number or formatted number (e.g. "5000" or "5,000")
  if (/^[\d,]+$/.test(str)) {
    return `₹${str}`;
  }

  // If it contains a number prefix
  const match = str.match(/^([\d,]+)(.*)$/);
  if (match) {
    return `₹${match[1]}${match[2]}`;
  }

  return `₹${str}`;
}
