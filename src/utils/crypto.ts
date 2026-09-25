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
    if (rawAddress.length === 0) return '';
    return normalizeAddress(rawAddress[0]);
  }

  if (typeof rawAddress === 'object') {
    const obj = rawAddress as Record<string, unknown>;
    if (typeof obj.address === 'string') return obj.address.trim();
    if (typeof obj.unshieldedAddress === 'string') return obj.unshieldedAddress.trim();
    if (typeof obj.shieldedAddress === 'string') return obj.shieldedAddress.trim();
    if (typeof obj.bech32 === 'string') return obj.bech32.trim();
    if (typeof obj.hex === 'string') return obj.hex.trim();
    if (typeof obj.value === 'string') return obj.value.trim();
    if (typeof obj.toString === 'function') {
      const str = obj.toString();
      if (str && str !== '[object Object]') return str.trim();
    }
  }

  return String(rawAddress).trim();
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
