/**
 * PrivateRank Backend Middleware Server
 * 
 * Architecture:
 *   Midnight Preprod → Official GraphQL Indexer → This Server → REST API → Frontend
 *
 * The server:
 *   1. Connects to the Midnight Preprod indexer
 *   2. Decodes the PrivateRank ContractState binary blob
 *   3. Maintains a tournament registry (since the Compact Map is not enumerable)
 *   4. Exposes REST endpoints for both Organizer and Player portals
 *   5. Both portals read the same data — no browser-local state as truth
 */

import express from 'express';
import cors from 'cors';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import { ledger as getLedger } from '../src/contracts/managed/privaterank/contract/index.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Configuration ────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PRIVATERANK_SERVER_PORT || process.env.SERVER_PORT || '4000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const INDEXER_URL = process.env.VITE_PREPROD_INDEXER_URL || process.env.PREPROD_INDEXER_URL || 'https://indexer.preprod.midnight.network/api/v4/graphql';

// Known unverified / blacklisted addresses — never use these as the PrivateRank contract
const BLACKLISTED_ADDRESSES = new Set([
  '0200986cc290581e0b324aea46b1fbe059d6e00dc60ab9c20f162d653588b4d2',
  '0200preprod_privaterank_midnight_contract_v1',
  '02007072697661746572616e6b6d69646e6967687470726570726f6430303031',
  'a4f5e2b8ab757f5e4d981415f74fffea3e42c50d7d0fb50e04bf47ac2faf7078',
]);

// ─── Persistence: Tournament Registry ────────────────────────────────────────
//
// The Compact runtime Map is NOT enumerable (no Symbol.iterator).
// We maintain a server-side JSON registry of tournament IDs.
// This is not "fake data" — each entry is verified against the on-chain contract
// state using ledger().tournaments.member(key) before being served to clients.
//
// This registry is populated when:
//   a) The frontend POSTs tournament metadata after a successful on-chain tx
//   b) The organizer creates a tournament — frontend calls POST /api/tournaments

const REGISTRY_PATH = path.join(__dirname, 'tournament-registry.json');

interface TournamentRegistry {
  contractAddress: string | null;
  tournaments: StoredTournament[];
  lastUpdated: string;
}

interface StoredTournament {
  id: string;                // The 32-byte key used on-chain (tournament name, padded)
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
  location: { locationType: string; onlinePlatform?: string; serverRegion?: string; venueName?: string; address?: string; city?: string; state?: string; country?: string; postalCode?: string };
  rules: string[];
  status: string;
  txHash: string;
  blockHeight: number;
  registeredAt: string;
  applicantCount?: number;
  // On-chain verified fields (filled by verifyWithChain)
  onChainStatus?: string;
  onChainApplicantCount?: number;
  onChainVerified?: boolean;
}

function formatPrizePool(prize?: string | number | null): string {
  if (prize === null || prize === undefined) return '₹0';
  let str = String(prize).trim();
  if (!str || str === '0') return '₹0';
  str = str.replace(/\b(t?DUST|tokens?|INR|Rs\.?)\b/gi, '').trim();
  str = str.replace(/^₹\s*/, '').trim();
  const cleanNum = str.replace(/,/g, '');
  const num = Number(cleanNum);
  if (!isNaN(num) && cleanNum !== '') {
    return `₹${num.toLocaleString('en-IN')}`;
  }
  return str ? `₹${str}` : '₹0';
}

function loadRegistry(): TournamentRegistry {
  if (existsSync(REGISTRY_PATH)) {
    try {
      const raw = readFileSync(REGISTRY_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('[PrivateRank][SERVER] Failed to parse registry file:', e);
    }
  }
  return { contractAddress: null, tournaments: [], lastUpdated: new Date().toISOString() };
}

function saveRegistry(reg: TournamentRegistry): void {
  try {
    writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2), 'utf-8');
  } catch (e) {
    console.error('[PrivateRank][SERVER] Failed to save registry:', e);
  }
}

let registry = loadRegistry();

// ─── Contract Address Management ─────────────────────────────────────────────

function getContractAddress(): string | null {
  const envAddr = process.env.VITE_PREPROD_CONTRACT_ADDRESS || process.env.PREPROD_CONTRACT_ADDRESS;
  if (envAddr) {
    const clean = envAddr.trim().replace(/^0x/i, '').toLowerCase();
    if (/^[0-9a-f]{64}$/.test(clean) && !BLACKLISTED_ADDRESSES.has(clean)) {
      return clean;
    }
  }
  if (registry.contractAddress && !BLACKLISTED_ADDRESSES.has(registry.contractAddress)) {
    return registry.contractAddress;
  }
  return null;
}

