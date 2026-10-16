// ──────────────────────────────────────────────────
// components/ConnectionStatus.tsx
// ──────────────────────────────────────────────────
'use client';

import { Wifi, WifiOff, Server } from 'lucide-react';
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
  statusText,
  icon: Icon,
  pulse,
}: {
  label: string;
  dotColor: string;
  textColor: string;
  statusText: string;
  icon: React.ElementType;
  pulse: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={14} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={cn('relative flex h-2 w-2')}>
          {pulse && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                dotColor,
              )}
            />
            )}
          <span className={cn('relative inline-flex rounded-full h-2 w-2', dotColor)} />
        </span>
        <span className={cn('text-xs font-semibold', textColor)}>{statusText}</span>
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
  const mqttLabel =
    mqttStatus === 'connected'
      ? 'Connected'
      : mqttStatus === 'reconnecting'
      ? 'Reconnecting…'
      : mqttStatus === 'error'
      ? 'Error'
      : mqttStatus === 'demo'
      ? 'Demo (no MQTT)'
      : 'Disconnected';

  const backendDot = backendConnected ? 'bg-green-500' : 'bg-red-500';
  const backendTextColor = backendConnected ? 'text-green-600' : 'text-red-500';
  const backendLabel = backendConnected ? 'Online' : 'Offline';

  const sseDot =
    sseStatus === 'connected'
      ? 'bg-green-500'
      : sseStatus === 'connecting'
      ? 'bg-yellow-500'
      : sseStatus === 'error'
      ? 'bg-red-500'
      : 'bg-slate-400';
  const sseTextColor =
    sseStatus === 'connected'
      ? 'text-green-600'
      : sseStatus === 'connecting'
      ? 'text-yellow-600'
      : sseStatus === 'error'
      ? 'text-red-500'
      : 'text-slate-400';
  const sseLabel =
    sseStatus === 'connected'
      ? 'Connected'
      : sseStatus === 'connecting'
      ? 'Connecting…'
      : sseStatus === 'error'
      ? 'Error'
      : 'Disconnected';

  return (
    <div className="bg-white rounded-xl border border-bg-border p-4 space-y-3">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Connection Status
      </h3>

      <div className="space-y-2.5">
        <StatusRow
          label="MQTT Broker"
          dotColor={mqttDot}
          textColor={mqttText}
          statusText={mqttLabel}
          icon={mqttStatus === 'connected' ? Wifi : WifiOff}
          pulse={mqttStatus === 'connected'}
        />
        <StatusRow
          label="Backend API"
          dotColor={backendDot}
          textColor={backendTextColor}
          statusText={backendLabel}
          icon={Server}
          pulse={backendConnected}
        />
        {sseStatus && (
          <StatusRow
            label="Live Stream"
            dotColor={sseDot}
            textColor={sseTextColor}
            statusText={sseLabel}
            icon={Wifi}
            pulse={sseStatus === 'connected'}
          />
        )}
      </div>

      {lastMessageAt && (
        <div className="pt-1 border-t border-bg-border">
          <p className="text-xs text-slate-400">
            Last message:{' '}
            <span className="text-slate-600">{formatRelativeTime(lastMessageAt)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
