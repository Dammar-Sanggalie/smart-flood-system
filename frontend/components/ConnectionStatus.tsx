// ──────────────────────────────────────────────────
// components/ConnectionStatus.tsx — Network Telemetry Mesh
// ──────────────────────────────────────────────────
'use client';

import { Wifi, Server, Activity, Radio } from 'lucide-react';
import { cn, getMQTTDotColor, getMQTTStatusColor, formatRelativeTime } from '@/lib/utils';
import type { MQTTConnectionStatus } from '@/types';

interface ConnectionStatusProps {
  mqttStatus: MQTTConnectionStatus;
  backendConnected: boolean;
  lastMessageAt?: string | null;
  sseStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
}

function StatusRow({
  label,
  dotColor,
  textColor,
  bgColor,
  statusText,
  icon: Icon,
  pulse,
}: {
  label: string;
  dotColor: string;
  textColor: string;
  bgColor: string;
  statusText: string;
  icon: React.ElementType;
  pulse: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-b-0 gap-2">
      <div className="flex items-center gap-2.5 text-slate-700 min-w-0">
        <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0 text-slate-400">
          <Icon size={13} />
        </div>
        <span className="text-xs font-semibold truncate">{label}</span>
      </div>

      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-mono font-semibold shrink-0',
          bgColor,
          textColor,
        )}
      >
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-60',
                dotColor,
              )}
            />
          )}
          <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', dotColor)} />
        </span>
        <span>{statusText}</span>
      </div>
    </div>
  );
}

export default function ConnectionStatus({
  mqttStatus,
  backendConnected,
  lastMessageAt,
  sseStatus,
}: ConnectionStatusProps) {
  const mqttDot = getMQTTDotColor(mqttStatus);
  const mqttText = getMQTTStatusColor(mqttStatus);
  const mqttBg =
    mqttStatus === 'connected'
      ? 'bg-emerald-50 border-emerald-200'
      : mqttStatus === 'reconnecting'
      ? 'bg-amber-50 border-amber-200'
      : mqttStatus === 'demo'
      ? 'bg-sky-50 border-sky-200'
      : 'bg-slate-50 border-slate-200';
  const mqttLabel =
    mqttStatus === 'connected'
      ? 'ONLINE'
      : mqttStatus === 'reconnecting'
      ? 'RETRYING'
      : mqttStatus === 'error'
      ? 'ERROR'
      : mqttStatus === 'demo'
      ? 'SIMULATED'
      : 'OFFLINE';

  const backendDot = backendConnected ? 'bg-emerald-500' : 'bg-rose-500';
  const backendTextColor = backendConnected ? 'text-emerald-700' : 'text-rose-700';
  const backendBg = backendConnected
    ? 'bg-emerald-50 border-emerald-200'
    : 'bg-rose-50 border-rose-200';
  const backendLabel = backendConnected ? 'HEALTHY' : 'UNREACHABLE';

  const sseDot =
    sseStatus === 'connected'
      ? 'bg-emerald-500'
      : sseStatus === 'connecting'
      ? 'bg-amber-500'
      : sseStatus === 'error'
      ? 'bg-rose-500'
      : 'bg-slate-300';
  const sseTextColor =
    sseStatus === 'connected'
      ? 'text-emerald-700'
      : sseStatus === 'connecting'
      ? 'text-amber-700'
      : sseStatus === 'error'
      ? 'text-rose-700'
      : 'text-slate-500';
  const sseBg =
    sseStatus === 'connected'
      ? 'bg-emerald-50 border-emerald-200'
      : sseStatus === 'connecting'
      ? 'bg-amber-50 border-amber-200'
      : sseStatus === 'error'
      ? 'bg-rose-50 border-rose-200'
      : 'bg-slate-50 border-slate-200';
  const sseLabel =
    sseStatus === 'connected'
      ? 'STREAMING'
      : sseStatus === 'connecting'
      ? 'CONNECTING'
      : sseStatus === 'error'
      ? 'ERROR'
      : 'IDLE';

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-sky-600" />
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Network Telemetry
          </h3>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
          MESH ACTIVE
        </span>
      </div>

      <div className="space-y-0.5">
        <StatusRow
          label="MQTT Broker"
          dotColor={mqttDot}
          textColor={mqttText}
          bgColor={mqttBg}
          statusText={mqttLabel}
          icon={Radio}
          pulse={mqttStatus === 'connected'}
        />
        <StatusRow
          label="Go API Daemon"
          dotColor={backendDot}
          textColor={backendTextColor}
          bgColor={backendBg}
          statusText={backendLabel}
          icon={Server}
          pulse={backendConnected}
        />
        {sseStatus && (
          <StatusRow
            label="SSE Live Stream"
            dotColor={sseDot}
            textColor={sseTextColor}
            bgColor={sseBg}
            statusText={sseLabel}
            icon={Wifi}
            pulse={sseStatus === 'connected'}
          />
        )}
      </div>

      {lastMessageAt && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Heartbeat sync</span>
          <span className="font-mono text-slate-700">{formatRelativeTime(lastMessageAt)}</span>
        </div>
      )}
    </div>
  );
}
