import { 
  Application, 
  GameCategory, 
  GamingCredentials, 
  Team, 
  TeamMember, 
  TeamStatus, 
  Tournament, 
  TournamentLocation, 
  TournamentRequirements, 
  TournamentSchedule, 
  TournamentStatus, 
  TournamentType, 
  ZKProofPayload 
} from '../types';
import { ZkProverService } from './zkProver';
import { getPreprodConfig } from '../config/network';
import { safeAddressCompare, normalizeAddress } from '../utils/crypto';
import { AuthService } from '../wallet/authService';

const TOURNAMENTS_STORAGE_KEY = 'privaterank_midnight_tournaments_v4';
const APPLICATIONS_STORAGE_KEY = 'privaterank_midnight_applications_v4';
const TEAMS_STORAGE_KEY = 'privaterank_midnight_teams_v4';

export class ContractService {
  public static getContractConfig() {
    return getPreprodConfig();
  }

  // --- LEDGER STORAGE HELPERS ---

  public static getTournaments(): Tournament[] {
    try {
      const stored = localStorage.getItem(TOURNAMENTS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return [];
  }

  private static saveTournaments(tournaments: Tournament[]): void {
    try {
      localStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(tournaments));
    } catch {
      // fallback
    }
  }

  public static getApplications(): Application[] {
    try {
      const stored = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return [];
  }

  private static saveApplications(applications: Application[]): void {
    try {
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(applications));
    } catch {
      // fallback
    }
  }

  public static getTeams(): Team[] {
    try {
      const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return [];
  }

  private static saveTeams(teams: Team[]): void {
    try {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    } catch {
      // fallback
    }
  }

  // --- SCHEDULE VALIDATION ---
  public static validateSchedule(schedule: TournamentSchedule): void {
    const regStart = new Date(schedule.registrationStart).getTime();
    const regEnd = new Date(schedule.registrationEnd).getTime();
    const tourneyStart = new Date(schedule.tournamentStart).getTime();
    const tourneyEnd = new Date(schedule.tournamentEnd).getTime();

    if (isNaN(regStart) || isNaN(regEnd) || isNaN(tourneyStart) || isNaN(tourneyEnd)) {
      throw new Error('Invalid schedule: All dates must be valid ISO date strings.');
    }

    if (regStart >= regEnd) {
      throw new Error('Schedule Error: Registration Start must be before Registration End.');
    }

    if (regEnd > tourneyStart) {
      throw new Error('Schedule Error: Registration End must be before or equal to Tournament Start.');
    }

    if (tourneyStart >= tourneyEnd) {
      throw new Error('Schedule Error: Tournament Start must be before Tournament End.');
    }
  }

  // Derive dynamic tournament status based on schedule & explicit state
  public static deriveTournamentStatus(tournament: Tournament): TournamentStatus {
    if (tournament.status === 'CLOSED' || tournament.status === 'CANCELLED') {
      return tournament.status;
    }

    if (!tournament.schedule) {
      return tournament.status || 'OPEN';
    }

    const now = Date.now();
    const regStart = new Date(tournament.schedule.registrationStart).getTime();
    const regEnd = new Date(tournament.schedule.registrationEnd).getTime();
    const tourneyStart = new Date(tournament.schedule.tournamentStart).getTime();
    const tourneyEnd = new Date(tournament.schedule.tournamentEnd).getTime();

    if (now < regStart) return 'UPCOMING';
    if (now >= regStart && now <= regEnd) return 'REGISTRATION_OPEN';
    if (now > regEnd && now < tourneyStart) return 'REGISTRATION_CLOSED';
    if (now >= tourneyStart && now <= tourneyEnd) return 'ONGOING';
    if (now > tourneyEnd) return 'COMPLETED';

    return tournament.status || 'OPEN';
  }

  // --- TOURNAMENT QUERIES ---

  public static listTournaments(filterStatus?: TournamentStatus): Tournament[] {
    const list = this.getTournaments().map(t => ({
      ...t,
      status: this.deriveTournamentStatus(t)
    }));
    if (filterStatus) {
      return list.filter(t => t.status === filterStatus);
    }
    return list;
  }

  public static getTournamentById(id: string): Tournament | null {
    const list = this.getTournaments();
    const found = list.find(t => t.id === id);
    if (!found) return null;
    return {
      ...found,
      status: this.deriveTournamentStatus(found)
    };
  }

  // --- TOURNAMENT CREATION ---

  public static createTournament(params: {
    name: string;
    description: string;
    gameTitle: string;
    category?: GameCategory;
    gameImage?: string;
    organizerAddress: string;
    organizerName: string;
    tournamentType?: TournamentType;
    teamSize?: number;
    maxTeams?: number;
    maxParticipants?: number;
    requirements: TournamentRequirements;
    prizePool: string;
    schedule?: TournamentSchedule;
    location?: TournamentLocation;
    applicationDeadline?: string;
    startDate?: string;
    status?: TournamentStatus;
    rules?: string[];
  }): Tournament {

    // 1. Authorization invariant
    if (!AuthService.isOrganizerAuthorized(params.organizerAddress)) {
      throw new Error('Access Denied: Caller address is not an authorized organizer.');
    }

    const tType = params.tournamentType || 'SOLO';

    // Construct schedule with defaults if not provided
    const defaultSchedule: TournamentSchedule = {
      registrationStart: new Date().toISOString(),
      registrationEnd: params.applicationDeadline || new Date(Date.now() + 86400000 * 30).toISOString(),
      tournamentStart: params.startDate || new Date(Date.now() + 86400000 * 35).toISOString(),
      tournamentEnd: new Date(Date.now() + 86400000 * 36).toISOString()
    };

    const finalSchedule = params.schedule || defaultSchedule;
    this.validateSchedule(finalSchedule);

    // Default location if not provided
    const finalLocation: TournamentLocation = params.location || {
      locationType: 'ONLINE',
      onlinePlatform: 'Midnight Network Preprod'
    };

    // 2. Validate and enforce team / solo capacity constraints
    let teamSize = 1;
    let maxTeams = 0;
    let maxParticipants = params.maxParticipants || 64;

    if (tType === 'TEAM') {
      teamSize = Number(params.teamSize) || 4;
      maxTeams = Number(params.maxTeams) || 16;
      if (teamSize < 2) {
        throw new Error('Team Tournament Error: Team size must be at least 2.');
      }
      if (maxTeams < 2) {
        throw new Error('Team Tournament Error: Maximum teams must be at least 2.');
      }
      // Strictly enforce on-chain formula: Max Players = Team Size * Max Teams
      maxParticipants = teamSize * maxTeams;
    } else {
      teamSize = 1;
      maxTeams = 0;
      if (maxParticipants < 2) {
        maxParticipants = 64;
      }
    }

    const tournaments = this.getTournaments();
    const newTournament: Tournament = {
      id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: params.name.trim(),
      description: params.description.trim(),
      gameTitle: params.gameTitle.trim(),
      category: params.category || 'FPS',
      gameImage: params.gameImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      organizerAddress: normalizeAddress(params.organizerAddress),
      organizerName: params.organizerName || 'Tournament Organizer',
      tournamentType: tType,
      teamSize,
      maxTeams,
      currentTeams: 0,
      requirements: params.requirements,
      prizePool: params.prizePool || 'TBD',
      maxParticipants,
      currentParticipants: 0,
      schedule: finalSchedule,
      applicationDeadline: finalSchedule.registrationEnd,
      startDate: finalSchedule.tournamentStart,
      location: finalLocation,
      status: params.status || 'OPEN',
      applicantCount: 0,
      createdAt: new Date().toISOString(),
      rules: params.rules || []
    };



    tournaments.unshift(newTournament);
    this.saveTournaments(tournaments);
    return newTournament;
  }


  public static publishTournament(tournamentId: string, organizerAddress: string): Tournament {
    if (!AuthService.isOrganizerAuthorized(organizerAddress)) {
      throw new Error('Access Denied: Caller address is not an authorized organizer.');
    }

    const tournaments = this.getTournaments();
    const index = tournaments.findIndex(t => t.id === tournamentId);
    if (index === -1) throw new Error('Tournament not found');

    if (!safeAddressCompare(tournaments[index].organizerAddress, organizerAddress)) {
      throw new Error('Unauthorized: Only tournament creator can publish this tournament');
    }

    tournaments[index].status = 'REGISTRATION_OPEN';
    this.saveTournaments(tournaments);
    return tournaments[index];
  }

  public static closeTournament(tournamentId: string, organizerAddress: string): Tournament {
    if (!AuthService.isOrganizerAuthorized(organizerAddress)) {
      throw new Error('Access Denied: Caller address is not an authorized organizer.');
    }

    const tournaments = this.getTournaments();
    const index = tournaments.findIndex(t => t.id === tournamentId);
    if (index === -1) throw new Error('Tournament not found');

    if (!safeAddressCompare(tournaments[index].organizerAddress, organizerAddress)) {
      throw new Error('Unauthorized: Only tournament creator can close this tournament');
    }

    tournaments[index].status = 'CLOSED';
    this.saveTournaments(tournaments);
    return tournaments[index];
  }

  // --- SOLO TOURNAMENT APPLICATION ---

  public static submitApplication(params: {
    tournamentId: string;
    playerWalletAddress: string;
    anonymousPlayerId: string;
    gamingCredentials: GamingCredentials;
    proof: ZKProofPayload;
  }): Application {
    // Strict Role Separation: Organizer wallets cannot act as players
    if (AuthService.isOrganizerAuthorized(params.playerWalletAddress)) {
      throw new Error('Access Restricted: Organizer wallets are not permitted to participate as players or join teams.');
    }

    const tournaments = this.getTournaments();
    const tourney = tournaments.find(t => t.id === params.tournamentId);
    if (!tourney) throw new Error('Tournament not found');


    const derivedStatus = this.deriveTournamentStatus(tourney);
    if (derivedStatus === 'REGISTRATION_CLOSED' || derivedStatus === 'CLOSED' || derivedStatus === 'COMPLETED') {
      throw new Error('Tournament registration is closed.');
    }

    if (tourney.tournamentType === 'TEAM') {
      throw new Error('This is a TEAM tournament. Please create or join a team instead of individual application.');
    }

    if (tourney.currentParticipants >= tourney.maxParticipants) {
      throw new Error('Tournament is full (maximum participants reached).');
    }

    // Verify ZK Proof against tournament requirements
    const verification = ZkProverService.verifyProof(params.proof, tourney.requirements);
    if (!verification.isValid) {
      throw new Error(`Invalid proof: ${verification.reason}`);
    }

    const applications = this.getApplications();
    const existing = applications.find(
      a => a.tournamentId === params.tournamentId && safeAddressCompare(a.playerWalletAddress, params.playerWalletAddress)
    );

    if (existing) {
      throw new Error('You have already joined this tournament');
    }

    const newApp: Application = {
      id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tournamentId: params.tournamentId,
      tournamentName: tourney.name,
      anonymousPlayerId: params.anonymousPlayerId,
      playerWalletAddress: normalizeAddress(params.playerWalletAddress),
      gamingCredentials: {
        rank: params.gamingCredentials.rank,
        score: params.gamingCredentials.score,
        wins: params.gamingCredentials.wins,
        losses: params.gamingCredentials.losses
      },
      proof: params.proof,
      status: 'PENDING_REVIEW',
      submittedAt: new Date().toISOString()
    };

    applications.unshift(newApp);
    this.saveApplications(applications);

    tourney.applicantCount = (tourney.applicantCount || 0) + 1;
    tourney.currentParticipants = (tourney.currentParticipants || 0) + 1;
    this.saveTournaments(tournaments);

    return newApp;
  }

  // --- TEAM MANAGEMENT CONTRACT INVARIANTS ---

  public static createTeam(params: {
    tournamentId: string;
    captainWalletAddress: string;
    captainAnonymousId: string;
    teamName: string;
    gamingCredentials: GamingCredentials;
    proof?: ZKProofPayload;
  }): Team {
    // Strict Role Separation: Organizer wallets cannot create teams
    if (AuthService.isOrganizerAuthorized(params.captainWalletAddress)) {
      throw new Error('Access Restricted: Organizer wallets are not permitted to participate as players or join teams.');
    }

    const tournaments = this.getTournaments();
    const tourney = tournaments.find(t => t.id === params.tournamentId);
    if (!tourney) throw new Error('Tournament not found');

    if (tourney.tournamentType !== 'TEAM') {
      throw new Error('Cannot create team: This is a SOLO tournament.');
    }

    const derivedStatus = this.deriveTournamentStatus(tourney);
    if (derivedStatus === 'REGISTRATION_CLOSED' || derivedStatus === 'CLOSED' || derivedStatus === 'COMPLETED') {
      throw new Error('Tournament registration is closed.');
    }

    const teams = this.getTeams();
    const tournamentTeams = teams.filter(t => t.tournamentId === params.tournamentId);

    // Rule: Max teams enforcement
    if (tournamentTeams.length >= tourney.maxTeams) {
      throw new Error(`Maximum teams limit reached (${tourney.maxTeams} teams). Creation of additional teams is forbidden.`);
    }

    // Rule: Duplicate membership invariant
    const alreadyInTeam = tournamentTeams.some(t =>
      t.members.some(m => safeAddressCompare(m.playerWalletAddress, params.captainWalletAddress))
    );
    if (alreadyInTeam) {
      throw new Error('Duplicate Membership: You already belong to a team in this tournament.');
    }

    // Check captain eligibility
    let isEligible = true;
    if (params.proof) {
      const verification = ZkProverService.verifyProof(params.proof, tourney.requirements);
      isEligible = verification.isValid;
    } else {
      isEligible = params.gamingCredentials.rank >= tourney.requirements.minimumRank &&
                   params.gamingCredentials.score >= tourney.requirements.minimumScore &&
                   params.gamingCredentials.wins >= tourney.requirements.minimumWins;
    }

    if (!isEligible) {
      throw new Error('Captain Eligibility Error: Captain does not satisfy tournament requirements.');
    }

    const captainMember: TeamMember = {
      playerWalletAddress: normalizeAddress(params.captainWalletAddress),
      anonymousPlayerId: params.captainAnonymousId,
      gamingCredentials: params.gamingCredentials,
      proof: params.proof,
      isEligible: true,
      joinedAt: new Date().toISOString()
    };

    const newTeam: Team = {
      id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tournamentId: params.tournamentId,
      name: params.teamName.trim(),
      captainWalletAddress: normalizeAddress(params.captainWalletAddress),
      captainAnonymousId: params.captainAnonymousId,
      teamSize: tourney.teamSize,
      members: [captainMember],
      status: 'RECRUITING',
      createdAt: new Date().toISOString()
    };

    teams.push(newTeam);
    this.saveTeams(teams);

    tourney.currentTeams = tournamentTeams.length + 1;
    tourney.currentParticipants = (tourney.currentParticipants || 0) + 1;
    this.saveTournaments(tournaments);

    return newTeam;
  }

  public static joinTeam(params: {
    tournamentId: string;
    teamId: string;
    playerWalletAddress: string;
    anonymousPlayerId: string;
    gamingCredentials: GamingCredentials;
    proof?: ZKProofPayload;
  }): Team {
    // Strict Role Separation: Organizer wallets cannot join teams
    if (AuthService.isOrganizerAuthorized(params.playerWalletAddress)) {
      throw new Error('Access Restricted: Organizer wallets are not permitted to participate as players or join teams.');
    }

    const tournaments = this.getTournaments();

    const tourney = tournaments.find(t => t.id === params.tournamentId);
    if (!tourney) throw new Error('Tournament not found');

    const teams = this.getTeams();
    const teamIndex = teams.findIndex(t => t.id === params.teamId && t.tournamentId === params.tournamentId);
    if (teamIndex === -1) throw new Error('Team not found');

    const team = teams[teamIndex];

    // Rule: Finalized team cannot accept new members
    if (team.status === 'FINALIZED') {
      throw new Error('Team is already finalized. No new members can join.');
    }

    // Rule: Maximum team size enforcement
    if (team.members.length >= team.teamSize) {
      throw new Error(`Team is full. Maximum team size is ${team.teamSize} members.`);
    }

    // Rule: Duplicate membership invariant across entire tournament
    const tournamentTeams = teams.filter(t => t.tournamentId === params.tournamentId);
    const alreadyInTeam = tournamentTeams.some(t =>
      t.members.some(m => safeAddressCompare(m.playerWalletAddress, params.playerWalletAddress))
    );
    if (alreadyInTeam) {
      throw new Error('Duplicate Membership: You already belong to a team in this tournament.');
    }

    // Check player eligibility
    let isEligible = true;
    if (params.proof) {
      const verification = ZkProverService.verifyProof(params.proof, tourney.requirements);
      isEligible = verification.isValid;
    } else {
      isEligible = params.gamingCredentials.rank >= tourney.requirements.minimumRank &&
                   params.gamingCredentials.score >= tourney.requirements.minimumScore &&
                   params.gamingCredentials.wins >= tourney.requirements.minimumWins;
    }

    if (!isEligible) {
      throw new Error('Eligibility Error: You do not satisfy the tournament entry requirements.');
    }

    const newMember: TeamMember = {
      playerWalletAddress: normalizeAddress(params.playerWalletAddress),
      anonymousPlayerId: params.anonymousPlayerId,
      gamingCredentials: params.gamingCredentials,
      proof: params.proof,
      isEligible: true,
      joinedAt: new Date().toISOString()
    };

    team.members.push(newMember);

    // If team is now full and all members are eligible, mark as READY
    if (team.members.length === team.teamSize && team.members.every(m => m.isEligible)) {
      team.status = 'READY';
    }

    teams[teamIndex] = team;
    this.saveTeams(teams);

    tourney.currentParticipants = (tourney.currentParticipants || 0) + 1;
    this.saveTournaments(tournaments);

    return team;
  }

  public static leaveTeam(params: {
    tournamentId: string;
    teamId: string;
    playerWalletAddress: string;
  }): { success: boolean; message: string } {
    const teams = this.getTeams();
    const teamIndex = teams.findIndex(t => t.id === params.teamId && t.tournamentId === params.tournamentId);
    if (teamIndex === -1) throw new Error('Team not found');

    const team = teams[teamIndex];

    if (team.status === 'FINALIZED') {
      throw new Error('Cannot leave team: Team is already finalized.');
    }

    const isCaptain = safeAddressCompare(team.captainWalletAddress, params.playerWalletAddress);
    const isMember = team.members.some(m => safeAddressCompare(m.playerWalletAddress, params.playerWalletAddress));

    if (!isMember) {
      throw new Error('You are not a member of this team.');
    }

    const tournaments = this.getTournaments();
    const tourney = tournaments.find(t => t.id === params.tournamentId);

    if (isCaptain) {
      // Captain leaving disbands team
      teams.splice(teamIndex, 1);
      this.saveTeams(teams);

      if (tourney) {
        tourney.currentTeams = Math.max(0, (tourney.currentTeams || 1) - 1);
        tourney.currentParticipants = Math.max(0, (tourney.currentParticipants || team.members.length) - team.members.length);
        this.saveTournaments(tournaments);
      }
      return { success: true, message: 'Team disbanded by captain.' };
    } else {
      team.members = team.members.filter(m => !safeAddressCompare(m.playerWalletAddress, params.playerWalletAddress));
      team.status = 'RECRUITING';
      teams[teamIndex] = team;
      this.saveTeams(teams);

      if (tourney) {
        tourney.currentParticipants = Math.max(0, (tourney.currentParticipants || 1) - 1);
        this.saveTournaments(tournaments);
      }
      return { success: true, message: 'Left team successfully.' };
    }
  }

  public static finalizeTeam(params: {
    tournamentId: string;
    teamId: string;
    captainWalletAddress: string;
  }): Team {
    const teams = this.getTeams();
    const teamIndex = teams.findIndex(t => t.id === params.teamId && t.tournamentId === params.tournamentId);
    if (teamIndex === -1) throw new Error('Team not found');

    const team = teams[teamIndex];

    // Rule: Captain Authorization invariant
    if (!safeAddressCompare(team.captainWalletAddress, params.captainWalletAddress)) {
      throw new Error('Unauthorized: Only the team captain can finalize the team.');
    }

    // Rule: Full capacity required
    if (team.members.length !== team.teamSize) {
      throw new Error(`Cannot finalize team: Incomplete roster (${team.members.length}/${team.teamSize} members).`);
    }

    // Rule: All members must satisfy eligibility
    const allEligible = team.members.every(m => m.isEligible);
    if (!allEligible) {
      throw new Error('Cannot finalize team: Not all team members meet tournament eligibility requirements.');
    }

    team.status = 'FINALIZED';
    team.finalizedAt = new Date().toISOString();
    teams[teamIndex] = team;
    this.saveTeams(teams);

    // Automatically create a consolidated team application in the applications ledger
    const applications = this.getApplications();
    const tourney = this.getTournamentById(params.tournamentId);

    const teamApp: Application = {
      id: `app-team-${team.id}`,
      tournamentId: params.tournamentId,
      tournamentName: tourney?.name || 'Tournament',
      anonymousPlayerId: team.captainAnonymousId,
      playerWalletAddress: team.captainWalletAddress,
      teamId: team.id,
      teamName: team.name,
      gamingCredentials: team.members[0].gamingCredentials,
      proof: team.members[0].proof || ({} as ZKProofPayload),
      status: 'APPROVED',
      submittedAt: new Date().toISOString()
    };

    applications.unshift(teamApp);
    this.saveApplications(applications);

    return team;
  }

  public static getTeamsForTournament(tournamentId: string): Team[] {
    return this.getTeams().filter(t => t.tournamentId === tournamentId);
  }

  public static getTeamById(teamId: string): Team | null {
    return this.getTeams().find(t => t.id === teamId) || null;
  }

  public static getPlayerTeamInTournament(tournamentId: string, playerAddress: string): Team | null {
    return this.getTeams().find(
      t => t.tournamentId === tournamentId && t.members.some(m => safeAddressCompare(m.playerWalletAddress, playerAddress))
    ) || null;
  }

  // --- REVIEW APPLICATIONS ---

  public static reviewApplication(params: {
    applicationId: string;
    organizerAddress: string;
    decision: 'APPROVE' | 'REJECT';
    rejectionReason?: string;
  }): Application {
    if (!AuthService.isOrganizerAuthorized(params.organizerAddress)) {
      throw new Error('Access Denied: Caller address is not an authorized organizer.');
    }

    const applications = this.getApplications();
    const index = applications.findIndex(a => a.id === params.applicationId);
    if (index === -1) throw new Error('Application not found');

    const app = applications[index];
    const tournament = this.getTournamentById(app.tournamentId);
    if (!tournament) throw new Error('Associated tournament not found');

    if (!safeAddressCompare(tournament.organizerAddress, params.organizerAddress)) {
      throw new Error('Unauthorized: Only tournament creator can review applications');
    }

    if (params.decision === 'APPROVE') {
      app.status = 'APPROVED';
    } else {
      app.status = 'REJECTED';
      app.rejectionReason = params.rejectionReason || 'Does not meet tournament requirements.';
    }

    app.reviewedAt = new Date().toISOString();
    app.reviewerAddress = normalizeAddress(params.organizerAddress);

    applications[index] = app;
    this.saveApplications(applications);
    return app;
  }

  public static getApplicationsForTournament(tournamentId: string): Application[] {
    return this.getApplications().filter(a => a.tournamentId === tournamentId);
  }

  public static getApplicationsForPlayer(playerWalletAddress: string): Application[] {
    return this.getApplications().filter(
      a => safeAddressCompare(a.playerWalletAddress, playerWalletAddress)
    );
  }

  public static getAllApplications(): Application[] {
    return this.getApplications();
  }
}
