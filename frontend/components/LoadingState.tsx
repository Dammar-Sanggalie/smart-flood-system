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
        <div className="w-14 h-14 border-[3px] border-slate-200 border-t-cyan-500 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Droplets size={18} className="text-cyan-500" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-slate-700 font-medium text-sm">{message}</p>
        <p className="text-slate-400 text-xs">
          Connecting to backend…
        </p>
      </div>
    </div>
  );
}
