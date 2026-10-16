// ──────────────────────────────────────────────────
// app/page.tsx — Main Dashboard Page
// ──────────────────────────────────────────────────
'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Settings2 } from 'lucide-react';
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

// ── Collapsible panel wrapper ─────────────────────
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
    <div className="bg-bg-card rounded-xl border border-bg-border overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-border/30 transition-colors duration-150"
      >
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-300">{title}</span>
        </div>
        {open ? (
          <ChevronDown size={15} className="text-slate-500" />
        ) : (
          <ChevronRight size={15} className="text-slate-500" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-bg-border pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Empty / waiting state for metric section ──────
function WaitingBanner() {
  return (
    <div className="rounded-xl border border-bg-border border-dashed p-8 text-center">
      <div className="text-slate-600 text-3xl mb-3">💧</div>
      <p className="text-slate-400 font-medium text-sm">
        Waiting for first reading…
      </p>
      <p className="text-slate-600 text-xs mt-1 max-w-xs mx-auto">
        Data will appear here once the ESP32 device connects and sends sensor readings.
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────
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
    refreshConfig,
    updateConfig,
    clearActivityLog,
  } = useTankData();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleSettingsClick = useCallback(() => {
    setSettingsOpen((o) => !o);
    // Scroll to config section on mobile
    setTimeout(() => {
      document.getElementById('config-panel')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // ── Loading ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-dark">
        <LoadingState message="Initializing dashboard…" />
      </div>
    );
  }

  // ── Fatal Error (no backend at all) ──────────────
  if (error && !reading && !config) {
    return (
      <div className="min-h-screen bg-bg-dark">
        <ErrorState
          message={error}
          onRetry={handleRetry}
          hint="Make sure the backend server is running on the configured API URL."
        />
      </div>
    );
  }

  const backendConnected = status?.backendStatus === 'ok' || sseStatus === 'connected';
  const lastMessageAt = status?.lastMessageAt ?? reading?.receivedAt ?? null;

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      {/* Demo banner */}
      {mode === 'demo' && <DemoModeBanner />}

      {/* Header */}
      <DashboardHeader
        deviceId={reading?.deviceId ?? status?.lastReading?.deviceId}
        mqttStatus={mqttStatus}
        backendConnected={backendConnected}
        lastUpdated={reading?.timestamp ?? null}
        mode={mode}
        onSettingsClick={handleSettingsClick}
      />

      {/* Main content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5">
        {/* Error banner (non-fatal) */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg px-4 py-2.5 flex items-center gap-2">
            <span className="shrink-0">⚠</span>
            <span>{error}</span>
            <button
              onClick={handleRetry}
              className="ml-auto text-red-400 hover:text-white underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left Column (2/3) ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Metrics */}
            {reading ? (
              <MetricGrid reading={reading} config={config} />
            ) : (
              <WaitingBanner />
            )}

            {/* 3D Tank */}
            <TankVisualization reading={reading} config={config} />

            {/* History Chart */}
            <WaterLevelChart
              history={history}
              warnThreshold={config?.warnThresholdPercent}
              dangerThreshold={config?.dangerThresholdPercent}
            />
          </div>

          {/* ── Right Column (1/3) ── */}
          <div className="space-y-4" id="config-panel">

            {/* Connection status */}
            <ConnectionStatus
              mqttStatus={mqttStatus}
              backendConnected={backendConnected}
              lastMessageAt={lastMessageAt}
              sseStatus={sseStatus}
            />

            {/* Tank Config Form */}
            <CollapsiblePanel
              title="Tank Configuration"
              icon={Settings2}
              defaultOpen={settingsOpen}
            >
              {config ? (
                <TankConfigForm
                  config={config}
                  onSave={updateConfig}
                />
              ) : (
                <div className="text-center py-4 text-slate-500 text-xs">
                  Loading configuration…
                </div>
              )}
            </CollapsiblePanel>

            {/* Activity Log */}
            <ActivityLog
              entries={activityLog}
              onClear={clearActivityLog}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-bg-border py-3 px-6 text-center">
        <p className="text-xs text-slate-700">
          Smart Flood Detection System &mdash; IoT Dashboard &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
