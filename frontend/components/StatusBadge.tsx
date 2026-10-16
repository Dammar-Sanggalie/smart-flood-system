// ──────────────────────────────────────────────────
// components/StatusBadge.tsx — Minimalist Status Badge
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
  sm: 'text-[11px] px-2 py-0.5 gap-1.5',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
};

const iconSizes = { sm: 12, md: 13, lg: 15 };

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
          'inline-flex items-center font-medium rounded-md border',
          'bg-slate-50 text-slate-600 border-slate-200',
          sizeClasses[size],
        )}
      >
        {showIcon && <Clock size={iconSizes[size]} className="text-slate-400" />}
        <span className="font-semibold tracking-wide">STALE</span>
      </span>
    );
  }

  const variants: Record<
    string,
    { classes: string; dot: string; label: string; Icon: React.ElementType }
  > = {
    SAFE: {
      classes: 'bg-emerald-50/70 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'SAFE',
      Icon: ShieldCheck,
    },
    WARNING: {
      classes: 'bg-amber-50/70 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      label: 'WARNING',
      Icon: AlertTriangle,
    },
    DANGER: {
      classes: 'bg-rose-50/80 text-rose-800 border-rose-200 animate-pulse',
      dot: 'bg-rose-500',
      label: 'DANGER',
      Icon: ShieldAlert,
    },
    INVALID: {
      classes: 'bg-slate-50 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
      label: 'INVALID',
      Icon: HelpCircle,
    },
    UNKNOWN: {
      classes: 'bg-slate-50 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
      label: 'UNKNOWN',
      Icon: HelpCircle,
    },
  };

  const variant = variants[status] ?? variants.UNKNOWN;
  const { classes, dot, label, Icon } = variant;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md border tracking-wide',
        classes,
        sizeClasses[size],
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
      {showIcon && <Icon size={iconSizes[size]} />}
      <span className="font-semibold">{label}</span>
    </span>
  );
}
