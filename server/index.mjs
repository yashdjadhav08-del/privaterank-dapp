/**
 * PrivateRank Backend Middleware Server (ESM, Node.js native)
 * Start: node server/index.mjs
 *
 * Architecture:
 *   Midnight Preprod → Official GraphQL Indexer → This Server → REST API → Frontend
 */

import express from 'express';
import cors from 'cors';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import { ledger as getLedger } from '../src/contracts/managed/privaterank/contract/index.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Configuration ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PRIVATERANK_SERVER_PORT || process.env.SERVER_PORT || '4000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const INDEXER_URL = process.env.VITE_PREPROD_INDEXER_URL ||
  process.env.PREPROD_INDEXER_URL ||
  'https://indexer.preprod.midnight.network/api/v4/graphql';

const BLACKLISTED_ADDRESSES = new Set([
  '0200986cc290581e0b324aea46b1fbe059d6e00dc60ab9c20f162d653588b4d2',
  '02007072697661746572616e6b6d69646e6967687470726570726f6430303031',
  'a4f5e2b8ab757f5e4d981415f74fffea3e42c50d7d0fb50e04bf47ac2faf7078',
  '465b7e551989396986ba3fdd11009ab45f6fc05bbd9ce2d053ded54dfe8c0088',
  '2f8eae6f0d87fc2139e3a777ca59a26ba86487cf66456daa314ed220c98b7a6b'
]);

function isBlacklisted(addr) {
  if (!addr) return true;
  const clean = addr.toLowerCase().trim().replace(/^0x/i, '');
  if (BLACKLISTED_ADDRESSES.has(clean)) return true;
  if (
    clean.startsWith('020070') ||
    clean.startsWith('465b7e') ||
    clean.startsWith('a4f5e2') ||
    clean.startsWith('2f8eae')
  ) {
    return true;
  }
  return false;
}

// ─── Registry (JSON persistence) ───────────────────────────────────────────────
const REGISTRY_PATH = path.join(__dirname, 'tournament-registry.json');
const PARTICIPANTS_PATH = path.join(__dirname, 'participants-registry.json');

function loadRegistry() {
  if (existsSync(REGISTRY_PATH)) {
    try {
      return JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
    } catch (e) {
      console.error('[PrivateRank][SERVER] Registry parse error:', e.message);
    }
  }
  return { contractAddress: null, tournaments: [], lastUpdated: new Date().toISOString() };
}

function saveRegistry(reg) {
  try {
    writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2), 'utf-8');
  } catch (e) {
    console.error('[PrivateRank][SERVER] Registry save error:', e.message);
  }
}

function loadParticipants() {
  if (existsSync(PARTICIPANTS_PATH)) {
    try {
      return JSON.parse(readFileSync(PARTICIPANTS_PATH, 'utf-8'));
    } catch (e) {
      console.error('[PrivateRank][SERVER] Participants parse error:', e.message);
    }
  }
  // Map of tournamentId -> { playerAddress -> { joinedAt, txHash, anonymousId } }
  return {};
}

function saveParticipants(p) {
  try {
    writeFileSync(PARTICIPANTS_PATH, JSON.stringify(p, null, 2), 'utf-8');
  } catch (e) {
    console.error('[PrivateRank][SERVER] Participants save error:', e.message);
  }
}

let registry = loadRegistry();
let participants = loadParticipants();

// ─── Contract Address ──────────────────────────────────────────────────────────
function getContractAddress() {
  const envAddr = process.env.VITE_PREPROD_CONTRACT_ADDRESS || process.env.PREPROD_CONTRACT_ADDRESS;
  if (envAddr) {
    const clean = envAddr.trim().replace(/^0x/i, '').toLowerCase();
    if (/^[0-9a-f]{64}$/.test(clean) && !isBlacklisted(clean)) return clean;
  }
  if (registry.contractAddress && !isBlacklisted(registry.contractAddress)) {
    return registry.contractAddress;
  }
  return null;
}

function setContractAddress(addr) {
  const clean = addr.trim().replace(/^0x/i, '').toLowerCase();
  if (/^[0-9a-f]{64}$/.test(clean) && !isBlacklisted(clean)) {
    registry.contractAddress = clean;
    saveRegistry(registry);
    console.log('[PrivateRank][SERVER] Contract address set:', clean);
  }
}

