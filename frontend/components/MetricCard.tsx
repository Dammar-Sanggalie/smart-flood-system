// ──────────────────────────────────────────────────
// components/MetricCard.tsx
// ──────────────────────────────────────────────────
'use client';

import type { LucideIcon } from 'lucide-react';
import { cn, getStatusBorderColor, getStatusColor } from '@/lib/utils';
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
}: MetricCardProps) {
  const borderColor = status ? getStatusBorderColor(status) : 'border-transparent';
  const valueColor = status && !isInvalid ? getStatusColor(status) : 'text-slate-900';

  return (
    <div
      className={cn(
        'relative bg-white rounded-xl border border-bg-border',
        'p-3.5 flex flex-col gap-1 overflow-hidden transition-all duration-200',
        'hover:shadow-sm hover:border-slate-300',
        'border-l-[3px]',
        borderColor,
        highlight && 'ring-1 ring-cyan-500/20',
      )}
    >
      <div className="absolute top-2.5 right-2.5 text-slate-300">
        <Icon size={16} />
      </div>

      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider pr-6">
        {label}
      </p>

      <div className="flex items-baseline gap-1 mt-0.5">
        <span
          className={cn(
            'text-xl font-bold tracking-tight transition-colors duration-300',
            isInvalid ? 'text-slate-300' : valueColor,
          )}
        >
          {isInvalid ? '—' : value}
        </span>
        {unit && !isInvalid && (
          <span className="text-xs text-slate-400 font-medium">{unit}</span>
        )}
      </div>

      {subtext && (
        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{subtext}</p>
      )}
    </div>
  );
}
