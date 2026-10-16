// ──────────────────────────────────────────────────
// components/DemoModeBanner.tsx
// ──────────────────────────────────────────────────
'use client';

import { AlertTriangle } from 'lucide-react';

export default function DemoModeBanner() {
  return (
    <div className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium">
        <AlertTriangle size={15} className="shrink-0 text-amber-400" />
        <span>
          <strong className="text-amber-400">DEMO MODE</strong>
          {' '}— Data is simulated. Connect your ESP32 device for live readings.
        </span>
      </div>
    </div>
  );
}