function formatPrizePool(prize) {
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

// ─── Indexer ───────────────────────────────────────────────────────────────────
async function queryIndexer(query, variables) {
  console.log('[PrivateRank][INDEXER] querying Preprod...');
  const res = await fetch(INDEXER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) throw new Error(`Indexer HTTP ${res.status} ${res.statusText}`);
  const json = await res.json();
  console.log('[PrivateRank][INDEXER] response received');
  if (json.errors?.length) throw new Error(`Indexer GraphQL: ${json.errors.map(e => e.message).join(', ')}`);
  return json.data;
}

async function fetchContractState(contractAddress) {
  const GQL = `
    query GetContractState($address: HexEncoded!) {
      contractAction(address: $address) {
        address state
        transaction { hash block { height } }
      }
    }`;
  const data = await queryIndexer(GQL, { address: contractAddress });
  const ca = data?.contractAction;
  if (!ca?.address || !ca?.state) return null;
  return { address: ca.address, stateHex: ca.state, blockHeight: ca.transaction?.block?.height ?? null, txHash: ca.transaction?.hash ?? null };
}

// ─── ContractState Decoder ─────────────────────────────────────────────────────
function decodeState(stateHex) {
  const hex = stateHex.replace(/^0x/i, '');
  const rawBytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < rawBytes.length; i++) rawBytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  console.log(`[PrivateRank][SERVER] Raw ContractState length = ${rawBytes.length}`);

  const cs = compactRuntime.ContractState.deserialize(rawBytes);
  console.log('[PrivateRank][SERVER] ContractState decoded');
  const lv = getLedger(cs.data);
  console.log('[PrivateRank][SERVER] ledger() OK, keys:', Object.keys(lv || {}).join(', '));

  // Compact Map supports: isEmpty, size (may throw), member(key), lookup(key)
  // It does NOT support iteration — we must know keys to look them up
  function idToBytes(id) {
    const b = new Uint8Array(32);
    const enc = new TextEncoder().encode(id);
    b.set(enc.slice(0, 32));
    return b;
  }

  function lookupTournament(id) {
    try {
      if (!lv?.tournaments) return null;
      const kb = idToBytes(id);
      const isMember = lv.tournaments.member(kb);
      if (!isMember) return null;
      const t = lv.tournaments.lookup(kb);
      if (!t) return null;
      const orgHex = Array.from(t.organizer).map(b => b.toString(16).padStart(2, '0')).join('');
      return {
        organizer: orgHex,
        status: Number(t.status ?? 1),
        minRank: Number(t.minRank ?? 1),
        minScore: Number(t.minScore ?? 0),
        minWins: Number(t.minWins ?? 0),
        deadline: Number(t.deadline ?? 0),
        applicantCount: Number(t.applicantCount ?? 0),
        exists: true
      };
    } catch (e) {
      console.warn('[PrivateRank][SERVER] lookupTournament error:', e.message);
      return null;
    }
  }

  function memberCheck(id) {
    try {
      if (!lv?.tournaments) return false;
      return Boolean(lv.tournaments.member(idToBytes(id)));
    } catch { return false; }
  }

  return { lv, lookupTournament, memberCheck };
}

// ─── Express ───────────────────────────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use((req, _res, next) => { console.log(`[PrivateRank][SERVER] ${req.method} ${req.path}`); next(); });

// ─── GET /api/health ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok', server: 'PrivateRank Backend',
    indexerUrl: INDEXER_URL,
    contractAddress: getContractAddress() || 'NOT_SET',
    registeredTournaments: registry.tournaments.length,
    uptime: process.uptime()
  });
});

// ─── GET /api/contract ────────────────────────────────────────────────────────
app.get('/api/contract', async (_req, res) => {
  const addr = getContractAddress();
  if (!addr) return res.status(404).json({ error: 'Contract address not configured. POST /api/contract to set it.' });
  try {
    const sr = await fetchContractState(addr);
    if (!sr) return res.status(404).json({ error: `Contract ${addr} not found on Preprod indexer.`, contractAddress: addr });
    return res.json({ contractAddress: sr.address, blockHeight: sr.blockHeight, txHash: sr.txHash, stateHexLength: sr.stateHex.length, isDeployed: true });
  } catch (e) {
    return res.status(500).json({ error: `Indexer error: ${e.message}` });
  }
});

