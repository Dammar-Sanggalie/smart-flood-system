// ──────────────────────────────────────────────────
// components/ActivityLog.tsx — Scrollable activity log
// ──────────────────────────────────────────────────
'use client';

import { useEffect, useRef } from 'react';
import { Info, AlertTriangle, XCircle, CheckCircle, Trash2 } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import type { ActivityLogEntry, LogSeverity } from '@/types';

interface ActivityLogProps {
  entries: ActivityLogEntry[];
  onClear: () => void;
}

const severityConfig: Record<
  LogSeverity,
  { icon: React.ElementType; textColor: string; bgColor: string; dotColor: string }
> = {
  info: {
    icon: Info,
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/5',
    dotColor: 'bg-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/5',
    dotColor: 'bg-amber-400',
  },
  error: {
    icon: XCircle,
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/5',
    dotColor: 'bg-red-400',
  },
  success: {
    icon: CheckCircle,
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/5',
    dotColor: 'bg-green-400',
  },
};

function LogEntry({ entry }: { entry: ActivityLogEntry }) {
  const config = severityConfig[entry.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 px-3 py-2 rounded-lg',
        config.bgColor,
        'animate-fade-in',
      )}
    >
      <div className={cn('mt-0.5 shrink-0', config.textColor)}>
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-300 leading-relaxed">{entry.message}</p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          {formatDateTime(entry.timestamp)}
        </p>
      </div>
    </div>
  );
}

export default function ActivityLog({ entries, onClear }: ActivityLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top (newest entries are first)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [entries.length]);

  return (
    <div className="bg-bg-card rounded-xl border border-bg-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-300">Activity Log</h3>
          {entries.length > 0 && (
            <span className="bg-slate-700 text-slate-400 text-[10px] font-semibold rounded-full px-1.5 py-0.5">
              {entries.length}
            </span>
          )}
        </div>
        {entries.length > 0 && (
          <button
            onClick={onClear}
            className={cn(
              'flex items-center gap-1 text-xs text-slate-500 hover:text-red-400',
              'transition-colors duration-150 rounded px-1.5 py-1 hover:bg-red-500/10',
            )}
          >
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Log list */}
      <div
        ref={scrollRef}
        className="overflow-y-auto p-2 space-y-1"
        style={{ maxHeight: '300px' }}
      >
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-600">
            <Info size={24} className="mb-2 opacity-50" />
            <p className="text-xs">No activity yet</p>
          </div>
        ) : (
          entries.map((entry) => <LogEntry key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
