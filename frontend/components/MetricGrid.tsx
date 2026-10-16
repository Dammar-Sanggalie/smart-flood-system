// ──────────────────────────────────────────────────
// components/MetricGrid.tsx — Telemetry Metric Grid
// ──────────────────────────────────────────────────
'use client';

import {
  Ruler,
  Droplets,
  Percent,
  FlaskConical,
  Database,
  ShieldAlert,
} from 'lucide-react';
import MetricCard from './MetricCard';
import { calculateCapacityLiters } from '@/lib/calculations';
import { formatNumber } from '@/lib/utils';
import type { SensorReading, TankConfig } from '@/types';

interface MetricGridProps {
  reading: SensorReading | null;
  config: TankConfig | null;
}

export default function MetricGrid({ reading, config }: MetricGridProps) {
  const isInvalid = !reading || !reading.sensorValid;
  const isStale = reading?.isStale ?? false;
  const showInvalid = isInvalid || isStale;

  const capacity = config
    ? calculateCapacityLiters(config.lengthCm, config.widthCm, config.depthCm)
    : null;

  const status = reading?.calculatedStatus ?? 'UNKNOWN';

  // Dynamic status icon colors
  const statusIconBg =
    status === 'DANGER'
      ? 'bg-rose-50 border-rose-200'
      : status === 'WARNING'
      ? 'bg-amber-50 border-amber-200'
      : 'bg-emerald-50 border-emerald-200';
  const statusIconColor =
    status === 'DANGER'
      ? 'text-rose-600'
      : status === 'WARNING'
      ? 'text-amber-600'
      : 'text-emerald-600';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
      {/* 1. Water Level */}
      <MetricCard
        label="Water Level"
        value={formatNumber(reading?.waterLevelCm, 1)}
        unit="cm"
        icon={Droplets}
        status={status}
        isInvalid={showInvalid}
        iconBgClass="bg-sky-50 border-sky-200/80"
        iconColorClass="text-sky-600"
        subtext={
          config
            ? `Target Depth: ${config.depthCm} cm`
            : undefined
        }
      />

      {/* 2. Fill Percentage */}
      <MetricCard
        label="Fill Capacity"
        value={formatNumber(reading?.fillPercentage, 1)}
        unit="%"
        icon={Percent}
        status={status}
        isInvalid={showInvalid}
        progressPercent={reading?.fillPercentage}
        iconBgClass="bg-indigo-50 border-indigo-200/80"
        iconColorClass="text-indigo-600"
        subtext={
          reading && !showInvalid
            ? `${formatNumber(reading.fillPercentage, 0)}% of total volume`
            : 'Pending telemetry'
        }
      />

      {/* 3. Surface Clearance */}
      <MetricCard
        label="Surface Clearance"
        value={formatNumber(reading?.distanceCm, 1)}
        unit="cm"
        icon={Ruler}
        isInvalid={showInvalid}
        iconBgClass="bg-cyan-50 border-cyan-200/80"
        iconColorClass="text-cyan-600"
        subtext={reading ? `Sensor HC-SR04` : undefined}
      />

      {/* 4. Current Volume */}
      <MetricCard
        label="Water Volume"
        value={formatNumber(reading?.volumeLiters, 1)}
        unit="L"
        icon={FlaskConical}
        isInvalid={showInvalid}
        iconBgClass="bg-blue-50 border-blue-200/80"
        iconColorClass="text-blue-600"
        subtext={
          capacity && reading?.volumeLiters
            ? `${formatNumber(capacity - reading.volumeLiters, 1)} L space left`
            : undefined
        }
      />

      {/* 5. Total Capacity */}
      <MetricCard
        label="Reservoir Size"
        value={capacity !== null ? formatNumber(capacity, 1) : '—'}
        unit="L"
        icon={Database}
        iconBgClass="bg-slate-100 border-slate-200"
        iconColorClass="text-slate-600"
        subtext={
          config
            ? `${config.lengthCm} × ${config.widthCm} × ${config.depthCm} cm`
            : undefined
        }
      />

      {/* 6. Flood Risk Status */}
      <MetricCard
        label="Flood Risk State"
        value={showInvalid ? (isStale ? 'STALE' : 'INVALID') : status}
        icon={ShieldAlert}
        status={showInvalid ? 'INVALID' : status}
        isInvalid={false}
        highlight={status === 'DANGER'}
        iconBgClass={statusIconBg}
        iconColorClass={statusIconColor}
        subtext={
          reading?.uptimeSeconds
            ? `Uptime: ${Math.floor(reading.uptimeSeconds / 3600)}h ${Math.floor((reading.uptimeSeconds % 3600) / 60)}m`
            : 'Watchdog active'
        }
      />
    </div>
  );
}