// ─── POST /api/contract ───────────────────────────────────────────────────────
app.post('/api/contract', (req, res) => {
  const { contractAddress } = req.body;
  if (!contractAddress) return res.status(400).json({ error: 'contractAddress required' });
  const clean = contractAddress.trim().replace(/^0x/i, '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(clean)) return res.status(400).json({ error: 'Must be 64 hex chars' });
  if (BLACKLISTED_ADDRESSES.has(clean)) return res.status(400).json({ error: `Address ${clean} is blacklisted.` });
  setContractAddress(clean);
  return res.json({ success: true, contractAddress: clean });
});

// ─── GET /api/tournaments ─────────────────────────────────────────────────────
app.get('/api/tournaments', async (_req, res) => {
  const contractAddress = getContractAddress();
  let decoded = null;
  let indexerReachable = false;
  let contractFound = false;
  let stateDecoded = false;

  if (contractAddress) {
    try {
      const sr = await fetchContractState(contractAddress);
      indexerReachable = true;
      if (sr) {
        contractFound = true;
        try {
          decoded = decodeState(sr.stateHex);
          stateDecoded = true;
          console.log('[PrivateRank][SERVER] ContractState decoded successfully');
        } catch (de) {
          console.error('[PrivateRank][SERVER] Decode error:', de.message);
        }
      }
    } catch (ie) {
      console.error('[PrivateRank][SERVER] Indexer error:', ie.message);
    }
  }

  const statusMap = { 0: 'DRAFT', 1: 'OPEN', 2: 'CLOSED', 3: 'COMPLETED', 4: 'ARCHIVED' };

  const enriched = registry.tournaments.map(t => {
    let onChainData = null;
    if (decoded) onChainData = decoded.lookupTournament(t.id);
    const statusStr = onChainData
      ? (statusMap[onChainData.status] || t.status)
      : t.status;

    // Merge server-side participant count with on-chain applicantCount
    const serverParticipants = participants[t.id] ? Object.keys(participants[t.id]).length : 0;
    const onChainApplicants = onChainData ? onChainData.applicantCount : (t.applicantCount ?? 0);
    // Use whichever is higher (on-chain is authoritative, server tracks locally too)
    const finalApplicantCount = Math.max(serverParticipants, onChainApplicants, t.applicantCount ?? 0);

    return {
      ...t,
      prizePool: formatPrizePool(t.prizePool),
      status: statusStr,
      applicantCount: finalApplicantCount,
      onChainVerified: onChainData !== null,
      onChainStatus: onChainData ? statusStr : null,
      requirements: onChainData ? {
        minimumRank: onChainData.minRank,
        minimumScore: onChainData.minScore,
        minimumWins: onChainData.minWins
      } : t.requirements
    };
  });

  console.log(`[PrivateRank][SERVER] Tournament count = ${enriched.length}`);
  return res.json({
    source: 'midnight-preprod',
    contractAddress: contractAddress || null,
    indexerReachable,
    contractFound,
    stateDecoded,
    tournaments: enriched,
    lastUpdated: registry.lastUpdated
  });
});

// ─── POST /api/tournaments ────────────────────────────────────────────────────
app.post('/api/tournaments', async (req, res) => {
  const body = req.body;
  if (!body.id || !body.name) {
    return res.status(400).json({ error: 'id and name required' });
  }
  if (body.contractAddress) setContractAddress(body.contractAddress);

  const contractAddress = getContractAddress();
  let onChainVerified = false;
  if (contractAddress) {
    try {
      const sr = await fetchContractState(contractAddress);
      if (sr) {
        const d = decodeState(sr.stateHex);
        onChainVerified = d.memberCheck(body.id);
        console.log(`[PrivateRank][SERVER] On-chain verification for '${body.id}': ${onChainVerified}`);
      }
    } catch (e) {
      console.warn('[PrivateRank][SERVER] Verification skipped:', e.message);
    }
  }

  const tournament = {
    id: body.id,
    name: body.name,
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
    applicantCount: 0,
    registeredAt: new Date().toISOString(),
    onChainVerified,
    onChainStatus: onChainVerified ? 'OPEN' : null
  };

  const idx = registry.tournaments.findIndex(t => t.id === tournament.id);
  if (idx >= 0) {
    registry.tournaments[idx] = tournament;
    console.log(`[PrivateRank][SERVER] Updated: ${tournament.id}`);
  } else {
    registry.tournaments.unshift(tournament);
    console.log(`[PrivateRank][SERVER] Registered new: ${tournament.id}`);
  }
  registry.lastUpdated = new Date().toISOString();
  saveRegistry(registry);

  return res.status(201).json({ success: true, tournament, onChainVerified });
});

// ─── GET /api/tournaments/:id ────────────────────────────────────────────────
app.get('/api/tournaments/:id', async (req, res) => {
  const { id } = req.params;
  const contractAddress = getContractAddress();
  let onChainData = null;
  if (contractAddress) {
    try {
      const sr = await fetchContractState(contractAddress);
      if (sr) {
        const d = decodeState(sr.stateHex);
        onChainData = d.lookupTournament(id);
      }
    } catch (e) {
      console.warn(`[PrivateRank][SERVER] Failed to query on-chain state for tournament ${id}:`, e.message);
    }
  }

  const tournament = registry.tournaments.find(t => t.id === id);
  if (!tournament && !onChainData) {
    return res.status(404).json({ error: `Tournament ${id} not found`, existsOnChain: false });
  }

  const serverParticipants = participants[id] ? Object.keys(participants[id]).length : 0;
  const onChainApplicants = onChainData ? onChainData.applicantCount : (tournament?.applicantCount ?? 0);
  const finalApplicantCount = Math.max(serverParticipants, onChainApplicants, tournament?.applicantCount ?? 0);

  return res.json({
    tournament: tournament ? {
      ...tournament,
      applicantCount: finalApplicantCount,
      onChainVerified: onChainData !== null
    } : null,
    existsOnChain: onChainData !== null,
    onChainData
  });
});

// ─── POST /api/tournaments/:id/join ──────────────────────────────────────────
// Called AFTER a successful on-chain joinTournament transaction is confirmed.
// Records the participation server-side for cross-browser visibility.
app.post('/api/tournaments/:id/join', async (req, res) => {
  const { id } = req.params;
  const { playerAddress, txHash, blockHeight, anonymousId, tournamentType, teamId } = req.body;

  if (!playerAddress) {
    return res.status(400).json({ error: 'playerAddress required' });
  }
  if (!txHash) {
    return res.status(400).json({ error: 'txHash required (must be an on-chain confirmed transaction)' });
  }

  const tournament = registry.tournaments.find(t => t.id === id);
  if (!tournament) {
    return res.status(404).json({ error: `Tournament ${id} not found in registry` });
  }

  // Initialize participants for this tournament if not exists
  if (!participants[id]) {
    participants[id] = {};
  }

  const normalizedAddr = playerAddress.toLowerCase().replace(/^0x/i, '');

  // Check if already joined
  if (participants[id][normalizedAddr]) {
    return res.status(409).json({
      error: 'Already joined',
      participation: participants[id][normalizedAddr]
    });
  }

  // Record participation
  participants[id][normalizedAddr] = {
    joinedAt: new Date().toISOString(),
    txHash,
    blockHeight: blockHeight || 0,
    anonymousId: anonymousId || '',
    tournamentType: tournamentType || 'SOLO',
    teamId: teamId || null
  };

  // Update tournament applicant count in registry
  const tidx = registry.tournaments.findIndex(t => t.id === id);
  if (tidx >= 0) {
    const currentCount = Object.keys(participants[id]).length;
    registry.tournaments[tidx].applicantCount = currentCount;
    registry.lastUpdated = new Date().toISOString();
    saveRegistry(registry);
  }
  saveParticipants(participants);

  console.log(`[PrivateRank][SERVER] Player joined tournament '${id}': ${normalizedAddr.slice(0, 16)}... (tx: ${txHash.slice(0, 16)}...)`);

  return res.status(201).json({
    success: true,
    tournamentId: id,
    playerAddress: normalizedAddr,
    participantCount: Object.keys(participants[id]).length,
    joinedAt: participants[id][normalizedAddr].joinedAt
  });
});

// ─── GET /api/tournaments/:id/participants ────────────────────────────────────
app.get('/api/tournaments/:id/participants', (req, res) => {
  const { id } = req.params;
  const tournamentParticipants = participants[id] || {};
  const count = Object.keys(tournamentParticipants).length;

  // Check if specific player has joined
  const { playerAddress } = req.query;
  let hasJoined = false;
  if (playerAddress) {
    const normalized = String(playerAddress).toLowerCase().replace(/^0x/i, '');
    hasJoined = !!tournamentParticipants[normalized];
  }

  return res.json({
    tournamentId: id,
    participantCount: count,
    hasJoined,
    // Do NOT expose full participant list for privacy — only aggregate count
  });
});

// ─── POST /api/tournaments/:id/archive ───────────────────────────────────────
// Called AFTER a successful on-chain archiveTournament transaction is confirmed.
// Updates the server-side registry to reflect ARCHIVED status.
app.post('/api/tournaments/:id/archive', async (req, res) => {
  const { id } = req.params;
  const { organizerAddress, txHash, blockHeight } = req.body;

  if (!organizerAddress) {
    return res.status(400).json({ error: 'organizerAddress required' });
  }
  if (!txHash) {
    return res.status(400).json({ error: 'txHash required (must be a confirmed on-chain archiveTournament transaction)' });
  }

  const idx = registry.tournaments.findIndex(t => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: `Tournament ${id} not found in registry` });
  }

  const tournament = registry.tournaments[idx];

  // Ownership check
  const normalizedOrganizer = organizerAddress.toLowerCase().replace(/^0x/i, '');
  const normalizedTournamentOrganizer = (tournament.organizerAddress || '').toLowerCase().replace(/^0x/i, '');
  if (normalizedOrganizer !== normalizedTournamentOrganizer) {
    return res.status(403).json({ error: 'Access Denied: Only the tournament organizer can archive this tournament.' });
  }

  // Update status
  registry.tournaments[idx] = {
    ...tournament,
    status: 'ARCHIVED',
    archiveTxHash: txHash,
    archiveBlockHeight: blockHeight || 0,
    archivedAt: new Date().toISOString()
  };
  registry.lastUpdated = new Date().toISOString();
  saveRegistry(registry);

  console.log(`[PrivateRank][SERVER] Tournament archived: '${id}' (tx: ${txHash.slice(0, 16)}...)`);

  return res.json({
    success: true,
    tournamentId: id,
    status: 'ARCHIVED',
    archivedAt: registry.tournaments[idx].archivedAt
  });
});

