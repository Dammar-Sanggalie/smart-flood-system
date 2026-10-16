// ──────────────────────────────────────────────────
// app/page.tsx — Refined Telemetry Dashboard
// ──────────────────────────────────────────────────
'use client';

import { useState, useCallback } from 'react';
import {
  Layers,
  TrendingUp,
  Settings2,
  Droplets,
  AlertCircle,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTankData } from '@/hooks/useTankData';

import DashboardHeader from '@/components/DashboardHeader';
import MetricGrid from '@/components/MetricGrid';
import TankVisualization from '@/components/TankVisualization';
import WaterLevelChart from '@/components/WaterLevelChart';
import ConnectionStatus from '@/components/ConnectionStatus';
import ActivityLog from '@/components/ActivityLog';
import TankConfigForm from '@/components/TankConfigForm';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';

type ViewMode = 'overview' | 'analytics' | 'settings' | 'all';

// ── Hero Status & Executive Summary ───────────────
function ExecutiveHeroStatus({
  reading,
  config,
}: {
  reading: ReturnType<typeof useTankData>['reading'];
  config: ReturnType<typeof useTankData>['config'];
}) {
  const isInvalid = !reading || !reading.sensorValid;
  const isStale = reading?.isStale ?? false;
  const status = reading?.calculatedStatus ?? 'UNKNOWN';
  const fillPct = reading?.fillPercentage ?? 0;
  const waterLevel = reading?.waterLevelCm ?? 0;

  // Status configuration
  const statusData = {
    SAFE: {
      title: 'Status Normal — Aman',
      desc: `Ketinggian air (${waterLevel.toFixed(1)} cm) berada dalam batas aman dan stabil di bawah ambang waspada (${config?.warnThresholdPercent ?? 60}%).`,
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      dotBg: 'bg-emerald-500',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      gradient: 'from-emerald-500 to-teal-600',
    },
    WARNING: {
      title: 'Peringatan Dini — Waspada',
      desc: `Ketinggian air (${waterLevel.toFixed(1)} cm) telah melampaui batas waspada (${config?.warnThresholdPercent ?? 60}%). Pantau saluran dan siapkan mitigasi.`,
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
      dotBg: 'bg-amber-500',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      gradient: 'from-amber-400 to-amber-600',
    },
    DANGER: {
      title: 'Bahaya Siaga 1 — Kritis',
      desc: `Ketinggian air (${waterLevel.toFixed(1)} cm) mendekati kapasitas penuh reservoir (${fillPct.toFixed(1)}%). Segera lakukan tindakan evakuasi dan pencegahan!`,
      badgeBg: 'bg-rose-50 border-rose-200 text-rose-800 animate-pulse',
      dotBg: 'bg-rose-600',
      icon: ShieldAlert,
      iconColor: 'text-rose-600',
      gradient: 'from-rose-500 to-red-700',
    },
    INVALID: {
      title: 'Sensor Memerlukan Pengecekan',
      desc: 'Nilai pembacaan sensor berada di luar jangkauan fisik atau terhalang.',
      badgeBg: 'bg-slate-100 border-slate-200 text-slate-700',
      dotBg: 'bg-slate-400',
      icon: HelpCircle,
      iconColor: 'text-slate-500',
      gradient: 'from-slate-400 to-slate-600',
    },
    UNKNOWN: {
      title: 'Menunggu Telemetri Sensor',
      desc: 'Menghubungkan ke aliran data IoT ESP32…',
      badgeBg: 'bg-slate-100 border-slate-200 text-slate-700',
      dotBg: 'bg-slate-400',
      icon: HelpCircle,
      iconColor: 'text-slate-500',
      gradient: 'from-slate-400 to-slate-600',
    },
  };

  const current =
    isStale
      ? {
          title: 'Koneksi Telemetri Terhenti (Stale)',
          desc: 'Tidak ada data sensor baru yang diterima dalam batas waktu watchdog.',
          badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
          dotBg: 'bg-amber-500',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
          gradient: 'from-amber-400 to-amber-600',
        }
      : statusData[status] ?? statusData.UNKNOWN;

  const StatusIcon = current.icon;

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-soft overflow-hidden">
      {/* Subtle background ambient light */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left: Status & Narrative */}
        <div className="flex items-start gap-4 min-w-0">
          <div
            className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border',
              current.badgeBg,
            )}
          >
            <StatusIcon size={24} className={current.iconColor} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tracking-wide border',
                  current.badgeBg,
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', current.dotBg)} />
                {isStale ? 'STALE' : isInvalid ? 'INVALID' : status}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {current.title}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {current.desc}
            </p>
          </div>
        </div>

        {/* Right: Key Gauge Telemetry */}
        {reading && !isInvalid && !isStale && (
          <div className="flex items-center gap-5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Water Level
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900">
                {waterLevel.toFixed(1)}{' '}
                <span className="text-xs font-bold text-slate-400 font-sans">cm</span>
              </span>
            </div>

            <div className="w-[1px] h-10 bg-slate-200 hidden sm:block" />

            <div className="text-right min-w-[90px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Capacity
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-sky-600">
                {fillPct.toFixed(1)}
                <span className="text-xs font-bold text-slate-400 font-sans">%</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress fill bar */}
      {reading && !isInvalid && !isStale && (
        <div className="mt-4 pt-4 border-t border-slate-100/80">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1.5">
            <span>Reservoir Level</span>
            <span className="font-bold text-slate-700">{fillPct.toFixed(1)}% Full</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-[1px]">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 bg-gradient-to-r',
                current.gradient,
              )}
              style={{ width: `${Math.min(Math.max(fillPct, 0), 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── View Mode Navigation Tabs ─────────────────────
function ViewModeTabs({
  activeTab,
  onSelectTab,
}: {
  activeTab: ViewMode;
  onSelectTab: (tab: ViewMode) => void;
}) {
  const tabs: { id: ViewMode; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Live Digital Twin & Metrik', icon: Layers },
    { id: 'analytics', label: 'Grafik Hidrograf & Tren', icon: TrendingUp },
    { id: 'settings', label: 'Hardware & Pengaturan', icon: Settings2 },
    { id: 'all', label: 'Tampilkan Semua', icon: LayoutGrid },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl overflow-x-auto w-full sm:w-auto self-start shadow-inner">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 whitespace-nowrap cursor-pointer',
              isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40',
            )}
          >
            <Icon size={14} className={isActive ? 'text-sky-600' : 'text-slate-400'} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Standby Placeholder ───────────────────────────
function WaitingBanner() {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center shadow-soft">
      <div className="w-12 h-12 mx-auto mb-3.5 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center">
        <Droplets size={24} className="text-sky-600" />
      </div>
      <h3 className="text-slate-900 font-bold text-base">
        Menunggu Aliran Telemetri Sensor
      </h3>
      <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-md mx-auto leading-relaxed">
        Data ketinggian air, volume, dan model 3D akan aktif begitu perangkat ESP32 mengirimkan paket data pertama.
      </p>
    </div>
  );
}

// ── Main Page Component ───────────────────────────
export default function DashboardPage() {
  const {
    reading,
    config,
    status,
    history,
    activityLog,
    sseStatus,
    isLoading,
    error,
    mode,
    mqttStatus,
    updateConfig,
    clearActivityLog,
  } = useTankData();

  const [activeTab, setActiveTab] = useState<ViewMode>('overview');

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleSettingsClick = useCallback(() => {
    setActiveTab('settings');
    setTimeout(() => {
      document.getElementById('config-panel')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // ── Loading Screen ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <LoadingState message="Menghubungkan ke sistem monitoring Smart Flood…" />
      </div>
    );
  }

  // ── Fatal Backend Error ──
  if (error && !reading && !config) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <ErrorState
          message={error}
          onRetry={handleRetry}
          hint="Pastikan server backend Go sedang berjalan pada port 8080."
        />
      </div>
    );
  }

  const backendConnected = status?.backendStatus === 'ok' || sseStatus === 'connected';
  const lastMessageAt = status?.lastMessageAt ?? reading?.receivedAt ?? null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col antialiased">
      {/* Single Unified Header */}
      <DashboardHeader
        deviceId={reading?.deviceId ?? status?.lastReading?.deviceId}
        mqttStatus={mqttStatus}
        backendConnected={backendConnected}
        lastUpdated={reading?.timestamp ?? null}
        mode={mode}
        onSettingsClick={handleSettingsClick}
      />

      {/* Main Spacious Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Non-fatal error banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRetry}
              className="text-rose-700 hover:text-rose-900 font-bold underline underline-offset-2 shrink-0 cursor-pointer"
            >
              Coba Ulang
            </button>
          </div>
        )}

        {/* 1. Primary Executive Summary Hero Card */}
        <ExecutiveHeroStatus reading={reading} config={config} />

        {/* 2. Interactive Navigation Segmented Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <ViewModeTabs activeTab={activeTab} onSelectTab={setActiveTab} />
          <span className="text-xs text-slate-400 font-mono hidden md:block">
            {reading?.timestamp ? `Sync: ${new Date(reading.timestamp).toLocaleTimeString()}` : 'Live Telemetry'}
          </span>
        </div>

        {/* 3. Dynamic Content Rendering Based on Active Tab */}

        {/* TAB 1: OVERVIEW (Default Focus: 3D Twin & Key Metrics) */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Core Metrics */}
            {reading ? (
              <MetricGrid reading={reading} config={config} />
            ) : (
              <WaitingBanner />
            )}

            {/* 3D Digital Twin Reservoir */}
            <TankVisualization reading={reading} config={config} />
          </div>
        )}

        {/* TAB 2: ANALYTICS (Focus: Historical Hydrograph Chart) */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fade-in">
            <WaterLevelChart
              history={history}
              warnThreshold={config?.warnThresholdPercent}
              dangerThreshold={config?.dangerThresholdPercent}
            />

            {/* Quick telemetry summary cards */}
            {reading && <MetricGrid reading={reading} config={config} />}
          </div>
        )}

        {/* TAB 3: SETTINGS & HARDWARE (Focus: Connection Mesh, Tank Setup & Logs) */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in" id="config-panel">
            {/* Left: Configuration Form */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-soft">
              <div className="mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Kalibrasi Geometri & Ambang Batas Tangki
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sesuaikan dimensi fisik tangki dan nilai pemicu peringatan dini.
                  </p>
                </div>
              </div>

              {config ? (
                <TankConfigForm config={config} onSave={updateConfig} />
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Memuat data konfigurasi…
                </div>
              )}
            </div>

            {/* Right: Network Mesh & Event Logs */}
            <div className="lg:col-span-5 space-y-6">
              <ConnectionStatus
                mqttStatus={mqttStatus}
                backendConnected={backendConnected}
                lastMessageAt={lastMessageAt}
                sseStatus={sseStatus}
              />

              <ActivityLog
                entries={activityLog}
                onClear={clearActivityLog}
              />
            </div>
          </div>
        )}

        {/* TAB 4: ALL PANELS (Expansive Multi-column Grid) */}
        {activeTab === 'all' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Primary Visual Column (7 on lg, 8 on xl) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-8 min-w-0">
              {reading ? (
                <MetricGrid reading={reading} config={config} />
              ) : (
                <WaitingBanner />
              )}

              <TankVisualization reading={reading} config={config} />

              <WaterLevelChart
                history={history}
                warnThreshold={config?.warnThresholdPercent}
                dangerThreshold={config?.dangerThresholdPercent}
              />
            </div>

            {/* Diagnostics Column (5 on lg, 4 on xl) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6 min-w-0" id="config-panel">
              <ConnectionStatus
                mqttStatus={mqttStatus}
                backendConnected={backendConnected}
                lastMessageAt={lastMessageAt}
                sseStatus={sseStatus}
              />

              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Reservoir Parameters
                </h3>
                {config ? (
                  <TankConfigForm config={config} onSave={updateConfig} />
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Loading configuration…
                  </div>
                )}
              </div>

              <ActivityLog
                entries={activityLog}
                onClear={clearActivityLog}
              />
            </div>
          </div>
        )}
      </main>

      {/* Clean Technical Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">SmartFlood IoT</span>
            <span>—</span>
            <span>Sistem Deteksi Banjir Real-Time & Peringatan Dini</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span>ESP32 HC-SR04</span>
            <span>•</span>
            <span>MQTT / HTTP POST</span>
            <span>•</span>
            <span>Go Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
