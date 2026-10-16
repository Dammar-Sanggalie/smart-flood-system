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
      <span className={cn('inline-flex items-center font-semibold rounded-full border', 'bg-slate-100 text-slate-500 border-slate-200', sizeClasses[size])}>
        {showIcon && <Clock size={iconSizes[size]} />}
        STALE
      </span>
    );
  }

  const variants: Record<string, { classes: string; label: string; Icon: React.ElementType }> = {
    SAFE: { classes: 'bg-green-50 text-green-600 border-green-200', label: 'SAFE', Icon: ShieldCheck },
    WARNING: { classes: 'bg-amber-50 text-amber-600 border-amber-200', label: 'WARNING', Icon: AlertTriangle },
    DANGER: { classes: 'bg-red-50 text-red-600 border-red-200 animate-pulse', label: 'DANGER', Icon: ShieldAlert },
    INVALID: { classes: 'bg-slate-100 text-slate-500 border-slate-200', label: 'INVALID', Icon: HelpCircle },
    UNKNOWN: { classes: 'bg-slate-100 text-slate-500 border-slate-200', label: 'UNKNOWN', Icon: HelpCircle },
  };

  const variant = variants[status] ?? variants.UNKNOWN;
  const { classes, label, Icon } = variant;

  return (
    <span className={cn('inline-flex items-center font-semibold rounded-full border', classes, sizeClasses[size])}>
      {showIcon && <Icon size={iconSizes[size]} />}
      {label}
    </span>
  );
}
