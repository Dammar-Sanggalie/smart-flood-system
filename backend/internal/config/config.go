// Package config loads application configuration from environment variables.
// All secrets (passwords) are loaded but never logged.
package config

import (
	"os"
	"strconv"
)

// Config holds all runtime configuration for the backend.
type Config struct {
	// HTTP server
	Port string

	// MQTT broker
	MQTTBrokerURL string
	MQTTTopic     string
	MQTTClientID  string
	MQTTUsername  string
	MQTTPassword  string // NEVER log this field

	// Application behaviour
	DemoMode    bool   // if true, generate synthetic sensor data instead of reading from MQTT
	DBPath      string // path to the SQLite database file
	FrontendURL string // allowed origin for CORS (e.g. http://localhost:3000)

	// Default tank dimensions / thresholds loaded as fallbacks
	// (the live values are persisted in DB and loaded at startup)
	DefaultTankLength      float64
	DefaultTankWidth       float64
	DefaultTankDepth       float64
	DefaultSensorHeight    float64
	DefaultWarnThreshold   float64 // percent
	DefaultDangerThreshold float64 // percent
	DefaultStaleTimeout    int     // seconds
}

// Load reads environment variables and returns a populated Config.
// Missing variables fall back to sensible defaults.
func Load() *Config {
	return &Config{
		Port:          getEnv("PORT", "8080"),
		MQTTBrokerURL: getEnv("MQTT_BROKER_URL", "tcp://test.mosquitto.org:1883"),
		MQTTTopic:     getEnv("MQTT_TOPIC", "ti2024i/kelompok3/smartflood/data"),
		MQTTClientID:  getEnv("MQTT_CLIENT_ID", "smartflood-backend-001"),
		MQTTUsername:  getEnv("MQTT_USERNAME", ""),
		MQTTPassword:  getEnv("MQTT_PASSWORD", ""), // loaded but never logged
		DemoMode:      getEnvBool("DEMO_MODE", false),
		DBPath:        getEnv("DB_PATH", "./data/smartflood.db"),
		FrontendURL:   getEnv("FRONTEND_URL", "http://localhost:3000"),

		DefaultTankLength:      getEnvFloat("DEFAULT_TANK_LENGTH", 100.0),
		DefaultTankWidth:       getEnvFloat("DEFAULT_TANK_WIDTH", 50.0),
		DefaultTankDepth:       getEnvFloat("DEFAULT_TANK_DEPTH", 100.0),
		DefaultSensorHeight:    getEnvFloat("DEFAULT_SENSOR_HEIGHT", 100.0),
		DefaultWarnThreshold:   getEnvFloat("DEFAULT_WARN_THRESHOLD", 60.0),
		DefaultDangerThreshold: getEnvFloat("DEFAULT_DANGER_THRESHOLD", 80.0),
		DefaultStaleTimeout:    getEnvInt("DEFAULT_STALE_TIMEOUT", 30),
	}
}

// getEnv returns the environment variable value or a default string.
func getEnv(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}

// getEnvBool parses a boolean environment variable ("true"/"1" → true).
func getEnvBool(key string, defaultValue bool) bool {
	v := os.Getenv(key)
	if v == "" {
		return defaultValue
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return defaultValue
	}
	return b
}

// getEnvFloat parses a float64 environment variable.
func getEnvFloat(key string, defaultValue float64) float64 {
	v := os.Getenv(key)
	if v == "" {
		return defaultValue
	}
	f, err := strconv.ParseFloat(v, 64)
	if err != nil {
		return defaultValue
	}
	return f
}

// getEnvInt parses an int environment variable.
func getEnvInt(key string, defaultValue int) int {
	v := os.Getenv(key)
	if v == "" {
		return defaultValue
	}
	i, err := strconv.Atoi(v)
	if err != nil {
		return defaultValue
	}
	return i
}