// ─── POST /api/tournaments/:id/close ─────────────────────────────────────────
// Called AFTER a successful on-chain closeTournament transaction is confirmed.
app.post('/api/tournaments/:id/close', async (req, res) => {
  const { id } = req.params;
  const { organizerAddress, txHash, blockHeight } = req.body;

  if (!organizerAddress) {
    return res.status(400).json({ error: 'organizerAddress required' });
  }
  if (!txHash) {
    return res.status(400).json({ error: 'txHash required' });
  }

  const idx = registry.tournaments.findIndex(t => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: `Tournament ${id} not found in registry` });
  }

  const tournament = registry.tournaments[idx];

  // Ownership check
  const normalizedOrganizer = organizerAddress.toLowerCase().replace(/^0x/i, '');
  const normalizedTournamentOrganizer = (tournament.organizerAddress || '').toLowerCase().replace(/^0x/i, '');
  if (normalizedOrganizer !== normalizedTournamentOrganizer) {
    return res.status(403).json({ error: 'Access Denied: Only the tournament organizer can close this tournament.' });
  }

  registry.tournaments[idx] = {
    ...tournament,
    status: 'CLOSED',
    closeTxHash: txHash,
    closeBlockHeight: blockHeight || 0,
    closedAt: new Date().toISOString()
  };
  registry.lastUpdated = new Date().toISOString();
  saveRegistry(registry);

  console.log(`[PrivateRank][SERVER] Tournament closed: '${id}' (tx: ${txHash.slice(0, 16)}...)`);

  return res.json({
    success: true,
    tournamentId: id,
    status: 'CLOSED',
    closedAt: registry.tournaments[idx].closedAt
  });
});

