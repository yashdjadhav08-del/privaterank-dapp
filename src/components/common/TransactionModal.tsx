import React, { useState } from 'react';
import { TransactionProgress, TransactionReceipt } from '../../types';
import { shortenAddress } from '../../utils/crypto';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  FileText, 
  Radio, 
  Layers,
  ArrowRight
} from 'lucide-react';

interface TransactionModalProps {
  progress: TransactionProgress | null;
  receipt?: TransactionReceipt | null;
  onClose: () => void;
  onRetry?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  progress,
  receipt,
  onClose,
  onRetry
}) => {
  const [copied, setCopied] = useState(false);

  if (!progress || progress.status === 'IDLE') return null;

  const isConfirmed = progress.status === 'CONFIRMED';
  const isRejected = progress.status === 'REJECTED';
  const isFailed = progress.status === 'FAILED';
  const isPending = !isConfirmed && !isRejected && !isFailed;

  const steps = [
    { num: 1, label: 'Prepare Tx', desc: 'Serialize Midnight contract payload' },
    { num: 2, label: '1AM Approval', desc: 'Sign in 1AM Wallet extension' },
    { num: 3, label: 'Broadcast', desc: 'Submit to Midnight Preprod RPC' },
    { num: 4, label: 'Block Inclusion', desc: 'Validate ZK state commitment' },
    { num: 5, label: 'Confirmed', desc: 'Recorded on Midnight ledger' }
  ];

  const handleCopyTx = () => {
    const hash = progress.txHash || receipt?.txHash;
    if (hash) {
      navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTitle = () => {
    const typeLabel = progress.type.replace(/_/g, ' ');
    if (isConfirmed) return `${typeLabel} Confirmed!`;
    if (isRejected) return 'Transaction Cancelled';
    if (isFailed) return 'Transaction Failed';
    return `Processing ${typeLabel}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(5, 8, 16, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '28px',
          borderRadius: '16px',
          border: isConfirmed
            ? '1px solid rgba(16, 185, 129, 0.4)'
            : isRejected || isFailed
            ? '1px solid rgba(239, 68, 68, 0.4)'
            : '1px solid rgba(0, 242, 254, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isConfirmed ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '12px' }}>
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>
          ) : isRejected || isFailed ? (
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '12px' }}>
              <XCircle size={28} className="text-rose-400" />
            </div>
          ) : (
            <div style={{ background: 'rgba(0, 242, 254, 0.15)', padding: '10px', borderRadius: '12px' }}>
              <Loader2 size={28} className="text-cyan-400 animate-spin" />
            </div>
          )}

          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', textTransform: 'capitalize' }}>
              {getTitle()}
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} className="text-cyan-400" />
              Midnight Preprod Testnet • 1AM Wallet
            </div>
          </div>
        </div>

        {/* 5-Step Lifecycle Progress Tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {steps.map(s => {
              const isCurrent = progress.step === s.num && isPending;
              const isDone = progress.step > s.num || (progress.step === s.num && isConfirmed);
              const isError = (isRejected || isFailed) && progress.step === s.num;

              return (
                <div
                  key={s.num}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: isDone
                        ? '#10b981'
                        : isError
                        ? '#ef4444'
                        : isCurrent
                        ? '#00f2fe'
                        : 'rgba(255, 255, 255, 0.1)',
                      boxShadow: isCurrent ? '0 0 10px rgba(0, 242, 254, 0.6)' : isDone ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: isDone ? '#34d399' : isCurrent ? '#00f2fe' : isError ? '#f87171' : '#64748b',
                      textAlign: 'center'
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.85rem',
              color: isRejected || isFailed ? '#f87171' : isConfirmed ? '#34d399' : '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {isPending && <Loader2 size={16} className="animate-spin text-cyan-400 shrink-0" />}
            {isConfirmed && <Check size={16} className="text-emerald-400 shrink-0" />}
            {isRejected && <XCircle size={16} className="text-rose-400 shrink-0" />}
            <span>{progress.message || (isConfirmed ? 'All on-chain commitments verified.' : 'Processing...')}</span>
          </div>
        </div>

        {/* Transaction Metadata Card */}
        {(progress.txHash || receipt?.txHash) && (
          <div
            style={{
              padding: '14px',
              background: 'rgba(10, 15, 26, 0.8)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Transaction Hash:</span>
              <button
                onClick={handleCopyTx}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copied ? '#34d399' : '#00f2fe',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: '#00f2fe',
                wordBreak: 'break-all',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '6px 10px',
                borderRadius: '6px'
              }}
            >
              {progress.txHash || receipt?.txHash}
            </div>

            {receipt && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '4px', fontSize: '0.75rem' }}>
                <div style={{ color: '#94a3b8' }}>
                  Block Height: <strong style={{ color: '#f8fafc' }}>#{receipt.blockHeight}</strong>
                </div>
                <div style={{ color: '#94a3b8', textAlign: 'right' }}>
                  Gas: <strong style={{ color: '#fbbf24' }}>{receipt.gasFee}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rejection / Error Message */}
        {progress.error && (
          <div
            style={{
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#fca5a5'
            }}
          >
            {progress.error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          {(isRejected || isFailed) && onRetry && (
            <button
              onClick={onRetry}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              Retry Transaction
            </button>
          )}

          {(isConfirmed || isRejected || isFailed) && (
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '8px 20px', fontSize: '0.85rem' }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
