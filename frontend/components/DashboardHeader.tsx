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
    <header className="sticky top-0 z-50 bg-bg-dark/95 backdrop-blur border-b border-bg-border">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">

        {/* ── Brand ── */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="p-1.5 bg-blue-600/20 rounded-lg">
            <Droplets size={20} className="text-blue-400" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-white leading-tight">
              Smart Flood Detection
            </h1>
            <p className="text-[10px] text-slate-500">IoT Monitoring System</p>
          </div>
          <h1 className="sm:hidden text-sm font-bold text-white">Flood Monitor</h1>
        </div>

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* ── Device ID ── */}
        {deviceId && (
          <div className="hidden md:flex items-center gap-1.5 bg-bg-card border border-bg-border rounded-lg px-2.5 py-1">
            <Cpu size={12} className="text-slate-500" />
            <span className="text-xs font-mono text-slate-300">{deviceId}</span>
          </div>
        )}

        {/* ── Mode Badge ── */}
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold',
            mode === 'demo'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'bg-green-500/20 text-green-400 border border-green-500/40',
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              mode === 'demo' ? 'bg-amber-400 animate-pulse' : 'bg-green-400',
            )}
          />
          {mode === 'demo' ? 'DEMO' : 'LIVE'}
        </div>

        {/* ── MQTT Status ── */}
        <div className="flex items-center gap-1.5 bg-bg-card border border-bg-border rounded-lg px-2.5 py-1">
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
          <span className={cn('text-xs font-semibold hidden sm:block', mqttText)}>
            {mqttStatus === 'connected'
              ? 'MQTT'
              : mqttStatus === 'reconnecting'
              ? 'Reconnecting'
              : mqttStatus === 'error'
              ? 'MQTT Error'
              : 'No MQTT'}
          </span>
        </div>

        {/* ── Last Updated ── */}
        {lastUpdated && (
          <span className="hidden lg:block text-xs text-slate-500">
            {formatRelativeTime(lastUpdated)}
          </span>
        )}

        {/* ── Settings Button ── */}
        <button
          onClick={onSettingsClick}
          className={cn(
            'p-2 rounded-lg text-slate-400 hover:text-white hover:bg-bg-card',
            'border border-transparent hover:border-bg-border',
            'transition-all duration-150',
            'focus:outline-none focus:ring-1 focus:ring-blue-500',
          )}
          title="Tank Configuration"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
