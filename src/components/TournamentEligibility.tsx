import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useTournament } from '../context/TournamentContext';
import { zkProver, ProofResult } from '../contracts/zkProver';
import { Tournament } from '../types';
import { Shield, CheckCircle2, XCircle, Lock, Cpu, Sparkles, AlertCircle } from 'lucide-react';

interface TournamentEligibilityProps {
  tournament: Tournament;
  onProofGenerated?: (proof: ProofResult) => void;
  onJoinSuccess?: () => void;
}

export const TournamentEligibility: React.FC<TournamentEligibilityProps> = ({
  tournament,
  onProofGenerated,
  onJoinSuccess
}) => {
  const { authState, playerProfile } = useWallet();
  const { submitApplication } = useTournament();
  const credentials = playerProfile?.gamingCredentials;
  const [proving, setProving] = useState(false);
  const [proofResult, setProofResult] = useState<ProofResult | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check baseline eligibility client-side
  const meetsRank = (credentials?.rank || 0) >= tournament.requirements.minimumRank;
  const meetsScore = (credentials?.score || 0) >= tournament.requirements.minimumScore;
  const meetsWins = (credentials?.wins || 0) >= tournament.requirements.minimumWins;
  const isEligible = meetsRank && meetsScore && meetsWins;

  const handleProveEligibility = async () => {
    if (!credentials) {
      setError('Please connect your 1AM wallet and load player credentials.');
      return;
    }

    try {
      setProving(true);
      setError(null);

      // Generate client-side Zero-Knowledge proof via Midnight Proof Server / local prover
      const proof = await zkProver.generateEligibilityProof(
        credentials,
        tournament.requirements,
        playerProfile?.personalInfo,
        authState.unshieldedAddress || undefined
      );

      setProofResult(proof);
      if (onProofGenerated) {
        onProofGenerated(proof);
      }
    } catch (err: any) {
      console.error('ZK proof generation failed:', err);
      setError(err?.message || 'Failed to generate Zero-Knowledge eligibility proof.');
    } finally {
      setProving(false);
    }
  };

  const handleJoinTournament = async () => {
    if (!proofResult) {
      setError('Generate a Zero-Knowledge proof first.');
      return;
    }

    if (!credentials) {
      setError('Player credentials not found.');
      return;
    }

    try {
      setJoining(true);
      setError(null);
      await submitApplication({
        tournamentId: tournament.id,
        playerWalletAddress: authState.unshieldedAddress || '',
        anonymousPlayerId: playerProfile?.anonymousId || 'PR-ANON',
        gamingCredentials: credentials,
        proof: proofResult as any
      });
      if (onJoinSuccess) {
        onJoinSuccess();
      }
    } catch (err: any) {
      console.error('Join tournament transaction failed:', err);
      setError(err?.message || 'Transaction rejected or failed on Midnight Preprod.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        borderRadius: '16px',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(0, 242, 254, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative gradient blur */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,242,254,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(121, 40, 202, 0.2) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(0, 242, 254, 0.3)'
          }}
        >
          <Shield size={20} color="#00f2fe" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
            Zero-Knowledge Eligibility Prover
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
            Prove you meet the entry requirements without revealing your personal identity.
          </p>
        </div>
      </div>

      {/* Requirements Matrix */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <div
          style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: `1px solid ${meetsRank ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Minimum Rank</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: meetsRank ? '#10b981' : '#f87171' }}>
            Tier {tournament.requirements.minimumRank}+
          </div>
          <div style={{ fontSize: '0.75rem', color: meetsRank ? '#34d399' : '#94a3b8', marginTop: '2px' }}>
            {credentials ? `Your Rank: Tier ${credentials.rank}` : 'Connect Wallet'}
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: `1px solid ${meetsScore ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Minimum Score</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: meetsScore ? '#10b981' : '#f87171' }}>
            {tournament.requirements.minimumScore.toLocaleString()}+
          </div>
          <div style={{ fontSize: '0.75rem', color: meetsScore ? '#34d399' : '#94a3b8', marginTop: '2px' }}>
            {credentials ? `Your Score: ${credentials.score.toLocaleString()}` : 'Connect Wallet'}
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: `1px solid ${meetsWins ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Minimum Wins</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: meetsWins ? '#10b981' : '#f87171' }}>
            {tournament.requirements.minimumWins}+ Wins
          </div>
          <div style={{ fontSize: '0.75rem', color: meetsWins ? '#34d399' : '#94a3b8', marginTop: '2px' }}>
            {credentials ? `Your Wins: ${credentials.wins}` : 'Connect Wallet'}
          </div>
        </div>
      </div>

      {/* Proof Result Box */}
      {proofResult && (
        <div
          style={{
            padding: '14px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            marginBottom: '18px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
            <CheckCircle2 size={16} />
            <span>Zero-Knowledge Proof Generated & Verified</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'var(--font-mono, monospace)' }}>
            Proof Hash: {proofResult.proofHash.slice(0, 32)}...
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Circuit: joinTournament • Protocol: Midnight Compact ZKIR • Status: Cryptographically Valid
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {!proofResult ? (
          <button
            onClick={handleProveEligibility}
            disabled={proving || !isEligible || !authState.isConnected}
            className="btn-primary"
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: isEligible
                ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)'
                : 'rgba(255, 255, 255, 0.1)',
              color: isEligible ? '#040d1a' : '#64748b',
              cursor: isEligible && !proving ? 'pointer' : 'not-allowed'
            }}
          >
            {proving ? <Cpu className="animate-spin" size={18} /> : <Sparkles size={18} />}
            <span>{proving ? 'Computing ZK Proof...' : 'Generate Zero-Knowledge Proof'}</span>
          </button>
        ) : (
          <button
            onClick={handleJoinTournament}
            disabled={joining}
            className="btn-primary"
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              cursor: joining ? 'wait' : 'pointer'
            }}
          >
            <Lock size={18} />
            <span>{joining ? 'Signing in 1AM Wallet...' : 'Register Anonymously on Midnight Preprod'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TournamentEligibility;
