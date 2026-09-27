import { describe, it, expect } from 'vitest';
import { Tournament, RankTier } from '../src/types';

interface GuardEvaluation {
  canJoinSolo: boolean;
  canCreateTeam: boolean;
  canJoinTeam: boolean;
  errorReason: string | null;
}

/**
 * Replicates the permission and status guards implemented in GameDetailsPage.tsx
 */
function evaluateTournamentActionGuards(
  tournament: Tournament,
  role: 'ORGANIZER' | 'PLAYER' | null,
  playerRank: number,
  isAlreadyMember: boolean = false
): GuardEvaluation {
  if (tournament.status === 'ARCHIVED' || tournament.status === 'CLOSED') {
    const reason = `This tournament is ${tournament.status.toLowerCase()} and is no longer accepting entries.`;
    return {
      canJoinSolo: false,
      canCreateTeam: false,
      canJoinTeam: false,
      errorReason: reason
    };
  }

  if (role === 'ORGANIZER') {
    return {
      canJoinSolo: false,
      canCreateTeam: false,
      canJoinTeam: false,
      errorReason: 'Organizers cannot participate in tournaments.'
    };
  }

  const reqRank = tournament.requirements?.minimumRank || 1;
  if (playerRank < reqRank) {
    return {
      canJoinSolo: false,
      canCreateTeam: false,
      canJoinTeam: false,
      errorReason: `Rank tier ${playerRank} does not meet tournament minimum ${reqRank}.`
    };
  }

  if (isAlreadyMember) {
    return {
      canJoinSolo: false,
      canCreateTeam: false,
      canJoinTeam: false,
      errorReason: 'Player is already registered in this tournament.'
    };
  }

  return {
    canJoinSolo: tournament.tournamentType === 'SOLO',
    canCreateTeam: tournament.tournamentType === 'TEAM',
    canJoinTeam: tournament.tournamentType === 'TEAM',
    errorReason: null
  };
}

describe('GameDetails Tournament Guardrails', () => {
  const openSoloTourney: Tournament = {
    id: 'open-1',
    name: 'Open Solo Cup',
    description: '',
    gameTitle: 'BGMI',
    category: 'Battle Royale',
    organizerAddress: 'org1',
    organizerName: 'Organizer',
    tournamentType: 'SOLO',
    requirements: { minimumRank: RankTier.GOLD, minimumScore: 1000, minimumWins: 5 },
    prizePool: '₹10,000',
    schedule: {
      registrationStart: '2026-10-01T00:00:00Z',
      registrationEnd: '2026-10-05T00:00:00Z',
      tournamentStart: '2026-10-06T00:00:00Z',
      tournamentEnd: '2026-10-07T00:00:00Z'
    },
    location: { locationType: 'ONLINE' },
    status: 'OPEN',
    applicantCount: 0,
    createdAt: '2026-10-01T00:00:00Z'
  };

  const archivedTourney: Tournament = {
    ...openSoloTourney,
    id: 'archived-1',
    name: 'Archived Solo Cup',
    status: 'ARCHIVED'
  };

  const closedTourney: Tournament = {
    ...openSoloTourney,
    id: 'closed-1',
    name: 'Closed Solo Cup',
    status: 'CLOSED'
  };

  const openTeamTourney: Tournament = {
    ...openSoloTourney,
    id: 'team-1',
    name: 'Open Squad Cup',
    tournamentType: 'TEAM',
    teamSize: 4,
    maxTeams: 16
  };

  it('strictly blocks solo entries if tournament is ARCHIVED', () => {
    const res = evaluateTournamentActionGuards(archivedTourney, 'PLAYER', RankTier.PLATINUM);
    expect(res.canJoinSolo).toBe(false);
    expect(res.errorReason).toMatch(/archived/i);
  });

  it('strictly blocks team creation and joins if tournament is ARCHIVED', () => {
    const res = evaluateTournamentActionGuards(
      { ...openTeamTourney, status: 'ARCHIVED' },
      'PLAYER',
      RankTier.DIAMOND
    );
    expect(res.canCreateTeam).toBe(false);
    expect(res.canJoinTeam).toBe(false);
    expect(res.errorReason).toMatch(/archived/i);
  });

  it('strictly blocks actions if tournament is CLOSED', () => {
    const res = evaluateTournamentActionGuards(closedTourney, 'PLAYER', RankTier.PLATINUM);
    expect(res.canJoinSolo).toBe(false);
    expect(res.errorReason).toMatch(/closed/i);
  });

  it('allows eligible player to join open solo tournament', () => {
    const res = evaluateTournamentActionGuards(openSoloTourney, 'PLAYER', RankTier.PLATINUM);
    expect(res.canJoinSolo).toBe(true);
    expect(res.errorReason).toBeNull();
  });

  it('rejects player with insufficient rank tier', () => {
    // tournament requires GOLD (Tier 3), player is SILVER (Tier 2)
    const res = evaluateTournamentActionGuards(openSoloTourney, 'PLAYER', RankTier.SILVER);
    expect(res.canJoinSolo).toBe(false);
    expect(res.errorReason).toMatch(/does not meet tournament minimum/);
  });

  it('blocks organizer role from participating in tournaments', () => {
    const res = evaluateTournamentActionGuards(openSoloTourney, 'ORGANIZER', RankTier.MASTER);
    expect(res.canJoinSolo).toBe(false);
    expect(res.errorReason).toMatch(/Organizers cannot participate/);
  });

  it('blocks player from duplicate registration', () => {
    const res = evaluateTournamentActionGuards(openSoloTourney, 'PLAYER', RankTier.GOLD, true);
    expect(res.canJoinSolo).toBe(false);
    expect(res.errorReason).toMatch(/already registered/);
  });
});
