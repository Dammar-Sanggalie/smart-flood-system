// ──────────────────────────────────────────────────
// types/index.ts — All shared TypeScript types
// ──────────────────────────────────────────────────

export type WaterStatus = 'SAFE' | 'WARNING' | 'DANGER' | 'INVALID' | 'UNKNOWN';

export type MQTTConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export type AppMode = 'live' | 'demo';

export type SSEEventType =
  | 'reading'
  | 'status'
  | 'connection'
  | 'stale'
  | 'error';

export type LogSeverity = 'info' | 'warning' | 'error' | 'success';

// ── Sensor Reading ─────────────────────────────────
export interface SensorReading {
  id: number;
  deviceId: string;
  distanceCm: number;
  waterLevelCm: number;
  fillPercentage: number;
  volumeLiters: number;
  capacityLiters: number;
  deviceStatus: string;       // Status string from ESP32 firmware
  calculatedStatus: WaterStatus; // Status derived by backend/dashboard
  sensorValid: boolean;
  isStale: boolean;
  uptimeSeconds: number;
  timestamp: string;           // ISO 8601 – when sensor measured
  receivedAt: string;          // ISO 8601 – when backend received
}

// ── Tank Configuration ─────────────────────────────
export interface TankConfig {
  lengthCm: number;
  widthCm: number;
  depthCm: number;
  sensorHeightCm: number;
  warnThresholdPercent: number;
  dangerThresholdPercent: number;
  staleTimeoutSeconds: number;
}

// ── Backend Status Response ────────────────────────
export interface StatusResponse {
  backendStatus: string;
  mqttStatus: MQTTConnectionStatus;
  lastReading: SensorReading | null;
  lastMessageAt: string | null;
  mode: AppMode;
}

// ── SSE Event ─────────────────────────────────────
export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp: string;
}

// ── Activity Log ──────────────────────────────────
export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: SSEEventType | 'system';
  message: string;
  severity: LogSeverity;
}

// ── History ───────────────────────────────────────
export interface HistoryEntry {
  timestamp: string;
  distanceCm: number;
  waterLevelCm: number;
  fillPercentage: number;
  volumeLiters: number;
  sensorValid: boolean;
}
