import { 
  getRoleForWallet, 
  bindWalletRole, 
  isWalletBound, 
  getSelectedRole, 
  setSelectedRole, 
  clearSelectedRole 
} from '../config/organizers';
import type { UserRole } from '../config/organizers';

export type { UserRole };

export class AuthService {
  /**
   * Returns the permanently bound role for a specific wallet, or null if unbound.
   */
  public static getRoleForWallet(walletAddress: unknown): UserRole | null {
    return getRoleForWallet(walletAddress);
  }

  /**
   * Permanently binds a wallet to a role. Immutable once set.
   */
  public static bindRole(walletAddress: unknown, role: UserRole): UserRole {
    return bindWalletRole(walletAddress, role);
  }

  /**
   * Check if a wallet is already bound to a role.
   */
  public static isWalletBound(walletAddress: unknown): boolean {
    return isWalletBound(walletAddress);
  }

  /**
   * Returns the currently active role for the session or wallet.
   */
  public static getSelectedRole(walletAddress?: unknown): UserRole | null {
    return getSelectedRole(walletAddress);
  }

  /**
   * Select and permanently bind role.
   */
  public static selectRole(role: UserRole, walletAddress?: unknown): void {
    setSelectedRole(role, walletAddress);
  }

  /**
   * Clear the active session role (on wallet disconnect).
   */
  public static clearRole(): void {
    clearSelectedRole();
  }

  /**
   * Returns true if the given wallet or active session is ORGANIZER.
   */
  public static isOrganizer(walletAddress?: unknown): boolean {
    if (walletAddress) {
      const boundRole = getRoleForWallet(walletAddress);
      if (boundRole) return boundRole === 'ORGANIZER';
    }
    return getSelectedRole(walletAddress) === 'ORGANIZER';
  }

  /**
   * Returns true if the given wallet or active session is PLAYER.
   */
  public static isPlayer(walletAddress?: unknown): boolean {
    if (walletAddress) {
      const boundRole = getRoleForWallet(walletAddress);
      if (boundRole) return boundRole === 'PLAYER';
    }
    return getSelectedRole(walletAddress) === 'PLAYER';
  }

  /**
   * Derive the active role for context consumers.
   * If wallet is bound, returns the bound role.
   * If session is set, returns session role.
   * Defaults to PLAYER only if completely unbound.
   */
  public static getActiveRole(walletAddress?: unknown): 'ORGANIZER' | 'PLAYER' {
    if (walletAddress) {
      const boundRole = getRoleForWallet(walletAddress);
      if (boundRole) return boundRole;
    }
    return getSelectedRole(walletAddress) ?? 'PLAYER';
  }
}