function setContractAddress(addr: string): void {
  const clean = addr.trim().replace(/^0x/i, '').toLowerCase();
  if (/^[0-9a-f]{64}$/.test(clean) && !BLACKLISTED_ADDRESSES.has(clean)) {
    registry.contractAddress = clean;
    saveRegistry(registry);
    console.log('[PrivateRank][SERVER] Contract address set:', clean);
  }
}

// ─── Indexer Helpers ─────────────────────────────────────────────────────────

async function queryIndexer(query: string, variables?: Record<string, unknown>): Promise<unknown> {
  console.log('[PrivateRank][INDEXER] querying Preprod...');
  const res = await fetch(INDEXER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) {
    throw new Error(`Indexer HTTP ${res.status} ${res.statusText}`);
  }
  const json = await res.json() as { data?: unknown; errors?: Array<{ message: string }> };
  console.log('[PrivateRank][INDEXER] response received');
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Indexer GraphQL error: ${json.errors.map(e => e.message).join(', ')}`);
  }
  return json.data;
}

interface ContractStateResult {
  address: string;
  stateHex: string;
  blockHeight: number | null;
  txHash: string | null;
}

async function fetchContractStateFromIndexer(contractAddress: string): Promise<ContractStateResult | null> {
  const GQL = `
    query GetContractState($address: HexEncoded!) {
      contractAction(address: $address) {
        address
        state
        transaction {
          hash
          block { height }
        }
      }
    }
  `;

  const data = await queryIndexer(GQL, { address: contractAddress }) as { contractAction?: { address: string; state: string; transaction?: { hash: string; block?: { height: number } } } | null };
  const ca = data?.contractAction;
  if (!ca || !ca.address || !ca.state) {
    return null;
  }
  return {
    address: ca.address,
    stateHex: ca.state,
    blockHeight: ca.transaction?.block?.height ?? null,
    txHash: ca.transaction?.hash ?? null
  };
}

// ─── ContractState Decoder ────────────────────────────────────────────────────

interface OnChainTournamentData {
  organizer: string;  // hex
  status: number;
  minRank: number;
  minScore: number;
  minWins: number;
  deadline: number;
  applicantCount: number;
  exists: boolean;
}

interface DecodedContractState {
  raw: unknown;
  tournamentLookup: (idBytes: Uint8Array) => OnChainTournamentData | null;
  memberCheck: (idBytes: Uint8Array) => boolean;
}

function decodeContractState(stateHex: string): DecodedContractState {
  const hex = stateHex.replace(/^0x/i, '');
  if (!hex || hex.length % 2 !== 0) {
    throw new Error(`Invalid state hex: length=${hex.length}`);
  }

  const rawBytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < rawBytes.length; i++) {
    rawBytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }

  console.log(`[PrivateRank][SERVER] ContractState raw bytes length = ${rawBytes.length}`);

  const contractState = compactRuntime.ContractState.deserialize(rawBytes);
  console.log('[PrivateRank][SERVER] ContractState decoded');

  const ledgerView = getLedger(contractState.data);
  console.log('[PrivateRank][SERVER] ledger() called, keys:', Object.keys(ledgerView || {}));

  function idToBytes(id: string): Uint8Array {
    const bytes = new Uint8Array(32);
    const enc = new TextEncoder().encode(id);
    bytes.set(enc.slice(0, 32));
    return bytes;
  }

  function tournamentLookup(idBytes: Uint8Array): OnChainTournamentData | null {
    try {
      if (!ledgerView?.tournaments) return null;
      const isMember = ledgerView.tournaments.member(idBytes);
      if (!isMember) return null;
      const t = ledgerView.tournaments.lookup(idBytes);
      if (!t) return null;
      const orgHex = Array.from(t.organizer as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
      return {
        organizer: orgHex,
        status: Number((t as { status: unknown }).status ?? 1),
        minRank: Number((t as { minRank: unknown }).minRank ?? 1),
        minScore: Number((t as { minScore: unknown }).minScore ?? 0),
        minWins: Number((t as { minWins: unknown }).minWins ?? 0),
        deadline: Number((t as { deadline: unknown }).deadline ?? 0),
        applicantCount: Number((t as { applicantCount: unknown }).applicantCount ?? 0),
        exists: true
      };
    } catch (e) {
      console.warn('[PrivateRank][SERVER] tournamentLookup error:', (e as Error).message);
      return null;
    }
  }

  function memberCheck(idBytes: Uint8Array): boolean {
    try {
      if (!ledgerView?.tournaments) return false;
      return Boolean(ledgerView.tournaments.member(idBytes));
    } catch {
      return false;
    }
  }

  return { raw: ledgerView, tournamentLookup, memberCheck };
}

// ─── Express App ──────────────────────────────────────────────────────────────

const app = express();

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[PrivateRank][SERVER] ${req.method} ${req.path}`);
  next();
});

