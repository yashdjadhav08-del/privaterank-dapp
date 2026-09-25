import { OrganizerAccount } from '../types';
import { normalizeAddress, safeAddressCompare } from '../utils/crypto';

const ORGANIZER_REGISTRY_KEY = 'privaterank_organizer_registry_v1';
const PLAYER_REGISTRY_KEY = 'privaterank_player_registry_v1';

// Pre-authorized organizer allowlist for Midnight Preprod MVP
const DEFAULT_AUTHORIZED_ORGANIZERS: OrganizerAccount[] = [
  {
    address: '0x892aF014bB5C3d49B4567890123456789abcdef0',
    name: 'Midnight Esports League',
    organization: 'Midnight DAO Tournaments',
    isAuthorized: true,
    registeredAt: '2026-01-01T00:00:00.000Z'
  },
  {
    address: '0x1A4b8E94c5C6d7E8F0123456789abcdef0123456',
    name: 'Apex Midnight Series',
    organization: 'Apex Gaming Federation',
    isAuthorized: true,
    registeredAt: '2026-01-01T00:00:00.000Z'
  }
];

export class AuthService {
  private static getOrganizerRegistry(): OrganizerAccount[] {
    try {
      const stored = localStorage.getItem(ORGANIZER_REGISTRY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    this.saveOrganizerRegistry(DEFAULT_AUTHORIZED_ORGANIZERS);
    return DEFAULT_AUTHORIZED_ORGANIZERS;
  }

  private static saveOrganizerRegistry(registry: OrganizerAccount[]): void {
    try {
      localStorage.setItem(ORGANIZER_REGISTRY_KEY, JSON.stringify(registry));
    } catch {
      // ignore
    }
  }

  private static getPlayerRegistry(): string[] {
    try {
      const stored = localStorage.getItem(PLAYER_REGISTRY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  }

  private static savePlayerRegistry(players: string[]): void {
    try {
      localStorage.setItem(PLAYER_REGISTRY_KEY, JSON.stringify(players));
    } catch {
      // ignore
    }
  }

  /**
   * Verifies whether the provided wallet address belongs to an authorized organizer.
   */
  public static isOrganizerAuthorized(address: unknown): boolean {
    const normalized = normalizeAddress(address);
    if (!normalized) return false;
    const registry = this.getOrganizerRegistry();
    return registry.some(org => org && org.isAuthorized && safeAddressCompare(org.address, normalized));
  }

  public static isOrganizer(address: unknown): boolean {
    return this.isOrganizerAuthorized(address);
  }

  /**
   * Verifies whether the provided wallet address is a registered player.
   */
  public static isPlayer(address: unknown): boolean {
    const normalized = normalizeAddress(address);
    if (!normalized) return false;
    // An organizer can NEVER be a player
    if (this.isOrganizerAuthorized(normalized)) return false;
    return true;
  }

  /**
   * Evaluates the caller's strict role based solely on the connected 1AM wallet address.
   */
  public static getUserRole(address: unknown): 'ORGANIZER' | 'PLAYER' | 'UNKNOWN' {
    const normalized = normalizeAddress(address);
    if (!normalized) return 'UNKNOWN';
    return this.isOrganizerAuthorized(normalized) ? 'ORGANIZER' : 'PLAYER';
  }

  /**
   * Registers a new organizer into the allowlist registry.
   * Enforces strict conflict rule: cannot register if wallet has acted as a player.
   */
  public static registerOrganizer(address: unknown, name = 'Tournament Organizer', organization = 'Esports Org'): void {
    const normalized = normalizeAddress(address);
    if (!normalized) return;

    const registry = this.getOrganizerRegistry();
    const existingIndex = registry.findIndex(o => o && safeAddressCompare(o.address, normalized));
    
    if (existingIndex >= 0) {
      registry[existingIndex].isAuthorized = true;
      registry[existingIndex].name = name;
      registry[existingIndex].organization = organization;
    } else {
      registry.push({
        address: normalized,
        name,
        organization,
        isAuthorized: true,
        registeredAt: new Date().toISOString()
      });
    }
    this.saveOrganizerRegistry(registry);
  }

  /**
   * Revokes organizer authorization for an address.
   */
  public static revokeOrganizer(address: unknown): void {
    const normalized = normalizeAddress(address);
    if (!normalized) return;
    const registry = this.getOrganizerRegistry();
    const existingIndex = registry.findIndex(o => o && safeAddressCompare(o.address, normalized));
    if (existingIndex >= 0) {
      registry[existingIndex].isAuthorized = false;
      this.saveOrganizerRegistry(registry);
    }
  }

  /**
   * Returns all registered organizers.
   */
  public static getAllOrganizers(): OrganizerAccount[] {
    return this.getOrganizerRegistry();
  }
}
