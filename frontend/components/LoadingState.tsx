// ──────────────────────────────────────────────────
// components/LoadingState.tsx
// ──────────────────────────────────────────────────
'use client';

import { Droplets } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = 'Loading dashboard…',
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-bg-border border-t-blue-500 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Droplets size={20} className="text-blue-400" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-slate-300 font-medium text-sm">{message}</p>
        <p className="text-slate-600 text-xs">
          Connecting to Smart Flood Detection backend…
        </p>
      </div>
    </div>
  );
}
