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

/** Format ISO date string to human-readable datetime (DD/MM/YYYY HH:mm:ss). */
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

/** Format ISO date string as relative time ("3s ago", "just now"). */
export function formatRelativeTime(iso: string): string {
  if (!iso) return '—';
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 4) return 'just now';
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
    case 'SAFE':
      return 'text-emerald-700';
    case 'WARNING':
      return 'text-amber-700';
    case 'DANGER':
      return 'text-rose-700';
    default:
      return 'text-slate-600';
  }
}

/** Get Tailwind bg color class for a WaterStatus. */
export function getStatusBgColor(status: WaterStatus | string): string {
  switch (status) {
    case 'SAFE':
      return 'bg-emerald-50';
    case 'WARNING':
      return 'bg-amber-50';
    case 'DANGER':
      return 'bg-rose-50';
    default:
      return 'bg-slate-100';
  }
}

/** Get Tailwind border color class for a WaterStatus. */
export function getStatusBorderColor(status: WaterStatus | string): string {
  switch (status) {
    case 'SAFE':
      return 'border-emerald-200';
    case 'WARNING':
      return 'border-amber-200';
    case 'DANGER':
      return 'border-rose-200';
    default:
      return 'border-slate-200';
  }
}

/** Get Tailwind color classes for MQTT connection status. */
export function getMQTTStatusColor(status: MQTTConnectionStatus): string {
  switch (status) {
    case 'connected':
      return 'text-emerald-700';
    case 'reconnecting':
      return 'text-amber-700';
    case 'disconnected':
      return 'text-slate-400';
    case 'error':
      return 'text-rose-700';
    case 'demo':
      return 'text-sky-700';
    default:
      return 'text-slate-400';
  }
}

/** Get background color for MQTT dot indicator. */
export function getMQTTDotColor(status: MQTTConnectionStatus): string {
  switch (status) {
    case 'connected':
      return 'bg-emerald-500';
    case 'reconnecting':
      return 'bg-amber-500';
    case 'disconnected':
      return 'bg-slate-300';
    case 'error':
      return 'bg-rose-500';
    case 'demo':
      return 'bg-sky-500';
    default:
      return 'bg-slate-300';
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
