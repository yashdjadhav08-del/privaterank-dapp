import { normalizeAddress } from '../utils/crypto';

export type UserRole = 'ORGANIZER' | 'PLAYER';

const WALLET_ROLE_STORAGE_KEY = 'privaterank_wallet_roles_v1';
const ACTIVE_SESSION_ROLE_KEY = 'privaterank_active_role_v1';

// Pre-seeded / designated organizer wallet
export const DESIGNATED_ORGANIZER_WALLETS: string[] = [
  'mn_addr_preprod1c35njcpvrtjdpjlghvcfnj7wda6d7a672armpjkm98hfwfxc2qksqsvlst'
];

/**
 * Normalizes wallet address key for dictionary lookups (lowercased & trimmed).
 */
export function normalizeWalletKey(walletAddress: unknown): string {
  return normalizeAddress(walletAddress).toLowerCase();
}

/**
 * Returns the entire persistent wallet role registry from localStorage.
 */
export function getWalletRoleRegistry(): Record<string, UserRole> {
  const registry: Record<string, UserRole> = {};

  // Pre-seed designated organizer wallets
  for (const org of DESIGNATED_ORGANIZER_WALLETS) {
    const key = normalizeWalletKey(org);
    if (key) {
      registry[key] = 'ORGANIZER';
    }
  }

  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(WALLET_ROLE_STORAGE_KEY) : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed === 'object' && parsed !== null) {
        for (const [k, v] of Object.entries(parsed)) {
          if (v === 'ORGANIZER' || v === 'PLAYER') {
            registry[normalizeWalletKey(k)] = v;
          }
        }
      }
    }
  } catch {
    // localStorage unavailable or parse error
  }

  return registry;
}

/**
 * Get the permanent bound role for a specific wallet address.
 * Returns null if the wallet is new and has not been bound yet.
 */
export function getRoleForWallet(walletAddress: unknown): UserRole | null {
  const key = normalizeWalletKey(walletAddress);
  if (!key) return null;

  const registry = getWalletRoleRegistry();
  return registry[key] || null;
}

/**
 * Permanently binds a wallet to a role ('ORGANIZER' or 'PLAYER').
 * If the wallet is already bound, it returns the existing bound role and NEVER overwrites it (role immutability).
 */
export function bindWalletRole(walletAddress: unknown, role: UserRole): UserRole {
  const key = normalizeWalletKey(walletAddress);
  if (!key) return role;

  const existingRole = getRoleForWallet(key);
  if (existingRole) {
    // Role is immutable — return existing binding
    return existingRole;
  }

  try {
    let storedRegistry: Record<string, UserRole> = {};
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(WALLET_ROLE_STORAGE_KEY);
      if (stored) {
        storedRegistry = JSON.parse(stored);
      }
      storedRegistry[key] = role;
      localStorage.setItem(WALLET_ROLE_STORAGE_KEY, JSON.stringify(storedRegistry));
    }
  } catch {
    // ignore storage errors
  }

  return role;
}

/**
 * Returns true if the wallet already has an immutable role binding.
 */
export function isWalletBound(walletAddress: unknown): boolean {
  return getRoleForWallet(walletAddress) !== null;
}

/**
 * Get active session role, or null if neither wallet nor session is bound.
 */
export function getSelectedRole(walletAddress?: unknown): UserRole | null {
  if (walletAddress) {
    const bound = getRoleForWallet(walletAddress);
    if (bound) return bound;
  }

  try {
    if (typeof sessionStorage !== 'undefined') {
      const session = sessionStorage.getItem(ACTIVE_SESSION_ROLE_KEY);
      if (session === 'ORGANIZER' || session === 'PLAYER') return session;
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Set active role for the current session, and if walletAddress is provided, permanently bind it.
 */
export function setSelectedRole(role: UserRole, walletAddress?: unknown): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(ACTIVE_SESSION_ROLE_KEY, role);
    }
  } catch {
    // ignore
  }

  if (walletAddress) {
    bindWalletRole(walletAddress, role);
  }
}

/**
 * Clear the session role (on disconnect). Does not erase the permanent walletRoleRegistry.
 */
export function clearSelectedRole(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(ACTIVE_SESSION_ROLE_KEY);
    }
  } catch {
    // ignore
  }
}
