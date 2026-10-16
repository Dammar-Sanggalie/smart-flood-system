// ──────────────────────────────────────────────────
// components/LoadingState.tsx — Minimalist Loading State
// ──────────────────────────────────────────────────
'use client';

import { Droplets } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = 'Initializing telemetry dashboard…',
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 bg-white">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Droplets size={16} className="text-sky-600" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-slate-900 font-semibold text-sm">{message}</p>
        <p className="text-slate-400 text-xs">
          Synchronizing with IoT telemetry daemon…
        </p>
      </div>
    </div>
  );
}
