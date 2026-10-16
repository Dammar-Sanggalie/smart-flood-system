// ──────────────────────────────────────────────────
// components/DemoModeBanner.tsx
// ──────────────────────────────────────────────────
'use client';

import { AlertTriangle } from 'lucide-react';

export default function DemoModeBanner() {
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-700">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-center gap-2 text-xs font-medium">
        <AlertTriangle size={13} className="shrink-0 text-amber-500" />
        <span>
          <strong className="text-amber-600 font-semibold">DEMO MODE</strong>
          {' '}— Data simulated. Connect your ESP32 for live readings.
        </span>
      </div>
    </div>
  );
}
