/**
 * PrivateRank Input & Tournament Schedule Validation Utilities
 *
 * Enforces strict domain rules across frontend forms, contract calls,
 * and backend registrations to prevent malformed or invalid state transitions.
 */

import { RankTier, TournamentSchedule, TournamentLocation, TournamentType } from '../types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface TournamentValidationInput {
  name: string;
  gameTitle: string;
  tournamentType: TournamentType;
  teamSize?: number;
  maxTeams?: number;
  maxParticipants?: number;
  prizePool: string;
  requirements: {
    minimumRank: number;
    minimumScore: number;
    minimumWins: number;
  };
  schedule: TournamentSchedule;
  location: TournamentLocation;
}

/**
 * Validates tournament name
 */
export function validateTournamentName(name: string): string | null {
  if (!name || typeof name !== 'string') return 'Tournament name is required.';
  const trimmed = name.trim();
  if (trimmed.length < 3) return 'Tournament name must be at least 3 characters.';
  if (trimmed.length > 64) return 'Tournament name must not exceed 64 characters.';
  if (/^[<>]/.test(trimmed)) return 'Tournament name contains invalid characters.';
  return null;
}

/**
 * Validates prize pool format
 */
export function validatePrizePool(prize: string): string | null {
  if (!prize || typeof prize !== 'string') return 'Prize pool is required.';
  const clean = prize.replace(/[₹$,\s]/g, '').trim();
  if (!clean) return 'Please specify a valid prize amount.';
  const num = Number(clean);
  if (isNaN(num) || num < 0) return 'Prize pool must be a non-negative number.';
  return null;
}

/**
 * Validates rank tier
 */
export function validateRankTier(rank: number): string | null {
  if (typeof rank !== 'number' || !Number.isInteger(rank)) {
    return 'Rank tier must be an integer.';
  }
  if (rank < RankTier.BRONZE || rank > RankTier.GRANDMASTER) {
    return `Rank tier must be between ${RankTier.BRONZE} (Bronze) and ${RankTier.GRANDMASTER} (Grandmaster).`;
  }
  return null;
}

/**
 * Validates participant and team limits
 */
export function validateCapacity(
  type: TournamentType,
  maxParticipants?: number,
  maxTeams?: number,
  teamSize?: number
): string | null {
  if (type === 'SOLO') {
    const p = maxParticipants ?? 64;
    if (p < 2 || p > 512) return 'Solo tournaments must accommodate between 2 and 512 players.';
  } else if (type === 'TEAM') {
    const teams = maxTeams ?? 16;
    const size = teamSize ?? 4;
    if (teams < 2 || teams > 64) return 'Team tournaments must accommodate between 2 and 64 teams.';
    if (size < 2 || size > 10) return 'Team size must be between 2 and 10 players.';
  }
  return null;
}

/**
 * Validates tournament schedule chronology
 */
export function validateScheduleRules(schedule: TournamentSchedule): string | null {
  if (!schedule) return 'Tournament schedule is required.';

  const regStart = new Date(schedule.registrationStart).getTime();
  const regEnd = new Date(schedule.registrationEnd).getTime();
  const tourneyStart = new Date(schedule.tournamentStart).getTime();
  const tourneyEnd = new Date(schedule.tournamentEnd).getTime();

  if (isNaN(regStart) || isNaN(regEnd) || isNaN(tourneyStart) || isNaN(tourneyEnd)) {
    return 'Schedule dates must be valid ISO date strings.';
  }

  if (regStart >= regEnd) {
    return 'Registration Start must be earlier than Registration End.';
  }

  if (regEnd > tourneyStart) {
    return 'Registration End must be on or before Tournament Start.';
  }

  if (tourneyStart >= tourneyEnd) {
    return 'Tournament Start must be earlier than Tournament End.';
  }

  return null;
}

/**
 * Validates tournament location details
 */
export function validateLocationRules(location: TournamentLocation): string | null {
  if (!location) return 'Tournament location is required.';
  if (location.locationType === 'ONLINE' || location.locationType === 'HYBRID') {
    if (!location.onlinePlatform && !location.serverRegion) {
      return 'Online or hybrid tournaments must specify an online platform or server region.';
    }
  }
  if (location.locationType === 'OFFLINE' || location.locationType === 'HYBRID') {
    if (!location.venueName && !location.address && !location.city) {
      return 'Physical venues must specify venue name, city, or address.';
    }
  }
  return null;
}

/**
 * Validates complete tournament form input
 */
export function validateTournament(input: TournamentValidationInput): ValidationError[] {
  const errors: ValidationError[] = [];

  const nameErr = validateTournamentName(input.name);
  if (nameErr) errors.push({ field: 'name', message: nameErr });

  if (!input.gameTitle?.trim()) {
    errors.push({ field: 'gameTitle', message: 'Game title is required.' });
  }

  const prizeErr = validatePrizePool(input.prizePool);
  if (prizeErr) errors.push({ field: 'prizePool', message: prizeErr });

  const rankErr = validateRankTier(input.requirements?.minimumRank);
  if (rankErr) errors.push({ field: 'minimumRank', message: rankErr });

  if ((input.requirements?.minimumScore ?? 0) < 0) {
    errors.push({ field: 'minimumScore', message: 'Minimum score cannot be negative.' });
  }

  if ((input.requirements?.minimumWins ?? 0) < 0) {
    errors.push({ field: 'minimumWins', message: 'Minimum wins cannot be negative.' });
  }

  const capacityErr = validateCapacity(
    input.tournamentType,
    input.maxParticipants,
    input.maxTeams,
    input.teamSize
  );
  if (capacityErr) errors.push({ field: 'capacity', message: capacityErr });

  const scheduleErr = validateScheduleRules(input.schedule);
  if (scheduleErr) errors.push({ field: 'schedule', message: scheduleErr });

  const locationErr = validateLocationRules(input.location);
  if (locationErr) errors.push({ field: 'location', message: locationErr });

  return errors;
}
