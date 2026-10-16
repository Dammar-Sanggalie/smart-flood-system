// ──────────────────────────────────────────────────
// lib/utils.ts — Shared helper utilities
// ──────────────────────────────────────────────────
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { MQTTConnectionStatus, WaterStatus } from '@/types';

/** Merge Tailwind class names safely (clsx + twMerge). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format ISO date string to human-readable datetime. */
export function formatDateTime(iso: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Format ISO date string to short time (HH:mm:ss). */
export function formatTime(iso: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Format ISO date string as relative time ("3 seconds ago"). */
export function formatRelativeTime(iso: string): string {
  if (!iso) return '—';
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  } catch {
    return '—';
  }
}

/** Get Tailwind text color class for a WaterStatus. */
export function getStatusColor(status: WaterStatus | string): string {
  switch (status) {
    case 'SAFE':    return 'text-water-safe';
    case 'WARNING': return 'text-water-warn';
    case 'DANGER':  return 'text-water-danger';
    default:        return 'text-water-invalid';
  }
}

/** Get Tailwind bg color class for a WaterStatus. */
export function getStatusBgColor(status: WaterStatus | string): string {
  switch (status) {
    case 'SAFE':    return 'bg-water-safe/10';
    case 'WARNING': return 'bg-water-warn/10';
    case 'DANGER':  return 'bg-water-danger/10';
    default:        return 'bg-water-invalid/10';
  }
}

/** Get Tailwind border color class for a WaterStatus. */
export function getStatusBorderColor(status: WaterStatus | string): string {
  switch (status) {
    case 'SAFE':    return 'border-water-safe';
    case 'WARNING': return 'border-water-warn';
    case 'DANGER':  return 'border-water-danger';
    default:        return 'border-water-invalid';
  }
}

/** Get Tailwind color classes for MQTT connection status. */
export function getMQTTStatusColor(status: MQTTConnectionStatus): string {
  switch (status) {
    case 'connected':    return 'text-green-600';
    case 'reconnecting': return 'text-yellow-600';
    case 'disconnected': return 'text-slate-400';
    case 'error':        return 'text-red-500';
    case 'demo':         return 'text-amber-600';
    default:             return 'text-slate-400';
  }
}

/** Get background color for MQTT dot indicator. */
export function getMQTTDotColor(status: MQTTConnectionStatus): string {
  switch (status) {
    case 'connected':    return 'bg-green-500';
    case 'reconnecting': return 'bg-yellow-500';
    case 'disconnected': return 'bg-slate-300';
    case 'error':        return 'bg-red-500';
    case 'demo':         return 'bg-amber-500';
    default:             return 'bg-slate-300';
  }
}

/** Format a number to N decimal places, returning '—' for invalid values. */
export function formatNumber(
  value: number | null | undefined,
  decimals = 1,
): string {
  if (value === null || value === undefined || !isFinite(value)) return '—';
  return value.toFixed(decimals);
}

/** Generate a unique ID for log entries. */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
