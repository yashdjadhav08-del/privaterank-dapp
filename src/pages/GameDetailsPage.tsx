import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useTournament } from '../context/TournamentContext';
import { RankBadge } from '../components/common/RankBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { TransactionModal } from '../components/common/TransactionModal';
import { Modal } from '../components/common/Modal';
import { safeAddressCompare, shortenAddress } from '../utils/crypto';
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
  const { authState, playerProfile, connectWallet } = useWallet();
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
    resetTxState 
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

  const tournament = safeTournaments.find(t => t && t.id === tournamentId) || (safeTournaments.length > 0 ? safeTournaments[0] : null);

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

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join tournament';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- CREATE TEAM HANDLER ---
  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !authState.unshieldedAddress || !playerProfile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
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

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
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
          <div>Prize: <strong style={{ color: '#fbbf24' }}>{tournament.prizePool}</strong></div>
        </div>
      </div>

      {/* Schedule & Location Details Panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#00f2fe', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} /> Tournament Schedule
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>Registration: <strong>{tournament.schedule ? new Date(tournament.schedule.registrationStart).toLocaleDateString() : 'Now'}</strong> to <strong>{tournament.schedule ? new Date(tournament.schedule.registrationEnd).toLocaleDateString() : 'TBD'}</strong></div>
            <div>Tournament: <strong>{tournament.schedule ? new Date(tournament.schedule.tournamentStart).toLocaleDateString() : 'TBD'}</strong></div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={15} /> Location Details
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
            {tournament.location?.locationType === 'ONLINE' && (
              <div>Online • {tournament.location.onlinePlatform || 'Platform'} • Server: {tournament.location.serverRegion || 'Global'}</div>
            )}
            {tournament.location?.locationType === 'OFFLINE' && (
              <div>Offline • {tournament.location.venueName || 'Venue'}, {tournament.location.city}, {tournament.location.country}</div>
            )}
            {tournament.location?.locationType === 'HYBRID' && (
              <div>Hybrid • {tournament.location.onlinePlatform} / {tournament.location.venueName}, {tournament.location.city}</div>
            )}
            {!tournament.location && <div>Online • Midnight Network Preprod</div>}
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
                  <span style={{ color: '#00f2fe', fontWeight: 700 }}>≥ {tournament.requirements?.minimumScore || 0}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Prize Pool:</span>
                  <span style={{ color: '#fbbf24', fontWeight: 800 }}>{tournament.prizePool || 'TBD'}</span>
                </div>
              </div>
            </div>

            <div>
              {existingApp ? (
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

              <button
                onClick={() => setShowCreateTeamModal(true)}
                disabled={tournamentTeams.length >= tournament.maxTeams}
                className="btn-purple"
                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
              >
                <PlusCircle size={15} /> Create Team (Become Captain)
              </button>
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
                  const canJoin = !myTeam && !isFull && !isFinalized;

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
        onRetry={resetTxState}
      />
    </div>
  );
};