// ─── GET /api/tournaments/debug ───────────────────────────────────────────────
app.get('/api/tournaments/debug', async (_req, res) => {
  const contractAddress = getContractAddress();
  const result = {
    server: 'PrivateRank Backend Middleware',
    indexerUrl: INDEXER_URL,
    contractAddress: contractAddress || 'NOT_SET',
    contractAddressBlacklisted: contractAddress ? BLACKLISTED_ADDRESSES.has(contractAddress) : null,
    indexerReachable: false,
    contractFound: false,
    contractStateFound: false,
    contractStateDecoded: false,
    decodedTournamentCount: 'N/A (Compact Map is not enumerable; registry-based lookup used)',
    registeredTournaments: registry.tournaments.length,
    tournamentIds: registry.tournaments.map(t => t.id),
    onChainVerification: [],
    tournaments: registry.tournaments,
    participantCounts: Object.fromEntries(
      Object.entries(participants).map(([tid, pmap]) => [tid, Object.keys(pmap).length])
    ),
    errors: []
  };

  // Test indexer
  try {
    const j = await queryIndexer('{ block { height timestamp } }');
    result.indexerReachable = true;
    result.latestBlock = j?.block;
  } catch (e) {
    result.errors.push(`Indexer unreachable: ${e.message}`);
  }

  if (!contractAddress) {
    result.errors.push('No contract address. POST /api/contract with { contractAddress }.');
    return res.json(result);
  }

  try {
    const sr = await fetchContractState(contractAddress);
    if (!sr) {
      result.errors.push(`Contract ${contractAddress} not found on Preprod. Wrong address?`);
      return res.json(result);
    }
    result.contractFound = true;
    result.contractStateFound = true;
    result.deployBlockHeight = sr.blockHeight;
    result.deployTxHash = sr.txHash;
    result.stateHexLength = sr.stateHex.length;

    try {
      const decoded = decodeState(sr.stateHex);
      result.contractStateDecoded = true;

      const verification = registry.tournaments.map(t => {
        const onChain = decoded.lookupTournament(t.id);
        return { id: t.id, name: t.name, onChain: onChain !== null, chainData: onChain };
      });
      result.onChainVerification = verification;
      const onChainCount = verification.filter(v => v.onChain).length;
      result.decodedTournamentCount = `${onChainCount} of ${registry.tournaments.length} registered tournaments verified on-chain`;
    } catch (de) {
      result.errors.push(`Decode error: ${de.message}`);
    }
  } catch (fe) {
    result.errors.push(`Fetch error: ${fe.message}`);
  }

  return res.json(result);
});

