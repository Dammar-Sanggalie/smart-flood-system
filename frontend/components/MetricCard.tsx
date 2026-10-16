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
  iconBgClass?: string;
  iconColorClass?: string;
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
  iconBgClass = 'bg-slate-50 border-slate-100',
  iconColorClass = 'text-slate-500',
}: MetricCardProps) {
  const valueColor = status && !isInvalid ? getStatusColor(status) : 'text-slate-900';

  return (
    <div
      className={cn(
        'group relative bg-white rounded-2xl border border-slate-200/80 p-5',
        'flex flex-col justify-between overflow-hidden transition-all duration-200 shadow-soft',
        'hover:border-slate-300 hover:shadow-card-hover',
        highlight && 'ring-2 ring-sky-500/20 border-sky-300',
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div
          className={cn(
            'w-8 h-8 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 shrink-0',
            iconBgClass,
            iconColorClass,
          )}
        >
          <Icon size={15} />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-1.5 my-1.5">
        <span
          className={cn(
            'text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums transition-colors',
            isInvalid ? 'text-slate-300' : valueColor,
          )}
        >
          {isInvalid ? '—' : value}
        </span>
        {unit && !isInvalid && (
          <span className="text-xs font-bold text-slate-400 font-sans">{unit}</span>
        )}
      </div>

      {/* Optional Progress Mini-bar */}
      {typeof progressPercent === 'number' && !isInvalid && (
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1 mb-2">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              status === 'DANGER'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                : status === 'WARNING'
                ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                : 'bg-gradient-to-r from-cyan-400 to-sky-600',
            )}
            style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
          />
        </div>
      )}

      {/* Subtext info */}
      {subtext && (
        <div className="pt-2.5 mt-auto border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="truncate">{subtext}</span>
        </div>
      )}
    </div>
  );
}
