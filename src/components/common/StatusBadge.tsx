import React from 'react';
import { ApplicationStatus, TournamentStatus } from '../../types';
import { CheckCircle2, Clock, XCircle, ShieldAlert, Sparkles, Lock, FileCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: TournamentStatus | ApplicationStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'OPEN':
      return (
        <span className={`badge bg-emerald-950/50 text-emerald-400 border border-emerald-500/40 shadow-sm ${className}`}>
          <Sparkles size={12} className="text-emerald-400" />
          OPEN
        </span>
      );
    case 'DRAFT':
      return (
        <span className={`badge bg-slate-800/60 text-slate-300 border border-slate-600/40 ${className}`}>
          <Clock size={12} className="text-slate-400" />
          DRAFT
        </span>
      );
    case 'CLOSED':
      return (
        <span className={`badge bg-zinc-900/60 text-zinc-400 border border-zinc-700/40 ${className}`}>
          <Lock size={12} className="text-zinc-400" />
          CLOSED
        </span>
      );
    case 'APPROVED':
      return (
        <span className={`badge bg-emerald-950/60 text-emerald-300 border border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.25)] ${className}`}>
          <CheckCircle2 size={12} className="text-emerald-400" />
          APPROVED ✓
        </span>
      );
    case 'REJECTED':
      return (
        <span className={`badge bg-rose-950/60 text-rose-300 border border-rose-500/50 ${className}`}>
          <XCircle size={12} className="text-rose-400" />
          REJECTED
        </span>
      );
    case 'PENDING_REVIEW':
      return (
        <span className={`badge bg-amber-950/50 text-amber-300 border border-amber-500/40 ${className}`}>
          <Clock size={12} className="text-amber-400 animate-pulse" />
          PENDING REVIEW
        </span>
      );
    case 'PROOF_VERIFIED':
      return (
        <span className={`badge bg-cyan-950/60 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)] ${className}`}>
          <FileCheck size={12} className="text-cyan-400" />
          PROOF VERIFIED ✓
        </span>
      );
    default:
      return (
        <span className={`badge bg-slate-800 text-slate-300 border border-slate-700 ${className}`}>
          {status}
        </span>
      );
  }
};
