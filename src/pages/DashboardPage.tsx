import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useTournament } from '../context/TournamentContext';
import { verifyContractDeployedOnPreprod, PREPROD_CONFIG } from '../config/network';
import { ContractDeploymentService } from '../services/contractDeploymentService';
import { MidnightTransactionService } from '../contracts/midnightTransactionService';
import { RankBadge } from '../components/common/RankBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { AccessDenied } from '../components/common/AccessDenied';
import { shortenAddress, safeAddressCompare, formatPrizePool } from '../utils/crypto';
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
import { DeploymentProgress } from '../services/contractDeploymentService';
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
  Shield,
  Sparkles,
  AlertCircle,
  Trash2,
  Loader2,
  RefreshCw,
  Rocket,
  ExternalLink,
  Copy,
  XCircle
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (view: string, extra?: { tournamentId?: string }) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { 
    authState, 
    activeRole, 
    playerProfile, 
    connectWallet
  } = useWallet();
  const { 
    tournaments, 
    applications, 
    teams,
    createTournament, 
    deleteTournament,
    reviewApplication,
    txProgress,
    txReceipt,
    resetTxState,
    refreshData 
  } = useTournament();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalDismissed, setIsModalDismissed] = useState(false);

  useEffect(() => {
    if (txProgress?.status === 'CONFIRMED' || txProgress?.status === 'FAILED' || txProgress?.status === 'REJECTED') {
      setIsModalDismissed(false);
    }
  }, [txProgress?.status]);

  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const [deploySuccessNotice, setDeploySuccessNotice] = useState<{ address: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preprod Contract Status
  const [isContractDeployed, setIsContractDeployed] = useState<boolean>(false);
  const [isContractChecking, setIsContractChecking] = useState<boolean>(true);
  const [contractVerifyReason, setContractVerifyReason] = useState<string | null>(null);
  const [canonicalContractAddress, setCanonicalContractAddress] = useState<string | null>(null);

  // Deploy Contract Modal State
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState<DeploymentProgress | null>(null);
  const [deployResult, setDeployResult] = useState<{ contractAddress: string; txHash: string; blockHeight?: number } | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleDeployContract = async () => {
    setIsDeploying(true);
    setDeployError(null);
    setDeployResult(null);
    setDeployProgress(null);

    try {
      const result = await ContractDeploymentService.deployContractVia1Am(
        (progress: DeploymentProgress) => {
          setDeployProgress(progress);
        }
      );
      // Find block height from last progress event if available
      setDeployResult({
        contractAddress: result.contractAddress,
        txHash: result.txHash
      });
      setIsContractDeployed(true);
      setCanonicalContractAddress(result.contractAddress);
      setDeploySuccessNotice({ address: result.contractAddress });
      await refreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDeployError(msg);
    } finally {
      setIsDeploying(false);
    }
  };

  // Derive step number (1-7) from DeploymentProgress
  const getDeployStep = (progress: DeploymentProgress | null): number => {
    if (!progress) return 0;
    switch (progress.step) {
      case 'CHECKING_WALLET': return 1;
      case 'CHECKING_DUST': return 1;
      case 'PREPARING_TRANSACTION': return 2;
      case 'AWAITING_APPROVAL': return 3;
      case 'BROADCASTING': return 4;
      case 'SUBMITTED': return 4;
      case 'WAITING_INDEXER': return 5;
      case 'CONFIRMED': return 7;
      case 'FAILED': return -1;
      default: return 0;
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await verifyContractDeployedOnPreprod(undefined, { skipCache: true });
      setIsContractDeployed(res.isDeployed);
      setContractVerifyReason(res.reason || res.error || null);
      if (res.contractAddress) setCanonicalContractAddress(res.contractAddress);
      await refreshData();
    } catch (e) {
      console.warn('[Dashboard] Manual sync error:', e);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Internal-only contract status check — never exposed in the organizer UI
  useEffect(() => {
    let isMounted = true;
    setIsContractChecking(true);
    console.log('[PrivateRank] canonical contract address:', PREPROD_CONFIG.contractAddress);
    console.log('[PrivateRank] starting Preprod contract verification');
    verifyContractDeployedOnPreprod(undefined, { skipCache: true }).then(res => {
      console.log('[PrivateRank] verification result:', res);
      console.log('[PrivateRank] isContractDeployed:', res.isDeployed);
      console.log('[PrivateRank] contract verification reason:', res.reason || res.error || 'OK');
      if (isMounted) {
        setIsContractDeployed(res.isDeployed);
        setContractVerifyReason(res.reason || res.error || null);
        if (res.contractAddress) setCanonicalContractAddress(res.contractAddress);
        setIsContractChecking(false);
      }
    }).catch(err => {
      console.error('[PrivateRank] contract verification exception:', err);
      if (isMounted) {
        setIsContractDeployed(false);
        setContractVerifyReason(err instanceof Error ? err.message : String(err));
        setIsContractChecking(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

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
  const [prizeAmount, setPrizeAmount] = useState('');
  const [prizeCurrency, setPrizeCurrency] = useState('INR');
  const [prizeDescription, setPrizeDescription] = useState('');

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
  const availableTournaments = safeTournaments.filter(t => t && !joinedTournamentIds.has(t.id) && t.status !== 'CLOSED' && t.status !== 'ARCHIVED');

  // Organizer tournaments
  const myCreatedTournaments = isConnected
    ? safeTournaments.filter(t => t && safeAddressCompare(t.organizerAddress, authState.unshieldedAddress))
    : [];

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsModalDismissed(false);

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

    // Step 1: Check whether a REAL PrivateRank contract exists on Midnight Preprod
    console.log('[PrivateRank] verifying Midnight Preprod contract status before tournament creation');
    const deployment = await verifyContractDeployedOnPreprod();
    
    if (!deployment.isDeployed) {
      try {
        const deployRes = await ContractDeploymentService.deployContractVia1Am((progress) => {
          let stepNum = 1;
          if (progress.step === 'PREPARING_TRANSACTION' || progress.step === 'CHECKING_WALLET' || progress.step === 'CHECKING_DUST') stepNum = 1;
          else if (progress.step === 'AWAITING_APPROVAL') stepNum = 2;
          else if (progress.step === 'BROADCASTING' || progress.step === 'SUBMITTED') stepNum = 3;
          else if (progress.step === 'WAITING_INDEXER') stepNum = 5;
          else if (progress.step === 'CONFIRMED') stepNum = 6;

          MidnightTransactionService.notifyExternalProgress({
            status: progress.step === 'FAILED' ? 'FAILED' : progress.step === 'CONFIRMED' ? 'CONFIRMED' : 'PREPARING',
            type: 'DEPLOY_CONTRACT',
            step: stepNum,
            totalSteps: 6,
            message: progress.message,
            error: progress.error,
            txHash: progress.txHash
          });
        });

        const verifyRes = await verifyContractDeployedOnPreprod(deployRes.contractAddress);
        if (verifyRes.isDeployed) {
          setIsContractDeployed(true);
          setShowCreateModal(false);
          setDeploySuccessNotice({ address: deployRes.contractAddress });
          setTimeout(() => {
            resetTxState();
          }, 2500);
          return;
        } else {
          throw new Error('Contract deployment was broadcast, but not yet verified by Midnight Preprod indexer.');
        }
      } catch (deployErr: unknown) {
        const msg = deployErr instanceof Error ? deployErr.message : String(deployErr);
        setFormError(msg);
        return;
      }
    }

    // Step 2: If verified contract exists, proceed with tournament creation
    setIsContractDeployed(true);
    console.log('[PrivateRank] executing createTournament on verified Midnight Preprod contract');

    try {
      await createTournament({
        name: newTourneyName.trim(),
        description: newTourneyDesc.trim(),
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
        prizePool: prizeAmount.trim() ? (prizeAmount.trim().startsWith('₹') ? prizeAmount.trim() : `₹${prizeAmount.trim()}`) : '₹0',
        prizeDetails: prizeDescription.trim() || undefined,
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


  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

      {/* Contract Deploy Success Notice Banner */}
      {deploySuccessNotice && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            color: '#10b981'
          }}
        >
          <CheckCircle2 size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#6ee7b7' }}>
              PrivateRank contract deployed successfully.
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', wordBreak: 'break-all' }}>
              Contract address: <span style={{ fontFamily: 'monospace', color: '#f1f5f9', fontWeight: 600 }}>{deploySuccessNotice.address}</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>
              Please click Create Tournament again to create your tournament.
            </div>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
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
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
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

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {activeRole === 'ORGANIZER' ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-purple"
              style={{
                padding: '9px 22px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700
              }}
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
                          Starts: {tourney.startDate ? new Date(tourney.startDate).toLocaleDateString() : 'TBD'} • Prize: <strong style={{ color: '#fbbf24' }}>{formatPrizePool(tourney.prizePool)}</strong>
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
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>No Active Tournaments Available Yet</div>
                <div style={{ fontSize: '0.85rem' }}>No tournaments are currently active on Midnight Preprod.</div>
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

      {/* ORGANIZER DASHBOARD VIEW: Responsive 2-Column Side-by-Side Layout */}
      {activeRole === 'ORGANIZER' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Operations Hub & Participant Applications */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. Quick Action & Stats Hub */}
            <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Deploy Contract Banner — shown only when contract is NOT yet deployed on Preprod */}
              {!isContractChecking && !isContractDeployed && (
                <div style={{
                  padding: '18px 20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(59, 130, 246, 0.12) 100%)',
                  border: '1.5px solid rgba(139, 92, 246, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      padding: '10px',
                      borderRadius: '10px',
                      background: 'rgba(139, 92, 246, 0.2)',
                      flexShrink: 0
                    }}>
                      <Rocket size={22} style={{ color: '#a78bfa' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '0.95rem', marginBottom: '3px' }}>
                        PrivateRank Contract Not Yet Deployed
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '360px', lineHeight: '1.5' }}>
                        Deploy the compiled Compact smart contract to Midnight Preprod to enable tournament creation with ZK privacy.
                      </div>
                    </div>
                  </div>
                  <button
                    id="deploy-contract-btn"
                    onClick={() => setShowDeployModal(true)}
                    disabled={isDeploying}
                    style={{
                      padding: '10px 22px',
                      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    <Rocket size={16} />
                    Deploy PrivateRank Contract
                  </button>
                </div>
              )}

              {/* Deployed Contract Status */}
              {!isContractChecking && isContractDeployed && canonicalContractAddress && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <CheckCircle2 size={16} style={{ color: '#34d399', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>Contract Deployed</span>
                    {' — '}
                    <span style={{ fontFamily: 'monospace', color: '#e2e8f0', fontSize: '0.78rem' }}>
                      {canonicalContractAddress.slice(0, 16)}...{canonicalContractAddress.slice(-8)}
                    </span>
                    <a
                      href={`https://midnight.network/explorer/contracts/${canonicalContractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#38bdf8', marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>

                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={18} className="text-purple-400" />
                  Tournament Operations
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="btn-secondary"
                    title="Sync on-chain state directly from Midnight Preprod Indexer"
                    style={{ padding: '7px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={14} className={`text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Preprod'}
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-purple"
                    style={{ padding: '7px 18px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <PlusCircle size={15} /> + Create Tournament
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>MANAGED</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#c084fc', marginTop: '2px' }}>
                    {myCreatedTournaments.length}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>PENDING APPS</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                    {safeApplications.filter(a => a.status === 'PENDING_REVIEW').length}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ACTIVE TEAMS</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                    {safeTeams.length}
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Participant Applications Section */}
            <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} className="text-cyan-400" />
                  Participant & Team Applications
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{safeApplications.length} total</span>
              </div>

              {safeApplications.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No participant applications to review at this moment.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                  {safeApplications.map(app => (
                    <div
                      key={app.id}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                        borderLeft: app.status === 'APPROVED' ? '3px solid #10b981' : app.status === 'REJECTED' ? '3px solid #f43f5e' : '3px solid #00f2fe'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#00f2fe', fontWeight: 700 }}>
                            {app.anonymousPlayerId} {app.teamName ? `(${app.teamName})` : ''}
                          </span>
                          <StatusBadge status={app.status || 'PENDING_REVIEW'} />
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                          {app.tournamentName}
                        </div>
                        {app.gamingCredentials && (
                          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <RankBadge rank={app.gamingCredentials.rank || 1} size="sm" />
                            <span>Score: {app.gamingCredentials.score || 0}</span>
                            <span>{app.gamingCredentials.wins || 0}W</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {app.status === 'PENDING_REVIEW' && (
                          <>
                            <button
                              onClick={() => handleReview(app.id, 'REJECT')}
                              className="btn-danger"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleReview(app.id, 'APPROVE')}
                              className="btn-success"
                              style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                            >
                              Approve
                            </button>
                          </>
                        )}
                        {app.status === 'APPROVED' && (
                          <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={14} /> Approved
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: My Managed Tournaments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} className="text-purple-400" />
                My Managed Tournaments
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {myCreatedTournaments.length} on-chain {myCreatedTournaments.length === 1 ? 'tournament' : 'tournaments'}
              </span>
            </div>

            {myCreatedTournaments.length === 0 ? (
              <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <Trophy size={36} className="text-purple-400 opacity-60" />
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>No Active Tournaments Available Yet</div>
                  <div style={{ fontSize: '0.85rem', maxWidth: '360px' }}>
                    Click Create Tournament to deploy the smart contract on Midnight Preprod and host your first competitive event.
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-purple"
                  style={{ padding: '8px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <PlusCircle size={15} /> + Create Your First Tournament
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myCreatedTournaments.map(tourney => (
                  <div
                    key={tourney.id}
                    className="glass-panel"
                    style={{
                      padding: '18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                      borderLeft: '4px solid #a855f7'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <StatusBadge status={tourney.status || 'OPEN'} />
                        <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700 }}>
                          {tourney.gameTitle} • {tourney.tournamentType || 'SOLO'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: '2px 0' }}>
                        {tourney.name}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
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
                      {tourney.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => setTournamentToDelete(tourney)}
                          title="Archive this tournament on-chain (requires 1AM Wallet)"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#f87171',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 600
                          }}
                        >
                          <Trash2 size={13} /> Archive
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compact Responsive Organizer Create Tournament Modal */}
      {showCreateModal && (
        <Modal isOpen={true} onClose={() => setShowCreateModal(false)} title="Create Real On-Chain Tournament">
          <form onSubmit={handleCreateTournament} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '78vh', overflowY: 'auto', paddingRight: '6px' }}>
            {formError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            {/* 1. Basic Information */}
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '0.88rem', color: '#00f2fe', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={14} /> 1. Basic Information
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '3px' }}>
                    Tournament Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Midnight BGMI Pro Championship"
                    value={newTourneyName}
                    onChange={e => setNewTourneyName(e.target.value)}
                    className="glass-panel"
                    style={{ width: '100%', padding: '7px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.85rem' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '3px' }}>
                      Game Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BGMI, Free Fire, Valorant"
                      value={newGameTitle}
                      onChange={e => setNewGameTitle(e.target.value)}
                      className="glass-panel"
                      style={{ width: '100%', padding: '7px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.85rem' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '3px' }}>
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value as GameCategory)}
                      className="glass-panel"
                      style={{ width: '100%', padding: '7px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.85rem' }}
                    >
                      <option value="Battle Royale">Battle Royale</option>
                      <option value="FPS">FPS</option>
                      <option value="MOBA">MOBA</option>
                      <option value="Sports">Sports</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '3px' }}>
                    Tournament Type *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setNewTourneyType('SOLO')}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: newTourneyType === 'SOLO' ? '2px solid #00f2fe' : '1px solid rgba(255,255,255,0.1)',
                        background: newTourneyType === 'SOLO' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(0,0,0,0.3)',
                        color: newTourneyType === 'SOLO' ? '#00f2fe' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      SOLO (Individual)
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewTourneyType('TEAM')}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: newTourneyType === 'TEAM' ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                        background: newTourneyType === 'TEAM' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0,0,0,0.3)',
                        color: newTourneyType === 'TEAM' ? '#c084fc' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      TEAM (Squad / Duo)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Team / Solo Capacity Configuration */}
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '0.88rem', color: '#a855f7', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} /> 2. {newTourneyType === 'TEAM' ? 'Team Configuration' : 'Player Capacity'}
              </h4>

              {newTourneyType === 'TEAM' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '3px' }}>
                        Team Size
                      </label>
                      <select
                        value={newTeamSize}
                        onChange={e => setNewTeamSize(Number(e.target.value))}
                        className="glass-panel"
                        style={{ width: '100%', padding: '7px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.85rem' }}
                      >
                        <option value={2}>2 Players (Duo)</option>
                        <option value={4}>4 Players (Squad)</option>
                        <option value={5}>5 Players (Esports Standard)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '3px' }}>
                        Maximum Teams
                      </label>
                      <select
                        value={newMaxTeams}
                        onChange={e => setNewMaxTeams(Number(e.target.value))}
                        className="glass-panel"
                        style={{ width: '100%', padding: '7px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.85rem' }}
                      >
                        <option value={8}>8 Teams</option>
                        <option value={16}>16 Teams</option>
                        <option value={32}>32 Teams</option>
                        <option value={64}>64 Teams</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: '#e9d5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Automatic Capacity:</span>
                    <strong>{newTeamSize} × {newMaxTeams} = {calculatedMaxPlayers} Maximum Players</strong>
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '3px' }}>
                    Maximum Solo Players
                  </label>
                  <input
                    type="number"
                    value={newSoloMaxPlayers}
                    onChange={e => setNewSoloMaxPlayers(Number(e.target.value))}
                    min={4}
                    max={500}
                    className="glass-panel"
                    style={{ width: '100%', padding: '7px 12px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              )}
            </div>

            {/* 3. Schedule Configuration */}
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '0.88rem', color: '#38bdf8', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} /> 3. Schedule (Registration & Event)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '2px' }}>
                    Registration Opens
                  </label>
                  <input
                    type="datetime-local"
                    value={regStart}
                    onChange={e => setRegStart(e.target.value)}
                    className="glass-panel"
                    style={{ width: '100%', padding: '6px 8px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.78rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '2px' }}>
                    Registration Closes
                  </label>
                  <input
                    type="datetime-local"
                    value={regEnd}
                    onChange={e => setRegEnd(e.target.value)}
                    className="glass-panel"
                    style={{ width: '100%', padding: '6px 8px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.78rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '2px' }}>
                    Tournament Starts
                  </label>
                  <input
                    type="datetime-local"
                    value={tourneyStart}
                    onChange={e => setTourneyStart(e.target.value)}
                    className="glass-panel"
                    style={{ width: '100%', padding: '6px 8px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.78rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '2px' }}>
                    Tournament Ends
                  </label>
                  <input
                    type="datetime-local"
                    value={tourneyEnd}
                    onChange={e => setTourneyEnd(e.target.value)}
                    className="glass-panel"
                    style={{ width: '100%', padding: '6px 8px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.78rem' }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* 4. Location Configuration */}
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '0.88rem', color: '#34d399', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} /> 4. Location & Venue
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {(['ONLINE', 'OFFLINE', 'HYBRID'] as LocationType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLocationType(type)}
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        border: locationType === type ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                        background: locationType === type ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.3)',
                        color: locationType === type ? '#34d399' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {(locationType === 'ONLINE' || locationType === 'HYBRID') && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '2px' }}>
                        Online Platform
                      </label>
                      <input
                        type="text"
                        value={onlinePlatform}
                        onChange={e => setOnlinePlatform(e.target.value)}
                        className="glass-panel"
                        style={{ width: '100%', padding: '6px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '2px' }}>
                        Server / Region
                      </label>
                      <input
                        type="text"
                        value={serverRegion}
                        onChange={e => setServerRegion(e.target.value)}
                        className="glass-panel"
                        style={{ width: '100%', padding: '6px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                )}

                {(locationType === 'OFFLINE' || locationType === 'HYBRID') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Venue Name (e.g. Pune Gaming Arena)"
                        value={venueName}
                        onChange={e => setVenueName(e.target.value)}
                        className="glass-panel"
                        style={{ width: '100%', padding: '6px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                        required={locationType === 'OFFLINE'}
                      />
                      <input
                        type="text"
                        placeholder="City (e.g. Pune)"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="glass-panel"
                        style={{ width: '100%', padding: '6px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                        required={locationType === 'OFFLINE'}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Eligibility Requirements */}
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '0.88rem', color: '#fbbf24', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} /> 5. Player Eligibility Requirements
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '2px' }}>Minimum Rank</label>
                  <select
                    value={newMinRank}
                    onChange={e => setNewMinRank(Number(e.target.value) as RankTier)}
                    className="glass-panel"
                    style={{ width: '100%', padding: '6px 8px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.78rem' }}
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
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '2px' }}>Minimum Score</label>
                  <input type="number" value={newMinScore} onChange={e => setNewMinScore(Number(e.target.value))} min={0} className="glass-panel" style={{ width: '100%', padding: '6px 8px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.78rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '2px' }}>Minimum Wins</label>
                  <input type="number" value={newMinWins} onChange={e => setNewMinWins(Number(e.target.value))} min={0} className="glass-panel" style={{ width: '100%', padding: '6px 8px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.78rem' }} />
                </div>
              </div>
            </div>

            {/* 6. Prize Pool */}
            <div>
              <h4 style={{ fontSize: '0.88rem', color: '#34d399', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={14} /> 6. Prize Pool
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '2px' }}>Prize Amount</label>
                    <input
                      type="text"
                      placeholder="e.g. 10,000"
                      value={prizeAmount}
                      onChange={e => setPrizeAmount(e.target.value)}
                      className="glass-panel"
                      style={{ width: '100%', padding: '7px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '2px' }}>Currency</label>
                    <select
                      value={prizeCurrency}
                      onChange={e => setPrizeCurrency(e.target.value)}
                      className="glass-panel"
                      style={{ width: '100%', padding: '7px 8px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USDT">USDT</option>
                      <option value="Gift Cards">Gift Cards</option>
                      <option value="Gaming Gear">Gaming Gear</option>
                      <option value="TBD">TBD</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '2px' }}>Prize Breakdown</label>
                  <input
                    type="text"
                    placeholder="e.g. 1st: ₹5,000 · 2nd: ₹3,000 · 3rd: ₹2,000"
                    value={prizeDescription}
                    onChange={e => setPrizeDescription(e.target.value)}
                    className="glass-panel"
                    style={{ width: '100%', padding: '7px 10px', background: 'rgba(10, 15, 26, 0.7)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            </div>

            {!isContractDeployed && (
              <div style={{
                padding: '8px 12px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '6px',
                fontSize: '0.78rem',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Sparkles size={14} />
                <span>PrivateRank contract is not deployed yet. It will be deployed automatically when you submit this tournament.</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ padding: '7px 16px', fontSize: '0.82rem' }}>
                Cancel
              </button>
              <button type="submit" className="btn-purple" style={{ padding: '7px 22px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <Sparkles size={14} /> Create Tournament
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Archive Tournament Confirmation Modal */}
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
              maxWidth: '500px',
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
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Archive Tournament on Midnight Preprod
              </h2>
            </div>

            <div
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '14px'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tournament:
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                {tournamentToDelete.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                Current Status: <strong style={{ color: '#f8fafc' }}>{tournamentToDelete.status}</strong>
              </div>
            </div>

            <p style={{ fontSize: '0.87rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '8px' }}>
              This will submit a real <strong style={{ color: '#f87171' }}>Midnight Preprod on-chain transaction</strong>:
            </p>
            <ul style={{ fontSize: '0.83rem', color: '#94a3b8', paddingLeft: '18px', lineHeight: 1.7, marginBottom: '16px' }}>
              <li>Your <strong style={{ color: '#38bdf8' }}>1AM Wallet</strong> will prompt for approval and DUST fee.</li>
              <li>If the tournament is OPEN → it will be <strong style={{ color: '#fbbf24' }}>closed</strong> first, then <strong style={{ color: '#f87171' }}>archived</strong>.</li>
              <li>Archived tournaments remain on-chain but are hidden from active player lists.</li>
              <li>This action <strong style={{ color: '#f87171' }}>cannot be undone</strong>.</li>
            </ul>

            {formError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '8px', color: '#f87171', fontSize: '0.82rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} /> {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setTournamentToDelete(null); setFormError(null); }}
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
                style={{
                  padding: '8px 22px',
                  fontSize: '0.9rem',
                  background: isDeleting ? 'rgba(239, 68, 68, 0.5)' : '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isDeleting ? (
                  <><Loader2 size={15} className="animate-spin" /> Archiving on-chain...</>
                ) : (
                  <><Trash2 size={14} /> Archive On-Chain</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================
          DEPLOY CONTRACT MODAL
          Real 7-step deployment flow
          via ContractDeploymentService
          ============================ */}
      {showDeployModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !isDeploying) setShowDeployModal(false); }}
        >
          <div
            style={{
              background: 'linear-gradient(160deg, #0d0d1f 0%, #0f172a 60%, #130820 100%)',
              border: '1px solid rgba(139,92,246,0.35)',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 80px rgba(0,0,0,0.7), 0 0 60px rgba(139,92,246,0.08)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(139,92,246,0.18)' }}>
                  <Rocket size={24} style={{ color: '#a78bfa' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                    Deploy PrivateRank Contract
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    Midnight Preprod Testnet · Real Compact Deployment
                  </p>
                </div>
              </div>
              {!isDeploying && (
                <button
                  onClick={() => setShowDeployModal(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#475569', padding: '6px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center'
                  }}
                >
                  <XCircle size={22} />
                </button>
              )}
            </div>

            {/* Steps Panel — always visible during/after deployment */}
            {(isDeploying || deployProgress) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { n: 1, label: 'Wallet & DUST Check', desc: 'Verify 1AM Wallet connection and Preprod network' },
                  { n: 2, label: 'Build Contract Transaction', desc: 'Construct Compact contract deployment intent' },
                  { n: 3, label: '1AM Wallet Approval', desc: 'Approve transaction + tDUST fee in wallet popup' },
                  { n: 4, label: 'Broadcast to Preprod', desc: 'Submit signed transaction to Midnight network' },
                  { n: 5, label: 'Indexer Confirmation', desc: 'Wait for Midnight Preprod indexer to confirm' },
                  { n: 6, label: 'Address Extraction', desc: 'Read real contract address from tx.contractActions' },
                  { n: 7, label: 'Deployed & Verified', desc: 'Contract live on Midnight Preprod Testnet' },
                ].map(({ n, label, desc }) => {
                  const currentStep = getDeployStep(deployProgress);
                  const isFailed = deployProgress?.step === 'FAILED';
                  const isDone = deployResult !== null && !isFailed;
                  const isActive = !isFailed && !isDone && currentStep === n;
                  const isPast = !isFailed && (isDone ? true : currentStep > n);

                  return (
                    <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: n < 7 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      {/* Circle indicator */}
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: '0.75rem', fontWeight: 700,
                        marginTop: '1px',
                        background: isPast
                          ? 'rgba(16,185,129,0.25)'
                          : isActive
                          ? 'rgba(139,92,246,0.3)'
                          : 'rgba(255,255,255,0.05)',
                        border: isPast
                          ? '2px solid rgba(52,211,153,0.7)'
                          : isActive
                          ? '2px solid rgba(167,139,250,0.7)'
                          : '2px solid rgba(255,255,255,0.08)',
                        color: isPast ? '#34d399' : isActive ? '#a78bfa' : '#475569'
                      }}>
                        {isPast ? <CheckCircle2 size={14} /> : isActive ? <Loader2 size={14} className="animate-spin" /> : n}
                      </div>

                      {/* Step text */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isPast ? '#34d399' : isActive ? '#e2e8f0' : '#475569' }}>
                          {label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '1px' }}>{desc}</div>
                        {/* Live progress message for active step */}
                        {isActive && deployProgress?.message && (
                          <div style={{ fontSize: '0.76rem', color: '#a78bfa', marginTop: '4px', fontStyle: 'italic' }}>
                            {deployProgress.message}
                            {deployProgress.attempt && deployProgress.maxAttempts && (
                              <span style={{ color: '#64748b', marginLeft: '6px' }}>
                                (attempt {deployProgress.attempt}/{deployProgress.maxAttempts}
                                {deployProgress.elapsedSeconds != null ? `, ${deployProgress.elapsedSeconds}s` : ''})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Success Result */}
            {deployResult && (
              <div style={{
                padding: '20px',
                borderRadius: '14px',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', fontWeight: 800, fontSize: '1rem' }}>
                  <CheckCircle2 size={22} />
                  Contract Deployed Successfully
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Contract Address */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contract Address</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#e2e8f0', wordBreak: 'break-all', flex: 1 }}>
                        {deployResult.contractAddress}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          onClick={() => handleCopy(deployResult.contractAddress, 'contract')}
                          title="Copy contract address"
                          style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: copiedField === 'contract' ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}
                        >
                          <Copy size={12} />
                          {copiedField === 'contract' ? 'Copied!' : 'Copy'}
                        </button>
                        <a
                          href={`https://midnight.network/explorer/contracts/${deployResult.contractAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on Midnight Explorer"
                          style={{ background: 'rgba(56,189,248,0.1)', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', textDecoration: 'none' }}
                        >
                          <ExternalLink size={12} />
                          Explorer
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* TX Hash */}
                  {deployResult.txHash && (
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Transaction Hash</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#e2e8f0', wordBreak: 'break-all', flex: 1 }}>
                          {deployResult.txHash}
                        </span>
                        <button
                          onClick={() => handleCopy(deployResult.txHash, 'txhash')}
                          style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: copiedField === 'txhash' ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', flexShrink: 0 }}
                        >
                          <Copy size={12} />
                          {copiedField === 'txhash' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5' }}>
                  ✅ Contract is verified on Midnight Preprod Indexer. You can now create tournaments.
                </div>
              </div>
            )}

            {/* Error State */}
            {deployError && !isDeploying && (
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.35)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <XCircle size={18} style={{ color: '#f87171', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.9rem', marginBottom: '4px' }}>Deployment Failed</div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.5', wordBreak: 'break-word' }}>{deployError}</div>
                </div>
              </div>
            )}

            {/* Idle State — before deployment starts */}
            {!isDeploying && !deployProgress && !deployResult && !deployError && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '0.85rem',
                  color: '#94a3b8',
                  lineHeight: '1.7'
                }}>
                  <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} style={{ color: '#a78bfa' }} />
                    What happens when you click Deploy:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li>1AM Wallet extension popup will ask you to approve</li>
                    <li>Real tDUST fees will be deducted from your Preprod wallet</li>
                    <li>Compact PrivateRank contract is deployed with all ZK verifier keys</li>
                    <li>Deployment confirmed via official Midnight Preprod GraphQL Indexer</li>
                    <li>Real 64-character contract address is extracted from the transaction</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              {!isDeploying && (
                <button
                  onClick={() => {
                    setShowDeployModal(false);
                    setDeployProgress(null);
                    setDeployError(null);
                    if (!deployResult) setDeployResult(null);
                  }}
                  style={{
                    padding: '9px 20px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#94a3b8',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  {deployResult ? 'Close' : 'Cancel'}
                </button>
              )}
              {!deployResult && (
                <button
                  id="deploy-contract-confirm-btn"
                  onClick={handleDeployContract}
                  disabled={isDeploying}
                  style={{
                    padding: '10px 28px',
                    background: isDeploying
                      ? 'rgba(139,92,246,0.4)'
                      : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: isDeploying ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: isDeploying ? 'none' : '0 4px 20px rgba(139,92,246,0.35)'
                  }}
                >
                  {isDeploying ? (
                    <><Loader2 size={16} className="animate-spin" /> Deploying to Preprod...</>
                  ) : deployError ? (
                    <><Rocket size={16} /> Retry Deployment</>
                  ) : (
                    <><Rocket size={16} /> Deploy to Midnight Preprod</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* On-Chain Transaction Progress Modal */}
      {!isModalDismissed && (
        <TransactionModal
          progress={txProgress}
          receipt={txReceipt}
          onClose={() => {
            setIsModalDismissed(true);
            resetTxState();
          }}
          onRetry={resetTxState}
          onRefresh={handleManualSync}
          onDismissBackground={() => setIsModalDismissed(true)}
        />
      )}
    </div>
  );
};
