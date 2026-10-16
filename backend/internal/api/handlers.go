// Package api contains all HTTP request handlers.
// Every handler follows the same pattern:
//   - Set CORS + content-type headers via middleware (router.go)
//   - Decode request (if needed)
//   - Delegate to service
//   - Encode JSON response using APIResponse wrapper
package api

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"

	"smartflood/backend/internal/models"
	"smartflood/backend/internal/service"
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

// writeJSON serialises v as JSON and writes it to w with the given HTTP status code.
func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("[API] JSON encode error: %v", err)
	}
}

// ok is a convenience wrapper for successful API responses.
func ok(w http.ResponseWriter, data interface{}) {
	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: data})
}

// fail writes an error API response.
func fail(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, models.APIResponse{Success: false, Error: msg})
}

// ─── Handlers ────────────────────────────────────────────────────────────────

// HealthHandler handles GET /api/health.
// Used by load balancers and health checks — always returns 200 when the process is up.
func HealthHandler(svc *service.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ok(w, map[string]interface{}{
			"status":    "ok",
			"timestamp": time.Now().UTC(),
		})
	}
}

// StatusHandler handles GET /api/status.
// Returns backend status, MQTT connection state, last reading, and operating mode.
func StatusHandler(svc *service.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ok(w, svc.GetStatus())
	}
}

// LatestReadingHandler handles GET /api/readings/latest.
func LatestReadingHandler(svc *service.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		reading := svc.GetLatestReading()
		if reading == nil {
			fail(w, http.StatusNotFound, "no readings available yet")
			return
		}
		ok(w, reading)
	}
}

// IngestReadingHandler handles POST /api/readings.
// Accepts the same JSON payload as the MQTT topic (MQTTPayload) so the ESP32
// can push sensor data directly over HTTP without an MQTT broker.
func IngestReadingHandler(svc *service.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			fail(w, http.StatusMethodNotAllowed, "use POST")
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			fail(w, http.StatusBadRequest, "failed to read request body")
			return
		}
		defer r.Body.Close()

		if len(body) == 0 {
			fail(w, http.StatusBadRequest, "empty body")
			return
		}

		// Delegate to the same processing pipeline as MQTT messages.
		svc.ProcessMQTTMessage(body)

		ok(w, map[string]interface{}{"status": "received"})
	}
}


// HistoryHandler handles GET /api/readings?limit=100&offset=0.
func HistoryHandler(svc *service.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		limit, err := queryInt(r, "limit", 100)
		if err != nil || limit <= 0 || limit > 1000 {
			fail(w, http.StatusBadRequest, "limit must be an integer between 1 and 1000")
			return
		}
		offset, err := queryInt(r, "offset", 0)
		if err != nil || offset < 0 {
			fail(w, http.StatusBadRequest, "offset must be a non-negative integer")
			return
		}

		readings, err := svc.GetHistory(limit, offset)
		if err != nil {
			log.Printf("[API] GetHistory error: %v", err)
			fail(w, http.StatusInternalServerError, "failed to retrieve history")
			return
		}

		// Return empty array instead of null when there are no readings.
		if readings == nil {
			readings = []models.SensorReading{}
		}
		ok(w, readings)
	}
}

// GetConfigHandler handles GET /api/config.
func GetConfigHandler(svc *service.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ok(w, svc.GetConfig())
	}
}

// UpdateConfigHandler handles PUT /api/config.
// Validates the JSON body and updates the running tank configuration.
func UpdateConfigHandler(svc *service.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			fail(w, http.StatusMethodNotAllowed, "use PUT")
			return
		}

		var cfg models.TankConfig
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			fail(w, http.StatusBadRequest, fmt.Sprintf("invalid JSON: %v", err))
			return
		}

		if err := svc.UpdateConfig(&cfg); err != nil {
			fail(w, http.StatusBadRequest, err.Error())
			return
		}

		ok(w, svc.GetConfig())
	}
}

// SSEHandler handles GET /api/events — the Server-Sent Events stream.
//
// Protocol:
//   - Content-Type: text/event-stream
//   - Each event: "data: {json}\n\n"
//   - Sends an initial "status" event immediately after the client connects.
//   - Blocks until the client disconnects or the server shuts down.
func SSEHandler(svc *service.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Verify the client supports streaming (has http.Flusher).
		flusher, ok := w.(http.Flusher)
		if !ok {
			fail(w, http.StatusInternalServerError, "streaming not supported")
			return
		}

		// SSE required headers.
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("X-Accel-Buffering", "no") // disable nginx buffering

		// Register this client.
		ch := svc.RegisterSSEClient()
		defer svc.UnregisterSSEClient(ch)

		// Send an immediate status snapshot so the client gets current state
		// without waiting for the next MQTT message.
		sendSSE(w, flusher, models.SSEEvent{
			Type:      "status",
			Data:      svc.GetStatus(),
			Timestamp: time.Now().UTC(),
		})

		// Block until client disconnects or server shuts down.
		ctx := r.Context()
		for {
			select {
			case event, open := <-ch:
				if !open {
					return // channel was closed by UnregisterSSEClient
				}
				sendSSE(w, flusher, event)
			case <-ctx.Done():
				return
			}
		}
	}
}

// ─── SSE wire format ─────────────────────────────────────────────────────────

// sendSSE serialises event as JSON and writes it in SSE wire format: "data: …\n\n"
func sendSSE(w http.ResponseWriter, flusher http.Flusher, event models.SSEEvent) {
	data, err := json.Marshal(event)
	if err != nil {
		log.Printf("[SSE] Marshal error: %v", err)
		return
	}
	fmt.Fprintf(w, "data: %s\n\n", data)
	flusher.Flush()
}

// ─── Query-string helpers ────────────────────────────────────────────────────

// queryInt parses a query-string integer parameter, returning defaultVal when absent.
func queryInt(r *http.Request, key string, defaultVal int) (int, error) {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return defaultVal, nil
	}
	return strconv.Atoi(raw)
}
