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
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-xs">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-900">
            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
            {p.unit}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
      <p className="text-slate-400 text-sm font-medium">No historical data yet</p>
      <p className="text-slate-400 text-xs mt-1 max-w-xs">
        Data will appear here once readings are received from the device.
      </p>
    </div>
  );
}

export default function WaterLevelChart({
  history,
  warnThreshold,
  dangerThreshold,
}: WaterLevelChartProps) {
  const chartData = [...history]
    .reverse()
    .filter((r) => r.sensorValid)
    .map((r) => ({
      time: formatTime(r.timestamp),
      distanceCm: r.distanceCm,
      waterLevelCm: r.waterLevelCm,
      fillPercent: r.fillPercentage,
    }));

  return (
    <div className="bg-white rounded-xl border border-bg-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-800">
          Historical Readings
        </h2>
        {history.length > 0 && (
          <span className="text-xs text-slate-400">
            {history.length} reading{history.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {chartData.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

            <XAxis
              dataKey="time"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              interval="preserveStartEnd"
            />

            <YAxis
              yAxisId="cm"
              orientation="left"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              unit=" cm"
              width={48}
            />

            <YAxis
              yAxisId="pct"
              orientation="right"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              unit="%"
              domain={[0, 100]}
              width={40}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b', paddingTop: '8px' }} />

            {warnThreshold !== undefined && (
              <ReferenceLine yAxisId="pct" y={warnThreshold} stroke="#d97706" strokeDasharray="4 2" label={{ value: 'WARN', fill: '#d97706', fontSize: 9 }} />
            )}
            {dangerThreshold !== undefined && (
              <ReferenceLine yAxisId="pct" y={dangerThreshold} stroke="#dc2626" strokeDasharray="4 2" label={{ value: 'DANGER', fill: '#dc2626', fontSize: 9 }} />
            )}

            <Line yAxisId="cm" type="monotone" dataKey="distanceCm" name="Distance" stroke="#f87171" strokeWidth={1.5} strokeDasharray="5 3" dot={false} unit=" cm" activeDot={{ r: 3, fill: '#f87171' }} />
            <Line yAxisId="cm" type="monotone" dataKey="waterLevelCm" name="Water Level" stroke="#0891b2" strokeWidth={2} dot={false} unit=" cm" activeDot={{ r: 4, fill: '#0891b2' }} />
            <Line yAxisId="pct" type="monotone" dataKey="fillPercent" name="Fill %" stroke="#16a34a" strokeWidth={1.5} dot={false} unit="%" activeDot={{ r: 3, fill: '#16a34a' }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
