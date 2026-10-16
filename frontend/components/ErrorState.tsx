// ──────────────────────────────────────────────────
// components/ErrorState.tsx
// ──────────────────────────────────────────────────
'use client';

import { AlertOctagon, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  hint?: string;
}

export default function ErrorState({
  message,
  onRetry,
  hint,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4 text-center">
      <div className="p-3.5 bg-red-50 rounded-full">
        <AlertOctagon size={32} className="text-red-500" />
      </div>
      <div className="space-y-1 max-w-sm">
        <p className="text-red-600 font-semibold text-base">Connection Error</p>
        <p className="text-slate-500 text-sm">{message}</p>
        {hint && <p className="text-slate-400 text-xs mt-2">{hint}</p>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors duration-150"
        >
          <RefreshCw size={14} />
          Retry Connection
        </button>
      )}
    </div>
  );
}
