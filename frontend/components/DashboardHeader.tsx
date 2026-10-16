// ──────────────────────────────────────────────────
// components/DashboardHeader.tsx
// ──────────────────────────────────────────────────
'use client';

import { Droplets, Settings, Cpu } from 'lucide-react';
import { cn, getMQTTStatusColor, getMQTTDotColor, formatRelativeTime } from '@/lib/utils';
import type { AppMode, MQTTConnectionStatus } from '@/types';

interface DashboardHeaderProps {
  deviceId?: string;
  mqttStatus: MQTTConnectionStatus;
  backendConnected: boolean;
  lastUpdated?: string | null;
  mode: AppMode;
  onSettingsClick: () => void;
}

export default function DashboardHeader({
  deviceId,
  mqttStatus,
  backendConnected,
  lastUpdated,
  mode,
  onSettingsClick,
}: DashboardHeaderProps) {
  const mqttDot = getMQTTDotColor(mqttStatus);
  const mqttText = getMQTTStatusColor(mqttStatus);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-bg-border">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">

        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1.5 bg-cyan-500/15 rounded-lg">
            <Droplets size={18} className="text-cyan-600" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-slate-900 leading-tight">
              Smart Flood Detection
            </h1>
            <p className="text-[10px] text-slate-400">IoT Monitoring System</p>
          </div>
        </div>

        <div className="flex-1" />

        {deviceId && (
          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
            <Cpu size={12} />
            <span className="text-xs font-mono text-slate-500">{deviceId}</span>
          </div>
        )}

        <div
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold',
            mode === 'demo'
              ? 'bg-amber-500/15 text-amber-600'
              : 'bg-green-500/15 text-green-600',
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              mode === 'demo' ? 'bg-amber-500 animate-pulse' : 'bg-green-500',
            )}
          />
          {mode === 'demo' ? 'DEMO' : 'LIVE'}
        </div>

        <div className="flex items-center gap-1.5">
          <span className={cn('relative flex h-2 w-2')}>
            {mqttStatus === 'connected' && (
              <span
                className={cn(
                  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                  mqttDot,
                )}
              />
            )}
            <span className={cn('relative inline-flex rounded-full h-2 w-2', mqttDot)} />
          </span>
          <span className={cn('text-xs font-medium hidden sm:block', mqttText)}>
            {mqttStatus === 'connected'
              ? 'Connected'
              : mqttStatus === 'reconnecting'
              ? 'Reconnecting'
              : mqttStatus === 'error'
              ? 'Error'
              : mqttStatus === 'demo'
              ? 'Demo'
              : 'Disconnected'}
          </span>
        </div>

        {lastUpdated && (
          <span className="hidden lg:block text-[11px] text-slate-400">
            {formatRelativeTime(lastUpdated)}
          </span>
        )}

        <button
          onClick={onSettingsClick}
          className={cn(
            'p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-bg-hover',
            'transition-all duration-150',
          )}
          title="Tank Configuration"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
