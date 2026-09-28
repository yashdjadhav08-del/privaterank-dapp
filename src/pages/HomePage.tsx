import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { useWallet } from '../context/WalletContext';
import { RankBadge } from '../components/common/RankBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatPrizePool } from '../utils/crypto';
import { Users, Calendar, Trophy, ArrowRight, Flame, PlusCircle, AlertTriangle, Server } from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: string, extra?: { tournamentId?: string }) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { tournaments, serverStatus, serverResponse } = useTournament();
  const { authState, activeRole, selectRole, connectWallet } = useWallet();

  const safeTournaments = Array.isArray(tournaments) ? tournaments : [];
  const openTournaments = safeTournaments.filter(
    t => t && t.status !== 'ARCHIVED' && t.status !== 'CLOSED' && t.status !== 'CANCELLED'
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '36px' }}>
      {/* Hero Banner */}
      <section
        style={{
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(7, 10, 18, 0.95))',
          padding: '40px 32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(0, 242, 254, 0.12)',
              color: '#00f2fe',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '14px',
              border: '1px solid rgba(0, 242, 254, 0.3)'
            }}
          >
            <Flame size={14} /> MIDNIGHT NETWORK ESPORTS
          </div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '12px' }}>
            Privacy-Preserving Gaming Tournaments
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '20px' }}>
            Prove tournament eligibility with Zero-Knowledge proofs while protecting your personal identity.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('dashboard')}
              className="btn-primary"
              style={{ padding: '9px 20px', fontSize: '0.9rem' }}
            >
              {activeRole === 'ORGANIZER' ? 'Go to Organizer Dashboard' : 'Enter Player Portal'}
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className="btn-secondary"
              style={{ padding: '9px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Explore <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Available Tournaments */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
              Available Tournaments
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Active tournaments on Midnight Network</p>
          </div>
          {openTournaments.length > 0 && (
            <button
              onClick={() => onNavigate('explore')}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              View All
            </button>
          )}
        </div>

        {/* Server Status Banner */}
        {serverStatus === 'unreachable' && (
          typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? (
            <div style={{
              borderRadius: '12px',
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#fbbf24'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.85rem' }}>Backend Server Offline (Local Dev)</strong>
                <p style={{ fontSize: '0.8rem', margin: '2px 0 0', color: '#94a3b8' }}>
                  Start the backend: <code>node server/index.mjs</code> in a second terminal.
                  Tournaments from Midnight Preprod will then appear here for ALL wallets.
                </p>
              </div>
            </div>
          ) : (
            <div style={{
              borderRadius: '10px',
              background: 'rgba(0, 242, 254, 0.05)',
              border: '1px solid rgba(0, 242, 254, 0.15)',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.78rem',
              color: '#64748b'
            }}>
              <Server size={14} style={{ color: '#00f2fe', flexShrink: 0 }} />
              <span>
                <span style={{ color: '#00f2fe', fontWeight: 600 }}>Midnight Preprod</span>
                {' · '}
                <span style={{ color: '#94a3b8' }}>Verified On-Chain Contract</span>
                {' · '}
                <code style={{ color: '#67e8f9', background: 'rgba(0,242,254,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem' }}>
                  ba193619...1dcde
                </code>
              </span>
            </div>
          )
        )}

        {/* Server OK banner */}
        {serverStatus === 'ok' && serverResponse && (
          <div style={{
            borderRadius: '10px',
            background: 'rgba(0, 242, 254, 0.05)',
            border: '1px solid rgba(0, 242, 254, 0.15)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.78rem',
            color: '#64748b'
          }}>
            <Server size={14} style={{ color: '#00f2fe', flexShrink: 0 }} />
            <span>
              <span style={{ color: '#00f2fe', fontWeight: 600 }}>Midnight Preprod</span>
              {' · '}
              {serverResponse.contractAddress
                ? <span>Contract: <code style={{ color: '#94a3b8' }}>{serverResponse.contractAddress.slice(0, 16)}…</code></span>
                : <span style={{ color: '#fbbf24' }}>Contract not set</span>
              }
              {' · '}
              <span>{serverResponse.tournaments.length} tournament(s)</span>
            </span>
          </div>
        )}

        {openTournaments.length === 0 ? (

          <div
            className="glass-panel"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <Trophy size={36} className="text-cyan-400" />
            {serverStatus === 'unreachable' ? (
              <>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                  Unable to Load Tournaments from Midnight Preprod
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '480px' }}>
                  The backend server is not running. Start it with <code>node server/index.mjs</code> in a separate terminal, then tournaments will appear here for both Organizer and Player wallets.
                </p>
              </>
            ) : serverStatus === 'ok' && serverResponse && !serverResponse.contractAddress ? (
              <>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                  PrivateRank Contract Not Yet Configured
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '480px' }}>
                  The backend server is running but has no PrivateRank contract address. Deploy the contract and register it via <code>POST /api/contract</code>.
                </p>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                  No Active Tournaments Available Yet
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '420px' }}>
                  No tournaments have been registered on Midnight Preprod yet. Create one as an Organizer.
                </p>
              </>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => onNavigate('explore')}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
              >
                Explore Games & Tournaments
              </button>
              {activeRole === 'ORGANIZER' && (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="btn-secondary"
                  style={{ padding: '8px 20px', fontSize: '0.85rem', borderColor: 'rgba(157, 78, 221, 0.4)' }}
                >
                  <PlusCircle size={15} /> Create Tournament
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {openTournaments.map(tourney => (
              <div
                key={tourney.id}
                className="glass-panel glass-card-interactive"
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
                onClick={() => onNavigate('game_details', { tournamentId: tourney.id })}
              >
                <div
                  style={{
                    height: '140px',
                    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(7, 10, 18, 0.95)), url(${tourney.gameImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        background: 'rgba(0,0,0,0.7)',
                        color: '#00f2fe',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}
                    >
                      {tourney.gameTitle || 'Game'}
                    </span>
                    <StatusBadge status={tourney.status || 'OPEN'} />
                  </div>

                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                    {tourney.name}
                  </div>
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} className="text-cyan-400" />
                        Players: <strong style={{ color: '#f8fafc' }}>{tourney.applicantCount || 0} / {tourney.maxParticipants || 64}</strong>
                      </span>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                        {formatPrizePool(tourney.prizePool)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>Requirement:</span>
                      <RankBadge rank={tourney.requirements?.minimumRank || 1} size="sm" />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                      <Calendar size={13} className="text-purple-400" />
                      <span>Starts: {tourney.startDate ? new Date(tourney.startDate).toLocaleDateString() : 'TBD'}</span>
                    </div>
                  </div>

                  <button
                    className="btn-primary"
                    style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('game_details', { tournamentId: tourney.id });
                    }}
                  >
                    View Tournament
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
