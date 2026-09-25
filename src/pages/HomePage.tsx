import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { useWallet } from '../context/WalletContext';
import { RankBadge } from '../components/common/RankBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Users, Calendar, Trophy, ArrowRight, Flame, PlusCircle } from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: string, extra?: { tournamentId?: string }) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { tournaments } = useTournament();
  const { authState, activeRole, isOrganizerAuthorized, registerOrganizerWallet, connectWallet } = useWallet();

  const safeTournaments = Array.isArray(tournaments) ? tournaments : [];
  const openTournaments = safeTournaments.filter(t => t && t.status === 'OPEN');

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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              No Active Tournaments Available Yet
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '420px' }}>
              Check back soon for upcoming competitive tournaments on the Midnight Network.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => onNavigate('explore')}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
              >
                Explore Games & Tournaments
              </button>
              {isOrganizerAuthorized && (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="btn-secondary"
                  style={{ padding: '8px 20px', fontSize: '0.85rem', borderColor: 'rgba(157, 78, 221, 0.4)' }}
                >
                  <PlusCircle size={15} /> Create Tournament (Organizer)
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
                        {tourney.prizePool || 'TBD'}
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
