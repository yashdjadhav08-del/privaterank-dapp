import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { ProfileService } from '../services/profileService';
import { RankTier } from '../types';
import { RankBadge } from '../components/common/RankBadge';
import { shortenAddress } from '../utils/crypto';
import { 
  Gamepad2, 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  X, 
  Save, 
  Wallet,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Award
} from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (view: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { authState, playerProfile, updateProfile, connectWallet } = useWallet();

  const isConnected = authState.isConnected && !!authState.unshieldedAddress;

  // View vs Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Form State (Gaming Credentials only)
  const [formData, setFormData] = useState({
    gameTitle: 'Competitive Esports',
    rank: RankTier.PLATINUM,
    score: 2000,
    wins: 10,
    losses: 2,
    achievementsCount: 3
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Sync state when profile loads or wallet connects
  useEffect(() => {
    if (playerProfile) {
      setFormData({
        gameTitle: playerProfile.gamingCredentials?.gameTitle || 'Competitive Esports',
        rank: playerProfile.gamingCredentials?.rank || RankTier.PLATINUM,
        score: playerProfile.gamingCredentials?.score ?? 2000,
        wins: playerProfile.gamingCredentials?.wins ?? 10,
        losses: playerProfile.gamingCredentials?.losses ?? 2,
        achievementsCount: playerProfile.gamingCredentials?.achievements?.length || 3
      });
    }
  }, [playerProfile]);

  if (!isConnected) {
    return (
      <div style={{ maxWidth: '700px', margin: '60px auto', padding: '20px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0, 242, 254, 0.1)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f2fe'
            }}
          >
            <Wallet size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
            Connect Your 1AM Wallet
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '420px', lineHeight: 1.5 }}>
            Please connect your 1AM Wallet to view and manage your gaming credentials on Midnight Network.
          </p>
          <button
            onClick={() => connectWallet()}
            disabled={authState.isConnecting}
            className="btn-primary"
            style={{ padding: '10px 24px', fontSize: '0.95rem', marginTop: '6px' }}
          >
            {authState.isConnecting ? 'Connecting...' : 'Connect 1AM Wallet'}
          </button>
        </div>
      </div>
    );
  }

  const currentProfile = playerProfile || ProfileService.getProfile(authState.unshieldedAddress!);
  const avatarInitials = ProfileService.getAvatarInitials(currentProfile);

  const totalMatches = (formData.wins || 0) + (formData.losses || 0);
  const winRate = totalMatches > 0 ? Math.round(((formData.wins || 0) / totalMatches) * 100) : 0;

  const handleStartEdit = () => {
    setFormErrors({});
    setGeneralError(null);
    setShowSuccessToast(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (playerProfile) {
      setFormData({
        gameTitle: playerProfile.gamingCredentials?.gameTitle || 'Competitive Esports',
        rank: playerProfile.gamingCredentials?.rank || RankTier.PLATINUM,
        score: playerProfile.gamingCredentials?.score ?? 2000,
        wins: playerProfile.gamingCredentials?.wins ?? 10,
        losses: playerProfile.gamingCredentials?.losses ?? 2,
        achievementsCount: playerProfile.gamingCredentials?.achievements?.length || 3
      });
    }
    setFormErrors({});
    setGeneralError(null);
    setIsEditing(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const updatedToValidate = {
      walletAddress: authState.unshieldedAddress!,
      anonymousId: currentProfile.anonymousId,
      personalInfo: currentProfile.personalInfo || {
        fullName: '',
        email: '',
        phone: '',
        country: '',
        dateOfBirth: ''
      },
      gamingCredentials: {
        rank: Number(formData.rank) as RankTier,
        score: Number(formData.score),
        wins: Number(formData.wins),
        losses: Number(formData.losses),
        achievements: Array.from({ length: Math.max(1, Number(formData.achievementsCount)) }, (_, i) => `Achievement #${i + 1}`),
        gameTitle: formData.gameTitle.trim() || 'Competitive Esports',
        verifiedAt: new Date().toISOString()
      }
    };

    // Validate gaming credentials
    const validation = ProfileService.validateProfile(updatedToValidate);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setGeneralError('Please correct the highlighted fields before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await new Promise(res => setTimeout(res, 250));
      updateProfile(updatedToValidate);
      setIsEditing(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to save your gaming credentials. Please try again.';
      setGeneralError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            MY PROFILE
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>
            Wallet Address & Verifiable Gaming Credentials
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.88rem' }}
          >
            <Edit3 size={15} /> Edit Gaming Credentials
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {showSuccessToast && (
        <div
          className="glass-panel"
          style={{
            padding: '14px 20px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#6ee7b7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span>✓ Profile updated successfully</span>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            style={{ background: 'transparent', border: 'none', color: '#6ee7b7', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* General Error Banner */}
      {generalError && (
        <div
          className="glass-panel"
          style={{
            padding: '14px 20px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem'
          }}
        >
          <AlertCircle size={18} className="text-rose-400" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Wallet Address & Identity Card */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(7, 10, 18, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '280px' }}>
          {/* Avatar / Badge */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #00f2fe 0%, #7928ca 100%)',
              color: '#040d1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
              fontWeight: 800,
              boxShadow: '0 0 20px rgba(0, 242, 254, 0.3)'
            }}
          >
            {avatarInitials}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Connected 1AM Wallet
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(0, 242, 254, 0.12)',
                  color: '#00f2fe',
                  fontWeight: 700
                }}
              >
                {currentProfile.anonymousId}
              </span>
            </div>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.92rem',
                color: '#f8fafc',
                wordBreak: 'break-all',
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              {authState.unshieldedAddress}
            </div>
          </div>
        </div>

        {/* Network & Privacy Status Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(0, 242, 254, 0.08)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#00f2fe'
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f2fe', boxShadow: '0 0 8px #00f2fe' }} />
            <span>Midnight Preprod Testnet</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#34d399'
            }}
          >
            <ShieldCheck size={14} />
            <span>Zero-Knowledge Verified</span>
          </div>
        </div>
      </div>

      {/* GAMING CREDENTIALS FORM / VIEW 🎮 */}
      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <section
          className="glass-panel"
          style={{
            padding: '28px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c084fc'
                }}
              >
                <Gamepad2 size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
                  Gaming Credentials 🎮
                </h2>
              </div>
            </div>

            {!isEditing && (
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={14} className="text-emerald-400" />
                Win Rate: <strong style={{ color: '#34d399' }}>{winRate}%</strong>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div
            style={{
              background: 'rgba(168, 85, 247, 0.06)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#e9d5ff',
              fontSize: '0.82rem',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={16} className="text-purple-400" />
            <span>These credentials are used by Midnight Zero-Knowledge circuits to verify tournament eligibility without exposing personal data.</span>
          </div>

          {/* Gaming Credentials Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
            {/* Game Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                Game Title
              </label>
              {isEditing ? (
                <input
                  type="text"
                  placeholder="e.g. Valorant / Apex Legends"
                  value={formData.gameTitle}
                  onChange={e => setFormData({ ...formData, gameTitle: e.target.value })}
                  className="glass-panel"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'rgba(10, 15, 26, 0.8)',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
              ) : (
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '8px' }}>
                  {currentProfile.gamingCredentials?.gameTitle || 'Competitive Esports'}
                </div>
              )}
            </div>

            {/* Rank */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                Rank
              </label>
              {isEditing ? (
                <>
                  <select
                    value={formData.rank}
                    onChange={e => setFormData({ ...formData, rank: Number(e.target.value) as RankTier })}
                    className="glass-panel"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: '#0d1322',
                      color: '#f8fafc',
                      border: formErrors.rank ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value={RankTier.BRONZE}>Bronze</option>
                    <option value={RankTier.SILVER}>Silver</option>
                    <option value={RankTier.GOLD}>Gold</option>
                    <option value={RankTier.PLATINUM}>Platinum</option>
                    <option value={RankTier.DIAMOND}>Diamond</option>
                    <option value={RankTier.MASTER}>Master</option>
                    <option value={RankTier.GRANDMASTER}>Grandmaster</option>
                  </select>
                  {formErrors.rank && <div style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.rank}</div>}
                </>
              ) : (
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                  <RankBadge rank={currentProfile.gamingCredentials?.rank || RankTier.PLATINUM} size="md" />
                </div>
              )}
            </div>

            {/* Score */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                Score / MMR
              </label>
              {isEditing ? (
                <>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 2450"
                    value={formData.score}
                    onChange={e => setFormData({ ...formData, score: Number(e.target.value) })}
                    className="glass-panel"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'rgba(10, 15, 26, 0.8)',
                      color: '#f8fafc',
                      border: formErrors.score ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  />
                  {formErrors.score && <div style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.score}</div>}
                </>
              ) : (
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#00f2fe', background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '8px' }}>
                  {currentProfile.gamingCredentials?.score ?? 0} pts
                </div>
              )}
            </div>

            {/* Wins */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                Wins
              </label>
              {isEditing ? (
                <>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 180"
                    value={formData.wins}
                    onChange={e => setFormData({ ...formData, wins: Number(e.target.value) })}
                    className="glass-panel"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'rgba(10, 15, 26, 0.8)',
                      color: '#f8fafc',
                      border: formErrors.wins ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  />
                  {formErrors.wins && <div style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.wins}</div>}
                </>
              ) : (
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '8px' }}>
                  {currentProfile.gamingCredentials?.wins ?? 0} Wins
                </div>
              )}
            </div>

            {/* Losses */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                Losses
              </label>
              {isEditing ? (
                <>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 40"
                    value={formData.losses}
                    onChange={e => setFormData({ ...formData, losses: Number(e.target.value) })}
                    className="glass-panel"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'rgba(10, 15, 26, 0.8)',
                      color: '#f8fafc',
                      border: formErrors.losses ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  />
                  {formErrors.losses && <div style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.losses}</div>}
                </>
              ) : (
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f43f5e', background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '8px' }}>
                  {currentProfile.gamingCredentials?.losses ?? 0} Losses
                </div>
              )}
            </div>

            {/* Achievements */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                Achievements
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 5"
                  value={formData.achievementsCount}
                  onChange={e => setFormData({ ...formData, achievementsCount: Number(e.target.value) })}
                  className="glass-panel"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'rgba(10, 15, 26, 0.8)',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
              ) : (
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} />
                  <span>{currentProfile.gamingCredentials?.achievements?.length || 0} Badges</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Form Action Buttons in Edit Mode */}
        {isEditing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingBottom: '20px' }}>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="btn-secondary"
              style={{ padding: '10px 22px', fontSize: '0.9rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
              style={{ padding: '10px 26px', fontSize: '0.9rem' }}
            >
              <Save size={16} /> {isSaving ? 'Saving changes...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
