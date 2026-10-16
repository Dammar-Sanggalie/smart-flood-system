// Package calculation contains pure water-math functions with no side-effects.
// All functions are deterministic and safe for concurrent use.
package calculation

import (
	"math"

	"smartflood/backend/internal/models"
)

// ClampFloat constrains value to the range [min, max].
func ClampFloat(value, min, max float64) float64 {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}

// CalculateWaterLevel returns the height of water in the tank (cm).
//
// The ultrasonic sensor is mounted at the top of the tank pointing downward.
// It measures the air gap (distanceCm) between itself and the water surface.
// waterLevel = clamp(sensorHeight - distance, 0, tankDepth)
//
// Examples:
//   - Empty tank: distance == sensorHeight → waterLevel = 0
//   - Full tank:  distance == 0           → waterLevel = sensorHeight (clamped to tankDepth)
func CalculateWaterLevel(distanceCm, sensorHeightCm, tankDepthCm float64) float64 {
	waterLevel := sensorHeightCm - distanceCm
	return ClampFloat(waterLevel, 0, tankDepthCm)
}

// CalculateFillPercentage returns how full the tank is as a percentage [0, 100].
// Returns 0 if tankDepthCm is zero or negative (prevents divide-by-zero).
func CalculateFillPercentage(waterLevelCm, tankDepthCm float64) float64 {
	if tankDepthCm <= 0 {
		return 0
	}
	pct := (waterLevelCm / tankDepthCm) * 100.0
	return ClampFloat(pct, 0, 100)
}

// CalculateVolumeLiters converts cm dimensions to litres.
// volume (L) = (length × width × waterLevel) / 1000
// Returns 0 if any dimension is non-positive.
func CalculateVolumeLiters(lengthCm, widthCm, waterLevelCm float64) float64 {
	if lengthCm <= 0 || widthCm <= 0 || waterLevelCm <= 0 {
		return 0
	}
	return (lengthCm * widthCm * waterLevelCm) / 1000.0
}

// CalculateCapacityLiters is the total tank capacity in litres when full.
// capacity (L) = (length × width × depth) / 1000
func CalculateCapacityLiters(lengthCm, widthCm, depthCm float64) float64 {
	if lengthCm <= 0 || widthCm <= 0 || depthCm <= 0 {
		return 0
	}
	return (lengthCm * widthCm * depthCm) / 1000.0
}

// IsValidDistance returns true when distanceCm is a usable sensor reading.
//
// Rejection criteria:
//   - NaN  — sensor communication error
//   - ±Inf — sensor communication error
//   - ≤ 0  — distance of zero or negative is physically impossible and
//     typically indicates an initialisation or hardware fault
func IsValidDistance(distanceCm float64) bool {
	if math.IsNaN(distanceCm) || math.IsInf(distanceCm, 0) {
		return false
	}
	return distanceCm > 0
}

// DetermineCalculatedStatus maps a fill percentage to a human-readable alert level.
// Thresholds come from TankConfig so operators can adjust them via the API.
func DetermineCalculatedStatus(fillPct float64, cfg *models.TankConfig) string {
	switch {
	case fillPct >= cfg.DangerThresholdPct:
		return "DANGER"
	case fillPct >= cfg.WarnThresholdPct:
		return "WARNING"
	default:
		return "SAFE"
	}
}

// CalculateAll is a convenience function that runs every water-math step in one call.
// It returns (waterLevelCm, fillPercentage, volumeLiters, capacityLiters).
func CalculateAll(distanceCm float64, cfg *models.TankConfig) (waterLevel, fillPct, volumeLiters, capacityLiters float64) {
	waterLevel = CalculateWaterLevel(distanceCm, cfg.SensorHeightCm, cfg.DepthCm)
	fillPct = CalculateFillPercentage(waterLevel, cfg.DepthCm)
	volumeLiters = CalculateVolumeLiters(cfg.LengthCm, cfg.WidthCm, waterLevel)
	capacityLiters = CalculateCapacityLiters(cfg.LengthCm, cfg.WidthCm, cfg.DepthCm)
	return
}