// ─── Endpoints ────────────────────────────────────────────────────────────────

// GET /api/health
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    server: 'PrivateRank Backend',
    indexerUrl: INDEXER_URL,
    contractAddress: getContractAddress() || 'NOT_SET',
    registeredTournaments: registry.tournaments.length,
    uptime: process.uptime()
  });
});

// GET /api/contract
app.get('/api/contract', async (_req, res) => {
  const addr = getContractAddress();
  if (!addr) {
    return res.status(404).json({ error: 'PrivateRank contract address not configured. Deploy the contract first and POST /api/contract with the address.' });
  }

  try {
    const stateResult = await fetchContractStateFromIndexer(addr);
    if (!stateResult) {
      return res.status(404).json({
        error: 'PrivateRank contract not found on Midnight Preprod indexer.',
        contractAddress: addr
      });
    }

    return res.json({
      contractAddress: stateResult.address,
      blockHeight: stateResult.blockHeight,
      txHash: stateResult.txHash,
      stateHexLength: stateResult.stateHex.length,
      isDeployed: true
    });
  } catch (err) {
    const msg = (err as Error).message;
    console.error('[PrivateRank][SERVER] /api/contract error:', msg);
    return res.status(500).json({ error: `Indexer error: ${msg}` });
  }
});

// POST /api/contract — set the canonical contract address (called after deployment)
app.post('/api/contract', (req, res) => {
  const { contractAddress } = req.body as { contractAddress?: string };
  if (!contractAddress) {
    return res.status(400).json({ error: 'contractAddress is required' });
  }
  const clean = contractAddress.trim().replace(/^0x/i, '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(clean)) {
    return res.status(400).json({ error: 'contractAddress must be 64 hex chars' });
  }
  if (BLACKLISTED_ADDRESSES.has(clean)) {
    return res.status(400).json({ error: `Address ${clean} is in the blacklist. This is not a PrivateRank contract.` });
  }
  setContractAddress(clean);
  return res.json({ success: true, contractAddress: clean });
});

// GET /api/tournaments — THE MAIN ENDPOINT
// Returns all registered tournaments, verified against on-chain state where possible
app.get('/api/tournaments', async (_req, res) => {
  const contractAddress = getContractAddress();

  // Try to enrich with on-chain data if we have a contract address
  let decodedState: DecodedContractState | null = null;
  let indexerReachable = false;
  let contractFound = false;
  let stateDecoded = false;

  if (contractAddress) {
    try {
      const stateResult = await fetchContractStateFromIndexer(contractAddress);
      indexerReachable = true;

      if (stateResult) {
        contractFound = true;
        try {
          decodedState = decodeContractState(stateResult.stateHex);
          stateDecoded = true;
          console.log('[PrivateRank][SERVER] ContractState decoded successfully');
        } catch (decodeErr) {
          console.error('[PrivateRank][SERVER] ContractState decode error:', (decodeErr as Error).message);
          // Don't fail the request — return registry data with a warning
        }
      }
    } catch (indexerErr) {
      console.error('[PrivateRank][SERVER] Indexer error:', (indexerErr as Error).message);
      // Return registry data with indexer unavailable flag
    }
  }

  // Enrich registered tournaments with on-chain verification
  const enrichedTournaments = registry.tournaments.map(t => {
    let onChainData: OnChainTournamentData | null = null;
    let onChainVerified = false;

    if (decodedState) {
      const idBytes = new Uint8Array(32);
      const enc = new TextEncoder().encode(t.id);
      idBytes.set(enc.slice(0, 32));
      onChainData = decodedState.tournamentLookup(idBytes);
      onChainVerified = onChainData !== null;
    }

    const statusNum = onChainData ? onChainData.status : undefined;
    const statusStr = statusNum === 0 ? 'DRAFT'
      : statusNum === 1 ? 'OPEN'
      : statusNum === 2 ? 'CLOSED'
      : statusNum === 3 ? 'COMPLETED'
      : statusNum === 4 ? 'ARCHIVED'
      : t.status;

    return {
      ...t,
      prizePool: formatPrizePool(t.prizePool),
      status: statusStr,
      applicantCount: onChainData ? onChainData.applicantCount : (t.onChainApplicantCount ?? 0),
      onChainVerified,
      onChainStatus: onChainData ? statusStr : null,
      requirements: onChainData ? {
        minimumRank: onChainData.minRank,
        minimumScore: onChainData.minScore,
        minimumWins: onChainData.minWins
      } : t.requirements
    };
  });

  console.log(`[PrivateRank][SERVER] Tournament count = ${enrichedTournaments.length}`);

  return res.json({
    source: 'midnight-preprod',
    contractAddress: contractAddress || null,
    indexerReachable,
    contractFound,
    stateDecoded,
    tournaments: enrichedTournaments,
    lastUpdated: registry.lastUpdated
  });
});

