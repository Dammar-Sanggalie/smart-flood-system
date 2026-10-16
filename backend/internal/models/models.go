// Package models defines all shared data structures for the Smart Flood Detection System.
package models

import "time"

// MQTTPayload represents the raw JSON payload received from the ESP32 sensor device.
// Fields marked omitempty are optional — the ESP32 firmware may not always send them.
type MQTTPayload struct {
	DeviceID      string   `json:"deviceId"`
	DistanceCm    float64  `json:"distanceCm"`
	Status        string   `json:"status,omitempty"`        // device-reported status (SAFE/WARNING/DANGER)
	SensorValid   *bool    `json:"sensorValid,omitempty"`   // nil if not sent
	WifiConnected *bool    `json:"wifiConnected,omitempty"` // nil if not sent
	UptimeSeconds *int64   `json:"uptimeSeconds,omitempty"` // nil if not sent
	Timestamp     string   `json:"timestamp,omitempty"`     // ISO8601 from device clock (optional)
}

// SensorReading is the fully-processed reading after validation and water math.
// This is what gets stored in the database and sent to clients.
type SensorReading struct {
	ID               int64     `json:"id"`
	DeviceID         string    `json:"deviceId"`
	DistanceCm       float64   `json:"distanceCm"`
	WaterLevelCm     float64   `json:"waterLevelCm"`
	FillPercentage   float64   `json:"fillPercentage"`
	VolumeLiters     float64   `json:"volumeLiters"`
	CapacityLiters   float64   `json:"capacityLiters"`
	DeviceStatus     string    `json:"deviceStatus"`     // status string as reported by ESP32
	CalculatedStatus string    `json:"calculatedStatus"` // status computed by backend thresholds
	SensorValid      bool      `json:"sensorValid"`
	IsStale          bool      `json:"isStale"`
	UptimeSeconds    int64     `json:"uptimeSeconds"`
	Timestamp        time.Time `json:"timestamp"`  // timestamp from device (or ReceivedAt if absent)
	ReceivedAt       time.Time `json:"receivedAt"` // when backend received the MQTT message
}

// TankConfig holds the physical configuration of the water tank and alert thresholds.
// This is stored in the database and can be updated via the API.
type TankConfig struct {
	LengthCm            float64 `json:"lengthCm"`
	WidthCm             float64 `json:"widthCm"`
	DepthCm             float64 `json:"depthCm"`
	SensorHeightCm      float64 `json:"sensorHeightCm"`
	WarnThresholdPct    float64 `json:"warnThresholdPercent"`
	DangerThresholdPct  float64 `json:"dangerThresholdPercent"`
	StaleTimeoutSeconds int     `json:"staleTimeoutSeconds"`
}

// APIResponse is the standard JSON envelope for all REST API responses.
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// StatusResponse is the payload for GET /api/status.
type StatusResponse struct {
	BackendStatus string         `json:"backendStatus"`
	MQTTStatus    string         `json:"mqttStatus"`   // connected/disconnected/reconnecting/error
	LastReading   *SensorReading `json:"lastReading"`
	LastMessageAt *time.Time     `json:"lastMessageAt"`
	Mode          string         `json:"mode"` // live/demo
}

// SSEEvent is the envelope for all Server-Sent Events pushed to frontend clients.
type SSEEvent struct {
	Type      string      `json:"type"`      // reading/status/connection/stale/error
	Data      interface{} `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
}
