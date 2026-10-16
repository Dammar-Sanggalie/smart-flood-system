// Package service contains the core business logic, state management, and SSE fan-out.
package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"sync"
	"time"

	"smartflood/backend/internal/calculation"
	"smartflood/backend/internal/config"
	"smartflood/backend/internal/models"
	"smartflood/backend/internal/storage"
)

// SSEEvent is re-exported from models for convenience in the api package.
type SSEEvent = models.SSEEvent

// Service is the application core.  All public methods are concurrency-safe.
type Service struct {
	mu          sync.RWMutex
	tankConfig  *models.TankConfig
	lastReading *models.SensorReading
	lastMsgAt   *time.Time
	mqttStatus  string
	sseClients  map[chan SSEEvent]struct{}
	db          *storage.DB
	appCfg      *config.Config
}

// NewService creates a Service and loads tank config from the database (or falls back to defaults).
func NewService(cfg *config.Config, db *storage.DB) *Service {
	s := &Service{
		mqttStatus: "disconnected",
		sseClients: make(map[chan SSEEvent]struct{}),
		db:         db,
		appCfg:     cfg,
	}

	// Try to load persisted tank config; fall back to application defaults.
	dbCfg, err := db.LoadConfig()
	if err != nil {
		log.Printf("[Service] Could not load config from DB: %v — using defaults", err)
	}
	if dbCfg != nil {
		s.tankConfig = dbCfg
	} else {
		s.tankConfig = &models.TankConfig{
			LengthCm:            cfg.DefaultTankLength,
			WidthCm:             cfg.DefaultTankWidth,
			DepthCm:             cfg.DefaultTankDepth,
			SensorHeightCm:      cfg.DefaultSensorHeight,
			WarnThresholdPct:    cfg.DefaultWarnThreshold,
			DangerThresholdPct:  cfg.DefaultDangerThreshold,
			StaleTimeoutSeconds: cfg.DefaultStaleTimeout,
		}
	}

	return s
}

// Start launches background goroutines.  ctx cancellation stops them cleanly.
func (s *Service) Start(ctx context.Context) {
	go s.staleChecker(ctx)
	if s.appCfg.DemoMode {
		log.Println("[Service] Demo mode active — generating synthetic sensor data")
		go s.demoGenerator(ctx)
	}
}

// ─── MQTT integration ────────────────────────────────────────────────────────

// ProcessMQTTMessage is the handler callback wired to the MQTT client.
// parse → validate → calculate → store → broadcast SSE
func (s *Service) ProcessMQTTMessage(payload []byte) {
	var p models.MQTTPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		log.Printf("[Service] JSON unmarshal error: %v", err)
		return
	}

	// Double-check distance validity (MQTT client already checks, but be defensive).
	if !calculation.IsValidDistance(p.DistanceCm) {
		log.Printf("[Service] Dropping reading with invalid distanceCm=%v from device=%q",
			p.DistanceCm, p.DeviceID)
		return
	}

	s.mu.RLock()
	cfg := s.tankConfig
	s.mu.RUnlock()

	waterLevel, fillPct, volumeLiters, capacityLiters := calculation.CalculateAll(p.DistanceCm, cfg)
	calcStatus := calculation.DetermineCalculatedStatus(fillPct, cfg)

	now := time.Now().UTC()

	// Parse optional device timestamp; fall back to reception time.
	ts := now
	if p.Timestamp != "" {
		if t, err := time.Parse(time.RFC3339, p.Timestamp); err == nil {
			ts = t.UTC()
		}
	}

	sensorValid := true
	if p.SensorValid != nil {
		sensorValid = *p.SensorValid
	}

	var uptimeSeconds int64
	if p.UptimeSeconds != nil {
		uptimeSeconds = *p.UptimeSeconds
	}

	r := &models.SensorReading{
		DeviceID:         p.DeviceID,
		DistanceCm:       p.DistanceCm,
		WaterLevelCm:     waterLevel,
		FillPercentage:   fillPct,
		VolumeLiters:     volumeLiters,
		CapacityLiters:   capacityLiters,
		DeviceStatus:     p.Status,
		CalculatedStatus: calcStatus,
		SensorValid:      sensorValid,
		IsStale:          false,
		UptimeSeconds:    uptimeSeconds,
		Timestamp:        ts,
		ReceivedAt:       now,
	}

	// Persist to database.
	if err := s.db.SaveReading(r); err != nil {
		log.Printf("[Service] DB save error: %v", err)
	}

	// Update in-memory state.
	s.mu.Lock()
	s.lastReading = r
	s.lastMsgAt = &now
	s.mu.Unlock()

	// Push to all SSE subscribers.
	s.BroadcastSSE(SSEEvent{
		Type:      "reading",
		Data:      r,
		Timestamp: now,
	})

	log.Printf("[Service] Reading processed: device=%q dist=%.1fcm level=%.1fcm fill=%.1f%% status=%s",
		r.DeviceID, r.DistanceCm, r.WaterLevelCm, r.FillPercentage, r.CalculatedStatus)
}

