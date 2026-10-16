// ──────────────────────────────────────────────────
// components/TankVisualization.tsx — Dynamic wrapper
// for the 3D R3F tank scene (SSR disabled)
// ──────────────────────────────────────────────────
'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { RotateCcw, AlertTriangle, Clock, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusBadge from './StatusBadge';
import type { SensorReading, TankConfig, WaterStatus } from '@/types';

const TankScene = dynamic(() => import('./TankScene'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
      <div className="flex flex-col items-center gap-2">
        <div className="w-7 h-7 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        <span className="text-xs">Loading 3D view…</span>
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

  return (
    <div className="bg-white rounded-xl border border-bg-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-bg-border">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-800">
            Tank Visualization
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
            <span className="text-[10px] text-slate-400 hidden sm:block font-mono">
              {config.lengthCm}×{config.widthCm}×{config.depthCm}cm
            </span>
          )}
          <button
            onClick={handleReset}
            title="Reset camera"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-bg-hover transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="relative" style={{ height: '360px' }}>
        <div
          key={resetKey}
          className="w-full h-full"
          style={{
            background: 'radial-gradient(ellipse at center, #e0f2fe 0%, #f1f5f9 70%)',
          }}
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

        {!reading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="text-center space-y-1.5">
              <div className="text-slate-500 text-sm font-medium">
                Waiting for first reading…
              </div>
              <div className="text-slate-400 text-xs">
                Tank will animate once data is received
              </div>
            </div>
          </div>
        )}

        {reading && !sensorValid && !isStale && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-2 text-center">
              <AlertTriangle size={28} className="text-slate-400" />
              <span className="text-slate-700 font-medium text-sm">
                Sensor Invalid
              </span>
              <span className="text-slate-400 text-xs">
                Cannot read water level
              </span>
            </div>
          </div>
        )}

        {reading && isStale && (
          <div className="absolute inset-0 flex items-center justify-center bg-amber-50/60 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-2 text-center">
              <Clock size={28} className="text-amber-500" />
              <span className="text-amber-700 font-medium text-sm">
                Data Stale
              </span>
              <span className="text-amber-600/70 text-xs">
                No recent readings
              </span>
            </div>
          </div>
        )}

        {reading && sensorValid && !isStale && (
          <div className="absolute bottom-2.5 left-2.5 bg-white/85 rounded-lg px-2.5 py-1.5 backdrop-blur-sm border border-bg-border">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all duration-500',
                  status === 'DANGER'
                    ? 'bg-red-500'
                    : status === 'WARNING'
                    ? 'bg-amber-500'
                    : 'bg-cyan-500',
                )}
                style={{ width: `${Math.max(fillPercentage, 2)}px`, maxWidth: '70px' }}
              />
              <span className="text-xs font-bold text-slate-900">
                {fillPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {reading && sensorValid && !isStale && (
          <div className="absolute top-2.5 right-2.5 text-[10px] text-slate-400 flex items-center gap-1">
            <Maximize2 size={10} />
            Drag to rotate
          </div>
        )}
      </div>
    </div>
  );
}
