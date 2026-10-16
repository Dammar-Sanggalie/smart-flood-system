// ──────────────────────────────────────────────────
// lib/api.ts — REST API client functions
// ──────────────────────────────────────────────────
import type {
  SensorReading,
  TankConfig,
  StatusResponse,
} from '@/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Helper: fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ── /api/status ───────────────────────────────────
export async function fetchStatus(): Promise<StatusResponse | null> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as StatusResponse;
  } catch (err) {
    console.error('[api] fetchStatus error:', err);
    return null;
  }
}

// ── /api/readings/latest ──────────────────────────
export async function fetchLatestReading(): Promise<SensorReading | null> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/readings/latest`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as SensorReading;
  } catch (err) {
    console.error('[api] fetchLatestReading error:', err);
    return null;
  }
}

// ── /api/readings?limit=N&offset=M ───────────────
export async function fetchHistory(
  limit = 50,
  offset = 0,
): Promise<SensorReading[]> {
  try {
    const url = `${API_BASE}/api/readings?limit=${limit}&offset=${offset}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[api] fetchHistory error:', err);
    return [];
  }
}

// ── /api/config GET ───────────────────────────────
export async function fetchConfig(): Promise<TankConfig | null> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/config`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as TankConfig;
  } catch (err) {
    console.error('[api] fetchConfig error:', err);
    return null;
  }
}

// ── /api/config PUT ───────────────────────────────
export async function updateConfig(config: TankConfig): Promise<TankConfig> {
  const res = await fetchWithTimeout(
    `${API_BASE}/api/config`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    },
    10000,
  );
  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as TankConfig;
}
