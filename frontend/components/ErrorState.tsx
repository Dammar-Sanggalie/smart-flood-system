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
      <div className="p-4 bg-red-500/10 rounded-full">
        <AlertOctagon size={36} className="text-red-400" />
      </div>
      <div className="space-y-1 max-w-sm">
        <p className="text-red-300 font-semibold text-base">Connection Error</p>
        <p className="text-slate-400 text-sm">{message}</p>
        {hint && <p className="text-slate-600 text-xs mt-2">{hint}</p>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-bg-dark"
        >
          <RefreshCw size={15} />
          Retry Connection
        </button>
      )}
    </div>
  );
}
