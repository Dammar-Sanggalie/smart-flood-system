// ──────────────────────────────────────────────────
// components/TankVisualization.tsx — Dynamic wrapper
// for the 3D R3F tank scene (SSR disabled)
// ──────────────────────────────────────────────────
'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { RotateCcw, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusBadge from './StatusBadge';
import type { SensorReading, TankConfig, WaterStatus } from '@/types';

// Load the heavy 3D scene with no SSR
const TankScene = dynamic(() => import('./TankScene'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading 3D visualization…</span>
      </div>
    </div>
  ),
});

interface TankVisualizationProps {
  reading: SensorReading | null;
  config: TankConfig | null;
}

const DEFAULT_CONFIG: TankConfig = {
  lengthCm: 100,
  widthCm: 60,
  depthCm: 80,
  sensorHeightCm: 90,
  warnThresholdPercent: 60,
  dangerThresholdPercent: 85,
  staleTimeoutSeconds: 30,
};

export default function TankVisualization({
  reading,
  config,
}: TankVisualizationProps) {
  const [resetKey, setResetKey] = useState(0);

  const tankConfig = config ?? DEFAULT_CONFIG;
  const sensorValid = reading?.sensorValid ?? false;
  const isStale = reading?.isStale ?? false;
  const fillPercentage = sensorValid && !isStale ? (reading?.fillPercentage ?? 0) : 0;
  const waterLevelCm = sensorValid && !isStale ? (reading?.waterLevelCm ?? 0) : 0;
  const distanceCm = reading?.distanceCm ?? 0;
  const status: WaterStatus = reading?.calculatedStatus ?? 'UNKNOWN';

  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  const showOverlay = !reading || !sensorValid || isStale;

  return (
    <div className="bg-bg-card rounded-xl border border-bg-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-300">
            3D Tank Visualization
          </h2>
          {reading && (
            <StatusBadge
              status={isStale ? 'INVALID' : status}
              isStale={isStale}
              size="sm"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {config && (
            <span className="text-xs text-slate-500 hidden sm:block">
              {config.lengthCm}×{config.widthCm}×{config.depthCm} cm
            </span>
          )}
          <button
            onClick={handleReset}
            title="Reset camera"
            className={cn(
              'p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-bg-border',
              'transition-colors duration-150',
            )}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="relative" style={{ height: '380px' }}>
        <div
          key={resetKey}
          className="w-full h-full bg-gradient-to-b from-slate-900 to-bg-dark"
        >
          <TankScene
            distanceCm={distanceCm}
            waterLevelCm={waterLevelCm}
            fillPercentage={fillPercentage}
            tankConfig={tankConfig}
            sensorValid={sensorValid}
            isStale={isStale}
            status={status}
          />
        </div>

        {/* Overlay: No reading */}
        {!reading && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-dark/70 backdrop-blur-sm">
            <div className="text-center space-y-2">
              <div className="text-slate-400 text-sm font-medium">
                Waiting for first reading…
              </div>
              <div className="text-slate-600 text-xs">
                Tank will animate once data is received
              </div>
            </div>
          </div>
        )}

        {/* Overlay: Sensor invalid */}
        {reading && !sensorValid && !isStale && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-dark/60 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-2 text-center">
              <AlertTriangle size={32} className="text-slate-400" />
              <span className="text-slate-300 font-semibold text-sm">
                Sensor Invalid
              </span>
              <span className="text-slate-500 text-xs">
                Cannot read water level — check sensor
              </span>
            </div>
          </div>
        )}

        {/* Overlay: Data stale */}
        {reading && isStale && (
          <div className="absolute inset-0 flex items-center justify-center bg-amber-950/40 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-2 text-center">
              <Clock size={32} className="text-amber-400" />
              <span className="text-amber-300 font-semibold text-sm">
                Data Stale
              </span>
              <span className="text-amber-500/80 text-xs">
                No new readings — check device connection
              </span>
            </div>
          </div>
        )}

        {/* Fill % corner badge */}
        {reading && sensorValid && !isStale && (
          <div className="absolute bottom-3 left-3 bg-bg-dark/80 rounded-lg px-2.5 py-1.5 backdrop-blur-sm border border-bg-border">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all duration-500',
                  status === 'DANGER'
                    ? 'bg-red-500'
                    : status === 'WARNING'
                    ? 'bg-amber-500'
                    : 'bg-blue-500',
                )}
                style={{ width: `${Math.max(fillPercentage, 2)}px`, maxWidth: '80px' }}
              />
              <span className="text-xs font-bold text-white">
                {fillPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
