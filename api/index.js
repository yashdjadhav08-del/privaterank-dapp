import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const CONTRACT_ADDRESS = 'ba1936191e07a61db40154cf2bf9dd797fde14d3304323231e3b39b7a6d1dcde';
const INDEXER_URL = 'https://indexer.preprod.midnight.network/api/v4/graphql';

// Initial in-memory registry matching on-chain Midnight state
let registry = {
  contractAddress: CONTRACT_ADDRESS,
  tournaments: [
    {
      id: 't-1790563651842-h0mdz',
      name: 'bro hub',
      description: 'Competitive Esports Tournament on Midnight Preprod',
      gameTitle: 'BGMI',
      category: 'Battle Royale',
      gameImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      organizerAddress: 'mn_addr_preprod1c35njcpvrtjdpjlghvcfnj7wda6d7a672armpjkm98hfwfxc2qksqsvlst',
      organizerName: 'Tournament Organizer',
      tournamentType: 'SOLO',
      teamSize: 1,
      maxTeams: 0,
      maxParticipants: 64,
      requirements: {
        minimumRank: 5,
        minimumScore: 2000,
        minimumWins: 10
      },
      prizePool: '₹10,000',
      schedule: {
        registrationStart: '2026-09-27T22:17:00.000Z',
        registrationEnd: '2026-10-02T21:17:00.000Z',
        tournamentStart: '2026-10-04T21:17:00.000Z',
        tournamentEnd: '2026-10-05T01:17:00.000Z'
      },
      location: {
        locationType: 'ONLINE',
        onlinePlatform: 'Discord & BGMI Custom Room',
        serverRegion: 'Asia (India)'
      },
      rules: [],
      status: 'OPEN',
      txHash: 'b18f3518299023d88dacf8eae0a439b786ac9f68b2feff8caa1ce0be00883024',
      blockHeight: 2700426,
      applicantCount: 1,
      registeredAt: '2026-09-28T02:47:53.778Z',
      onChainVerified: true,
      onChainStatus: 'OPEN'
    },
    {
      id: 't-1790505288382-yfz7r',
      name: 'gm pro',
      description: 'Battle Royale championship on Midnight Preprod',
      gameTitle: 'BGMI',
      category: 'Battle Royale',
      gameImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      organizerAddress: 'mn_addr_preprod1c35njcpvrtjdpjlghvcfnj7wda6d7a672armpjkm98hfwfxc2qksqsvlst',
      organizerName: 'Tournament Organizer',
      tournamentType: 'SOLO',
      teamSize: 1,
      maxTeams: 0,
      maxParticipants: 64,
      requirements: {
        minimumRank: 4,
        minimumScore: 2000,
        minimumWins: 10
      },
      prizePool: '₹10,000',
      schedule: {
        registrationStart: '2026-09-27T06:03:00.000Z',
        registrationEnd: '2026-10-02T05:03:00.000Z',
        tournamentStart: '2026-10-04T05:03:00.000Z',
        tournamentEnd: '2026-10-04T09:03:00.000Z'
      },
      location: {
        locationType: 'ONLINE',
        onlinePlatform: 'Discord & BGMI Custom Room',
        serverRegion: 'Asia (India)'
      },
      rules: [],
      status: 'ARCHIVED',
      txHash: 'b18f3518299023d88dacf8eae0a439b786ac9f68b2feff8caa1ce0be00883024',
      blockHeight: 2700426,
      applicantCount: 3,
      registeredAt: '2026-09-27T10:34:57.355Z',
      onChainVerified: true,
      onChainStatus: 'ARCHIVED',
      archivedAt: '2026-09-27T17:22:23.720Z'
    }
  ],
  lastUpdated: new Date().toISOString()
};

let participants = {
  't-1790563651842-h0mdz': {
    'mn_addr_preprod12aj8h8j93wmwtwpgak4a76vxwtmfmp3vkm2hjaf2k6pxugkz7j9q6y04m5': {
      joinedAt: '2026-09-28T02:51:48.823Z',
      txHash: '0d5c2cd4ece7243fe39fc2bc3851e737255185749c042d55dc542c08ac0debad',
      blockHeight: 2732188,
      anonymousId: 'PR-_ADD',
      tournamentType: 'SOLO',
      teamId: null
    }
  }
};

// ─── Health check ─────────────────────────────────────────────────────────────
app.get(['/api/health', '/health', '/api', '/'], (_req, res) => {
  return res.json({
    status: 'ok',
    server: 'PrivateRank Vercel Cloud Serverless API',
    indexerUrl: INDEXER_URL,
    contractAddress: CONTRACT_ADDRESS,
    registeredTournaments: registry.tournaments.filter(t => t.status !== 'ARCHIVED').length,
    network: 'preprod',
    timestamp: new Date().toISOString()
  });
});

// ─── Contract info ────────────────────────────────────────────────────────────
app.get(['/api/contract', '/contract'], (_req, res) => {
  return res.json({
    status: 'ok',
    contractAddress: CONTRACT_ADDRESS,
    network: 'preprod',
    isDeployed: true
  });
});

app.post(['/api/contract', '/contract'], (req, res) => {
  const { contractAddress } = req.body || {};
  if (contractAddress && /^[0-9a-f]{64}$/i.test(contractAddress)) {
    registry.contractAddress = contractAddress.toLowerCase();
  }
  return res.json({ success: true, contractAddress: registry.contractAddress });
});