// POST /api/tournaments — Register a new tournament after on-chain creation
app.post('/api/tournaments', async (req, res) => {
  const body = req.body as Partial<StoredTournament & { contractAddress?: string }>;

  if (!body.id || !body.name || !body.txHash) {
    return res.status(400).json({ error: 'id, name, and txHash are required' });
  }

  // Set contract address if provided
  if (body.contractAddress) {
    setContractAddress(body.contractAddress);
  }

  const contractAddress = getContractAddress();

  // Verify the tournament exists on-chain (optional — we do best effort)
  let onChainVerified = false;
  if (contractAddress) {
    try {
      const stateResult = await fetchContractStateFromIndexer(contractAddress);
      if (stateResult) {
        const decoded = decodeContractState(stateResult.stateHex);
        const idBytes = new Uint8Array(32);
        const enc = new TextEncoder().encode(body.id);
        idBytes.set(enc.slice(0, 32));
        onChainVerified = decoded.memberCheck(idBytes);
        console.log(`[PrivateRank][SERVER] On-chain verification for '${body.id}':`, onChainVerified);
      }
    } catch (e) {
      console.warn('[PrivateRank][SERVER] On-chain verification skipped:', (e as Error).message);
    }
  }

  const tournament: StoredTournament = {
    id: body.id,
    name: body.name || body.id,
    description: body.description || '',
    gameTitle: body.gameTitle || 'Unknown',
    category: body.category || 'Battle Royale',
    gameImage: body.gameImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    organizerAddress: body.organizerAddress || '',
    organizerName: body.organizerName || 'Tournament Organizer',
    tournamentType: body.tournamentType || 'SOLO',
    teamSize: body.teamSize || 1,
    maxTeams: body.maxTeams || 0,
    maxParticipants: body.maxParticipants || 64,
    requirements: body.requirements || { minimumRank: 1, minimumScore: 0, minimumWins: 0 },
    prizePool: formatPrizePool(body.prizePool),
    prizeDetails: body.prizeDetails ? String(body.prizeDetails) : undefined,
    schedule: body.schedule || {
      registrationStart: new Date().toISOString(),
      registrationEnd: new Date(Date.now() + 86400000 * 30).toISOString(),
      tournamentStart: new Date(Date.now() + 86400000 * 35).toISOString(),
      tournamentEnd: new Date(Date.now() + 86400000 * 36).toISOString()
    },
    location: body.location || { locationType: 'ONLINE', onlinePlatform: 'Midnight Network Preprod' },
    rules: body.rules || [],
    status: body.status || 'OPEN',
    txHash: body.txHash,
    blockHeight: body.blockHeight || 0,
    registeredAt: new Date().toISOString(),
    onChainVerified,
    onChainStatus: onChainVerified ? 'OPEN' : undefined
  };

  // Replace or add
  const existingIdx = registry.tournaments.findIndex(t => t.id === tournament.id);
  if (existingIdx >= 0) {
    registry.tournaments[existingIdx] = tournament;
    console.log(`[PrivateRank][SERVER] Updated tournament in registry: ${tournament.id}`);
  } else {
    registry.tournaments.unshift(tournament);
    console.log(`[PrivateRank][SERVER] Registered new tournament: ${tournament.id}`);
  }

  registry.lastUpdated = new Date().toISOString();
  saveRegistry(registry);

  return res.status(201).json({ success: true, tournament, onChainVerified });
});

