// ──────────────────────────────────────────────────
// components/TankVisualization.tsx — Precision 3D Digital Twin
// ──────────────────────────────────────────────────
'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { RotateCcw, AlertTriangle, Clock, Compass, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusBadge from './StatusBadge';
import type { SensorReading, TankConfig, WaterStatus } from '@/types';

const TankScene = dynamic(() => import('./TankScene'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-sky-600 rounded-full animate-spin" />
        <span className="text-xs font-medium text-slate-500">Initializing 3D Digital Twin…</span>
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
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-sky-500" />
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
            Digital Twin 3D Reservoir
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
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono">
              <Layers size={11} className="text-slate-400" />
              <span>{config.lengthCm}×{config.widthCm}×{config.depthCm} cm</span>
            </div>
          )}
          <button
            onClick={handleReset}
            title="Reset 3D Camera Angle"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <RotateCcw size={12} className="text-slate-400" />
            <span className="hidden sm:inline">Reset View</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div className="relative h-[380px] sm:h-[420px] w-full bg-[#fbfcfd]">
        {/* Subtle engineering grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35]"
          style={{
            backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div key={resetKey} className="w-full h-full relative z-10">
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

        {/* Live HUD Floating Card (Top Left) */}
        {reading && sensorValid && !isStale && (
          <div className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-md rounded-lg px-3 py-2 border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Water Level
              </p>
              <p className="text-sm font-bold font-mono text-slate-900">
                {waterLevelCm.toFixed(1)} <span className="text-xs font-normal text-slate-500">cm</span>
              </p>
            </div>
            <div className="w-[1px] h-6 bg-slate-200" />
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Fill Volume
              </p>
              <p className="text-sm font-bold font-mono text-sky-600">
                {fillPercentage.toFixed(1)} <span className="text-xs font-normal text-slate-500">%</span>
              </p>
            </div>
          </div>
        )}

        {/* Drag Hint (Top Right) */}
        <div className="absolute top-3 right-3 z-20 pointer-events-none text-[11px] text-slate-400 font-medium flex items-center gap-1.5 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200/60">
          <Compass size={12} className="text-slate-400" />
          <span>Rotate & Zoom</span>
        </div>

        {/* Waiting State Overlay */}
        {!reading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 backdrop-blur-xs">
            <div className="text-center space-y-1.5 p-6 bg-white rounded-xl border border-slate-200 shadow-sm max-w-xs">
              <div className="text-slate-900 text-sm font-semibold">
                Waiting for Telemetry
              </div>
              <div className="text-slate-500 text-xs">
                3D Digital Twin will animate once readings arrive from the ultrasonic sensor.
              </div>
            </div>
          </div>
        )}

        {/* Sensor Invalid Overlay */}
        {reading && !sensorValid && !isStale && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 backdrop-blur-xs">
            <div className="flex flex-col items-center gap-2 p-5 bg-white rounded-xl border border-slate-200 shadow-sm text-center max-w-xs">
              <AlertTriangle size={24} className="text-amber-500" />
              <span className="text-slate-900 font-semibold text-sm">
                Sensor Value Out of Range
              </span>
              <span className="text-slate-500 text-xs">
                Distance exceeds configured sensor boundary or ultrasonic echo was lost.
              </span>
            </div>
          </div>
        )}

        {/* Stale Data Overlay */}
        {reading && isStale && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 backdrop-blur-xs">
            <div className="flex flex-col items-center gap-2 p-5 bg-white rounded-xl border border-amber-200 shadow-sm text-center max-w-xs">
              <Clock size={24} className="text-amber-600" />
              <span className="text-slate-900 font-semibold text-sm">
                Telemetry Stale
              </span>
              <span className="text-slate-500 text-xs">
                No recent heartbeat received within timeout threshold.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
