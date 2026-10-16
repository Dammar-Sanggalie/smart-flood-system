// ──────────────────────────────────────────────────
// components/MetricGrid.tsx
// ──────────────────────────────────────────────────
'use client';

import {
  Ruler,
  Droplets,
  Percent,
  FlaskConical,
  Database,
  AlertTriangle,
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

  const capacity =
    config
      ? calculateCapacityLiters(config.lengthCm, config.widthCm, config.depthCm)
      : null;

  const status = reading?.calculatedStatus ?? 'UNKNOWN';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {/* 1. Distance */}
      <MetricCard
        label="Sensor Distance"
        value={formatNumber(reading?.distanceCm, 1)}
        unit="cm"
        icon={Ruler}
        isInvalid={showInvalid}
        subtext={reading ? `Device: ${reading.deviceId}` : undefined}
      />

      {/* 2. Water Level */}
      <MetricCard
        label="Water Level"
        value={formatNumber(reading?.waterLevelCm, 1)}
        unit="cm"
        icon={Droplets}
        status={status}
        isInvalid={showInvalid}
      />

      {/* 3. Fill % */}
      <MetricCard
        label="Fill Level"
        value={formatNumber(reading?.fillPercentage, 1)}
        unit="%"
        icon={Percent}
        status={status}
        isInvalid={showInvalid}
        subtext={
          reading && !showInvalid
            ? `${formatNumber(reading.fillPercentage, 0)}% of capacity`
            : undefined
        }
      />

      {/* 4. Volume */}
      <MetricCard
        label="Current Volume"
        value={formatNumber(reading?.volumeLiters, 1)}
        unit="L"
        icon={FlaskConical}
        isInvalid={showInvalid}
      />

      {/* 5. Capacity */}
      <MetricCard
        label="Tank Capacity"
        value={capacity !== null ? formatNumber(capacity, 1) : '—'}
        unit="L"
        icon={Database}
        subtext={
          config
            ? `${config.lengthCm}×${config.widthCm}×${config.depthCm} cm`
            : undefined
        }
      />

      {/* 6. Status */}
      <MetricCard
        label="Alert Status"
        value={showInvalid ? (isStale ? 'STALE' : 'INVALID') : status}
        icon={AlertTriangle}
        status={showInvalid ? 'INVALID' : status}
        isInvalid={false}
        subtext={
          reading?.uptimeSeconds
            ? `Uptime: ${Math.floor(reading.uptimeSeconds / 3600)}h ${Math.floor((reading.uptimeSeconds % 3600) / 60)}m`
            : undefined
        }
        highlight={status === 'DANGER'}
      />
    </div>
  );
}
