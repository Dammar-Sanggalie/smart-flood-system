// ──────────────────────────────────────────────────
// components/DemoModeBanner.tsx — Minimalist Demo Banner
// ──────────────────────────────────────────────────
'use client';

import { Info } from 'lucide-react';

export default function DemoModeBanner() {
  return (
    <div className="w-full bg-slate-50 border-b border-slate-200/80 text-slate-700 py-2">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Info size={12} className="text-amber-700" />
          </div>
          <span className="text-slate-600">
            <strong className="text-slate-900 font-semibold">Demo Simulation Active:</strong>
            {' '}Generating synthetic sensor telemetry for testing. Real ESP32 HTTP POST data will automatically override simulation.
          </span>
        </div>
        <span className="hidden sm:inline-block text-[11px] font-mono text-slate-500">
          POST /api/readings
        </span>
      </div>
    </div>
  );
}
