import { describe, it, expect } from 'vitest';
import {
  validateTournamentName,
  validatePrizePool,
  validateRankTier,
  validateCapacity,
  validateScheduleRules,
  validateLocationRules,
  validateTournament,
  type TournamentValidationInput
} from '../src/utils/validation';
import { RankTier } from '../src/types';

describe('Tournament Validation Utilities', () => {
  describe('validateTournamentName', () => {
    it('accepts valid tournament names', () => {
      expect(validateTournamentName('Midnight Champions Cup')).toBeNull();
      expect(validateTournamentName('BGMI Pro League 2026')).toBeNull();
      expect(validateTournamentName('Cup')).toBeNull(); // min 3 chars
    });

    it('rejects empty, short, or oversized names', () => {
      expect(validateTournamentName('')).toMatch(/required/);
      expect(validateTournamentName('AB')).toMatch(/at least 3 characters/);
      expect(validateTournamentName('A'.repeat(65))).toMatch(/must not exceed 64 characters/);
    });

    it('rejects unsafe script or tag characters', () => {
      expect(validateTournamentName('<script>alert(1)</script>')).toMatch(/invalid characters/);
    });
  });

  describe('validatePrizePool', () => {
    it('accepts valid prize numbers and currency formats', () => {
      expect(validatePrizePool('10000')).toBeNull();
      expect(validatePrizePool('₹10,000')).toBeNull();
      expect(validatePrizePool('$5,000')).toBeNull();
      expect(validatePrizePool('0')).toBeNull();
    });

    it('rejects invalid or negative prize strings', () => {
      expect(validatePrizePool('')).toMatch(/required/);
      expect(validatePrizePool('abc')).toMatch(/valid prize amount/);
      expect(validatePrizePool('-500')).toMatch(/non-negative/);
    });
  });

  describe('validateRankTier', () => {
    it('accepts valid rank tiers between 1 and 7', () => {
      expect(validateRankTier(RankTier.BRONZE)).toBeNull();
      expect(validateRankTier(RankTier.GOLD)).toBeNull();
      expect(validateRankTier(RankTier.GRANDMASTER)).toBeNull();
    });

    it('rejects out-of-range or non-integer rank tiers', () => {
      expect(validateRankTier(0)).toMatch(/between 1/);
      expect(validateRankTier(8)).toMatch(/between 1/);
      expect(validateRankTier(2.5 as any)).toMatch(/integer/);
    });
  });

  describe('validateCapacity', () => {
    it('validates SOLO tournament capacity limits', () => {
      expect(validateCapacity('SOLO', 64)).toBeNull();
      expect(validateCapacity('SOLO', 1)).toMatch(/between 2 and 512/);
      expect(validateCapacity('SOLO', 1000)).toMatch(/between 2 and 512/);
    });

    it('validates TEAM tournament team count and team sizes', () => {
      expect(validateCapacity('TEAM', 16, 16, 4)).toBeNull();
      expect(validateCapacity('TEAM', 16, 1, 4)).toMatch(/between 2 and 64 teams/);
      expect(validateCapacity('TEAM', 16, 16, 1)).toMatch(/between 2 and 10 players/);
      expect(validateCapacity('TEAM', 16, 16, 12)).toMatch(/between 2 and 10 players/);
    });
  });

  describe('validateScheduleRules', () => {
    it('accepts chronologically valid schedules', () => {
      const schedule = {
        registrationStart: '2026-10-01T00:00:00Z',
        registrationEnd: '2026-10-05T00:00:00Z',
        tournamentStart: '2026-10-06T00:00:00Z',
        tournamentEnd: '2026-10-07T00:00:00Z'
      };
      expect(validateScheduleRules(schedule)).toBeNull();
    });

    it('rejects when registrationStart is after registrationEnd', () => {
      const schedule = {
        registrationStart: '2026-10-05T00:00:00Z',
        registrationEnd: '2026-10-01T00:00:00Z',
        tournamentStart: '2026-10-06T00:00:00Z',
        tournamentEnd: '2026-10-07T00:00:00Z'
      };
      expect(validateScheduleRules(schedule)).toMatch(/earlier than Registration End/);
    });

    it('rejects when registrationEnd is after tournamentStart', () => {
      const schedule = {
        registrationStart: '2026-10-01T00:00:00Z',
        registrationEnd: '2026-10-08T00:00:00Z',
        tournamentStart: '2026-10-06T00:00:00Z',
        tournamentEnd: '2026-10-09T00:00:00Z'
      };
      expect(validateScheduleRules(schedule)).toMatch(/on or before Tournament Start/);
    });

    it('rejects when tournamentStart is after tournamentEnd', () => {
      const schedule = {
        registrationStart: '2026-10-01T00:00:00Z',
        registrationEnd: '2026-10-05T00:00:00Z',
        tournamentStart: '2026-10-10T00:00:00Z',
        tournamentEnd: '2026-10-08T00:00:00Z'
      };
      expect(validateScheduleRules(schedule)).toMatch(/earlier than Tournament End/);
    });

    it('rejects invalid date strings', () => {
      const schedule = {
        registrationStart: 'not-a-date',
        registrationEnd: '2026-10-05T00:00:00Z',
        tournamentStart: '2026-10-06T00:00:00Z',
        tournamentEnd: '2026-10-07T00:00:00Z'
      };
      expect(validateScheduleRules(schedule)).toMatch(/valid ISO date strings/);
    });
  });

  describe('validateLocationRules', () => {
    it('accepts online location with platform', () => {
      expect(validateLocationRules({ locationType: 'ONLINE', onlinePlatform: 'Discord' })).toBeNull();
    });

    it('rejects online location without platform or region', () => {
      expect(validateLocationRules({ locationType: 'ONLINE' })).toMatch(/specify an online platform/);
    });

    it('accepts offline location with venue or city', () => {
      expect(validateLocationRules({ locationType: 'OFFLINE', venueName: 'Gaming Arena', city: 'Mumbai' })).toBeNull();
    });

    it('rejects offline location with missing venue info', () => {
      expect(validateLocationRules({ locationType: 'OFFLINE' })).toMatch(/specify venue name, city, or address/);
    });
  });

  describe('validateTournament (Full Object)', () => {
    it('returns empty errors array for a completely valid tournament', () => {
      const valid: TournamentValidationInput = {
        name: 'PrivateRank Masters',
        gameTitle: 'Valorant',
        tournamentType: 'SOLO',
        maxParticipants: 64,
        prizePool: '₹25,000',
        requirements: {
          minimumRank: RankTier.DIAMOND,
          minimumScore: 2000,
          minimumWins: 10
        },
        schedule: {
          registrationStart: '2026-10-01T00:00:00Z',
          registrationEnd: '2026-10-05T00:00:00Z',
          tournamentStart: '2026-10-06T00:00:00Z',
          tournamentEnd: '2026-10-07T00:00:00Z'
        },
        location: {
          locationType: 'ONLINE',
          onlinePlatform: 'Custom Server'
        }
      };

      const errors = validateTournament(valid);
      expect(errors).toHaveLength(0);
    });

    it('aggregates multiple field errors properly', () => {
      const invalid: TournamentValidationInput = {
        name: 'A', // too short
        gameTitle: '', // missing
        tournamentType: 'SOLO',
        maxParticipants: 1, // too low
        prizePool: '-10', // negative
        requirements: {
          minimumRank: 10, // out of range
          minimumScore: -5, // negative
          minimumWins: -1 // negative
        },
        schedule: {
          registrationStart: '2026-10-10T00:00:00Z',
          registrationEnd: '2026-10-01T00:00:00Z', // wrong order
          tournamentStart: '2026-10-06T00:00:00Z',
          tournamentEnd: '2026-10-07T00:00:00Z'
        },
        location: {
          locationType: 'ONLINE' // missing platform
        }
      };

      const errors = validateTournament(invalid);
      expect(errors.length).toBeGreaterThan(4);
      expect(errors.map(e => e.field)).toContain('name');
      expect(errors.map(e => e.field)).toContain('gameTitle');
      expect(errors.map(e => e.field)).toContain('prizePool');
      expect(errors.map(e => e.field)).toContain('minimumRank');
      expect(errors.map(e => e.field)).toContain('capacity');
      expect(errors.map(e => e.field)).toContain('schedule');
    });
  });
});
