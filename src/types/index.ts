export enum RankTier {
  BRONZE = 1,
  SILVER = 2,
  GOLD = 3,
  PLATINUM = 4,
  DIAMOND = 5,
  MASTER = 6,
  GRANDMASTER = 7
}

export const RANK_NAMES: Record<RankTier, string> = {
  [RankTier.BRONZE]: 'Bronze',
  [RankTier.SILVER]: 'Silver',
  [RankTier.GOLD]: 'Gold',
  [RankTier.PLATINUM]: 'Platinum',
  [RankTier.DIAMOND]: 'Diamond',
  [RankTier.MASTER]: 'Master',
  [RankTier.GRANDMASTER]: 'Grandmaster'
};

export type GameCategory = 'All' | 'FPS' | 'MOBA' | 'Battle Royale' | 'Sports';

export type TournamentType = 'SOLO' | 'TEAM';

export type LocationType = 'ONLINE' | 'OFFLINE' | 'HYBRID';

export type TournamentStatus =
  | 'UPCOMING'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'OPEN'
  | 'DRAFT'
  | 'CLOSED'
  | 'ARCHIVED';

export type ApplicationStatus = 
  | 'DRAFT'
  | 'OPEN'
  | 'APPLIED'
  | 'PROOF_GENERATED'
  | 'PROOF_VERIFIED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLOSED';

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  dateOfBirth: string;
  discordHandle?: string;
}

export interface GamingCredentials {
  rank: RankTier;
  score: number;
  wins: number;
  losses: number;
  achievements: string[];
  gameTitle: string;
  verifiedAt: string;
}

export interface PlayerProfile {
  walletAddress: string;
  anonymousId: string;
  personalInfo: PersonalInfo;
  gamingCredentials: GamingCredentials;
}

export interface TournamentRequirements {
  minimumRank: RankTier;
  minimumScore: number;
  minimumWins: number;
}

export interface TournamentLocation {
  locationType: LocationType;
  // Online fields
  onlinePlatform?: string;
  serverRegion?: string;
  roomInfo?: string;
  // Offline fields
  venueName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface TournamentSchedule {
  registrationStart: string;
  registrationEnd: string;
  tournamentStart: string;
  tournamentEnd: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  gameTitle: string;
  category: GameCategory;
  gameImage: string;
  organizerAddress: string;
  organizerName: string;
  tournamentType: TournamentType;
  teamSize: number;
  maxTeams: number;
  currentTeams: number;
  requirements: TournamentRequirements;
  prizePool: string;
  maxParticipants: number;
  currentParticipants: number;
  schedule: TournamentSchedule;
  applicationDeadline: string;
  startDate: string;
  location: TournamentLocation;
  status: TournamentStatus;
  applicantCount: number;
  createdAt: string;
  rules?: string[];
}

export interface ZKProofPayload {
  proofId: string;
  tournamentId: string;
  anonymousPlayerId: string;
  commitmentHash: string;
  nullifierHash: string;
  rankSatisfied: boolean;
  scoreSatisfied: boolean;
  winsSatisfied: boolean;
  credentialsValid: boolean;
  timestamp: string;
  publicInputs: {
    minRank: RankTier;
    minScore: number;
    minWins: number;
  };
  zkSnarkProof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
    protocol: 'Midnight-ZK-Plonk-v2';
  };
}

export interface TeamMember {
  playerWalletAddress: string;
  anonymousPlayerId: string;
  gamingCredentials: GamingCredentials;
  proof?: ZKProofPayload;
  isEligible: boolean;
  joinedAt: string;
}

export type TeamStatus = 'RECRUITING' | 'READY' | 'FINALIZED';

export interface Team {
  id: string;
  tournamentId: string;
  name: string;
  captainWalletAddress: string;
  captainAnonymousId: string;
  teamSize: number;
  members: TeamMember[];
  status: TeamStatus;
  createdAt: string;
  finalizedAt?: string;
}

export interface Application {
  id: string;
  tournamentId: string;
  tournamentName: string;
  anonymousPlayerId: string;
  playerWalletAddress: string;
  gamingCredentials: {
    rank: RankTier;
    score: number;
    wins: number;
    losses: number;
  };
  proof: ZKProofPayload;
  status: ApplicationStatus;
  teamId?: string;
  teamName?: string;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewerAddress?: string;
}

export interface OrganizerAccount {
  address: string;
  name: string;
  organization: string;
  isAuthorized: boolean;
  registeredAt: string;
}

export type TransactionStatus =
  | 'IDLE'
  | 'PREPARING'
  | 'AWAITING_WALLET_APPROVAL'
  | 'SUBMITTING'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'FAILED';

export type TransactionType =
  | 'CREATE_TOURNAMENT'
  | 'PUBLISH_TOURNAMENT'
  | 'CLOSE_TOURNAMENT'
  | 'DELETE_TOURNAMENT'
  | 'SUBMIT_APPLICATION'
  | 'REVIEW_APPLICATION'
  | 'CREATE_TEAM'
  | 'JOIN_TEAM'
  | 'LEAVE_TEAM'
  | 'FINALIZE_TEAM';

export interface TransactionReceipt {
  txHash: string;
  blockHeight: number;
  blockHash: string;
  timestamp: string;
  action: TransactionType;
  status: 'CONFIRMED' | 'FAILED';
  submitter: string;
  contractAddress: string;
  network: string;
  gasFee: string;
}

export interface TransactionProgress {
  status: TransactionStatus;
  type: TransactionType;
  txHash?: string;
  blockHeight?: number;
  error?: string;
  step: number;
  totalSteps: number;
  message: string;
}
