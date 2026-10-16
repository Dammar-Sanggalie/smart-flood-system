// ──────────────────────────────────────────────────
// lib/calculations.ts — Client-side water calculations
// Mirrors the backend formulas for display validation
// ──────────────────────────────────────────────────
import type { TankConfig, WaterStatus } from '@/types';

/** Clamp a value between min and max (inclusive). */
export function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate water level from sensor distance reading.
 * waterLevel = sensorHeight - distance
 * Clamped to [0, tankDepth].
 */
export function calculateWaterLevel(
  distanceCm: number,
  sensorHeightCm: number,
  tankDepthCm: number,
): number {
  const raw = sensorHeightCm - distanceCm;
  return clampValue(raw, 0, tankDepthCm);
}

/**
 * Calculate fill percentage from water level.
 * fill% = (waterLevel / depth) * 100
 * Clamped to [0, 100].
 */
export function calculateFillPercentage(
  waterLevelCm: number,
  tankDepthCm: number,
): number {
  if (tankDepthCm <= 0) return 0;
  return clampValue((waterLevelCm / tankDepthCm) * 100, 0, 100);
}

/**
 * Calculate volume in liters.
 * volume = length * width * waterLevel (cm³) / 1000
 */
export function calculateVolumeLiters(
  lengthCm: number,
  widthCm: number,
  waterLevelCm: number,
): number {
  return (lengthCm * widthCm * waterLevelCm) / 1000;
}

/**
 * Calculate total tank capacity in liters.
 * capacity = length * width * depth (cm³) / 1000
 */
export function calculateCapacityLiters(
  lengthCm: number,
  widthCm: number,
  depthCm: number,
): number {
  return (lengthCm * widthCm * depthCm) / 1000;
}

/**
 * Validate sensor distance reading.
 * Valid range: 2 cm – 400 cm (typical HC-SR04 range).
 */
export function isValidDistance(distanceCm: number): boolean {
  return (
    typeof distanceCm === 'number' &&
    isFinite(distanceCm) &&
    distanceCm >= 2 &&
    distanceCm <= 400
  );
}

/**
 * Determine water status from fill percentage and thresholds.
 */
export function determineStatus(
  fillPercentage: number,
  config: TankConfig,
): WaterStatus {
  if (fillPercentage >= config.dangerThresholdPercent) return 'DANGER';
  if (fillPercentage >= config.warnThresholdPercent) return 'WARNING';
  return 'SAFE';
}
