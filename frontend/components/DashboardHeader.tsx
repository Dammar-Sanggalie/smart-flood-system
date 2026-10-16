// ──────────────────────────────────────────────────
// components/DashboardHeader.tsx — Unified Enterprise Header & Brand
// ──────────────────────────────────────────────────
'use client';

import { useState } from 'react';
import { Settings, Cpu, Activity, Info, X } from 'lucide-react';
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

// ── Custom Bespoke Hydro-Sonar Brand Logo ──────────
function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      {/* Dynamic Hydro-Sonar SVG Emblem */}
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 p-[1px] shadow-sm flex items-center justify-center overflow-hidden shrink-0 group">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-blue-500/0 opacity-60" />
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 transform group-hover:scale-105 transition-transform duration-300"
        >
          {/* Sonar Radar Arcs */}
          <path
            d="M6 18C6 11.3726 11.3726 6 18 6"
            stroke="url(#logoGrad1)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeOpacity="0.4"
          />
          <path
            d="M10 18C10 13.5817 13.5817 10 18 10"
            stroke="url(#logoGrad1)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeOpacity="0.75"
          />
          {/* Central Water Droplet */}
          <path
            d="M18 13C18 13 23 19.2 23 22.5C23 25.2614 20.7614 27.5 18 27.5C15.2386 27.5 13 25.2614 13 22.5C13 19.2 18 13 18 13Z"
            fill="url(#logoGrad2)"
          />
          {/* Droplet Highlight */}
          <ellipse
            cx="16.5"
            cy="21.5"
            rx="1.5"
            ry="2.5"
            transform="rotate(-25 16.5 21.5)"
            fill="white"
            fillOpacity="0.65"
          />
          {/* Gradients */}
          <defs>
            <linearGradient id="logoGrad1" x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="logoGrad2" x1="13" y1="13" x2="23" y2="27.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-base tracking-tight text-slate-900 font-sans">
            Smart<span className="text-sky-600">Flood</span>
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-sky-50 text-sky-700 border border-sky-200/80">
            IOT
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium tracking-tight hidden sm:block">
          Precision Hydro Telemetry & Early Warning
        </span>
      </div>
    </div>
  );
}

export default function DashboardHeader({
  deviceId,
  mqttStatus,
  lastUpdated,
  mode,
  onSettingsClick,
}: DashboardHeaderProps) {
  const [showDemoInfo, setShowDemoInfo] = useState(false);
  const mqttDot = getMQTTDotColor(mqttStatus);
  const mqttText = getMQTTStatusColor(mqttStatus);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <BrandLogo />

        {/* Unified Status & Quick Actions Bar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Demo Simulation Badge with Tooltip Trigger */}
          {mode === 'demo' && (
            <div className="relative">
              <button
                onClick={() => setShowDemoInfo((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100/60 transition-colors cursor-pointer"
                title="Click for simulation details"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Simulation Active</span>
                <Info size={12} className="text-amber-600 ml-0.5" />
              </button>

              {/* Informative Popover */}
              {showDemoInfo && (
                <div className="absolute right-0 top-10 w-72 p-3 bg-white border border-slate-200 rounded-xl shadow-elevated z-50 animate-fade-in text-xs text-slate-600">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                      Demo Telemetry
                    </span>
                    <button
                      onClick={() => setShowDemoInfo(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <p className="leading-relaxed text-slate-600">
                    Sistem sedang mensimulasikan sensor ketinggian air secara real-time. Begitu perangkat fisik ESP32 mengirim HTTP POST ke <code className="text-sky-600 bg-sky-50 px-1 py-0.5 rounded font-mono">/api/readings</code>, simulasi otomatis berhenti.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Device ID pill */}
          {deviceId && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-mono">
              <Cpu size={13} className="text-slate-400" />
              <span>{deviceId}</span>
            </div>
          )}

          {/* MQTT Status with Pulse Ring */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50/80 border border-slate-200 text-xs">
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
            <span className={cn('font-semibold capitalize text-[11px] sm:text-xs', mqttText)}>
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

          {/* Last sync info */}
          {lastUpdated && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Activity size={12} className="text-slate-400" />
              <span>{formatRelativeTime(lastUpdated)}</span>
            </div>
          )}

          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Configuration Settings Button */}
          <button
            onClick={onSettingsClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-semibold transition-all shadow-card cursor-pointer"
            title="Configure Reservoir Parameters"
          >
            <Settings size={14} className="text-slate-500" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
