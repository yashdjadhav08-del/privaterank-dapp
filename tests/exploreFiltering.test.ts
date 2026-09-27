import { describe, it, expect } from 'vitest';
import { Tournament, GameCategory, RankTier } from '../src/types';

/**
 * Filter function implementing the exact logic from ExplorePage.tsx
 */
function filterExploreTournaments(
  tournaments: Tournament[],
  searchQuery: string,
  selectedCategory: GameCategory,
  selectedRank: number
): Tournament[] {
  const safeTournaments = Array.isArray(tournaments) ? tournaments : [];

  // Exclude archived and cancelled tournaments from active player explore listings
  const activeTournaments = safeTournaments.filter(
    t => t && t.status !== 'ARCHIVED' && t.status !== 'CANCELLED'
  );

  return activeTournaments.filter(t => {
    if (!t) return false;
    const name = t.name || '';
    const gameTitle = t.gameTitle || '';
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gameTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const reqRank = t.requirements?.minimumRank || 1;
    const matchesRank = selectedRank === 0 || reqRank <= selectedRank;
    return matchesSearch && matchesCategory && matchesRank;
  });
}

describe('Explore Page Tournament Filtering', () => {
  const mockTournaments: Tournament[] = ([
    {
      id: 't-1',
      name: 'BGMI Pro Invitational',
      description: 'Competitive tournament',
      gameTitle: 'BGMI',
      category: 'Battle Royale',
      organizerAddress: 'addr1',
      organizerName: 'Organizer Alpha',
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
      applicantCount: 5,
      createdAt: '2026-10-01T00:00:00Z'
    },
    {
      id: 't-2',
      name: 'Valorant Midnight Clash',
      description: 'Tactical FPS',
      gameTitle: 'Valorant',
      category: 'FPS',
      organizerAddress: 'addr1',
      organizerName: 'Organizer Alpha',
      tournamentType: 'TEAM',
      teamSize: 5,
      maxTeams: 16,
      requirements: { minimumRank: RankTier.DIAMOND, minimumScore: 2500, minimumWins: 20 },
      prizePool: '₹50,000',
      schedule: {
        registrationStart: '2026-10-01T00:00:00Z',
        registrationEnd: '2026-10-05T00:00:00Z',
        tournamentStart: '2026-10-06T00:00:00Z',
        tournamentEnd: '2026-10-07T00:00:00Z'
      },
      location: { locationType: 'ONLINE' },
      status: 'OPEN',
      applicantCount: 8,
      createdAt: '2026-10-01T00:00:00Z'
    },
    {
      id: 't-3',
      name: 'Archived Tournament',
      description: 'Old deleted tournament',
      gameTitle: 'BGMI',
      category: 'Battle Royale',
      organizerAddress: 'addr1',
      organizerName: 'Organizer Alpha',
      tournamentType: 'SOLO',
      requirements: { minimumRank: RankTier.BRONZE, minimumScore: 0, minimumWins: 0 },
      prizePool: '₹5,000',
      schedule: {
        registrationStart: '2026-09-01T00:00:00Z',
        registrationEnd: '2026-09-05T00:00:00Z',
        tournamentStart: '2026-09-06T00:00:00Z',
        tournamentEnd: '2026-09-07T00:00:00Z'
      },
      location: { locationType: 'ONLINE' },
      status: 'ARCHIVED', // Archived on-chain!
      applicantCount: 12,
      createdAt: '2026-09-01T00:00:00Z'
    },
    {
      id: 't-4',
      name: 'Cancelled Event',
      description: 'Cancelled tournament',
      gameTitle: 'Apex Legends',
      category: 'Battle Royale',
      organizerAddress: 'addr1',
      organizerName: 'Organizer Alpha',
      tournamentType: 'SOLO',
      requirements: { minimumRank: RankTier.SILVER, minimumScore: 500, minimumWins: 2 },
      prizePool: '₹2,000',
      schedule: {
        registrationStart: '2026-09-01T00:00:00Z',
        registrationEnd: '2026-09-05T00:00:00Z',
        tournamentStart: '2026-09-06T00:00:00Z',
        tournamentEnd: '2026-09-07T00:00:00Z'
      },
      location: { locationType: 'ONLINE' },
      status: 'CANCELLED',
      applicantCount: 2,
      createdAt: '2026-09-01T00:00:00Z'
    }
  ] as unknown) as Tournament[];

  it('strictly excludes ARCHIVED tournaments from the result set', () => {
    const results = filterExploreTournaments(mockTournaments, '', 'All', 0);
    const ids = results.map(t => t.id);
    expect(ids).not.toContain('t-3');
    expect(results.some(t => t.status === 'ARCHIVED')).toBe(false);
  });

  it('strictly excludes CANCELLED tournaments from the result set', () => {
    const results = filterExploreTournaments(mockTournaments, '', 'All', 0);
    const ids = results.map(t => t.id);
    expect(ids).not.toContain('t-4');
    expect(results.some(t => t.status === 'CANCELLED')).toBe(false);
  });

  it('returns active OPEN tournaments when no filters applied', () => {
    const results = filterExploreTournaments(mockTournaments, '', 'All', 0);
    expect(results).toHaveLength(2);
    expect(results.map(t => t.id)).toEqual(['t-1', 't-2']);
  });

  it('filters tournaments by search keyword in tournament name or game title', () => {
    const searchByName = filterExploreTournaments(mockTournaments, 'pro invitational', 'All', 0);
    expect(searchByName).toHaveLength(1);
    expect(searchByName[0].id).toBe('t-1');

    const searchByGame = filterExploreTournaments(mockTournaments, 'valorant', 'All', 0);
    expect(searchByGame).toHaveLength(1);
    expect(searchByGame[0].id).toBe('t-2');
  });

  it('filters tournaments by game category pill', () => {
    const fpsOnly = filterExploreTournaments(mockTournaments, '', 'FPS', 0);
    expect(fpsOnly).toHaveLength(1);
    expect(fpsOnly[0].gameTitle).toBe('Valorant');

    const brOnly = filterExploreTournaments(mockTournaments, '', 'Battle Royale', 0);
    expect(brOnly).toHaveLength(1);
    expect(brOnly[0].gameTitle).toBe('BGMI');
  });

  it('filters tournaments by rank tier requirements', () => {
    // RankTier.GOLD = 3
    const goldAndUnder = filterExploreTournaments(mockTournaments, '', 'All', RankTier.GOLD);
    expect(goldAndUnder).toHaveLength(1);
    expect(goldAndUnder[0].id).toBe('t-1');

    // RankTier.DIAMOND = 5
    const diamondAndUnder = filterExploreTournaments(mockTournaments, '', 'All', RankTier.DIAMOND);
    expect(diamondAndUnder).toHaveLength(2);
  });

  it('handles empty or malformed tournament arrays safely', () => {
    expect(filterExploreTournaments([], '', 'All', 0)).toEqual([]);
    expect(filterExploreTournaments(null as any, '', 'All', 0)).toEqual([]);
    expect(filterExploreTournaments([null as any], '', 'All', 0)).toEqual([]);
  });
});
