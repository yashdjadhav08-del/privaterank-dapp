import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Application, 
  GameCategory,
  GamingCredentials, 
  PersonalInfo, 
  Team,
  Tournament, 
  TournamentLocation,
  TournamentRequirements, 
  TournamentSchedule,
  TournamentType,
  TransactionProgress, 
  TransactionReceipt, 
  ZKProofPayload 
} from '../types';
import { ContractService } from '../contracts/contractService';
import { ZkProverService } from '../contracts/zkProver';
import { MidnightTransactionService } from '../contracts/midnightTransactionService';
import { fetchTournamentsFromServer, checkServerHealth, registerTournamentWithServer, type TournamentsResponse } from '../services/backendApi';
import { formatPrizePool } from '../utils/crypto';

interface TournamentContextType {
  tournaments: Tournament[];
  applications: Application[];
  teams: Team[];
  userProofs: ZKProofPayload[];
  isLoading: boolean;
  error: string | null;
  txProgress: TransactionProgress | null;
  txReceipt: TransactionReceipt | null;
  serverStatus: 'ok' | 'unreachable' | 'unknown';
  serverResponse: TournamentsResponse | null;
  resetTxState: () => void;
  refreshData: () => void;
  createTournament: (params: {
    name: string;
    description: string;
    gameTitle: string;
    category?: GameCategory;
    gameImage?: string;
    organizerAddress: string;
    organizerName: string;
    tournamentType: TournamentType;
    teamSize?: number;
    maxTeams?: number;
    maxParticipants?: number;
    requirements: TournamentRequirements;
    prizePool: string;
    prizeDetails?: string;
    schedule: TournamentSchedule;
    location: TournamentLocation;
    rules?: string[];
  }) => Promise<{ tournament: Tournament; receipt: TransactionReceipt }>;
  publishTournament: (tournamentId: string, organizerAddress: string) => Promise<{ tournament: Tournament; receipt: TransactionReceipt }>;
  closeTournament: (tournamentId: string, organizerAddress: string) => Promise<{ tournament: Tournament; receipt: TransactionReceipt }>;
  deleteTournament: (tournamentId: string, organizerAddress: string) => Promise<{ tournament: Tournament; receipt: TransactionReceipt }>;
  generateProof: (params: {
    tournament: Tournament;
    gamingCredentials: GamingCredentials;
    personalInfo: PersonalInfo;
    walletAddress: string;
  }) => Promise<ZKProofPayload>;
  submitApplication: (params: {
    tournamentId: string;
    playerWalletAddress: string;
    anonymousPlayerId: string;
    gamingCredentials: GamingCredentials;
    proof: ZKProofPayload;
  }) => Promise<{ application: Application; receipt: TransactionReceipt }>;
  createTeam: (params: {
    tournamentId: string;
    captainWalletAddress: string;
    captainAnonymousId: string;
    teamName: string;
    gamingCredentials: GamingCredentials;
    proof?: ZKProofPayload;
  }) => Promise<{ team: Team; receipt: TransactionReceipt }>;
  joinTeam: (params: {
    tournamentId: string;
    teamId: string;
    playerWalletAddress: string;
    anonymousPlayerId: string;
    gamingCredentials: GamingCredentials;
    proof?: ZKProofPayload;
  }) => Promise<{ team: Team; receipt: TransactionReceipt }>;
  leaveTeam: (params: {
    tournamentId: string;
    teamId: string;
    playerWalletAddress: string;
  }) => Promise<{ success: boolean; message: string; receipt: TransactionReceipt }>;
  finalizeTeam: (params: {
    tournamentId: string;
    teamId: string;
    captainWalletAddress: string;
  }) => Promise<{ team: Team; receipt: TransactionReceipt }>;
  reviewApplication: (params: {
    applicationId: string;
    organizerAddress: string;
    decision: 'APPROVE' | 'REJECT';
    rejectionReason?: string;
  }) => Promise<{ application: Application; receipt: TransactionReceipt }>;
  getTeamsForTournament: (tournamentId: string) => Team[];
  getPlayerTeam: (tournamentId: string, playerAddress: string) => Team | null;
}

const PROOFS_STORAGE_KEY = 'privaterank_user_proofs';

