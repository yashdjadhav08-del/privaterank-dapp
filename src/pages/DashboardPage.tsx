import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useTournament } from '../context/TournamentContext';
import { RankBadge } from '../components/common/RankBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { AccessDenied } from '../components/common/AccessDenied';
import { shortenAddress, safeAddressCompare } from '../utils/crypto';
import { 
  GameCategory,
  LocationType, 
  RankTier, 
  Tournament,
  TournamentLocation, 
  TournamentSchedule, 
  TournamentType 
} from '../types';
import { TransactionModal } from '../components/common/TransactionModal';
import { 
  Gamepad2, 
  Trophy, 
  Users, 
  PlusCircle, 
  ArrowRight, 
  CheckCircle2, 
  Wallet,
  User,
  Calendar,
  MapPin,
  Globe,
  Shield,
  Clock,
  Sparkles,
  AlertCircle,
  Trash2
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (view: string, extra?: { tournamentId?: string }) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { authState, activeRole, isOrganizerAuthorized, playerProfile, connectWallet, registerOrganizerWallet } = useWallet();
  const { 
    tournaments, 
    applications, 
    teams,
    createTournament, 
    deleteTournament,
    reviewApplication,
    txProgress,
    txReceipt,
    resetTxState 
  } = useTournament();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [newTourneyName, setNewTourneyName] = useState('');
  const [newTourneyDesc, setNewTourneyDesc] = useState('');
  const [newGameTitle, setNewGameTitle] = useState('BGMI');
  const [newCategory, setNewCategory] = useState<GameCategory>('Battle Royale');
  const [newTourneyType, setNewTourneyType] = useState<TournamentType>('TEAM');
  
  // Team Configuration
  const [newTeamSize, setNewTeamSize] = useState<number>(4);
  const [newMaxTeams, setNewMaxTeams] = useState<number>(16);
  const [newSoloMaxPlayers, setNewSoloMaxPlayers] = useState<number>(64);

  // Requirements
  const [newMinRank, setNewMinRank] = useState<RankTier>(RankTier.PLATINUM);
  const [newMinScore, setNewMinScore] = useState<number>(2000);
  const [newMinWins, setNewMinWins] = useState<number>(10);
  const [newPrize, setNewPrize] = useState('5,000 DUST');

  // Schedule State (Default to current time + offset)
  const defaultRegStart = new Date(Date.now() + 3600000).toISOString().slice(0, 16);
  const defaultRegEnd = new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 16);
  const defaultTourneyStart = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16);
  const defaultTourneyEnd = new Date(Date.now() + 86400000 * 7 + 14400000).toISOString().slice(0, 16);

  const [regStart, setRegStart] = useState(defaultRegStart);
  const [regEnd, setRegEnd] = useState(defaultRegEnd);
  const [tourneyStart, setTourneyStart] = useState(defaultTourneyStart);
  const [tourneyEnd, setTourneyEnd] = useState(defaultTourneyEnd);

  // Location State
  const [locationType, setLocationType] = useState<LocationType>('ONLINE');
  const [onlinePlatform, setOnlinePlatform] = useState('Discord & BGMI Custom Room');
  const [serverRegion, setServerRegion] = useState('Asia (India)');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [postalCode, setPostalCode] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  const isConnected = authState.isConnected && !!authState.unshieldedAddress;

  const safeTournaments = Array.isArray(tournaments) ? tournaments : [];
  const safeApplications = Array.isArray(applications) ? applications : [];
  const safeTeams = Array.isArray(teams) ? teams : [];

  // Automatically calculate maximum players
  const calculatedMaxPlayers = newTourneyType === 'TEAM' 
    ? newTeamSize * newMaxTeams 
    : newSoloMaxPlayers;

  // Filter player joined tournaments & teams
  const playerApps = isConnected
    ? safeApplications.filter(a => a && safeAddressCompare(a.playerWalletAddress, authState.unshieldedAddress))
    : [];

  const playerTeams = isConnected
    ? safeTeams.filter(t => t && t.members.some(m => safeAddressCompare(m.playerWalletAddress, authState.unshieldedAddress)))
    : [];

  const joinedTournamentIds = new Set([
    ...playerApps.map(a => a.tournamentId),
    ...playerTeams.map(t => t.tournamentId)
  ]);

  const myJoinedTournaments = safeTournaments.filter(t => t && joinedTournamentIds.has(t.id));
  const availableTournaments = safeTournaments.filter(t => t && !joinedTournamentIds.has(t.id) && t.status !== 'CLOSED');

  // Organizer tournaments
  const myCreatedTournaments = isConnected
    ? safeTournaments.filter(t => t && safeAddressCompare(t.organizerAddress, authState.unshieldedAddress))
    : [];

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newTourneyName.trim() || !authState.unshieldedAddress) {
      setFormError('Please provide a tournament name.');
      return;
    }

    // Schedule validation
    const rStart = new Date(regStart).getTime();
    const rEnd = new Date(regEnd).getTime();
    const tStart = new Date(tourneyStart).getTime();
    const tEnd = new Date(tourneyEnd).getTime();

    if (rStart >= rEnd) {
      setFormError('Registration Start must be before Registration End.');
      return;
    }
    if (rEnd > tStart) {
      setFormError('Registration End must be before or equal to Tournament Start.');
      return;
    }
    if (tStart >= tEnd) {
      setFormError('Tournament Start must be before Tournament End.');
      return;
    }

    const schedule: TournamentSchedule = {
      registrationStart: new Date(regStart).toISOString(),
      registrationEnd: new Date(regEnd).toISOString(),
      tournamentStart: new Date(tourneyStart).toISOString(),
      tournamentEnd: new Date(tourneyEnd).toISOString()
    };

    const location: TournamentLocation = {
      locationType,
      onlinePlatform: locationType === 'ONLINE' || locationType === 'HYBRID' ? onlinePlatform : undefined,
      serverRegion: locationType === 'ONLINE' || locationType === 'HYBRID' ? serverRegion : undefined,
      venueName: locationType === 'OFFLINE' || locationType === 'HYBRID' ? venueName : undefined,
      address: locationType === 'OFFLINE' || locationType === 'HYBRID' ? address : undefined,
      city: locationType === 'OFFLINE' || locationType === 'HYBRID' ? city : undefined,
      state: locationType === 'OFFLINE' || locationType === 'HYBRID' ? state : undefined,
      country: locationType === 'OFFLINE' || locationType === 'HYBRID' ? country : undefined,
      postalCode: locationType === 'OFFLINE' || locationType === 'HYBRID' ? postalCode : undefined
    };

    try {
      await createTournament({
        name: newTourneyName.trim(),
        description: newTourneyDesc.trim() || `Official competitive ${newGameTitle} ${newTourneyType} tournament on Midnight Preprod.`,
        gameTitle: newGameTitle.trim(),
        category: newCategory,
        organizerAddress: authState.unshieldedAddress,
        organizerName: 'Tournament Organizer',
        tournamentType: newTourneyType,
        teamSize: newTourneyType === 'TEAM' ? Number(newTeamSize) : 1,
        maxTeams: newTourneyType === 'TEAM' ? Number(newMaxTeams) : 0,
        maxParticipants: calculatedMaxPlayers,
        requirements: {
          minimumRank: newMinRank,
          minimumScore: Number(newMinScore),
          minimumWins: Number(newMinWins)
        },
        prizePool: newPrize,
        schedule,
        location
      });

      setShowCreateModal(false);
      setNewTourneyName('');
      setNewTourneyDesc('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tournament creation failed';
      setFormError(msg);
    }
  };

  const handleReview = async (appId: string, decision: 'APPROVE' | 'REJECT') => {
    if (!authState.unshieldedAddress) return;
    await reviewApplication({
      applicationId: appId,
      organizerAddress: authState.unshieldedAddress,
      decision,
      rejectionReason: decision === 'REJECT' ? 'Does not meet tournament requirements.' : undefined
    });
  };

  const handleConfirmDelete = async () => {
    if (!tournamentToDelete || !authState.unshieldedAddress) return;
    setIsDeleting(true);
    setFormError(null);
    try {
      await deleteTournament(tournamentToDelete.id, authState.unshieldedAddress);
      setDeleteNotice(`Tournament "${tournamentToDelete.name}" archived successfully.`);
      setTournamentToDelete(null);
      setTimeout(() => setDeleteNotice(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tournament deletion failed';
      setFormError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ maxWidth: '800px', margin: '60px auto', padding: '20px', textAlign: 'center' }}>
        <div
          className="glass-panel"
          style={{
            padding: '48px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <Wallet size={40} className="text-cyan-400" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
            Connect Your Wallet
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '400px' }}>
            Please connect your 1AM Wallet to access your {activeRole === 'ORGANIZER' ? 'organizer dashboard' : 'player profile and tournaments'}.
          </p>
          <button
            onClick={() => connectWallet()}
            disabled={authState.isConnecting}
            className="btn-primary"
            style={{ padding: '10px 24px', fontSize: '0.95rem', marginTop: '8px' }}
          >
            {authState.isConnecting ? 'Connecting...' : 'Connect 1AM Wallet'}
          </button>
        </div>
      </div>
    );
  }

  // Strict Authorization Guard
  if (activeRole === 'ORGANIZER' && !isOrganizerAuthorized) {
    return (
      <AccessDenied
        connectedAddress={authState.unshieldedAddress}
        onBackToUserPortal={() => onNavigate('explore')}
      />
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Delete Notice Banner */}
      {deleteNotice && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6ee7b7',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{deleteNotice}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderLeft: activeRole === 'ORGANIZER' ? '4px solid #a855f7' : '4px solid #00f2fe'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc' }}>
              {activeRole === 'ORGANIZER' ? 'Organizer Dashboard' : 'Player Dashboard'}
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: '20px',
                background: activeRole === 'ORGANIZER' ? 'rgba(157, 78, 221, 0.2)' : 'rgba(0, 242, 254, 0.15)',
                color: activeRole === 'ORGANIZER' ? '#c084fc' : '#00f2fe',
                fontWeight: 700
              }}
            >
              {activeRole === 'ORGANIZER' ? 'Organizer' : 'Player'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#94a3b8' }}>
            <Wallet size={15} className="text-slate-400" />
            Wallet: <strong style={{ color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{shortenAddress(authState.unshieldedAddress!, 6)}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeRole === 'ORGANIZER' ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-purple"
              style={{ padding: '8px 20px', fontSize: '0.85rem' }}
            >
              <PlusCircle size={16} /> Create Tournament
            </button>
          ) : (
            <button
              onClick={() => onNavigate('explore')}
              className="btn-primary"
              style={{ padding: '8px 20px', fontSize: '0.85rem' }}
            >
              Browse Tournaments <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      {/* PLAYER DASHBOARD VIEW */}
      {activeRole !== 'ORGANIZER' && (
        <>
          <section className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gamepad2 size={18} className="text-cyan-400" />
                Game Credentials
              </h2>
              <button
                onClick={() => onNavigate('profile')}
                className="btn-secondary"
                style={{ padding: '5px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <User size={13} /> Manage Profile
              </button>
            </div>

            {playerProfile && playerProfile.gamingCredentials ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>GAME</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                    {playerProfile.gamingCredentials.gameTitle || 'BGMI'}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>RANK</div>
                  <div style={{ marginTop: '4px' }}>
                    <RankBadge rank={playerProfile.gamingCredentials.rank || 1} size="sm" />
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>WINS</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                    {playerProfile.gamingCredentials.wins || 0} Wins
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SCORE</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#00f2fe', marginTop: '2px' }}>
                    {playerProfile.gamingCredentials.score || 0} pts
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Game credentials will appear here when available.
              </div>
            )}
          </section>

          {/* My Joined Tournaments */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
              My Tournaments
            </h2>

            {myJoinedTournaments.length === 0 ? (
              <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                You haven't joined any tournaments yet.
                <div style={{ marginTop: '10px' }}>
                  <button onClick={() => onNavigate('explore')} className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
                    Explore Tournaments
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {myJoinedTournaments.map(tourney => {
                  const app = playerApps.find(a => a.tournamentId === tourney.id);
                  const pTeam = playerTeams.find(t => t.tournamentId === tourney.id);

                  return (
                    <div
                      key={tourney.id}
                      className="glass-panel"
                      style={{
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                        borderLeft: '4px solid #10b981'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#00f2fe', fontWeight: 700 }}>
                            {tourney.gameTitle || 'Game'} • {tourney.tournamentType || 'SOLO'}
                          </span>
                          <StatusBadge status={app?.status || (pTeam?.status === 'FINALIZED' ? 'APPROVED' : 'OPEN')} />
                        </div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                          {tourney.name}
                        </h3>
                        {pTeam && (
                          <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginBottom: '4px' }}>
                            Team: <strong>{pTeam.name}</strong> ({pTeam.members.length}/{pTeam.teamSize} Members)
                          </div>
                        )}
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          Starts: {tourney.startDate ? new Date(tourney.startDate).toLocaleDateString() : 'TBD'} • Prize: <strong style={{ color: '#fbbf24' }}>{tourney.prizePool || 'TBD'}</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigate('game_details', { tournamentId: tourney.id })}
                        className="btn-secondary"
                        style={{ padding: '7px', fontSize: '0.8rem', width: '100%' }}
                      >
                        View Tournament
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Available Tournaments */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
                Available Tournaments
              </h2>
              {availableTournaments.length > 0 && (
                <button onClick={() => onNavigate('explore')} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                  Explore All
                </button>
              )}
            </div>

            {availableTournaments.length === 0 ? (
              <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                No available tournaments at the moment.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {availableTournaments.map(tourney => (
                  <div
                    key={tourney.id}
                    className="glass-panel glass-card-interactive"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px'
                    }}
                    onClick={() => onNavigate('game_details', { tournamentId: tourney.id })}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#00f2fe', fontWeight: 700 }}>{tourney.gameTitle}</span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: tourney.tournamentType === 'TEAM' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0, 242, 254, 0.2)',
                              color: tourney.tournamentType === 'TEAM' ? '#c084fc' : '#38bdf8',
                              fontWeight: 700
                            }}
                          >
                            {tourney.tournamentType === 'TEAM' ? `TEAM (${tourney.teamSize})` : 'SOLO'}
                          </span>
                        </div>
                        <StatusBadge status={tourney.status || 'OPEN'} />
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                        {tourney.name}
                      </h3>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginTop: '8px' }}>
                        <span>
                          {tourney.tournamentType === 'TEAM' 
                            ? `Teams: ${tourney.currentTeams || 0} / ${tourney.maxTeams || 16}` 
                            : `Players: ${tourney.applicantCount || 0} / ${tourney.maxParticipants || 64}`}
                        </span>
                        <RankBadge rank={tourney.requirements?.minimumRank || 1} size="sm" />
                      </div>
                    </div>

                    <button
                      className="btn-primary"
                      style={{ padding: '7px', fontSize: '0.8rem', width: '100%' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('game_details', { tournamentId: tourney.id });
                      }}
                    >
                      View Tournament
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ORGANIZER DASHBOARD VIEW */}
      {activeRole === 'ORGANIZER' && (
        <>
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
                My Managed Tournaments
              </h2>
              <button onClick={() => setShowCreateModal(true)} className="btn-purple" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
                <PlusCircle size={14} /> Create Tournament
              </button>
            </div>

            {myCreatedTournaments.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                You haven't created any tournaments yet.
                <div style={{ marginTop: '12px' }}>
                  <button onClick={() => setShowCreateModal(true)} className="btn-purple" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                    <PlusCircle size={14} /> Create Your First Tournament
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myCreatedTournaments.map(tourney => (
                  <div
                    key={tourney.id}
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <StatusBadge status={tourney.status || 'OPEN'} />
                        <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700 }}>
                          {tourney.gameTitle} • {tourney.tournamentType || 'SOLO'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                        {tourney.name}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {tourney.tournamentType === 'TEAM' ? (
                          <>
                            <span>Teams: <strong style={{ color: '#f8fafc' }}>{tourney.currentTeams || 0} / {tourney.maxTeams || 16}</strong></span>
                            <span>Players: <strong style={{ color: '#f8fafc' }}>{tourney.currentParticipants || 0} / {tourney.maxParticipants || 64}</strong></span>
                          </>
                        ) : (
                          <span>Players: <strong style={{ color: '#f8fafc' }}>{tourney.applicantCount || 0} / {tourney.maxParticipants || 100}</strong></span>
                        )}
                        <span>Min Rank: Tier {tourney.requirements?.minimumRank || 1}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => onNavigate('game_details', { tournamentId: tourney.id })}
                        className="btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      >
                        View Details
                      </button>
                      {tourney.status === 'COMPLETED' && (
                        <button
                          onClick={() => setTournamentToDelete(tourney)}
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#f87171',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 600
                          }}
                        >
                          <Trash2 size={13} /> Delete Tournament
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Participant Review Section */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
              Participant & Team Applications
            </h2>

            {safeApplications.length === 0 ? (
              <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                No participant applications to review.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {safeApplications.map(app => (
                  <div
                    key={app.id}
                    className="glass-panel"
                    style={{
                      padding: '18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                      borderLeft: app.status === 'APPROVED' ? '4px solid #10b981' : app.status === 'REJECTED' ? '4px solid #f43f5e' : '4px solid #00f2fe'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#00f2fe', fontWeight: 700 }}>
                          {app.anonymousPlayerId} {app.teamName ? `(${app.teamName})` : ''}
                        </span>
                        <StatusBadge status={app.status || 'PENDING_REVIEW'} />
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                        {app.tournamentName}
                      </div>
                      {app.gamingCredentials && (
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <RankBadge rank={app.gamingCredentials.rank || 1} size="sm" />
                          <span>Score: {app.gamingCredentials.score || 0}</span>
                          <span>{app.gamingCredentials.wins || 0}W / {app.gamingCredentials.losses || 0}L</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {app.status === 'PENDING_REVIEW' && (
                        <>
                          <button
                            onClick={() => handleReview(app.id, 'REJECT')}
                            className="btn-danger"
                            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleReview(app.id, 'APPROVE')}
                            className="btn-success"
                            style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                          >
                            Approve
                          </button>
                        </>
                      )}
                      {app.status === 'APPROVED' && (
                        <span style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={16} /> Verified & Approved
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Comprehensive Organizer Create Tournament Modal */}
      {showCreateModal && (
        <Modal isOpen={true} onClose={() => setShowCreateModal(false)} title="Create Real On-Chain Tournament">
          <form onSubmit={handleCreateTournament} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
            {formError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            {/* Basic Information */}
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#00f2fe', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={15} /> 1. Basic Information
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                    Tournament Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Midnight BGMI Pro Championship"
                    value={newTourneyName}
                    onChange={e => setNewTourneyName(e.target.value)}
                    className="glass-panel"
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', fontSize: '0.85rem' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                      Game Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BGMI, Free Fire, Valorant"
                      value={newGameTitle}
                      onChange={e => setNewGameTitle(e.target.value)}
                      className="glass-panel"
                      style={{ width: '100%', padding: '8px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', fontSize: '0.85rem' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value as GameCategory)}
                      className="glass-panel"
                      style={{ width: '100%', padding: '8px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', fontSize: '0.85rem' }}
                    >
                      <option value="Battle Royale">Battle Royale</option>
                      <option value="FPS">FPS</option>
                      <option value="MOBA">MOBA</option>
                      <option value="Sports">Sports</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                    Tournament Type *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setNewTourneyType('SOLO')}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: newTourneyType === 'SOLO' ? '2px solid #00f2fe' : '1px solid rgba(255,255,255,0.1)',
                        background: newTourneyType === 'SOLO' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(0,0,0,0.3)',
                        color: newTourneyType === 'SOLO' ? '#00f2fe' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      SOLO (Individual)
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewTourneyType('TEAM')}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: newTourneyType === 'TEAM' ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                        background: newTourneyType === 'TEAM' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0,0,0,0.3)',
                        color: newTourneyType === 'TEAM' ? '#c084fc' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      TEAM (Squad / Duo)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Team / Solo Capacity Configuration */}
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#a855f7', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={15} /> 2. {newTourneyType === 'TEAM' ? 'Team Configuration' : 'Player Capacity'}
              </h4>

              {newTourneyType === 'TEAM' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                        Team Size (Players per team)
                      </label>
                      <select
                        value={newTeamSize}
                        onChange={e => setNewTeamSize(Number(e.target.value))}
                        className="glass-panel"
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', fontSize: '0.85rem' }}
                      >
                        <option value={2}>2 Players (Duo)</option>
                        <option value={4}>4 Players (Squad)</option>
                        <option value={5}>5 Players (Esports Standard)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                        Maximum Teams
                      </label>
                      <select
                        value={newMaxTeams}
                        onChange={e => setNewMaxTeams(Number(e.target.value))}
                        className="glass-panel"
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', fontSize: '0.85rem' }}
                      >
                        <option value={8}>8 Teams</option>
                        <option value={16}>16 Teams</option>
                        <option value={32}>32 Teams</option>
                        <option value={64}>64 Teams</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ padding: '10px 14px', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', fontSize: '0.85rem', color: '#e9d5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Automatic Capacity Calculation:</span>
                    <strong>{newTeamSize} × {newMaxTeams} = {calculatedMaxPlayers} Maximum Players</strong>
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                    Maximum Solo Players
                  </label>
                  <input
                    type="number"
                    value={newSoloMaxPlayers}
                    onChange={e => setNewSoloMaxPlayers(Number(e.target.value))}
                    min={4}
                    max={500}
                    className="glass-panel"
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
              )}
            </div>

            {/* Schedule Configuration */}
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} /> 3. Tournament Schedule (Date & Time)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>
                    Registration Opens
                  </label>
                  <input
                    type="datetime-local"
                    value={regStart}
                    onChange={e => setRegStart(e.target.value)}
                    className="glass-panel"
                    style={{ width: '100%', padding: '7px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>
                    Registration Closes
                  </label>
                  <input
                    type="datetime-local"
                    value={regEnd}
                    onChange={e => setRegEnd(e.target.value)}
                    className="glass-panel"
                    style={{ width: '100%', padding: '7px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>
                    Tournament Starts
                  </label>
                  <input
                    type="datetime-local"
                    value={tourneyStart}
                    onChange={e => setTourneyStart(e.target.value)}
                    className="glass-panel"
                    style={{ width: '100%', padding: '7px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>
                    Tournament Ends
                  </label>
                  <input
                    type="datetime-local"
                    value={tourneyEnd}
                    onChange={e => setTourneyEnd(e.target.value)}
                    className="glass-panel"
                    style={{ width: '100%', padding: '7px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location Configuration */}
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} /> 4. Tournament Location
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {(['ONLINE', 'OFFLINE', 'HYBRID'] as LocationType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLocationType(type)}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: locationType === type ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                        background: locationType === type ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.3)',
                        color: locationType === type ? '#34d399' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {(locationType === 'ONLINE' || locationType === 'HYBRID') && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>
                        Online Platform
                      </label>
                      <input
                        type="text"
                        value={onlinePlatform}
                        onChange={e => setOnlinePlatform(e.target.value)}
                        className="glass-panel"
                        style={{ width: '100%', padding: '7px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>
                        Server / Region
                      </label>
                      <input
                        type="text"
                        value={serverRegion}
                        onChange={e => setServerRegion(e.target.value)}
                        className="glass-panel"
                        style={{ width: '100%', padding: '7px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                )}

                {(locationType === 'OFFLINE' || locationType === 'HYBRID') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="Venue Name (e.g. Pune Gaming Arena)"
                        value={venueName}
                        onChange={e => setVenueName(e.target.value)}
                        className="glass-panel"
                        style={{ width: '100%', padding: '7px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                        required={locationType === 'OFFLINE'}
                      />
                      <input
                        type="text"
                        placeholder="City (e.g. Pune)"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="glass-panel"
                        style={{ width: '100%', padding: '7px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                        required={locationType === 'OFFLINE'}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="State (e.g. Maharashtra)"
                        value={state}
                        onChange={e => setState(e.target.value)}
                        className="glass-panel"
                        style={{ width: '100%', padding: '7px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        className="glass-panel"
                        style={{ width: '100%', padding: '7px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                      />
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={postalCode}
                        onChange={e => setPostalCode(e.target.value)}
                        className="glass-panel"
                        style={{ width: '100%', padding: '7px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Eligibility Requirements & Prize */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={15} /> 5. Player Eligibility & Prize Pool
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>
                    Minimum Rank Requirement
                  </label>
                  <select
                    value={newMinRank}
                    onChange={e => setNewMinRank(Number(e.target.value) as RankTier)}
                    className="glass-panel"
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    <option value={RankTier.BRONZE}>Bronze (Tier 1)</option>
                    <option value={RankTier.SILVER}>Silver (Tier 2)</option>
                    <option value={RankTier.GOLD}>Gold (Tier 3)</option>
                    <option value={RankTier.PLATINUM}>Platinum (Tier 4)</option>
                    <option value={RankTier.DIAMOND}>Diamond (Tier 5)</option>
                    <option value={RankTier.MASTER}>Master (Tier 6)</option>
                    <option value={RankTier.GRANDMASTER}>Grandmaster (Tier 7)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>
                    Minimum Score
                  </label>
                  <input
                    type="number"
                    value={newMinScore}
                    onChange={e => setNewMinScore(Number(e.target.value))}
                    className="glass-panel"
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>
                    Minimum Wins
                  </label>
                  <input
                    type="number"
                    value={newMinWins}
                    onChange={e => setNewMinWins(Number(e.target.value))}
                    className="glass-panel"
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>
                    Prize Pool
                  </label>
                  <input
                    type="text"
                    value={newPrize}
                    onChange={e => setNewPrize(e.target.value)}
                    className="glass-panel"
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Cancel
              </button>
              <button type="submit" className="btn-purple" style={{ padding: '8px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={15} /> Submit to 1AM Wallet
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Tournament Confirmation Modal */}
      {tournamentToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 8, 16, 0.88)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '32px 26px',
              borderRadius: '16px',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'linear-gradient(180deg, rgba(24, 13, 20, 0.98) 0%, rgba(12, 9, 20, 0.98) 100%)',
              boxShadow: '0 0 45px rgba(239, 68, 68, 0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', color: '#ef4444' }}>
              <AlertCircle size={28} />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Delete Tournament?
              </h2>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
              This tournament has already ended.
            </p>

            <div
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '16px'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tournament:
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                {tournamentToDelete.name}
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '24px' }}>
              This action will remove the tournament from the active tournament list.
              <br />
              <strong>Are you sure?</strong>
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setTournamentToDelete(null)}
                disabled={isDeleting}
                className="btn-secondary"
                style={{ padding: '8px 20px', fontSize: '0.9rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="btn-danger"
                style={{
                  padding: '8px 20px',
                  fontSize: '0.9rem',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Tournament'}
              </button>
            </div>
          </div>
        </div>
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
