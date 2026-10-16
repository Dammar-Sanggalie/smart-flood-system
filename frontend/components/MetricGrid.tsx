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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
      {/* 1. Water Level */}
      <MetricCard
        label="Water Level"
        value={formatNumber(reading?.waterLevelCm, 1)}
        unit="cm"
        icon={Droplets}
        status={status}
        isInvalid={showInvalid}
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
        subtext={
          reading && !showInvalid
            ? `${formatNumber(reading.fillPercentage, 0)}% of total volume`
            : 'Pending telemetry'
        }
      />

      {/* 3. Sensor Distance */}
      <MetricCard
        label="Surface Clearance"
        value={formatNumber(reading?.distanceCm, 1)}
        unit="cm"
        icon={Ruler}
        isInvalid={showInvalid}
        subtext={reading ? `Sensor HC-SR04: ${reading.deviceId}` : undefined}
      />

      {/* 4. Current Volume */}
      <MetricCard
        label="Water Volume"
        value={formatNumber(reading?.volumeLiters, 1)}
        unit="L"
        icon={FlaskConical}
        isInvalid={showInvalid}
        subtext={
          capacity && reading?.volumeLiters
            ? `${formatNumber(capacity - reading.volumeLiters, 1)} L remaining`
            : undefined
        }
      />

      {/* 5. Total Capacity */}
      <MetricCard
        label="Reservoir Size"
        value={capacity !== null ? formatNumber(capacity, 1) : '—'}
        unit="L"
        icon={Database}
        subtext={
          config
            ? `${config.lengthCm} × ${config.widthCm} × ${config.depthCm} cm`
            : undefined
        }
      />

      {/* 6. Flood Risk Status */}
      <MetricCard
        label="System Status"
        value={showInvalid ? (isStale ? 'STALE' : 'INVALID') : status}
        icon={ShieldAlert}
        status={showInvalid ? 'INVALID' : status}
        isInvalid={false}
        highlight={status === 'DANGER'}
        subtext={
          reading?.uptimeSeconds
            ? `Uptime: ${Math.floor(reading.uptimeSeconds / 3600)}h ${Math.floor((reading.uptimeSeconds % 3600) / 60)}m`
            : 'Monitoring active'
        }
      />
    </div>
  );
}
