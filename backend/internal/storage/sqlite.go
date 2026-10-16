// Package storage provides SQLite persistence using modernc.org/sqlite (pure Go, no CGO).
package storage

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"smartflood/backend/internal/models"

	_ "modernc.org/sqlite" // register "sqlite" driver
)

// DB wraps a sql.DB for the Smart Flood backend.
type DB struct {
	db *sql.DB
}

// NewDB opens (or creates) the SQLite database at path.
// Parent directories are created automatically.
func NewDB(path string) (*DB, error) {
	// Ensure the parent directory exists
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, fmt.Errorf("storage: create db dir %q: %w", dir, err)
	}

	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("storage: open db %q: %w", path, err)
	}

	// SQLite is single-writer — cap to one writer connection to avoid SQLITE_BUSY.
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(0)

	// Enable WAL mode for better concurrent read performance.
	if _, err := db.Exec("PRAGMA journal_mode=WAL;"); err != nil {
		return nil, fmt.Errorf("storage: set WAL mode: %w", err)
	}

	return &DB{db: db}, nil
}

// Init creates the tables if they do not already exist.
func (d *DB) Init() error {
	const createReadings = `
CREATE TABLE IF NOT EXISTS readings (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id        TEXT    NOT NULL,
    distance_cm      REAL    NOT NULL,
    water_level_cm   REAL    NOT NULL,
    fill_percentage  REAL    NOT NULL,
    volume_liters    REAL    NOT NULL,
    capacity_liters  REAL    NOT NULL,
    device_status    TEXT    NOT NULL DEFAULT '',
    calculated_status TEXT   NOT NULL DEFAULT 'SAFE',
    sensor_valid     INTEGER NOT NULL DEFAULT 1,
    uptime_seconds   INTEGER NOT NULL DEFAULT 0,
    timestamp        TEXT    NOT NULL,
    received_at      TEXT    NOT NULL
);`

	const createConfig = `
CREATE TABLE IF NOT EXISTS config (
    id                       INTEGER PRIMARY KEY DEFAULT 1,
    length_cm                REAL    NOT NULL DEFAULT 100.0,
    width_cm                 REAL    NOT NULL DEFAULT 50.0,
    depth_cm                 REAL    NOT NULL DEFAULT 100.0,
    sensor_height_cm         REAL    NOT NULL DEFAULT 100.0,
    warn_threshold_pct       REAL    NOT NULL DEFAULT 60.0,
    danger_threshold_pct     REAL    NOT NULL DEFAULT 80.0,
    stale_timeout_seconds    INTEGER NOT NULL DEFAULT 30,
    updated_at               TEXT    NOT NULL
);`

	if _, err := d.db.Exec(createReadings); err != nil {
		return fmt.Errorf("storage: create readings table: %w", err)
	}
	if _, err := d.db.Exec(createConfig); err != nil {
		return fmt.Errorf("storage: create config table: %w", err)
	}
	return nil
}

