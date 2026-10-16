// ──────────────────────────────────────────────────
// components/ActivityLog.tsx — Precision Audit Trail
// ──────────────────────────────────────────────────
'use client';

import { useEffect, useRef } from 'react';
import { Info, AlertTriangle, XCircle, CheckCircle, Trash2, List } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import type { ActivityLogEntry, LogSeverity } from '@/types';

interface ActivityLogProps {
  entries: ActivityLogEntry[];
  onClear: () => void;
}

const severityConfig: Record<
  LogSeverity,
  { icon: React.ElementType; iconColor: string; dotColor: string }
> = {
  info: { icon: Info, iconColor: 'text-sky-600', dotColor: 'bg-sky-500' },
  warning: { icon: AlertTriangle, iconColor: 'text-amber-600', dotColor: 'bg-amber-500' },
  error: { icon: XCircle, iconColor: 'text-rose-600', dotColor: 'bg-rose-500' },
  success: { icon: CheckCircle, iconColor: 'text-emerald-600', dotColor: 'bg-emerald-500' },
};

function LogEntry({ entry }: { entry: ActivityLogEntry }) {
  const config = severityConfig[entry.severity] ?? severityConfig.info;
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
      <div className={cn('mt-0.5 shrink-0', config.iconColor)}>
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-800 leading-snug font-medium break-words">
          {entry.message}
        </p>
        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
          {formatDateTime(entry.timestamp)}
        </span>
      </div>
    </div>
  );
}

export default function ActivityLog({ entries, onClear }: ActivityLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [entries.length]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <List size={14} className="text-slate-400" />
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            System Event Log
          </h3>
          {entries.length > 0 && (
            <span className="bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold rounded-full px-2 py-0.5 border border-slate-200">
              {entries.length}
            </span>
          )}
        </div>
        {entries.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-rose-600 transition-colors px-1.5 py-0.5 rounded hover:bg-rose-50"
            title="Clear Event Log"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Log Feed */}
      <div
        ref={scrollRef}
        className="overflow-y-auto p-2 space-y-0.5"
        style={{ maxHeight: '280px' }}
      >
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
            <Info size={20} className="mb-1.5 opacity-40 text-slate-400" />
            <p className="text-xs font-medium text-slate-500">No events logged</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              System alerts and threshold changes will appear here
            </p>
          </div>
        ) : (
          entries.map((entry) => <LogEntry key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