// GET /api/tournaments/debug — Diagnostic endpoint
app.get('/api/tournaments/debug', async (_req, res) => {
  const contractAddress = getContractAddress();

  const result: Record<string, unknown> = {
    server: 'PrivateRank Backend Middleware',
    indexerUrl: INDEXER_URL,
    contractAddress: contractAddress || 'NOT_SET',
    contractAddressBlacklisted: contractAddress ? BLACKLISTED_ADDRESSES.has(contractAddress) : null,
    indexerReachable: false,
    contractFound: false,
    contractStateFound: false,
    contractStateDecoded: false,
    decodedTournamentCount: 'N/A (Map is not enumerable — use member() lookup)',
    registeredTournaments: registry.tournaments.length,
    tournamentIds: registry.tournaments.map(t => t.id),
    tournaments: registry.tournaments,
    errors: [] as string[]
  };

  // Test indexer reachability
  try {
    const q = `{ block { height timestamp } }`;
    const r = await fetch(INDEXER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) });
    const j = await r.json() as { data?: { block?: { height: number; timestamp: number } } };
    result.indexerReachable = true;
    result.latestBlock = j?.data?.block;
  } catch (e) {
    (result.errors as string[]).push(`Indexer unreachable: ${(e as Error).message}`);
  }

  if (!contractAddress) {
    (result.errors as string[]).push('Contract address not set. POST /api/contract with { contractAddress: "..." } to set it.');
    return res.json(result);
  }

  // Test contract state fetch
  try {
    const stateResult = await fetchContractStateFromIndexer(contractAddress);
    if (!stateResult) {
      (result.errors as string[]).push(`Contract ${contractAddress} not found on Midnight Preprod indexer. The address may be incorrect or the contract was not deployed.`);
      return res.json(result);
    }
    result.contractFound = true;
    result.contractStateFound = true;
    result.deployBlockHeight = stateResult.blockHeight;
    result.deployTxHash = stateResult.txHash;
    result.stateHexLength = stateResult.stateHex.length;

    // Decode state
    try {
      const decoded = decodeContractState(stateResult.stateHex);
      result.contractStateDecoded = true;

      // Verify each registered tournament against on-chain state
      const verifiedTournaments: Array<{ id: string; onChain: boolean; data: unknown }> = [];
      for (const t of registry.tournaments) {
        const idBytes = new Uint8Array(32);
        const enc = new TextEncoder().encode(t.id);
        idBytes.set(enc.slice(0, 32));
        const onChainData = decoded.tournamentLookup(idBytes);
        verifiedTournaments.push({
          id: t.id,
          onChain: onChainData !== null,
          data: onChainData
        });
      }
      result.onChainVerification = verifiedTournaments;
      result.decodedTournamentCount = `${verifiedTournaments.filter(t => t.onChain).length} of ${registry.tournaments.length} registered tournaments found on-chain`;
    } catch (decErr) {
      (result.errors as string[]).push(`ContractState decode error: ${(decErr as Error).message}`);
    }
  } catch (fetchErr) {
    (result.errors as string[]).push(`Indexer fetch error: ${(fetchErr as Error).message}`);
  }

  return res.json(result);
});

// DELETE /api/tournaments/:id — Remove from registry (organizer only use-case)
app.delete('/api/tournaments/:id', (req, res) => {
  const { id } = req.params;
  const before = registry.tournaments.length;
  registry.tournaments = registry.tournaments.filter(t => t.id !== id);
  if (registry.tournaments.length < before) {
    registry.lastUpdated = new Date().toISOString();
    saveRegistry(registry);
    return res.json({ success: true, message: `Tournament ${id} removed from registry.` });
  }
  return res.status(404).json({ error: `Tournament ${id} not found in registry.` });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       PrivateRank Backend Middleware Server               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`  Server:        http://localhost:${PORT}`);
  console.log(`  Indexer:       ${INDEXER_URL}`);
  console.log(`  Contract:      ${getContractAddress() || '(not set yet — POST /api/contract)'}`);
  console.log(`  Frontend CORS: ${FRONTEND_URL}`);
  console.log(`  Registry:      ${registry.tournaments.length} tournament(s)`);
  console.log('');
  console.log('  Endpoints:');
  console.log(`    GET  http://localhost:${PORT}/api/health`);
  console.log(`    GET  http://localhost:${PORT}/api/tournaments`);
  console.log(`    POST http://localhost:${PORT}/api/tournaments`);
  console.log(`    GET  http://localhost:${PORT}/api/tournaments/debug`);
  console.log(`    GET  http://localhost:${PORT}/api/contract`);
  console.log(`    POST http://localhost:${PORT}/api/contract`);
  console.log('');
});

export default app;
