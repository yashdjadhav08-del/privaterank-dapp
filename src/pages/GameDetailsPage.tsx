import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useTournament } from '../context/TournamentContext';
import { RankBadge } from '../components/common/RankBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { TransactionModal } from '../components/common/TransactionModal';
import { Modal } from '../components/common/Modal';
import { safeAddressCompare, shortenAddress, formatPrizePool } from '../utils/crypto';
import { getVerifiedPrivateRankContract, PREPROD_CONFIG } from '../config/network';
import { 
  ArrowLeft, 
  Gamepad2, 
  Trophy, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  Award,
  Wallet,
  MapPin,
  Globe,
  Shield,
  PlusCircle,
  LogOut,
  Check,
  AlertCircle,
  Crown
} from 'lucide-react';

interface GameDetailsPageProps {
  tournamentId: string;
  onNavigate: (view: string) => void;
}

export const GameDetailsPage: React.FC<GameDetailsPageProps> = ({ tournamentId, onNavigate }) => {
  const { authState, playerProfile, activeRole, connectWallet } = useWallet();
  const { 
    tournaments, 
    applications, 
    teams,
    generateProof, 
    submitApplication,
    createTeam,
    joinTeam,
    leaveTeam,
    finalizeTeam,
    txProgress,
    txReceipt,
    resetTxState,
    refreshData 
  } = useTournament();

  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Team creation modal state
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const safeTournaments = Array.isArray(tournaments) ? tournaments : [];
  const safeApplications = Array.isArray(applications) ? applications : [];
  const safeTeams = Array.isArray(teams) ? teams : [];

  const activeTournaments = safeTournaments.filter(t => t && t.status !== 'ARCHIVED');
  const tournament = (tournamentId && safeTournaments.find(t => t && t.id === tournamentId)) || (activeTournaments.length > 0 ? activeTournaments[0] : null);

  useEffect(() => {
    if (tournament) {
      console.log('[PrivateRank][PLAYER]\nRendering tournament:', {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        gameTitle: tournament.gameTitle,
        category: tournament.category,
        tournamentType: tournament.tournamentType,
        teamSize: tournament.teamSize,
        maxTeams: tournament.maxTeams,
        maxParticipants: tournament.maxParticipants,
        requirements: tournament.requirements,
        prizePool: tournament.prizePool,
        prizeDetails: tournament.prizeDetails,
        schedule: tournament.schedule,
        location: tournament.location,
        status: tournament.status,
        applicantCount: tournament.applicantCount
      });
    }
  }, [tournament]);

  const isConnected = authState.isConnected && !!authState.unshieldedAddress;

  // Filter existing Solo application
  const existingApp = tournament && isConnected
    ? safeApplications.find(a => a && a.tournamentId === tournament.id && safeAddressCompare(a.playerWalletAddress, authState.unshieldedAddress))
    : null;

  // Filter existing Team membership in this tournament
  const tournamentTeams = tournament ? safeTeams.filter(t => t && t.tournamentId === tournament.id) : [];
  const myTeam = tournament && isConnected
    ? tournamentTeams.find(t => t.members.some(m => safeAddressCompare(m.playerWalletAddress, authState.unshieldedAddress)))
    : null;

  if (!tournament) {
    return (
      <div style={{ maxWidth: '800px', margin: '60px auto', padding: '20px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '40px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
            Tournament Not Found
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>
            The requested tournament is not available on the Midnight Network ledger.
          </p>
          <button onClick={() => onNavigate('explore')} className="btn-secondary">
            <ArrowLeft size={16} /> Back to Explore
          </button>
        </div>
      </div>
    );
  }

  const isSolo = tournament.tournamentType === 'SOLO';
  const isTeam = tournament.tournamentType === 'TEAM';
  const reqRank = tournament.requirements?.minimumRank || 1;
  const isRankEligible = playerProfile && playerProfile.gamingCredentials
    ? (playerProfile.gamingCredentials.rank || 1) >= reqRank
    : false;

  // --- SOLO APPLICATION HANDLER ---
  const handleJoinSolo = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (!playerProfile) {
      setErrorMessage('Player profile not initialized. Please reconnect your wallet.');
      return;
    }

    if (tournament.status === 'ARCHIVED' || tournament.status === 'CLOSED') {
      setErrorMessage(`This tournament is ${tournament.status.toLowerCase()} and is no longer accepting entries.`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 0. Check verified PrivateRank contract deployment
      const verifiedContract = await getVerifiedPrivateRankContract();
      if (!verifiedContract || !verifiedContract.isDeployed) {
        setErrorMessage(
          'PrivateRank contract is not deployed on Midnight Preprod yet.\nPlease ask the organizer to create the tournament through the Organizer Dashboard first.'
        );
        return;
      }

      const activeContractAddress = verifiedContract.contractAddress || PREPROD_CONFIG.contractAddress;

      console.log(`[JOIN DEBUG]\ncontractAddress = ${activeContractAddress}\ntournamentId from /api/tournaments = ${tournament.id}\ntournamentId from detail page = ${tournamentId || tournament.id}\ntournamentId passed to joinTournament = ${tournament.id}\nplayer wallet = ${authState.unshieldedAddress}\nnetwork = Preprod`);

      // 1. Generate Zero-Knowledge eligibility proof
      const proof = await generateProof({
        tournament,
        gamingCredentials: playerProfile.gamingCredentials,
        personalInfo: playerProfile.personalInfo,
        walletAddress: authState.unshieldedAddress!
      });

      // 2. Submit transaction with 1AM Wallet
      await submitApplication({
        tournamentId: tournament.id,
        playerWalletAddress: authState.unshieldedAddress!,
        anonymousPlayerId: playerProfile.anonymousId,
        gamingCredentials: playerProfile.gamingCredentials,
        proof
      });

      setSuccessMessage('Solo application submitted and confirmed on Midnight Preprod!');
      await refreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join tournament';
      console.error('[PrivateRank][JOIN] Technical error:', err);
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- CREATE TEAM HANDLER ---
  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !authState.unshieldedAddress || !playerProfile) return;

    if (tournament.status === 'ARCHIVED' || tournament.status === 'CLOSED') {
      setErrorMessage(`This tournament is ${tournament.status.toLowerCase()} and is no longer accepting team creation.`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Check verified PrivateRank contract deployment
      const verifiedContract = await getVerifiedPrivateRankContract();
      if (!verifiedContract || !verifiedContract.isDeployed) {
        setErrorMessage(
          'PrivateRank contract is not deployed on Midnight Preprod yet.\nPlease ask the organizer to create the tournament through the Organizer Dashboard first.'
        );
        return;
      }

      if (!tournament.txHash && !(tournament as any).onChainVerified) {
        setErrorMessage('This tournament could not be found on Midnight Preprod.');
        return;
      }

      const proof = await generateProof({
        tournament,
        gamingCredentials: playerProfile.gamingCredentials,
        personalInfo: playerProfile.personalInfo,
        walletAddress: authState.unshieldedAddress
      });

      await createTeam({
        tournamentId: tournament.id,
        captainWalletAddress: authState.unshieldedAddress,
        captainAnonymousId: playerProfile.anonymousId,
        teamName: newTeamName.trim(),
        gamingCredentials: playerProfile.gamingCredentials,
        proof
      });

      setShowCreateTeamModal(false);
      setNewTeamName('');
      setSuccessMessage(`Team "${newTeamName.trim()}" created successfully on Midnight Preprod!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create team';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- JOIN TEAM HANDLER ---
  const handleJoinTeam = async (teamId: string) => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (!playerProfile) {
      setErrorMessage('Player profile not initialized. Please reconnect your wallet.');
      return;
    }

    if (tournament.status === 'ARCHIVED' || tournament.status === 'CLOSED') {
      setErrorMessage(`This tournament is ${tournament.status.toLowerCase()} and is no longer accepting team joins.`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Check verified PrivateRank contract deployment
      const verifiedContract = await getVerifiedPrivateRankContract();
      if (!verifiedContract || !verifiedContract.isDeployed) {
        setErrorMessage(
          'PrivateRank contract is not deployed on Midnight Preprod yet.\nPlease ask the organizer to create the tournament through the Organizer Dashboard first.'
        );
        return;
      }

      if (!tournament.txHash && !(tournament as any).onChainVerified) {
        setErrorMessage('This tournament could not be found on Midnight Preprod.');
        return;
      }

      const proof = await generateProof({
        tournament,
        gamingCredentials: playerProfile.gamingCredentials,
        personalInfo: playerProfile.personalInfo,
        walletAddress: authState.unshieldedAddress!
      });

      await joinTeam({
        tournamentId: tournament.id,
        teamId,
        playerWalletAddress: authState.unshieldedAddress!,
        anonymousPlayerId: playerProfile.anonymousId,
        gamingCredentials: playerProfile.gamingCredentials,
        proof
      });

      setSuccessMessage('Joined team successfully! Verified on Midnight Preprod.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join team';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- LEAVE TEAM HANDLER ---
  const handleLeaveTeam = async (teamId: string) => {
    if (!authState.unshieldedAddress) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await leaveTeam({
        tournamentId: tournament.id,
        teamId,
        playerWalletAddress: authState.unshieldedAddress
      });
      setSuccessMessage(res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to leave team';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- FINALIZE TEAM HANDLER ---
  const handleFinalizeTeam = async (teamId: string) => {
    if (!authState.unshieldedAddress) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await finalizeTeam({
        tournamentId: tournament.id,
        teamId,
        captainWalletAddress: authState.unshieldedAddress
      });
      setSuccessMessage('Team finalized! Official tournament registration confirmed on Midnight.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to finalize team';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!tournament) {
    return (
      <div style={{ maxWidth: '800px', margin: '60px auto', padding: '20px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Trophy size={40} className="text-cyan-400 opacity-60" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
            No Active Tournaments Available Yet
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '420px' }}>
            No tournament was found or no active tournaments are currently registered on Midnight Preprod.
          </p>
          <button
            onClick={() => onNavigate('explore')}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.85rem' }}
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Back Navigation */}
      <div>
        <button
          onClick={() => onNavigate('explore')}
          className="btn-secondary"
          style={{ padding: '6px 14px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={14} /> Back to Explore
        </button>
      </div>

      {/* Game Header Banner */}
      <div
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
          background: `linear-gradient(to bottom, rgba(7, 10, 18, 0.4), rgba(7, 10, 18, 0.95)), url(${tournament.gameImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '32px 24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                background: 'rgba(0,0,0,0.7)',
                color: '#00f2fe',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                backdropFilter: 'blur(4px)'
              }}
            >
              {tournament.gameTitle || 'Game'}
            </span>

            <span
              style={{
                background: isTeam ? 'rgba(168, 85, 247, 0.8)' : 'rgba(0, 242, 254, 0.8)',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 800
              }}
            >
              {isTeam ? `TEAM • Squad Size ${tournament.teamSize}` : 'SOLO (Individual)'}
            </span>
          </div>

          <StatusBadge status={tournament.status || 'OPEN'} />
        </div>

        <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#f8fafc' }}>
          {tournament.name}
        </h1>

        <p style={{ color: '#cbd5e1', fontSize: '0.95rem', maxWidth: '700px', lineHeight: 1.5 }}>
          {tournament.description}
        </p>

        {/* Quick Meta Row */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '6px', fontSize: '0.85rem', color: '#94a3b8' }}>
          {isTeam ? (
            <>
              <div>Teams: <strong style={{ color: '#f8fafc' }}>{tournament.currentTeams || tournamentTeams.length} / {tournament.maxTeams}</strong></div>
              <div>Players: <strong style={{ color: '#f8fafc' }}>{tournament.currentParticipants || 0} / {tournament.maxParticipants}</strong></div>
            </>
          ) : (
            <div>Players: <strong style={{ color: '#f8fafc' }}>{tournament.applicantCount || 0} / {tournament.maxParticipants}</strong></div>
          )}
          <div>Prize Pool: <strong style={{ color: '#fbbf24' }}>{formatPrizePool(tournament.prizePool)}</strong></div>
        </div>
      </div>

      {/* Schedule & Location Details Panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#00f2fe', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} /> Tournament Schedule
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>Registration: <strong>{tournament.schedule?.registrationStart ? new Date(tournament.schedule.registrationStart).toLocaleString() : 'Open'}</strong> to <strong>{tournament.schedule?.registrationEnd ? new Date(tournament.schedule.registrationEnd).toLocaleString() : 'TBD'}</strong></div>
            <div>Tournament: <strong>{tournament.schedule?.tournamentStart ? new Date(tournament.schedule.tournamentStart).toLocaleString() : 'TBD'}</strong>{tournament.schedule?.tournamentEnd ? <> to <strong>{new Date(tournament.schedule.tournamentEnd).toLocaleString()}</strong></> : null}</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={15} /> Location Details
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
            {tournament.location?.locationType === 'ONLINE' && (
              <div>
                <div>Platform: <strong>{tournament.location.onlinePlatform || 'Discord & BGMI Custom Room'}</strong></div>
                {tournament.location.serverRegion && <div>Server / Region: <strong>{tournament.location.serverRegion}</strong></div>}
              </div>
            )}
            {tournament.location?.locationType === 'OFFLINE' && (
              <div>
                <div>Venue: <strong>{tournament.location.venueName || 'Venue'}</strong></div>
                <div>{[tournament.location.address, tournament.location.city, tournament.location.state, tournament.location.country].filter(Boolean).join(', ')}</div>
              </div>
            )}
            {tournament.location?.locationType === 'HYBRID' && (
              <div>
                <div>Online: <strong>{tournament.location.onlinePlatform || 'Online Platform'}</strong></div>
                <div>Venue: <strong>{tournament.location.venueName || 'Venue'}, {tournament.location.city || ''}</strong></div>
              </div>
            )}
            {!tournament.location && <div>Online • Discord & BGMI Custom Room</div>}
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} /> {errorMessage}
        </div>
      )}

      {/* SOLO TOURNAMENT VIEW */}
      {isSolo && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Left: Player Game Credentials */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gamepad2 size={18} className="text-cyan-400" />
              Your Game Credentials
            </h2>

            {isConnected && playerProfile && playerProfile.gamingCredentials ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>RANK</div>
                  <div style={{ marginTop: '4px' }}>
                    <RankBadge rank={playerProfile.gamingCredentials.rank || 1} size="sm" />
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SCORE</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00f2fe', marginTop: '2px' }}>
                    {playerProfile.gamingCredentials.score || 0} pts
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>WINS</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                    {playerProfile.gamingCredentials.wins || 0} W
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ELIGIBILITY</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isRankEligible ? '#34d399' : '#f87171', marginTop: '4px' }}>
                    {isRankEligible ? '✓ Eligible' : '✗ Ineligible'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <Wallet size={28} className="text-slate-500" />
                <div style={{ fontSize: '0.85rem' }}>Connect your 1AM wallet to verify your credentials.</div>
                <button onClick={() => connectWallet()} className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
                  Connect Wallet
                </button>
              </div>
            )}
          </div>

          {/* Right: Join Solo Action */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={18} className="text-amber-400" />
                Solo Tournament Entry
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Entry Requirement:</span>
                  <RankBadge rank={tournament.requirements?.minimumRank || 1} size="sm" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Minimum Score:</span>
                  <span style={{ color: '#00f2fe', fontWeight: 700 }}>≥ {tournament.requirements?.minimumScore || 0} pts</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Minimum Wins:</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>≥ {tournament.requirements?.minimumWins || 0} W</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Prize Pool:</span>
                  <span style={{ color: '#fbbf24', fontWeight: 800 }}>{formatPrizePool(tournament.prizePool)}</span>
                </div>

                {tournament.prizeDetails && (
                  <div style={{ padding: '8px 12px', background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '8px', fontSize: '0.8rem', color: '#fde68a' }}>
                    <div style={{ fontWeight: 700, marginBottom: '2px', color: '#fbbf24' }}>Prize Breakdown:</div>
                    <div>{tournament.prizeDetails}</div>
                  </div>
                )}

                <div style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={13} style={{ color: '#38bdf8', flexShrink: 0 }} />
                  <span>Transaction Fee: Paid in Midnight DUST when applicable</span>
                </div>
              </div>
            </div>

            <div>
              {tournament.status === 'ARCHIVED' ? (
                <div style={{ padding: '14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', textAlign: 'center', color: '#f87171', fontSize: '0.85rem' }}>
                  <strong>Tournament Archived</strong>: This tournament has been archived on Midnight Preprod and is closed to all entries.
                </div>
              ) : activeRole === 'ORGANIZER' ? (
                <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', textAlign: 'center', color: '#c084fc', fontSize: '0.85rem' }}>
                  <strong>Organizer Wallet</strong>: Organizers cannot participate or apply to tournaments.
                </div>
              ) : existingApp ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '8px', textAlign: 'center', color: '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>
                    ✓ You have joined this Solo tournament
                  </div>
                  <button onClick={() => onNavigate('dashboard')} className="btn-secondary" style={{ width: '100%', padding: '9px', fontSize: '0.85rem' }}>
                    View in Dashboard
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleJoinSolo}
                  disabled={isProcessing}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Verifying Proof & Joining...
                    </>
                  ) : !isConnected ? (
                    'Connect Wallet to Join'
                  ) : (
                    'Join Solo Tournament'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TEAM TOURNAMENT VIEW */}
      {isTeam && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Team Requirements & Prize Pool Banner */}
          <div className="glass-panel" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>ENTRY REQUIREMENT</div>
              <RankBadge rank={tournament.requirements?.minimumRank || 1} size="sm" />
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px' }}>MINIMUM STATS</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                <span style={{ color: '#00f2fe' }}>≥ {tournament.requirements?.minimumScore || 0} pts</span>
                <span style={{ color: '#64748b', margin: '0 6px' }}>•</span>
                <span style={{ color: '#34d399' }}>≥ {tournament.requirements?.minimumWins || 0} W</span>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px' }}>TOURNAMENT PRIZE POOL</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>
                {formatPrizePool(tournament.prizePool)}
              </div>
              {tournament.prizeDetails && (
                <div style={{ fontSize: '0.75rem', color: '#fde68a', marginTop: '2px' }}>
                  {tournament.prizeDetails}
                </div>
              )}
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <Shield size={12} /> Midnight Preprod
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Gas & proof verification fees are paid separately in DUST
              </div>
            </div>
          </div>

          {/* My Team Status (If already member of a team) */}
          {myTeam && (
            <section className="glass-panel" style={{ padding: '24px', borderLeft: myTeam.status === 'FINALIZED' ? '4px solid #10b981' : '4px solid #a855f7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
                      My Team: {myTeam.name}
                    </h2>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: myTeam.status === 'FINALIZED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                        color: myTeam.status === 'FINALIZED' ? '#34d399' : '#c084fc',
                        fontWeight: 700
                      }}
                    >
                      {myTeam.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>
                    Roster: <strong>{myTeam.members.length} / {myTeam.teamSize} Members</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {safeAddressCompare(myTeam.captainWalletAddress, authState.unshieldedAddress) ? (
                    <>
                      {myTeam.status !== 'FINALIZED' && (
                        <>
                          <button
                            onClick={() => handleLeaveTeam(myTeam.id)}
                            disabled={isProcessing}
                            className="btn-danger"
                            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                          >
                            Disband Team
                          </button>

                          <button
                            onClick={() => handleFinalizeTeam(myTeam.id)}
                            disabled={isProcessing || myTeam.members.length !== myTeam.teamSize}
                            className="btn-purple"
                            style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                          >
                            <Check size={14} /> Finalize Team Roster
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {myTeam.status !== 'FINALIZED' && (
                        <button
                          onClick={() => handleLeaveTeam(myTeam.id)}
                          disabled={isProcessing}
                          className="btn-danger"
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          <LogOut size={14} /> Leave Team
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Members List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {myTeam.members.map((member, idx) => {
                  const isCaptain = safeAddressCompare(member.playerWalletAddress, myTeam.captainWalletAddress);
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        border: isCaptain ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: '#00f2fe', fontWeight: 700 }}>
                          {member.anonymousPlayerId}
                        </span>
                        {isCaptain && (
                          <span style={{ fontSize: '0.7rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                            <Crown size={12} /> Captain
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <RankBadge rank={member.gamingCredentials?.rank || 1} size="sm" />
                        <span style={{ fontSize: '0.75rem', color: member.isEligible ? '#34d399' : '#f87171', fontWeight: 700 }}>
                          {member.isEligible ? '✓ Eligible' : '✗ Ineligible'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Score: {member.gamingCredentials?.score || 0} pts • {member.gamingCredentials?.wins || 0}W
                      </div>
                    </div>
                  );
                })}

                {/* Empty member slots */}
                {Array.from({ length: myTeam.teamSize - myTeam.members.length }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    style={{
                      padding: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '8px',
                      border: '1px dashed rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      fontSize: '0.8rem'
                    }}
                  >
                    + Open Slot ({myTeam.members.length + idx + 1}/{myTeam.teamSize})
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Create Team CTA (If user is not in a team) */}
          {!myTeam && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                  Create or Join a Squad
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Squad size: {tournament.teamSize} players. Max teams: {tournament.maxTeams}.
                </p>
              </div>

              {tournament.status === 'ARCHIVED' ? (
                <div style={{ padding: '6px 14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem' }}>
                  Tournament is archived. Team creation is disabled.
                </div>
              ) : activeRole === 'ORGANIZER' ? (
                <div style={{ padding: '6px 14px', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '6px', color: '#c084fc', fontSize: '0.8rem' }}>
                  Organizer accounts cannot create or join teams.
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateTeamModal(true)}
                  disabled={tournamentTeams.length >= tournament.maxTeams}
                  className="btn-purple"
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                >
                  <PlusCircle size={15} /> Create Team (Become Captain)
                </button>
              )}
            </div>
          )}

          {/* Available Teams List */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                Teams Roster ({tournamentTeams.length} / {tournament.maxTeams} Teams)
              </h3>
            </div>

            {tournamentTeams.length === 0 ? (
              <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                No teams registered yet. Be the first to create a team!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {tournamentTeams.map(t => {
                  const isMyTeam = myTeam?.id === t.id;
                  const isFull = t.members.length >= t.teamSize;
                  const isFinalized = t.status === 'FINALIZED';
                  const canJoin = activeRole !== 'ORGANIZER' && !myTeam && !isFull && !isFinalized && tournament.status !== 'ARCHIVED' && tournament.status !== 'CLOSED';

                  return (
                    <div
                      key={t.id}
                      className="glass-panel"
                      style={{
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        borderLeft: isFinalized ? '4px solid #10b981' : isMyTeam ? '4px solid #a855f7' : '4px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                            {t.name}
                          </h4>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: isFinalized ? 'rgba(16, 185, 129, 0.2)' : isFull ? 'rgba(251, 191, 36, 0.2)' : 'rgba(0, 242, 254, 0.2)',
                              color: isFinalized ? '#34d399' : isFull ? '#fbbf24' : '#00f2fe',
                              fontWeight: 700
                            }}
                          >
                            {isFinalized ? 'FINALIZED' : `${t.members.length}/${t.teamSize} Members`}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          Captain: <span style={{ fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>{t.captainAnonymousId}</span>
                        </div>
                      </div>

                      <div>
                        {canJoin && (
                          <button
                            onClick={() => handleJoinTeam(t.id)}
                            disabled={isProcessing}
                            className="btn-primary"
                            style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}
                          >
                            Join Team
                          </button>
                        )}
                        {isMyTeam && (
                          <div style={{ padding: '6px', textAlign: 'center', fontSize: '0.78rem', color: '#c084fc', fontWeight: 700, background: 'rgba(168, 85, 247, 0.1)', borderRadius: '6px' }}>
                            Your Team
                          </div>
                        )}
                        {!canJoin && !isMyTeam && (
                          <div style={{ padding: '6px', textAlign: 'center', fontSize: '0.78rem', color: '#64748b', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                            {isFinalized ? 'Roster Locked' : isFull ? 'Team Full' : 'Unavailable'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <Modal isOpen={true} onClose={() => setShowCreateTeamModal(false)} title="Create New Squad / Team">
          <form onSubmit={handleCreateTeamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                Team Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Team Phoenix"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                className="glass-panel"
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', fontSize: '0.85rem' }}
                required
              />
            </div>

            <div style={{ padding: '10px 12px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '8px', fontSize: '0.8rem', color: '#e9d5ff' }}>
              You will be registered as the <strong>Team Captain</strong>. Team Size is set to <strong>{tournament.teamSize} players</strong>.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button type="button" onClick={() => setShowCreateTeamModal(false)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                Cancel
              </button>
              <button type="submit" disabled={isProcessing} className="btn-purple" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                {isProcessing ? 'Submitting to 1AM Wallet...' : 'Create Team'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* On-Chain Transaction Progress Modal */}
      <TransactionModal
        progress={txProgress}
        receipt={txReceipt}
        onClose={resetTxState}
        onRetry={handleJoinSolo}
        onRefresh={refreshData}
      />
    </div>
  );
};

