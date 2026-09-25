import React from 'react';
import { Modal } from './Modal';
import { ZKProofPayload } from '../../types';
import { ShieldCheck, Cpu, Key, Database, CheckCircle2 } from 'lucide-react';
import { RankBadge } from './RankBadge';

interface ProofInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  proof: ZKProofPayload | null;
}

export const ProofInspectorModal: React.FC<ProofInspectorModalProps> = ({
  isOpen,
  onClose,
  proof
}) => {
  if (!proof) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Zero-Knowledge Proof: ${proof.proofId}`} maxWidth="xl">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Verification Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(16, 185, 129, 0.15))',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <ShieldCheck size={28} className="text-cyan-400" />
          <div>
            <div style={{ fontWeight: 700, color: '#22d3ee', fontSize: '0.95rem' }}>
              Midnight Compact ZK-Proof Verified ✓
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              Proves tournament eligibility without disclosing off-chain personal identity.
            </div>
          </div>
        </div>

        {/* Prover Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div className="glass-panel" style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.6)' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={14} className="text-cyan-400" />
              Anonymous Player ID
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px' }}>
              {proof.anonymousPlayerId}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.6)' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} className="text-purple-400" />
              Proof Protocol
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#c084fc', marginTop: '4px' }}>
              {proof.zkSnarkProof?.protocol || 'Midnight-ZK-Plonk-v2'}
            </div>
          </div>
        </div>

        {/* Public Circuit Constraints */}
        <div className="glass-panel" style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.6)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f8fafc', marginBottom: '10px' }}>
            Verified Circuit Constraints
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
              <span style={{ color: '#94a3b8' }}>Rank Requirement:</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Rank ≥ Tier {proof.publicInputs.minRank} (Satisfied)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
              <span style={{ color: '#94a3b8' }}>Score Requirement:</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Score ≥ {proof.publicInputs.minScore} (Satisfied)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
              <span style={{ color: '#94a3b8' }}>Wins Requirement:</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Wins ≥ {proof.publicInputs.minWins} (Satisfied)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
              <span style={{ color: '#94a3b8' }}>Personal Identity Disclosure:</span>
              <span style={{ color: '#f87171', fontWeight: 600 }}>
                🔒 0% Disclosed (Fully Protected)
              </span>
            </div>
          </div>
        </div>

        {/* Cryptographic Hashes */}
        <div className="glass-panel" style={{ padding: '14px', background: 'rgba(10, 15, 30, 0.9)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={14} className="text-cyan-400" />
            Midnight On-Chain Commitment & Nullifier Hashes
          </div>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#67e8f9', wordBreak: 'break-all', marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Commitment: </span>{proof.commitmentHash}
          </div>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#c084fc', wordBreak: 'break-all' }}>
            <span style={{ color: '#94a3b8' }}>Nullifier: </span>{proof.nullifierHash}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
            Close Inspector
          </button>
        </div>
      </div>
    </Modal>
  );
};
