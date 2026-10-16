// ──────────────────────────────────────────────────
// components/ErrorState.tsx — Minimalist Error State
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center bg-white">
      <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
        <AlertOctagon size={22} />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h2 className="text-slate-900 font-semibold text-base">Backend Connection Unavailable</h2>
        <p className="text-slate-600 text-xs leading-relaxed">{message}</p>
        {hint && (
          <p className="text-slate-400 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded p-2 mt-2">
            {hint}
          </p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg px-4 py-2.5 transition-colors shadow-xs"
        >
          <RefreshCw size={13} />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}
