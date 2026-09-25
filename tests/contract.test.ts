import { describe, it, expect, beforeEach } from 'vitest';
import { ContractService } from '../src/contracts/contractService';
import { ZkProverService } from '../src/contracts/zkProver';
import { AuthService } from '../src/wallet/authService';
import { RankTier, TournamentSchedule, TournamentLocation } from '../src/types';

describe('Midnight ContractService & Solo/Team Tournament System', () => {
  const organizerAddress = 'addr_test1midnight_organizer_main';
  const player1 = 'addr_test1midnight_player_1';
  const player2 = 'addr_test1midnight_player_2';
  const player3 = 'addr_test1midnight_player_3';
  const player4 = 'addr_test1midnight_player_4';
  const player5 = 'addr_test1midnight_player_5';

  const defaultSchedule: TournamentSchedule = {
    registrationStart: new Date(Date.now() - 3600000).toISOString(),
    registrationEnd: new Date(Date.now() + 86400000 * 5).toISOString(),
    tournamentStart: new Date(Date.now() + 86400000 * 7).toISOString(),
    tournamentEnd: new Date(Date.now() + 86400000 * 8).toISOString()
  };

  const defaultLocation: TournamentLocation = {
    locationType: 'ONLINE',
    onlinePlatform: 'Discord',
    serverRegion: 'Asia (India)'
  };

  beforeEach(() => {
    localStorage.clear();
    AuthService.registerOrganizer(organizerAddress, 'Main Organizer', 'Midnight Arena');
  });

  it('should validate tournament schedule invariants', () => {
    // 1. Reg Start >= Reg End
    expect(() => {
      ContractService.validateSchedule({
        registrationStart: '2026-10-15T00:00:00Z',
        registrationEnd: '2026-10-10T00:00:00Z',
        tournamentStart: '2026-10-18T00:00:00Z',
        tournamentEnd: '2026-10-20T00:00:00Z'
      });
    }).toThrow('Registration Start must be before Registration End.');

    // 2. Reg End > Tournament Start
    expect(() => {
      ContractService.validateSchedule({
        registrationStart: '2026-10-10T00:00:00Z',
        registrationEnd: '2026-10-19T00:00:00Z',
        tournamentStart: '2026-10-18T00:00:00Z',
        tournamentEnd: '2026-10-20T00:00:00Z'
      });
    }).toThrow('Registration End must be before or equal to Tournament Start.');

    // 3. Tournament Start >= Tournament End
    expect(() => {
      ContractService.validateSchedule({
        registrationStart: '2026-10-10T00:00:00Z',
        registrationEnd: '2026-10-15T00:00:00Z',
        tournamentStart: '2026-10-20T00:00:00Z',
        tournamentEnd: '2026-10-18T00:00:00Z'
      });
    }).toThrow('Tournament Start must be before Tournament End.');
  });

  it('should automatically compute and enforce Maximum Players = Team Size × Max Teams for TEAM tournaments', () => {
    const tourney = ContractService.createTournament({
      name: 'BGMI Squad Clash',
      description: 'Official 4v4 BGMI championship',
      gameTitle: 'BGMI',
      organizerAddress,
      organizerName: 'Main Organizer',
      tournamentType: 'TEAM',
      teamSize: 4,
      maxTeams: 16,
      requirements: {
        minimumRank: RankTier.PLATINUM,
        minimumScore: 2000,
        minimumWins: 10
      },
      prizePool: '10,000 DUST',
      schedule: defaultSchedule,
      location: defaultLocation
    });

    expect(tourney.tournamentType).toBe('TEAM');
    expect(tourney.teamSize).toBe(4);
    expect(tourney.maxTeams).toBe(16);
    expect(tourney.maxParticipants).toBe(64); // 4 * 16 = 64
  });

  it('should allow player to create team and become captain', async () => {
    const tourney = ContractService.createTournament({
      name: 'Free Fire Duo Championship',
      description: 'Duo matches',
      gameTitle: 'Free Fire',
      organizerAddress,
      organizerName: 'Main Organizer',
      tournamentType: 'TEAM',
      teamSize: 2,
      maxTeams: 8,
      requirements: {
        minimumRank: RankTier.GOLD,
        minimumScore: 1000,
        minimumWins: 5
      },
      prizePool: '2,000 DUST',
      schedule: defaultSchedule,
      location: defaultLocation
    });

    const team = ContractService.createTeam({
      tournamentId: tourney.id,
      captainWalletAddress: player1,
      captainAnonymousId: 'PR-P101',
      teamName: 'Team Phoenix',
      gamingCredentials: {
        rank: RankTier.PLATINUM,
        score: 1500,
        wins: 12,
        losses: 2,
        achievements: ['Sharpshooter'],
        gameTitle: 'Free Fire',
        verifiedAt: new Date().toISOString()
      }
    });

    expect(team.id).toBeDefined();
    expect(team.name).toBe('Team Phoenix');
    expect(team.captainWalletAddress).toBe(player1);
    expect(team.members.length).toBe(1);
    expect(team.status).toBe('RECRUITING');

    const updatedTourney = ContractService.getTournamentById(tourney.id);
    expect(updatedTourney?.currentTeams).toBe(1);
  });

  it('should enforce maximum team size (prevent extra members from joining)', () => {
    const tourney = ContractService.createTournament({
      name: 'Valorant 2v2',
      description: 'Duo Valorant',
      gameTitle: 'Valorant',
      organizerAddress,
      organizerName: 'Main Organizer',
      tournamentType: 'TEAM',
      teamSize: 2,
      maxTeams: 4,
      requirements: {
        minimumRank: RankTier.SILVER,
        minimumScore: 500,
        minimumWins: 0
      },
      prizePool: '1,000 DUST',
      schedule: defaultSchedule,
      location: defaultLocation
    });

    // 1. Player 1 creates team (1/2 members)
    const team = ContractService.createTeam({
      tournamentId: tourney.id,
      captainWalletAddress: player1,
      captainAnonymousId: 'PR-P1',
      teamName: 'Duo Dominators',
      gamingCredentials: {
        rank: RankTier.GOLD,
        score: 800,
        wins: 5,
        losses: 1,
        achievements: [],
        gameTitle: 'Valorant',
        verifiedAt: new Date().toISOString()
      }
    });

    // 2. Player 2 joins (2/2 members)
    ContractService.joinTeam({
      tournamentId: tourney.id,
      teamId: team.id,
      playerWalletAddress: player2,
      anonymousPlayerId: 'PR-P2',
      gamingCredentials: {
        rank: RankTier.GOLD,
        score: 850,
        wins: 6,
        losses: 2,
        achievements: [],
        gameTitle: 'Valorant',
        verifiedAt: new Date().toISOString()
      }
    });

    // 3. Player 3 attempts to join full team (should fail)
    expect(() => {
      ContractService.joinTeam({
        tournamentId: tourney.id,
        teamId: team.id,
        playerWalletAddress: player3,
        anonymousPlayerId: 'PR-P3',
        gamingCredentials: {
          rank: RankTier.GOLD,
          score: 900,
          wins: 8,
          losses: 2,
          achievements: [],
          gameTitle: 'Valorant',
          verifiedAt: new Date().toISOString()
        }
      });
    }).toThrow('Team is full.');
  });

  it('should prevent a player from joining two teams in the same tournament', () => {
    const tourney = ContractService.createTournament({
      name: 'Apex Trios',
      description: 'Trios match',
      gameTitle: 'Apex',
      organizerAddress,
      organizerName: 'Main Organizer',
      tournamentType: 'TEAM',
      teamSize: 3,
      maxTeams: 4,
      requirements: {
        minimumRank: RankTier.SILVER,
        minimumScore: 500,
        minimumWins: 0
      },
      prizePool: '1,000 DUST',
      schedule: defaultSchedule,
      location: defaultLocation
    });

    const team1 = ContractService.createTeam({
      tournamentId: tourney.id,
      captainWalletAddress: player1,
      captainAnonymousId: 'PR-P1',
      teamName: 'Apex Alpha',
      gamingCredentials: {
        rank: RankTier.GOLD,
        score: 800,
        wins: 5,
        losses: 1,
        achievements: [],
        gameTitle: 'Apex',
        verifiedAt: new Date().toISOString()
      }
    });

    const team2 = ContractService.createTeam({
      tournamentId: tourney.id,
      captainWalletAddress: player2,
      captainAnonymousId: 'PR-P2',
      teamName: 'Apex Beta',
      gamingCredentials: {
        rank: RankTier.GOLD,
        score: 800,
        wins: 5,
        losses: 1,
        achievements: [],
        gameTitle: 'Apex',
        verifiedAt: new Date().toISOString()
      }
    });

    // Player 1 attempts to join team 2 while being captain of team 1
    expect(() => {
      ContractService.joinTeam({
        tournamentId: tourney.id,
        teamId: team2.id,
        playerWalletAddress: player1,
        anonymousPlayerId: 'PR-P1',
        gamingCredentials: {
          rank: RankTier.GOLD,
          score: 800,
          wins: 5,
          losses: 1,
          achievements: [],
          gameTitle: 'Apex',
          verifiedAt: new Date().toISOString()
        }
      });
    }).toThrow('Duplicate Membership');
  });

  it('should allow Captain to finalize a full eligible team and lock roster', () => {
    const tourney = ContractService.createTournament({
      name: 'CS2 Duo',
      description: 'CS2 2v2',
      gameTitle: 'CS2',
      organizerAddress,
      organizerName: 'Main Organizer',
      tournamentType: 'TEAM',
      teamSize: 2,
      maxTeams: 4,
      requirements: {
        minimumRank: RankTier.BRONZE,
        minimumScore: 100,
        minimumWins: 0
      },
      prizePool: '500 DUST',
      schedule: defaultSchedule,
      location: defaultLocation
    });

    const team = ContractService.createTeam({
      tournamentId: tourney.id,
      captainWalletAddress: player1,
      captainAnonymousId: 'PR-P1',
      teamName: 'Strike Duo',
      gamingCredentials: {
        rank: RankTier.SILVER,
        score: 400,
        wins: 2,
        losses: 0,
        achievements: [],
        gameTitle: 'CS2',
        verifiedAt: new Date().toISOString()
      }
    });

    // Incomplete team cannot finalize
    expect(() => {
      ContractService.finalizeTeam({
        tournamentId: tourney.id,
        teamId: team.id,
        captainWalletAddress: player1
      });
    }).toThrow('Cannot finalize team: Incomplete roster');

    // Add 2nd player
    ContractService.joinTeam({
      tournamentId: tourney.id,
      teamId: team.id,
      playerWalletAddress: player2,
      anonymousPlayerId: 'PR-P2',
      gamingCredentials: {
        rank: RankTier.SILVER,
        score: 420,
        wins: 3,
        losses: 1,
        achievements: [],
        gameTitle: 'CS2',
        verifiedAt: new Date().toISOString()
      }
    });

    // Non-captain cannot finalize
    expect(() => {
      ContractService.finalizeTeam({
        tournamentId: tourney.id,
        teamId: team.id,
        captainWalletAddress: player2
      });
    }).toThrow('Unauthorized: Only the team captain can finalize the team.');

    // Captain finalizes full team
    const finalized = ContractService.finalizeTeam({
      tournamentId: tourney.id,
      teamId: team.id,
      captainWalletAddress: player1
    });

    expect(finalized.status).toBe('FINALIZED');
    expect(finalized.finalizedAt).toBeDefined();

    // No new members can join finalized team
    expect(() => {
      ContractService.joinTeam({
        tournamentId: tourney.id,
        teamId: team.id,
        playerWalletAddress: player3,
        anonymousPlayerId: 'PR-P3',
        gamingCredentials: {
          rank: RankTier.GOLD,
          score: 800,
          wins: 5,
          losses: 1,
          achievements: [],
          gameTitle: 'CS2',
          verifiedAt: new Date().toISOString()
        }
      });
    }).toThrow('Team is already finalized.');
  });

  it('should enforce strict deletion rules: only COMPLETED tournaments can be deleted by their creator organizer', () => {
    const otherOrganizer = 'addr_test1midnight_organizer_beta';
    AuthService.registerOrganizer(otherOrganizer, 'Beta Organizer', 'Midnight Guild');

    // 1. Active tournament (registration open) cannot be deleted
    const activeTourney = ContractService.createTournament({
      name: 'Active Clash',
      description: 'Currently active',
      gameTitle: 'Valorant',
      organizerAddress,
      organizerName: 'Main Organizer',
      tournamentType: 'SOLO',
      requirements: { minimumRank: RankTier.SILVER, minimumScore: 500, minimumWins: 2 },
      prizePool: '2,000 DUST',
      schedule: defaultSchedule,
      location: defaultLocation
    });

    expect(() => {
      ContractService.deleteTournament(activeTourney.id, organizerAddress);
    }).toThrow(/Deletion Restricted: Tournament cannot be deleted/);

    // 2. Completed tournament (past end date)
    const completedSchedule: TournamentSchedule = {
      registrationStart: new Date(Date.now() - 86400000 * 10).toISOString(),
      registrationEnd: new Date(Date.now() - 86400000 * 8).toISOString(),
      tournamentStart: new Date(Date.now() - 86400000 * 5).toISOString(),
      tournamentEnd: new Date(Date.now() - 86400000 * 2).toISOString() // Ended 2 days ago
    };

    const completedTourney = ContractService.createTournament({
      name: 'Completed Valorant Cup',
      description: 'Championship finished',
      gameTitle: 'Valorant',
      organizerAddress,
      organizerName: 'Main Organizer',
      tournamentType: 'SOLO',
      requirements: { minimumRank: RankTier.GOLD, minimumScore: 1000, minimumWins: 5 },
      prizePool: '10,000 DUST',
      schedule: completedSchedule,
      location: defaultLocation
    });

    expect(ContractService.deriveTournamentStatus(completedTourney)).toBe('COMPLETED');

    // Unauthorized organizer cannot delete
    expect(() => {
      ContractService.deleteTournament(completedTourney.id, otherOrganizer);
    }).toThrow('Unauthorized: Only the creator organizer can delete this tournament.');

    // Creator organizer can delete completed tournament
    const delRes = ContractService.deleteTournament(completedTourney.id, organizerAddress);
    expect(delRes.tournament.status).toBe('ARCHIVED');
    expect(delRes.message).toBe('Tournament archived successfully.');

    // Active listing should not include the archived tournament
    const activeList = ContractService.listTournaments();
    expect(activeList.find(t => t.id === completedTourney.id)).toBeUndefined();

    // Querying with includeArchived returns it
    const fullList = ContractService.listTournaments(undefined, true);
    expect(fullList.find(t => t.id === completedTourney.id)?.status).toBe('ARCHIVED');
  });
});
