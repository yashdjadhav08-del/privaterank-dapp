import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { GameCategory, RankTier } from '../types';
import { RankBadge } from '../components/common/RankBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Search, Users, Trophy, Calendar, ArrowRight, Filter } from 'lucide-react';

interface ExplorePageProps {
  onNavigate: (view: string, extra?: { tournamentId?: string }) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ onNavigate }) => {
  const { tournaments } = useTournament();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('All');
  const [selectedRank, setSelectedRank] = useState<number>(0);

  const categories: GameCategory[] = ['All', 'FPS', 'MOBA', 'Battle Royale', 'Sports'];

  const safeTournaments = Array.isArray(tournaments) ? tournaments : [];

  const filteredTournaments = safeTournaments.filter(t => {
    if (!t) return false;
    const name = t.name || '';
    const gameTitle = t.gameTitle || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          gameTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const reqRank = t.requirements?.minimumRank || 1;
    const matchesRank = selectedRank === 0 || reqRank <= selectedRank;
    return matchesSearch && matchesCategory && matchesRank;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
          Explore Games & Tournaments
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Discover competitive gaming tournaments across top titles on Midnight.
        </p>
      </div>

      {/* Search Bar & Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          className="glass-panel"
          style={{
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderRadius: '12px'
          }}
        >
          <Search size={20} className="text-cyan-400" />
          <input
            type="text"
            placeholder="Search games, tournaments..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Category Pills & Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '20px',
                  border: selectedCategory === cat ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: selectedCategory === cat ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: selectedCategory === cat ? '#00f2fe' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} className="text-purple-400" />
            <select
              value={selectedRank}
              onChange={e => setSelectedRank(Number(e.target.value))}
              className="glass-panel"
              style={{
                padding: '6px 12px',
                background: 'rgba(10, 15, 26, 0.7)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                fontSize: '0.8rem'
              }}
            >
              <option value={0}>All Rank Tiers</option>
              <option value={RankTier.GOLD}>Gold & Under (≤ Tier 3)</option>
              <option value={RankTier.PLATINUM}>Platinum & Under (≤ Tier 4)</option>
              <option value={RankTier.DIAMOND}>Diamond & Under (≤ Tier 5)</option>
              <option value={RankTier.MASTER}>Master+ (Tier 6-7)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tournaments Grid */}
      {filteredTournaments.length === 0 ? (
        <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8' }}>
          No tournaments found matching your search.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredTournaments.map(tourney => (
            <div
              key={tourney.id}
              className="glass-panel glass-card-interactive"
              style={{
                borderRadius: '14px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
              onClick={() => onNavigate('game_details', { tournamentId: tourney.id })}
            >
              {/* Top Banner */}
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
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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
                    <span
                      style={{
                        background: tourney.tournamentType === 'TEAM' ? 'rgba(168, 85, 247, 0.7)' : 'rgba(0, 242, 254, 0.6)',
                        color: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 800
                      }}
                    >
                      {tourney.tournamentType === 'TEAM' ? `TEAM (${tourney.teamSize})` : 'SOLO'}
                    </span>
                  </div>
                  <StatusBadge status={tourney.status || 'OPEN'} />
                </div>

                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                  {tourney.name}
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={15} className="text-cyan-400" />
                    {tourney.tournamentType === 'TEAM' 
                      ? `Teams: ${tourney.currentTeams || 0} / ${tourney.maxTeams || 16}` 
                      : `Players: ${tourney.applicantCount || 0} / ${tourney.maxParticipants || 64}`}
                  </span>
                  <span style={{ color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Trophy size={14} /> {tourney.prizePool || 'TBD'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Requirement:</span>
                  <RankBadge rank={tourney.requirements?.minimumRank || 1} size="sm" />
                </div>


                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                  <Calendar size={14} className="text-purple-400" />
                  <span>Starts: {tourney.startDate ? new Date(tourney.startDate).toLocaleDateString() : 'TBD'}</span>
                </div>

                <button
                  className="btn-primary"
                  style={{ width: '100%', padding: '9px', fontSize: '0.85rem', marginTop: '4px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('game_details', { tournamentId: tourney.id });
                  }}
                >
                  View Details <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
