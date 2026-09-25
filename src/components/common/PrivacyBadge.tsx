import React from 'react';
import { Lock, Eye, ShieldCheck } from 'lucide-react';

interface PrivacyBadgeProps {
  type: 'PRIVATE' | 'SHAREABLE' | 'ZK_PROVED';
  label?: string;
  className?: string;
}

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({ type, label, className = '' }) => {
  if (type === 'PRIVATE') {
    return (
      <span className={`badge badge-private inline-flex items-center gap-1.5 ${className}`}>
        <Lock size={12} className="text-red-400" />
        <span>{label || 'PRIVATE 🔒'}</span>
      </span>
    );
  }

  if (type === 'SHAREABLE') {
    return (
      <span className={`badge badge-shareable inline-flex items-center gap-1.5 ${className}`}>
        <Eye size={12} className="text-emerald-400" />
        <span>{label || 'SHAREABLE FOR TOURNAMENT EVALUATION 🌐'}</span>
      </span>
    );
  }

  return (
    <span className={`badge badge-verified inline-flex items-center gap-1.5 ${className}`}>
      <ShieldCheck size={12} className="text-cyan-400" />
      <span>{label || 'ZK VERIFIED 🛡️'}</span>
    </span>
  );
};
