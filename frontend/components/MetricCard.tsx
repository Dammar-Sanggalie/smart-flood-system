// ──────────────────────────────────────────────────
// components/MetricCard.tsx — High-Precision Metric Card
// ──────────────────────────────────────────────────
'use client';

import type { LucideIcon } from 'lucide-react';
import { cn, getStatusColor } from '@/lib/utils';
import type { WaterStatus } from '@/types';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  status?: WaterStatus | string;
  subtext?: string;
  isInvalid?: boolean;
  highlight?: boolean;
  progressPercent?: number;
}

export default function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  status,
  subtext,
  isInvalid = false,
  highlight = false,
  progressPercent,
}: MetricCardProps) {
  const valueColor = status && !isInvalid ? getStatusColor(status) : 'text-slate-900';

  return (
    <div
      className={cn(
        'group relative bg-white rounded-xl border border-slate-200/80 p-4',
        'flex flex-col justify-between overflow-hidden transition-all duration-200',
        'hover:border-slate-300 hover:shadow-card',
        highlight && 'ring-1 ring-sky-500/30 border-sky-300',
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-700 transition-colors">
          <Icon size={14} />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-1 my-1">
        <span
          className={cn(
            'text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums transition-colors',
            isInvalid ? 'text-slate-300' : valueColor,
          )}
        >
          {isInvalid ? '—' : value}
        </span>
        {unit && !isInvalid && (
          <span className="text-xs font-semibold text-slate-400 font-sans">{unit}</span>
        )}
      </div>

      {/* Optional Progress Mini-bar */}
      {typeof progressPercent === 'number' && !isInvalid && (
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 mb-1.5">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              status === 'DANGER'
                ? 'bg-rose-500'
                : status === 'WARNING'
                ? 'bg-amber-500'
                : 'bg-sky-500',
            )}
            style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
          />
        </div>
      )}

      {/* Subtext info */}
      {subtext && (
        <div className="pt-2 mt-auto border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="truncate">{subtext}</span>
        </div>
      )}
    </div>
  );
}
