/**
 * PrivateRank Backend API Client
 * 
 * All tournament read operations go through the backend server at localhost:4000.
 * This ensures BOTH Organizer and Player see the same on-chain data.
 * 
 * 1AM Wallet signing / transaction submission remains on the frontend.
 */

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export interface ServerTournament {
  id: string;
  name: string;
  description: string;
  gameTitle: string;
  category: string;
  gameImage: string;
  organizerAddress: string;
  organizerName: string;
  tournamentType: string;
  teamSize: number;
  maxTeams: number;
  maxParticipants: number;
  requirements: { minimumRank: number; minimumScore: number; minimumWins: number };
  prizePool: string;
  prizeDetails?: string;
  schedule: { registrationStart: string; registrationEnd: string; tournamentStart: string; tournamentEnd: string };
  location: {
    locationType: string;
    onlinePlatform?: string;
    serverRegion?: string;
    venueName?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    roomInfo?: string;
  };
  rules: string[];
  status: string;
  txHash: string;
  blockHeight: number;
  applicantCount: number;
  registeredAt: string;
  onChainVerified: boolean;
  onChainStatus: string | null;
}

export interface TournamentsResponse {
  source: 'midnight-preprod';
  contractAddress: string | null;
  indexerReachable: boolean;
  contractFound: boolean;
  stateDecoded: boolean;
  tournaments: ServerTournament[];
  lastUpdated: string;
}

export interface DebugResponse {
  server: string;
  indexerUrl: string;
  contractAddress: string;
  indexerReachable: boolean;
  contractFound: boolean;
  contractStateFound: boolean;
  contractStateDecoded: boolean;
  decodedTournamentCount: string | number;
  registeredTournaments: number;
  tournamentIds: string[];
  tournaments: ServerTournament[];
  onChainVerification?: Array<{ id: string; onChain: boolean; data: unknown }>;
  errors: string[];
  latestBlock?: { height: number; timestamp: number };
}

/**
 * Check if the backend server is reachable
 */
export async function checkServerHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${SERVER_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return { ok: true };
    return { ok: false, error: `Server returned HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Fetch all tournaments from the backend server.
 * The server queries Midnight Preprod indexer + decodes ContractState.
 * Returns real on-chain tournaments visible to BOTH Organizer and Player.
 */
export async function fetchTournamentsFromServer(): Promise<TournamentsResponse> {
  const res = await fetch(`${SERVER_URL}/api/tournaments`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    },
    signal: AbortSignal.timeout(30000)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<TournamentsResponse>;
}

/**
 * Fetch a single tournament from the backend server by ID.
 * Returns the tournament and whether it exists on-chain.
 */
export async function fetchTournamentByIdFromServer(tournamentId: string): Promise<{
  tournament: ServerTournament | null;
  existsOnChain: boolean;
  onChainData: any;
} | null> {
  try {
    const res = await fetch(`${SERVER_URL}/api/tournaments/${encodeURIComponent(tournamentId)}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Register a tournament with the backend server after on-chain confirmation.
 * This must be called after a successful createTournament transaction.
 * The server will store the tournament metadata and verify it against the indexer.
 */
export async function registerTournamentWithServer(tournament: Partial<ServerTournament> & {
  contractAddress?: string;
  txHash: string;
}): Promise<{ success: boolean; tournament: ServerTournament; onChainVerified: boolean }> {
  const res = await fetch(`${SERVER_URL}/api/tournaments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tournament),
    signal: AbortSignal.timeout(30000)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend registration error ${res.status}: ${text}`);
  }

  return res.json() as Promise<{ success: boolean; tournament: ServerTournament; onChainVerified: boolean }>;
}

/**
 * Register the contract address with the backend server.
 * Call this after deploying the PrivateRank contract.
 */
export async function registerContractAddress(contractAddress: string): Promise<void> {
  const res = await fetch(`${SERVER_URL}/api/contract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractAddress }),
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn(`[BackendAPI] Contract registration failed: ${text}`);
  }
}

/**
 * Register a player participation with the backend server AFTER on-chain join is confirmed.
 * Requires a real txHash from the confirmed joinTournament circuit call.
 */
export async function registerParticipationWithServer(params: {
  tournamentId: string;
  playerAddress: string;
  txHash: string;
  blockHeight?: number;
  anonymousId?: string;
  tournamentType?: string;
  teamId?: string;
}): Promise<{
  success: boolean;
  tournamentId: string;
  playerAddress: string;
  participantCount: number;
  joinedAt: string;
}> {
  const res = await fetch(`${SERVER_URL}/api/tournaments/${params.tournamentId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerAddress: params.playerAddress,
      txHash: params.txHash,
      blockHeight: params.blockHeight,
      anonymousId: params.anonymousId,
      tournamentType: params.tournamentType,
      teamId: params.teamId
    }),
    signal: AbortSignal.timeout(30000)
  });

  if (!res.ok) {
    const text = await res.text();
    // 409 = already joined, not a fatal error
    if (res.status === 409) {
      console.warn(`[BackendAPI] Player already joined tournament ${params.tournamentId}`);
      const json = await res.json().catch(() => ({})) as any;
      return {
        success: true,
        tournamentId: params.tournamentId,
        playerAddress: params.playerAddress,
        participantCount: json.participation?.participantCount ?? 0,
        joinedAt: json.participation?.joinedAt ?? new Date().toISOString()
      };
    }
    throw new Error(`Backend join registration error ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Check if a player has joined a specific tournament (server-side tracking).
 */
export async function checkParticipationStatus(tournamentId: string, playerAddress: string): Promise<{
  hasJoined: boolean;
  participantCount: number;
}> {
  try {
    const res = await fetch(
      `${SERVER_URL}/api/tournaments/${tournamentId}/participants?playerAddress=${encodeURIComponent(playerAddress)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return { hasJoined: false, participantCount: 0 };
    const data = await res.json() as any;
    return {
      hasJoined: data.hasJoined ?? false,
      participantCount: data.participantCount ?? 0
    };
  } catch {
    return { hasJoined: false, participantCount: 0 };
  }
}

/**
 * Archive a tournament server-side AFTER on-chain archiveTournament is confirmed.
 * Requires a real txHash from the confirmed transaction.
 */
export async function archiveTournamentOnServer(params: {
  tournamentId: string;
  organizerAddress: string;
  txHash: string;
  blockHeight?: number;
}): Promise<{ success: boolean; status: string; archivedAt: string }> {
  const res = await fetch(`${SERVER_URL}/api/tournaments/${params.tournamentId}/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organizerAddress: params.organizerAddress,
      txHash: params.txHash,
      blockHeight: params.blockHeight
    }),
    signal: AbortSignal.timeout(30000)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend archive error ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Close a tournament server-side AFTER on-chain closeTournament is confirmed.
 */
export async function closeTournamentOnServer(params: {
  tournamentId: string;
  organizerAddress: string;
  txHash: string;
  blockHeight?: number;
}): Promise<{ success: boolean; status: string; closedAt: string }> {
  const res = await fetch(`${SERVER_URL}/api/tournaments/${params.tournamentId}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organizerAddress: params.organizerAddress,
      txHash: params.txHash,
      blockHeight: params.blockHeight
    }),
    signal: AbortSignal.timeout(30000)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend close error ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Fetch the debug diagnostic from the backend server.
 */
export async function fetchDebugInfo(): Promise<DebugResponse> {
  const res = await fetch(`${SERVER_URL}/api/tournaments/debug`, { signal: AbortSignal.timeout(30000) });
  return res.json() as Promise<DebugResponse>;
}
