// ──────────────────────────────────────────────────
// components/DashboardHeader.tsx — Clean Enterprise Header
// ──────────────────────────────────────────────────
'use client';

import { Droplets, Settings, Cpu, Activity } from 'lucide-react';
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm shrink-0">
            <Droplets size={18} className="text-sky-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 tracking-tight text-sm sm:text-base truncate">
                Smart Flood System
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                v1.2
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              IoT Real-Time Hydro Telemetry & Early Warning
            </p>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Device ID pill */}
          {deviceId && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-xs font-mono">
              <Cpu size={13} className="text-slate-400" />
              <span>{deviceId}</span>
            </div>
          )}

          {/* Mode Pill (LIVE vs DEMO) */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border',
              mode === 'demo'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200',
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                mode === 'demo' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse',
              )}
            />
            {mode === 'demo' ? 'DEMO' : 'LIVE'}
          </div>

          {/* MQTT Status */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs">
            <span className="relative flex h-2 w-2">
              {mqttStatus === 'connected' && (
                <span
                  className={cn(
                    'animate-ping absolute inline-flex h-full w-full rounded-full opacity-60',
                    mqttDot,
                  )}
                />
              )}
              <span className={cn('relative inline-flex rounded-full h-2 w-2', mqttDot)} />
            </span>
            <span className={cn('font-medium capitalize', mqttText)}>
              {mqttStatus === 'connected'
                ? 'MQTT Online'
                : mqttStatus === 'reconnecting'
                ? 'Reconnecting'
                : mqttStatus === 'error'
                ? 'MQTT Error'
                : mqttStatus === 'demo'
                ? 'Simulated'
                : 'Disconnected'}
            </span>
          </div>

          {/* Last Updated Timestamp */}
          {lastUpdated && (
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Activity size={13} className="text-slate-400" />
              <span>{formatRelativeTime(lastUpdated)}</span>
            </div>
          )}

          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Configuration button */}
          <button
            onClick={onSettingsClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-semibold transition-all shadow-xs"
            title="Configure Tank Parameters"
          >
            <Settings size={14} className="text-slate-500" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