// SaveReading inserts a new SensorReading row and populates r.ID with the inserted rowid.
func (d *DB) SaveReading(r *models.SensorReading) error {
	const q = `
INSERT INTO readings
    (device_id, distance_cm, water_level_cm, fill_percentage, volume_liters,
     capacity_liters, device_status, calculated_status, sensor_valid,
     uptime_seconds, timestamp, received_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	sensorValid := 0
	if r.SensorValid {
		sensorValid = 1
	}

	res, err := d.db.Exec(q,
		r.DeviceID,
		r.DistanceCm,
		r.WaterLevelCm,
		r.FillPercentage,
		r.VolumeLiters,
		r.CapacityLiters,
		r.DeviceStatus,
		r.CalculatedStatus,
		sensorValid,
		r.UptimeSeconds,
		r.Timestamp.UTC().Format(time.RFC3339Nano),
		r.ReceivedAt.UTC().Format(time.RFC3339Nano),
	)
	if err != nil {
		return fmt.Errorf("storage: insert reading: %w", err)
	}
	id, _ := res.LastInsertId()
	r.ID = id
	return nil
}

// GetLatestReading returns the most recently inserted reading, or nil if none exist.
func (d *DB) GetLatestReading() (*models.SensorReading, error) {
	const q = `
SELECT id, device_id, distance_cm, water_level_cm, fill_percentage,
       volume_liters, capacity_liters, device_status, calculated_status,
       sensor_valid, uptime_seconds, timestamp, received_at
FROM readings
ORDER BY id DESC
LIMIT 1`

	row := d.db.QueryRow(q)
	r, err := scanReading(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return r, err
}

// GetHistory returns up to limit readings starting at offset, newest first.
func (d *DB) GetHistory(limit, offset int) ([]models.SensorReading, error) {
	const q = `
SELECT id, device_id, distance_cm, water_level_cm, fill_percentage,
       volume_liters, capacity_liters, device_status, calculated_status,
       sensor_valid, uptime_seconds, timestamp, received_at
FROM readings
ORDER BY id DESC
LIMIT ? OFFSET ?`

	rows, err := d.db.Query(q, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("storage: query history: %w", err)
	}
	defer rows.Close()

	var results []models.SensorReading
	for rows.Next() {
		r, err := scanReadingFromRows(rows)
		if err != nil {
			return nil, fmt.Errorf("storage: scan history row: %w", err)
		}
		results = append(results, *r)
	}
	return results, rows.Err()
}

// SaveConfig upserts the single config row (always id=1).
func (d *DB) SaveConfig(cfg *models.TankConfig) error {
	const q = `
INSERT INTO config (id, length_cm, width_cm, depth_cm, sensor_height_cm,
                    warn_threshold_pct, danger_threshold_pct, stale_timeout_seconds, updated_at)
VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
    length_cm             = excluded.length_cm,
    width_cm              = excluded.width_cm,
    depth_cm              = excluded.depth_cm,
    sensor_height_cm      = excluded.sensor_height_cm,
    warn_threshold_pct    = excluded.warn_threshold_pct,
    danger_threshold_pct  = excluded.danger_threshold_pct,
    stale_timeout_seconds = excluded.stale_timeout_seconds,
    updated_at            = excluded.updated_at`

	_, err := d.db.Exec(q,
		cfg.LengthCm,
		cfg.WidthCm,
		cfg.DepthCm,
		cfg.SensorHeightCm,
		cfg.WarnThresholdPct,
		cfg.DangerThresholdPct,
		cfg.StaleTimeoutSeconds,
		time.Now().UTC().Format(time.RFC3339),
	)
	if err != nil {
		return fmt.Errorf("storage: upsert config: %w", err)
	}
	return nil
}

// LoadConfig retrieves the stored tank config.  Returns nil if none has been saved yet.
func (d *DB) LoadConfig() (*models.TankConfig, error) {
	const q = `
SELECT length_cm, width_cm, depth_cm, sensor_height_cm,
       warn_threshold_pct, danger_threshold_pct, stale_timeout_seconds
FROM config WHERE id = 1`

	row := d.db.QueryRow(q)
	var cfg models.TankConfig
	err := row.Scan(
		&cfg.LengthCm,
		&cfg.WidthCm,
		&cfg.DepthCm,
		&cfg.SensorHeightCm,
		&cfg.WarnThresholdPct,
		&cfg.DangerThresholdPct,
		&cfg.StaleTimeoutSeconds,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("storage: load config: %w", err)
	}
	return &cfg, nil
}

// Close shuts down the database connection pool.
func (d *DB) Close() error {
	return d.db.Close()
}

// ─── helpers ─────────────────────────────────────────────────────────────────

// rowScanner abstracts both *sql.Row and *sql.Rows so we can share scan logic.
type rowScanner interface {
	Scan(dest ...interface{}) error
}

func scanReading(row rowScanner) (*models.SensorReading, error) {
	return scanReadingFromRows(row)
}

func scanReadingFromRows(row rowScanner) (*models.SensorReading, error) {
	var r models.SensorReading
	var sensorValid int
	var tsStr, raStr string

	err := row.Scan(
		&r.ID,
		&r.DeviceID,
		&r.DistanceCm,
		&r.WaterLevelCm,
		&r.FillPercentage,
		&r.VolumeLiters,
		&r.CapacityLiters,
		&r.DeviceStatus,
		&r.CalculatedStatus,
		&sensorValid,
		&r.UptimeSeconds,
		&tsStr,
		&raStr,
	)
	if err != nil {
		return nil, err
	}

	r.SensorValid = sensorValid != 0

	// Parse timestamps — be lenient with format.
	if t, err := time.Parse(time.RFC3339Nano, tsStr); err == nil {
		r.Timestamp = t
	} else if t, err := time.Parse(time.RFC3339, tsStr); err == nil {
		r.Timestamp = t
	}

	if t, err := time.Parse(time.RFC3339Nano, raStr); err == nil {
		r.ReceivedAt = t
	} else if t, err := time.Parse(time.RFC3339, raStr); err == nil {
		r.ReceivedAt = t
	}

	return &r, nil
}