const TournamentContext = createContext<TournamentContextType | null>(null);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [serverStatus, setServerStatus] = useState<'ok' | 'unreachable' | 'unknown'>('unknown');
  const [serverResponse, setServerResponse] = useState<TournamentsResponse | null>(null);
  const [userProofs, setUserProofs] = useState<ZKProofPayload[]>(() => {
    try {
      const stored = localStorage.getItem(PROOFS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txProgress, setTxProgress] = useState<TransactionProgress | null>(null);
  const [txReceipt, setTxReceipt] = useState<TransactionReceipt | null>(null);

  const refreshData = useCallback(async () => {
    // PRIMARY: Try the backend server (source of truth for both Organizer + Player)
    try {
      const response = await fetchTournamentsFromServer();
      setServerStatus('ok');
      setServerResponse(response);

      // Map server tournaments to the app's Tournament type
      const mapped: Tournament[] = response.tournaments.map(st => {
        const item: Tournament = {
          id: st.id,
          name: st.name,
          description: st.description,
          gameTitle: st.gameTitle,
          category: (st.category as import('../types').GameCategory) || 'Battle Royale',
          gameImage: st.gameImage,
          organizerAddress: st.organizerAddress,
          organizerName: st.organizerName,
          tournamentType: (st.tournamentType as import('../types').TournamentType) || 'SOLO',
          teamSize: st.teamSize,
          maxTeams: st.maxTeams,
          currentTeams: 0,
          requirements: st.requirements,
          prizePool: formatPrizePool(st.prizePool),
          prizeDetails: st.prizeDetails,
          maxParticipants: st.maxParticipants,
          currentParticipants: st.applicantCount || 0,
          schedule: st.schedule,
          applicationDeadline: st.schedule.registrationEnd,
          startDate: st.schedule.tournamentStart,
          location: st.location as import('../types').TournamentLocation,
          status: (st.status as import('../types').TournamentStatus) || 'OPEN',
          applicantCount: st.applicantCount || 0,
          createdAt: st.registeredAt,
          rules: st.rules || [],
          txHash: st.txHash,
          blockHeight: st.blockHeight,
          onChainVerified: Boolean(st.txHash || st.onChainVerified)
        };
        console.log('[PrivateRank][TOURNAMENT]\nDecoded on-chain tournament:', {
          id: item.id,
          name: item.name,
          description: item.description,
          gameTitle: item.gameTitle,
          tournamentType: item.tournamentType,
          teamSize: item.teamSize,
          maxTeams: item.maxTeams,
          maxParticipants: item.maxParticipants,
          requirements: item.requirements,
          prizePool: item.prizePool,
          prizeDetails: item.prizeDetails,
          schedule: item.schedule,
          location: item.location,
          status: item.status,
          applicantCount: item.applicantCount,
          txHash: item.txHash,
          blockHeight: item.blockHeight,
          onChainVerified: item.onChainVerified
        });
        return item;
      });

      setTournaments(mapped);
      ContractService.setTournaments(mapped);
      console.log(`[TournamentContext] Loaded ${mapped.length} tournament(s) from backend server`);
    } catch (serverErr) {
      console.warn('[TournamentContext] Backend server unavailable:', (serverErr as Error).message);
      setServerStatus('unreachable');
      // When backend is unreachable, do NOT invent mock tournaments
      setTournaments([]);
    }

    // Purge any legacy localStorage tournament items from older schema versions
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('privaterank_midnight_tournaments_v3');
        localStorage.removeItem('privaterank_midnight_tournaments_v2');
        localStorage.removeItem('privaterank_midnight_tournaments');
      }
    } catch {
      // non-fatal
    }

    setApplications(ContractService.getAllApplications());
    setTeams(ContractService.getTeams());
  }, []);

  useEffect(() => {
    // Initial health check to determine server status immediately
    checkServerHealth().then(h => {
      if (h.ok) {
        setServerStatus('ok');
      } else {
        console.warn('[TournamentContext] Backend server unreachable:', h.error);
        setServerStatus('unreachable');
      }
    });

    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, 8000);
    const unsubscribe = MidnightTransactionService.subscribeProgress((progress) => {
      setTxProgress(progress);
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [refreshData]);

  const resetTxState = () => {
    setTxProgress(null);
    setTxReceipt(null);
    setError(null);
    MidnightTransactionService.resetProgress();
  };

  const saveProofs = (proofs: ZKProofPayload[]) => {
    setUserProofs(proofs);
    try {
      localStorage.setItem(PROOFS_STORAGE_KEY, JSON.stringify(proofs));
    } catch {
      // fallback
    }
  };

  const createTournament = async (params: {
    name: string;
    description: string;
    gameTitle: string;
    category?: GameCategory;
    gameImage?: string;
    organizerAddress: string;
    organizerName: string;
    tournamentType: TournamentType;
    teamSize?: number;
    maxTeams?: number;
    maxParticipants?: number;
    requirements: TournamentRequirements;
    prizePool: string;
    prizeDetails?: string;
    schedule: TournamentSchedule;
    location: TournamentLocation;
    rules?: string[];
  }): Promise<{ tournament: Tournament; receipt: TransactionReceipt }> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await MidnightTransactionService.createTournament(params);
      setTxReceipt(res.receipt);
      refreshData();
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create tournament';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const publishTournament = async (
    tournamentId: string, 
    organizerAddress: string
  ): Promise<{ tournament: Tournament; receipt: TransactionReceipt }> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await MidnightTransactionService.publishTournament(tournamentId, organizerAddress);
      setTxReceipt(res.receipt);
      refreshData();
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish tournament';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const closeTournament = async (
    tournamentId: string, 
    organizerAddress: string
  ): Promise<{ tournament: Tournament; receipt: TransactionReceipt }> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await MidnightTransactionService.closeTournament(tournamentId, organizerAddress);
      setTxReceipt(res.receipt);
      refreshData();
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to close tournament';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTournament = async (
    tournamentId: string,
    organizerAddress: string
  ): Promise<{ tournament: Tournament; receipt: TransactionReceipt }> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await MidnightTransactionService.deleteTournament(tournamentId, organizerAddress);
      setTxReceipt(res.receipt);
      refreshData();
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete tournament';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const generateProof = async (params: {
    tournament: Tournament;
    gamingCredentials: GamingCredentials;
    personalInfo: PersonalInfo;
    walletAddress: string;
  }): Promise<ZKProofPayload> => {
    setIsLoading(true);
    setError(null);
    try {
      const proof = await ZkProverService.generateEligibilityProof({
        tournamentId: params.tournament.id,
        requirements: params.tournament.requirements,
        gamingCredentials: params.gamingCredentials,
        personalInfo: params.personalInfo,
        walletAddress: params.walletAddress
      });

      const updated = [proof, ...userProofs.filter(p => p.proofId !== proof.proofId)];
      saveProofs(updated);
      return proof;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate ZK proof';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const submitApplication = async (params: {
    tournamentId: string;
    playerWalletAddress: string;
    anonymousPlayerId: string;
    gamingCredentials: GamingCredentials;
    proof: ZKProofPayload;
  }): Promise<{ application: Application; receipt: TransactionReceipt }> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await MidnightTransactionService.submitApplication(params);
      setTxReceipt(res.receipt);
      refreshData();
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit application';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createTeam = async (params: {
    tournamentId: string;
    captainWalletAddress: string;
    captainAnonymousId: string;
    teamName: string;
    gamingCredentials: GamingCredentials;
    proof?: ZKProofPayload;
  }): Promise<{ team: Team; receipt: TransactionReceipt }> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await MidnightTransactionService.createTeam(params);
      setTxReceipt(res.receipt);
      refreshData();
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create team';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const joinTeam = async (params: {
    tournamentId: string;
    teamId: string;
    playerWalletAddress: string;
    anonymousPlayerId: string;
    gamingCredentials: GamingCredentials;
    proof?: ZKProofPayload;
  }): Promise<{ team: Team; receipt: TransactionReceipt }> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await MidnightTransactionService.joinTeam(params);
      setTxReceipt(res.receipt);
      refreshData();
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join team';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const leaveTeam = async (params: {
    tournamentId: string;
    teamId: string;
    playerWalletAddress: string;
  }): Promise<{ success: boolean; message: string; receipt: TransactionReceipt }> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await MidnightTransactionService.leaveTeam(params);
      setTxReceipt(res.receipt);
      refreshData();
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to leave team';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeTeam = async (params: {
    tournamentId: string;
    teamId: string;
    captainWalletAddress: string;
  }): Promise<{ team: Team; receipt: TransactionReceipt }> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await MidnightTransactionService.finalizeTeam(params);
      setTxReceipt(res.receipt);
      refreshData();
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to finalize team';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reviewApplication = async (params: {
    applicationId: string;
    organizerAddress: string;
    decision: 'APPROVE' | 'REJECT';
    rejectionReason?: string;
  }): Promise<{ application: Application; receipt: TransactionReceipt }> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await MidnightTransactionService.reviewApplication(params);
      setTxReceipt(res.receipt);
      refreshData();
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to review application';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getTeamsForTournament = useCallback((tournamentId: string): Team[] => {
    return ContractService.getTeamsForTournament(tournamentId);
  }, []);

  const getPlayerTeam = useCallback((tournamentId: string, playerAddress: string): Team | null => {
    return ContractService.getPlayerTeamInTournament(tournamentId, playerAddress);
  }, []);

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        applications,
        teams,
        userProofs,
        isLoading,
        error,
        txProgress,
        txReceipt,
        serverStatus,
        serverResponse,
        resetTxState,
        refreshData,
        createTournament,
        publishTournament,
        closeTournament,
        deleteTournament,
        generateProof,
        submitApplication,
        createTeam,
        joinTeam,
        leaveTeam,
        finalizeTeam,
        reviewApplication,
        getTeamsForTournament,
        getPlayerTeam
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