// ─── State accessors ─────────────────────────────────────────────────────────

// GetLatestReading returns the most recent in-memory reading (may be nil).
func (s *Service) GetLatestReading() *models.SensorReading {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.lastReading
}

// GetConfig returns a copy of the current tank configuration.
func (s *Service) GetConfig() *models.TankConfig {
	s.mu.RLock()
	defer s.mu.RUnlock()
	// Return a copy so callers cannot mutate shared state.
	cfgCopy := *s.tankConfig
	return &cfgCopy
}

// UpdateConfig validates, persists, and applies a new tank configuration.
// If there is an existing reading it is recalculated with the new config and broadcast.
func (s *Service) UpdateConfig(cfg *models.TankConfig) error {
	if err := validateConfig(cfg); err != nil {
		return err
	}

	if err := s.db.SaveConfig(cfg); err != nil {
		return fmt.Errorf("service: save config: %w", err)
	}

	s.mu.Lock()
	s.tankConfig = cfg

	// Recalculate the last reading with the new config dimensions.
	if s.lastReading != nil {
		r := s.lastReading
		wl, fillPct, vol, cap := calculation.CalculateAll(r.DistanceCm, cfg)
		r.WaterLevelCm = wl
		r.FillPercentage = fillPct
		r.VolumeLiters = vol
		r.CapacityLiters = cap
		r.CalculatedStatus = calculation.DetermineCalculatedStatus(fillPct, cfg)
	}
	s.mu.Unlock()

	// Notify clients that config changed.
	s.BroadcastSSE(SSEEvent{
		Type:      "status",
		Data:      map[string]string{"event": "config_updated"},
		Timestamp: time.Now().UTC(),
	})

	log.Printf("[Service] Tank config updated: %+v", cfg)
	return nil
}

// GetStatus assembles the full status payload for the /api/status endpoint.
func (s *Service) GetStatus() models.StatusResponse {
	s.mu.RLock()
	defer s.mu.RUnlock()

	mode := "live"
	if s.appCfg.DemoMode {
		mode = "demo"
	}

	return models.StatusResponse{
		BackendStatus: "ok",
		MQTTStatus:    s.mqttStatus,
		LastReading:   s.lastReading,
		LastMessageAt: s.lastMsgAt,
		Mode:          mode,
	}
}

// GetHistory delegates to the storage layer.
func (s *Service) GetHistory(limit, offset int) ([]models.SensorReading, error) {
	return s.db.GetHistory(limit, offset)
}

// SetMQTTStatus is called by the MQTT client to update connection status.
func (s *Service) SetMQTTStatus(status string) {
	s.mu.Lock()
	s.mqttStatus = status
	s.mu.Unlock()

	s.BroadcastSSE(SSEEvent{
		Type:      "connection",
		Data:      map[string]string{"mqttStatus": status},
		Timestamp: time.Now().UTC(),
	})
}

// ─── SSE fan-out ──────────────────────────────────────────────────────────────

// RegisterSSEClient creates a buffered channel for a new SSE subscriber.
func (s *Service) RegisterSSEClient() chan SSEEvent {
	ch := make(chan SSEEvent, 32) // buffer prevents slow clients from blocking
	s.mu.Lock()
	s.sseClients[ch] = struct{}{}
	s.mu.Unlock()
	log.Printf("[SSE] Client registered (total=%d)", s.sseClientCount())
	return ch
}

// UnregisterSSEClient removes the subscriber and closes its channel.
func (s *Service) UnregisterSSEClient(ch chan SSEEvent) {
	s.mu.Lock()
	delete(s.sseClients, ch)
	close(ch)
	s.mu.Unlock()
	log.Printf("[SSE] Client unregistered (total=%d)", s.sseClientCount())
}

