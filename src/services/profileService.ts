import { PlayerProfile, RankTier } from '../types';
import { normalizeAddress } from '../utils/crypto';

export interface ProfileValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class ProfileService {
  private static getStorageKey(walletAddress: string): string {
    const norm = normalizeAddress(walletAddress);
    return `privaterank_profile_${norm}`;
  }

  public static getProfile(walletAddress: string): PlayerProfile {
    const safeAddress = normalizeAddress(walletAddress);
    const key = this.getStorageKey(safeAddress);
    
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return {
            walletAddress: safeAddress,
            anonymousId: parsed.anonymousId || `PR-${safeAddress.slice(2, 6).toUpperCase()}`,
            personalInfo: {
              fullName: parsed.personalInfo?.fullName || '',
              email: parsed.personalInfo?.email || '',
              phone: parsed.personalInfo?.phone || '',
              country: parsed.personalInfo?.country || '',
              dateOfBirth: parsed.personalInfo?.dateOfBirth || '',
              discordHandle: parsed.personalInfo?.discordHandle || ''
            },
            gamingCredentials: {
              rank: typeof parsed.gamingCredentials?.rank === 'number' ? parsed.gamingCredentials.rank : RankTier.PLATINUM,
              score: typeof parsed.gamingCredentials?.score === 'number' ? parsed.gamingCredentials.score : 2000,
              wins: typeof parsed.gamingCredentials?.wins === 'number' ? parsed.gamingCredentials.wins : 10,
              losses: typeof parsed.gamingCredentials?.losses === 'number' ? parsed.gamingCredentials.losses : 2,
              achievements: Array.isArray(parsed.gamingCredentials?.achievements) ? parsed.gamingCredentials.achievements : ['Pioneer Badge'],
              gameTitle: parsed.gamingCredentials?.gameTitle || 'Esports Championship',
              verifiedAt: parsed.gamingCredentials?.verifiedAt || new Date().toISOString()
            }
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load profile from storage:', e);
    }

    // Default new profile for this wallet
    const anonPrefix = safeAddress.length >= 6 ? safeAddress.slice(2, 6).toUpperCase() : 'USER';
    const defaultProfile: PlayerProfile = {
      walletAddress: safeAddress,
      anonymousId: `PR-${anonPrefix}`,
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        country: '',
        dateOfBirth: ''
      },
      gamingCredentials: {
        rank: RankTier.PLATINUM,
        score: 2000,
        wins: 10,
        losses: 2,
        achievements: ['Pioneer Badge'],
        gameTitle: 'Esports Championship',
        verifiedAt: new Date().toISOString()
      }
    };

    try {
      localStorage.setItem(key, JSON.stringify(defaultProfile));
    } catch {
      // Ignore
    }

    return defaultProfile;
  }

  public static validateProfile(profile: Partial<PlayerProfile>): ProfileValidationResult {
    const errors: Record<string, string> = {};

    const gaming = profile.gamingCredentials || {} as any;
    const personal = profile.personalInfo;

    // Optional email validation if provided
    if (personal?.email && personal.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personal.email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Rank
    if (typeof gaming.rank !== 'number' || gaming.rank < 1 || gaming.rank > 7) {
      errors.rank = 'Please select a valid Rank';
    }

    // Score
    if (typeof gaming.score !== 'number' || isNaN(gaming.score) || gaming.score < 0) {
      errors.score = 'Score must be a non-negative number';
    }

    // Wins
    if (typeof gaming.wins !== 'number' || isNaN(gaming.wins) || gaming.wins < 0 || !Number.isInteger(gaming.wins)) {
      errors.wins = 'Wins must be a non-negative whole integer';
    }

    // Losses
    if (typeof gaming.losses !== 'number' || isNaN(gaming.losses) || gaming.losses < 0 || !Number.isInteger(gaming.losses)) {
      errors.losses = 'Losses must be a non-negative whole integer';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  public static saveProfile(profile: PlayerProfile): void {
    const validation = this.validateProfile(profile);
    if (!validation.isValid) {
      const errorMsg = Object.values(validation.errors).join(', ');
      throw new Error(`Profile validation failed: ${errorMsg}`);
    }

    const safeAddress = normalizeAddress(profile.walletAddress);
    const key = this.getStorageKey(safeAddress);
    
    // Ensure verified timestamp is kept fresh
    const toSave: PlayerProfile = {
      ...profile,
      walletAddress: safeAddress,
      gamingCredentials: {
        ...profile.gamingCredentials,
        verifiedAt: new Date().toISOString()
      }
    };

    localStorage.setItem(key, JSON.stringify(toSave));
  }

  public static calculateCompletion(profile: PlayerProfile): { percentage: number; missingFields: string[] } {
    const fields = [
      { name: 'Full Name', value: profile.personalInfo?.fullName },
      { name: 'Email', value: profile.personalInfo?.email },
      { name: 'Phone', value: profile.personalInfo?.phone },
      { name: 'Country', value: profile.personalInfo?.country },
      { name: 'Date of Birth', value: profile.personalInfo?.dateOfBirth },
      { name: 'Gaming Rank', value: profile.gamingCredentials?.rank },
      { name: 'Gaming Score', value: profile.gamingCredentials?.score }
    ];

    const filledCount = fields.filter(f => f.value !== undefined && f.value !== null && String(f.value).trim() !== '').length;
    const percentage = Math.round((filledCount / fields.length) * 100);
    const missingFields = fields
      .filter(f => f.value === undefined || f.value === null || String(f.value).trim() === '')
      .map(f => f.name);

    return { percentage, missingFields };
  }

  public static getAvatarInitials(profile: PlayerProfile): string {
    if (profile.personalInfo?.fullName && profile.personalInfo.fullName.trim().length > 0) {
      const parts = profile.personalInfo.fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (profile.walletAddress && profile.walletAddress.length >= 4) {
      return profile.walletAddress.slice(2, 4).toUpperCase();
    }
    return 'PR';
  }

  public static maskPhone(phone: string): string {
    if (!phone) return 'Not set';
    const clean = phone.trim();
    if (clean.length <= 4) return clean;
    const lastFour = clean.slice(-2);
    return '•'.repeat(Math.min(clean.length - 2, 8)) + lastFour;
  }
}
