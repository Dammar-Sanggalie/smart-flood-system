// ──────────────────────────────────────────────────
// components/WaterLevelChart.tsx — Recharts history
// ──────────────────────────────────────────────────
'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { formatTime } from '@/lib/utils';
import type { SensorReading } from '@/types';

interface WaterLevelChartProps {
  history: SensorReading[];
  warnThreshold?: number;
  dangerThreshold?: number;
}

// ── Custom Tooltip ────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; unit: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-bg-border rounded-lg p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold text-white">
            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
            {p.unit}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
      <div className="text-slate-600 text-3xl mb-3">📊</div>
      <p className="text-slate-400 text-sm font-medium">No historical data yet</p>
      <p className="text-slate-600 text-xs mt-1 max-w-xs">
        Data will appear here once readings are received from the device.
      </p>
    </div>
  );
}

// ── Chart ─────────────────────────────────────────
export default function WaterLevelChart({
  history,
  warnThreshold,
  dangerThreshold,
}: WaterLevelChartProps) {
  const chartData = [...history]
    .reverse() // oldest first for left-to-right timeline
    .filter((r) => r.sensorValid)
    .map((r) => ({
      time: formatTime(r.timestamp),
      distanceCm: r.distanceCm,
      waterLevelCm: r.waterLevelCm,
      fillPercent: r.fillPercentage,
    }));

  return (
    <div className="bg-bg-card rounded-xl border border-bg-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300">
          Historical Readings
        </h2>
        {history.length > 0 && (
          <span className="text-xs text-slate-500">
            {history.length} reading{history.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {chartData.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="time"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              interval="preserveStartEnd"
            />

            {/* Left Y axis: cm */}
            <YAxis
              yAxisId="cm"
              orientation="left"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              unit=" cm"
              width={48}
            />

            {/* Right Y axis: % */}
            <YAxis
              yAxisId="pct"
              orientation="right"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              unit="%"
              domain={[0, 100]}
              width={40}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '8px' }}
            />

            {/* Thresholds */}
            {warnThreshold !== undefined && (
              <ReferenceLine
                yAxisId="pct"
                y={warnThreshold}
                stroke="#f59e0b"
                strokeDasharray="4 2"
                label={{ value: 'WARN', fill: '#f59e0b', fontSize: 9 }}
              />
            )}
            {dangerThreshold !== undefined && (
              <ReferenceLine
                yAxisId="pct"
                y={dangerThreshold}
                stroke="#ef4444"
                strokeDasharray="4 2"
                label={{ value: 'DANGER', fill: '#ef4444', fontSize: 9 }}
              />
            )}

            {/* Distance — red dashed */}
            <Line
              yAxisId="cm"
              type="monotone"
              dataKey="distanceCm"
              name="Distance"
              stroke="#f87171"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              unit=" cm"
              activeDot={{ r: 3, fill: '#f87171' }}
            />

            {/* Water Level — blue solid */}
            <Line
              yAxisId="cm"
              type="monotone"
              dataKey="waterLevelCm"
              name="Water Level"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={false}
              unit=" cm"
              activeDot={{ r: 4, fill: '#60a5fa' }}
            />

            {/* Fill % — green area-line */}
            <Line
              yAxisId="pct"
              type="monotone"
              dataKey="fillPercent"
              name="Fill %"
              stroke="#4ade80"
              strokeWidth={1.5}
              dot={false}
              unit="%"
              activeDot={{ r: 3, fill: '#4ade80' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
