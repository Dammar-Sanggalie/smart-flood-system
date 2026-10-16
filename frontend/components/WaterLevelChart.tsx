// ──────────────────────────────────────────────────
// components/WaterLevelChart.tsx — Precision Hydrograph Telemetry
// ──────────────────────────────────────────────────
'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { formatTime } from '@/lib/utils';
import type { SensorReading } from '@/types';

interface WaterLevelChartProps {
  history: SensorReading[];
  warnThreshold?: number;
  dangerThreshold?: number;
  heightClass?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; unit?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg p-3 shadow-lg text-xs space-y-1.5 min-w-[140px]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 text-slate-400 font-mono text-[10px]">
        <span>TIME</span>
        <span className="font-semibold text-slate-700">{label}</span>
      </div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-slate-500 capitalize">{p.name}</span>
          </div>
          <span className="font-mono font-bold text-slate-900">
            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
            <span className="text-[10px] text-slate-400 font-normal ml-0.5">
              {p.name === 'Fill' ? '%' : 'cm'}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-52 text-center px-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
      <p className="text-slate-600 text-sm font-semibold">No Telemetry Recorded</p>
      <p className="text-slate-400 text-xs mt-1 max-w-xs">
        Historical hydrograph chart will render as readings stream in from the device.
      </p>
    </div>
  );
}

export default function WaterLevelChart({
  history,
  warnThreshold,
  dangerThreshold,
  heightClass = 'h-64 sm:h-72',
}: WaterLevelChartProps) {
  const chartData = [...history]
    .reverse()
    .filter((r) => r.sensorValid)
    .map((r) => ({
      time: formatTime(r.timestamp),
      waterLevel: r.waterLevelCm,
      fill: r.fillPercentage,
      distance: r.distanceCm,
    }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-soft flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Hydrograph Telemetry Log
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              {history.length} pts
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Real-time water level fluctuations & capacity thresholds
          </p>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-sky-600 rounded-full" />
            <span>Water Level (cm)</span>
          </div>
          {warnThreshold && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-amber-500 border-b border-dashed border-amber-500" />
              <span className="text-amber-700">Warn ({warnThreshold}%)</span>
            </div>
          )}
          {dangerThreshold && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-rose-500 border-b border-dashed border-rose-500" />
              <span className="text-rose-700">Danger ({dangerThreshold}%)</span>
            </div>
          )}
        </div>
      </div>

      {chartData.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={`w-full ${heightClass}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="waterLevelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              {/* Minimal horizontal grid lines */}
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                dy={6}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
                dx={-4}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Threshold reference lines */}
              {warnThreshold && (
                <ReferenceLine
                  y={warnThreshold}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}
              {dangerThreshold && (
                <ReferenceLine
                  y={dangerThreshold}
                  stroke="#e11d48"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}

              {/* Area fill under curve */}
              <Area
                type="monotone"
                dataKey="waterLevel"
                name="Water Level"
                stroke="none"
                fill="url(#waterLevelGrad)"
              />

              {/* Main telemetry line */}
              <Line
                type="monotone"
                dataKey="waterLevel"
                name="Water Level"
                stroke="#0284c7"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#0284c7' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