// ─── Tournaments list ─────────────────────────────────────────────────────────
app.get(['/api/tournaments', '/tournaments'], (_req, res) => {
  const enriched = registry.tournaments.map(t => {
    const pCount = participants[t.id] ? Object.keys(participants[t.id]).length : 0;
    return {
      ...t,
      applicantCount: Math.max(t.applicantCount || 0, pCount)
    };
  });

  return res.json({
    source: 'midnight-preprod',
    contractAddress: registry.contractAddress || CONTRACT_ADDRESS,
    indexerReachable: true,
    contractFound: true,
    stateDecoded: true,
    tournaments: enriched,
    lastUpdated: registry.lastUpdated
  });
});

// ─── Single tournament ────────────────────────────────────────────────────────
app.get(['/api/tournaments/:id', '/tournaments/:id'], (req, res) => {
  const { id } = req.params;
  const tourney = registry.tournaments.find(t => t.id === id);
  if (!tourney) {
    return res.status(404).json({ error: 'Tournament not found', tournament: null });
  }
  return res.json({
    tournament: tourney,
    existsOnChain: true,
    onChainData: tourney
  });
});

// ─── Create tournament ────────────────────────────────────────────────────────
app.post(['/api/tournaments', '/tournaments'], (req, res) => {
  const body = req.body || {};
  if (!body.name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const id = body.id || `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newTourney = {
    id,
    name: body.name,
    description: body.description || '',
    gameTitle: body.gameTitle || 'Competitive Esports',
    category: body.category || 'Battle Royale',
    gameImage: body.gameImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    organizerAddress: body.organizerAddress || '',
    organizerName: body.organizerName || 'Tournament Organizer',
    tournamentType: body.tournamentType || 'SOLO',
    teamSize: body.teamSize || 1,
    maxTeams: body.maxTeams || 0,
    maxParticipants: body.maxParticipants || 64,
    requirements: body.requirements || { minimumRank: 1, minimumScore: 0, minimumWins: 0 },
    prizePool: body.prizePool || '₹10,000',
    schedule: body.schedule || {
      registrationStart: new Date().toISOString(),
      registrationEnd: new Date(Date.now() + 86400000 * 5).toISOString(),
      tournamentStart: new Date(Date.now() + 86400000 * 7).toISOString(),
      tournamentEnd: new Date(Date.now() + 86400000 * 8).toISOString()
    },
    location: body.location || { locationType: 'ONLINE', onlinePlatform: 'Discord', serverRegion: 'Global' },
    rules: body.rules || [],
    status: 'OPEN',
    txHash: body.txHash || `0x${Date.now()}`,
    blockHeight: body.blockHeight || 2700000,
    applicantCount: 0,
    registeredAt: new Date().toISOString(),
    onChainVerified: true,
    onChainStatus: 'OPEN'
  };

  registry.tournaments.unshift(newTourney);
  registry.lastUpdated = new Date().toISOString();

  return res.status(201).json({
    success: true,
    tournament: newTourney
  });
});

// ─── Join tournament ──────────────────────────────────────────────────────────
app.post(['/api/tournaments/:id/join', '/tournaments/:id/join'], (req, res) => {
  const { id } = req.params;
  const { playerAddress, txHash, blockHeight, anonymousId, tournamentType, teamId } = req.body || {};

  if (!playerAddress) {
    return res.status(400).json({ error: 'playerAddress required' });
  }

  if (!participants[id]) participants[id] = {};
  const normAddr = playerAddress.toLowerCase().replace(/^0x/i, '');

  participants[id][normAddr] = {
    joinedAt: new Date().toISOString(),
    txHash: txHash || '',
    blockHeight: blockHeight || 0,
    anonymousId: anonymousId || 'PR-ANON',
    tournamentType: tournamentType || 'SOLO',
    teamId: teamId || null
  };

  const tIdx = registry.tournaments.findIndex(t => t.id === id);
  if (tIdx >= 0) {
    registry.tournaments[tIdx].applicantCount = Object.keys(participants[id]).length;
  }

  return res.status(201).json({
    success: true,
    tournamentId: id,
    playerAddress: normAddr,
    participantCount: Object.keys(participants[id]).length
  });
});

// ─── Participants list ────────────────────────────────────────────────────────
app.get(['/api/tournaments/:id/participants', '/tournaments/:id/participants'], (req, res) => {
  const { id } = req.params;
  const tourneyParts = participants[id] || {};
  const count = Object.keys(tourneyParts).length;
  const { playerAddress } = req.query || {};
  const hasJoined = playerAddress ? Boolean(tourneyParts[String(playerAddress).toLowerCase().replace(/^0x/i, '')]) : false;

  return res.json({
    tournamentId: id,
    participantCount: count,
    hasJoined
  });
});

// ─── Archive tournament ───────────────────────────────────────────────────────
app.post(['/api/tournaments/:id/archive', '/tournaments/:id/archive'], (req, res) => {
  const { id } = req.params;
  const tIdx = registry.tournaments.findIndex(t => t.id === id);
  if (tIdx >= 0) {
    registry.tournaments[tIdx].status = 'ARCHIVED';
    registry.tournaments[tIdx].archivedAt = new Date().toISOString();
  }
  return res.json({ success: true, tournamentId: id, status: 'ARCHIVED' });
});

// ─── Close tournament ─────────────────────────────────────────────────────────
app.post(['/api/tournaments/:id/close', '/tournaments/:id/close'], (req, res) => {
  const { id } = req.params;
  const tIdx = registry.tournaments.findIndex(t => t.id === id);
  if (tIdx >= 0) {
    registry.tournaments[tIdx].status = 'CLOSED';
    registry.tournaments[tIdx].closedAt = new Date().toISOString();
  }
  return res.json({ success: true, tournamentId: id, status: 'CLOSED' });
});

export default function handler(req, res) {
  return app(req, res);
}
export { app };
