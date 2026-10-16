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
  const valueColor = status && !isInvalid ? getStatusColor(status) : 'text-white';

  return (
    <div
      className={cn(
        'relative bg-bg-card rounded-xl border border-bg-border',
        'p-4 flex flex-col gap-1 overflow-hidden',
        'border-l-4',
        borderColor,
        highlight && 'ring-1 ring-blue-500/30',
      )}
    >
      {/* Icon */}
      <div className="absolute top-3 right-3 text-slate-500">
        <Icon size={18} />
      </div>

      {/* Label */}
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider pr-6">
        {label}
      </p>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span
          className={cn(
            'text-2xl font-bold tracking-tight transition-colors duration-300',
            isInvalid ? 'text-slate-600' : valueColor,
          )}
        >
          {isInvalid ? '—' : value}
        </span>
        {unit && !isInvalid && (
          <span className="text-sm text-slate-400 font-medium">{unit}</span>
        )}
      </div>

      {/* Subtext */}
      {subtext && (
        <p className="text-xs text-slate-500 mt-0.5">{subtext}</p>
      )}

      {/* Invalid overlay hint */}
      {isInvalid && (
        <p className="text-xs text-slate-600 mt-0.5">Sensor invalid</p>
      )}
    </div>
  );
}