// ─── DELETE /api/tournaments/:id ──────────────────────────────────────────────
app.delete('/api/tournaments/:id', (req, res) => {
  const { id } = req.params;
  const before = registry.tournaments.length;
  registry.tournaments = registry.tournaments.filter(t => t.id !== id);
  if (registry.tournaments.length < before) {
    registry.lastUpdated = new Date().toISOString();
    saveRegistry(registry);
    return res.json({ success: true, message: `Removed ${id}` });
  }
  return res.status(404).json({ error: `Tournament ${id} not found` });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       PrivateRank Backend Middleware Server               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`  Server:        http://localhost:${PORT}`);
  console.log(`  Indexer:       ${INDEXER_URL}`);
  console.log(`  Contract:      ${getContractAddress() || '(not set — POST /api/contract)'}`);
  console.log(`  Frontend CORS: ${FRONTEND_URL}`);
  console.log(`  Registry:      ${registry.tournaments.length} tournament(s)`);
  console.log('');
  console.log('  Endpoints:');
  console.log(`    GET  http://localhost:${PORT}/api/health`);
  console.log(`    GET  http://localhost:${PORT}/api/tournaments`);
  console.log(`    POST http://localhost:${PORT}/api/tournaments`);
  console.log(`    POST http://localhost:${PORT}/api/tournaments/:id/join`);
  console.log(`    GET  http://localhost:${PORT}/api/tournaments/:id/participants`);
  console.log(`    POST http://localhost:${PORT}/api/tournaments/:id/archive`);
  console.log(`    POST http://localhost:${PORT}/api/tournaments/:id/close`);
  console.log(`    GET  http://localhost:${PORT}/api/tournaments/debug`);
  console.log(`    POST http://localhost:${PORT}/api/contract`);
  console.log('');
});

export default app;
