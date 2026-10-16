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

// ── Response envelope ─────────────────────────────
// The backend wraps every REST response in { success, data, error }.
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

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

// Helper: unwrap the APIResponse envelope and return data
async function unwrap<T>(res: Response): Promise<T> {
  const json: APIResponse<T> = await res.json();
  if (!json.success) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return json.data as T;
}

// ── /api/status ───────────────────────────────────
export async function fetchStatus(): Promise<StatusResponse | null> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await unwrap<StatusResponse>(res);
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
    return await unwrap<SensorReading>(res);
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
    const data = await unwrap<SensorReading[]>(res);
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
    return await unwrap<TankConfig>(res);
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
  return await unwrap<TankConfig>(res);
}
