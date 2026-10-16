// ──────────────────────────────────────────────────
// components/StatusBadge.tsx
// ──────────────────────────────────────────────────
'use client';

import { Clock, ShieldAlert, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WaterStatus } from '@/types';

interface StatusBadgeProps {
  status: WaterStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  isStale?: boolean;
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

const iconSizes = { sm: 12, md: 14, lg: 16 };

export default function StatusBadge({
  status,
  size = 'md',
  showIcon = true,
  isStale = false,
}: StatusBadgeProps) {
  if (isStale) {
    return (
      <span
        className={cn(
          'inline-flex items-center font-semibold rounded-full border',
          'bg-slate-500/20 text-slate-400 border-slate-500/40',
          sizeClasses[size],
        )}
      >
        {showIcon && <Clock size={iconSizes[size]} />}
        STALE
      </span>
    );
  }

  const variants: Record<string, { classes: string; label: string; Icon: React.ElementType }> = {
    SAFE: {
      classes: 'bg-green-500/20 text-green-400 border-green-500/40',
      label: 'SAFE',
      Icon: ShieldCheck,
    },
    WARNING: {
      classes: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      label: 'WARNING',
      Icon: AlertTriangle,
    },
    DANGER: {
      classes: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse',
      label: 'DANGER',
      Icon: ShieldAlert,
    },
    INVALID: {
      classes: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
      label: 'INVALID',
      Icon: HelpCircle,
    },
    UNKNOWN: {
      classes: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
      label: 'UNKNOWN',
      Icon: HelpCircle,
    },
  };

  const variant = variants[status] ?? variants.UNKNOWN;
  const { classes, label, Icon } = variant;

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border',
        classes,
        sizeClasses[size],
      )}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      {label}
    </span>
  );
}
