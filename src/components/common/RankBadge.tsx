import React from 'react';
import { RankTier, RANK_NAMES } from '../../types';
import { Trophy, Shield, Flame, Crown, Zap, Award } from 'lucide-react';

interface RankBadgeProps {
  rank?: RankTier | number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank = RankTier.BRONZE, size = 'md', showIcon = true }) => {
  const safeRank = (rank && rank in RANK_NAMES) ? (rank as RankTier) : RankTier.BRONZE;
  const name = RANK_NAMES[safeRank] || 'Unranked';

  const getRankStyle = () => {
    switch (safeRank) {
      case RankTier.BRONZE:
        return {
          bg: 'bg-amber-950/40',
          text: 'text-amber-500',
          border: 'border-amber-700/50',
          glow: 'rgba(217, 119, 6, 0.2)',
          icon: <Shield size={size === 'lg' ? 20 : size === 'sm' ? 12 : 15} />
        };
      case RankTier.SILVER:
        return {
          bg: 'bg-slate-800/50',
          text: 'text-slate-300',
          border: 'border-slate-500/50',
          glow: 'rgba(148, 163, 184, 0.2)',
          icon: <Shield size={size === 'lg' ? 20 : size === 'sm' ? 12 : 15} />
        };
      case RankTier.GOLD:
        return {
          bg: 'bg-yellow-950/40',
          text: 'text-yellow-400',
          border: 'border-yellow-600/50',
          glow: 'rgba(234, 179, 8, 0.3)',
          icon: <Award size={size === 'lg' ? 20 : size === 'sm' ? 12 : 15} />
        };
      case RankTier.PLATINUM:
        return {
          bg: 'bg-teal-950/40',
          text: 'text-teal-300',
          border: 'border-teal-500/50',
          glow: 'rgba(20, 184, 166, 0.35)',
          icon: <Zap size={size === 'lg' ? 20 : size === 'sm' ? 12 : 15} />
        };
      case RankTier.DIAMOND:
        return {
          bg: 'bg-cyan-950/50',
          text: 'text-cyan-300',
          border: 'border-cyan-400/60',
          glow: 'rgba(6, 182, 212, 0.45)',
          icon: <Trophy size={size === 'lg' ? 20 : size === 'sm' ? 12 : 15} />
        };
      case RankTier.MASTER:
        return {
          bg: 'bg-purple-950/50',
          text: 'text-purple-300',
          border: 'border-purple-400/60',
          glow: 'rgba(168, 85, 247, 0.45)',
          icon: <Flame size={size === 'lg' ? 20 : size === 'sm' ? 12 : 15} />
        };
      case RankTier.GRANDMASTER:
        return {
          bg: 'bg-rose-950/60',
          text: 'text-rose-300',
          border: 'border-rose-400/70',
          glow: 'rgba(244, 63, 94, 0.5)',
          icon: <Crown size={size === 'lg' ? 20 : size === 'sm' ? 12 : 15} />
        };
      default:
        return {
          bg: 'bg-slate-800/40',
          text: 'text-slate-300',
          border: 'border-slate-600/50',
          glow: 'rgba(148, 163, 184, 0.2)',
          icon: <Shield size={size === 'lg' ? 20 : size === 'sm' ? 12 : 15} />
        };
    }
  };

  const style = getRankStyle();
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm font-semibold',
    lg: 'px-4 py-1.5 text-base font-bold'
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}
      style={{ boxShadow: `0 0 10px ${style.glow}` }}
    >
      {showIcon && style.icon}
      <span>{name} (Tier {safeRank})</span>
    </span>
  );
};