// BroadcastSSE delivers an event to every registered SSE client.
// It uses a non-blocking send so a slow client never blocks the broadcast.
func (s *Service) BroadcastSSE(event SSEEvent) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for ch := range s.sseClients {
		select {
		case ch <- event:
		default:
			// Client channel is full — drop this event rather than block.
			log.Printf("[SSE] Dropped event for slow client (type=%s)", event.Type)
		}
	}
}

func (s *Service) sseClientCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.sseClients)
}

// ─── Background goroutines ───────────────────────────────────────────────────

// staleChecker runs every 5 seconds and marks the last reading as stale
// if no new message has arrived within the configured timeout.
func (s *Service) staleChecker(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.mu.Lock()
			if s.lastMsgAt != nil && s.lastReading != nil {
				timeout := time.Duration(s.tankConfig.StaleTimeoutSeconds) * time.Second
				if time.Since(*s.lastMsgAt) > timeout && !s.lastReading.IsStale {
					s.lastReading.IsStale = true
					r := s.lastReading // capture for broadcast (done outside lock below)
					s.mu.Unlock()

					log.Printf("[Service] Data is now stale — last message: %s", s.lastMsgAt.Format(time.RFC3339))
					s.BroadcastSSE(SSEEvent{
						Type:      "stale",
						Data:      r,
						Timestamp: time.Now().UTC(),
					})
					continue
				}
			}
			s.mu.Unlock()
		}
	}
}

// demoGenerator produces synthetic sensor readings every 2 seconds.
// The simulated distance oscillates sinusoidally between 20 cm and 90 cm.
// Demo readings are NOT persisted to the database.
func (s *Service) demoGenerator(ctx context.Context) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	start := time.Now()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			elapsed := time.Since(start).Seconds()

			// Oscillate between 20 and 90 cm (period ≈ 60 s).
			// sin goes -1…+1; scale to 35 amplitude around midpoint 55.
			distanceCm := 55.0 + 35.0*math.Sin(2*math.Pi*elapsed/60.0)

			s.mu.RLock()
			cfg := s.tankConfig
			s.mu.RUnlock()

			waterLevel, fillPct, volumeLiters, capacityLiters := calculation.CalculateAll(distanceCm, cfg)
			calcStatus := calculation.DetermineCalculatedStatus(fillPct, cfg)

			now := time.Now().UTC()
			sensorValid := true

			r := &models.SensorReading{
				ID:               0, // not persisted
				DeviceID:         "demo-device",
				DistanceCm:       distanceCm,
				WaterLevelCm:     waterLevel,
				FillPercentage:   fillPct,
				VolumeLiters:     volumeLiters,
				CapacityLiters:   capacityLiters,
				DeviceStatus:     calcStatus,
				CalculatedStatus: calcStatus,
				SensorValid:      sensorValid,
				IsStale:          false,
				UptimeSeconds:    int64(elapsed),
				Timestamp:        now,
				ReceivedAt:       now,
			}

			// Update in-memory state so /api/readings/latest returns demo data.
			s.mu.Lock()
			s.lastReading = r
			s.lastMsgAt = &now
			s.mu.Unlock()

			s.BroadcastSSE(SSEEvent{
				Type:      "reading",
				Data:      r,
				Timestamp: now,
			})
		}
	}
}

// ─── Validation ───────────────────────────────────────────────────────────────

// validateConfig checks that the supplied TankConfig is physically sensible.
func validateConfig(cfg *models.TankConfig) error {
	switch {
	case cfg.LengthCm <= 0:
		return fmt.Errorf("lengthCm must be positive")
	case cfg.WidthCm <= 0:
		return fmt.Errorf("widthCm must be positive")
	case cfg.DepthCm <= 0:
		return fmt.Errorf("depthCm must be positive")
	case cfg.SensorHeightCm <= 0:
		return fmt.Errorf("sensorHeightCm must be positive")
	case cfg.WarnThresholdPct < 0 || cfg.WarnThresholdPct > 100:
		return fmt.Errorf("warnThresholdPercent must be 0–100")
	case cfg.DangerThresholdPct < 0 || cfg.DangerThresholdPct > 100:
		return fmt.Errorf("dangerThresholdPercent must be 0–100")
	case cfg.WarnThresholdPct >= cfg.DangerThresholdPct:
		return fmt.Errorf("warnThresholdPercent must be less than dangerThresholdPercent")
	case cfg.StaleTimeoutSeconds <= 0:
		return fmt.Errorf("staleTimeoutSeconds must be positive")
	}
	return nil
}
