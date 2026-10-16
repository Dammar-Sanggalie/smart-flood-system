// ──────────────────────────────────────────────────
// app/page.tsx — Main Telemetry Dashboard Page
// ──────────────────────────────────────────────────
'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Settings2, Droplets, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTankData } from '@/hooks/useTankData';

import DashboardHeader from '@/components/DashboardHeader';
import DemoModeBanner from '@/components/DemoModeBanner';
import MetricGrid from '@/components/MetricGrid';
import TankVisualization from '@/components/TankVisualization';
import WaterLevelChart from '@/components/WaterLevelChart';
import ConnectionStatus from '@/components/ConnectionStatus';
import ActivityLog from '@/components/ActivityLog';
import TankConfigForm from '@/components/TankConfigForm';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';

// ── Collapsible Panel Component ───────────────────
function CollapsiblePanel({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">{title}</span>
        </div>
        {open ? (
          <ChevronDown size={15} className="text-slate-400" />
        ) : (
          <ChevronRight size={15} className="text-slate-400" />
        )}
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 border-t border-slate-100 pt-3.5">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Telemetry Standby Placeholder ─────────────────
function WaitingBanner() {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center shadow-xs">
      <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
        <Droplets size={20} className="text-sky-600" />
      </div>
      <p className="text-slate-900 font-semibold text-sm">
        Awaiting Initial Sensor Telemetry
      </p>
      <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
        Live water level, clearance distance, and volume metrics will populate once the ESP32 transmitter streams data.
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

  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleSettingsClick = useCallback(() => {
    setSettingsOpen((prev) => !prev);
    setTimeout(() => {
      document.getElementById('config-panel')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // ── Loading Screen ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <LoadingState message="Connecting to Smart Flood telemetry system…" />
      </div>
    );
  }

  // ── Fatal Backend Error ──
  if (error && !reading && !config) {
    return (
      <div className="min-h-screen bg-white">
        <ErrorState
          message={error}
          onRetry={handleRetry}
          hint="Ensure the Go backend server is running on :8080 and reachable."
        />
      </div>
    );
  }

  const backendConnected = status?.backendStatus === 'ok' || sseStatus === 'connected';
  const lastMessageAt = status?.lastMessageAt ?? reading?.receivedAt ?? null;

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      {/* Simulation Banner (if demo mode) */}
      {mode === 'demo' && <DemoModeBanner />}

      {/* Main Enterprise Header */}
      <DashboardHeader
        deviceId={reading?.deviceId ?? status?.lastReading?.deviceId}
        mqttStatus={mqttStatus}
        backendConnected={backendConnected}
        lastUpdated={reading?.timestamp ?? null}
        mode={mode}
        onSettingsClick={handleSettingsClick}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Non-fatal notification banner */}
        {error && (
          <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg px-4 py-3 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRetry}
              className="text-rose-700 hover:text-rose-900 font-semibold underline underline-offset-2 shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Primary Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── Primary Visual & Telemetry Column (7 on lg, 8 on xl) ── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6 min-w-0">
            {/* Real-time Metric Cards */}
            {reading ? (
              <MetricGrid reading={reading} config={config} />
            ) : (
              <WaitingBanner />
            )}

            {/* 3D Digital Twin Reservoir */}
            <TankVisualization reading={reading} config={config} />

            {/* Hydrograph Telemetry History Chart */}
            <WaterLevelChart
              history={history}
              warnThreshold={config?.warnThresholdPercent}
              dangerThreshold={config?.dangerThresholdPercent}
            />
          </div>

          {/* ── System Telemetry & Configuration Column (5 on lg, 4 on xl) ── */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 min-w-0" id="config-panel">
            {/* Network Telemetry Mesh */}
            <ConnectionStatus
              mqttStatus={mqttStatus}
              backendConnected={backendConnected}
              lastMessageAt={lastMessageAt}
              sseStatus={sseStatus}
            />

            {/* Collapsible Reservoir Calibration Form */}
            <CollapsiblePanel
              title="Reservoir Parameters"
              icon={Settings2}
              defaultOpen={settingsOpen}
            >
              {config ? (
                <TankConfigForm config={config} onSave={updateConfig} />
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Loading calibration parameters…
                </div>
              )}
            </CollapsiblePanel>

            {/* Real-time Activity & Audit Log */}
            <ActivityLog
              entries={activityLog}
              onClear={clearActivityLog}
            />
          </div>
        </div>
      </main>

      {/* Clean Technical Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>
            Smart Flood Detection System — IoT Hydro Telemetry & Early Warning Dashboard
          </p>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>ESP32 HC-SR04</span>
            <span>•</span>
            <span>SSE Telemetry</span>
            <span>•</span>
            <span>Go SQLite Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
