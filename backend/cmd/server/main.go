// cmd/server/main.go — application entry point for the Smart Flood Detection backend.
//
// Start order:
//  1. Load config from env vars
//  2. Open SQLite database, run migrations
//  3. Create service (loads tank config from DB)
//  4. Optionally create and connect MQTT client
//  5. Start service background goroutines
//  6. Start HTTP server
//  7. Block until SIGINT/SIGTERM
//  8. Graceful shutdown: cancel context → disconnect MQTT → close DB → stop HTTP
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"smartflood/backend/internal/api"
	"smartflood/backend/internal/config"
	"smartflood/backend/internal/mqtt"
	"smartflood/backend/internal/service"
	"smartflood/backend/internal/storage"
)

func main() {
	// Load .env file if it exists (non-fatal if missing).
	_ = godotenv.Load()

	log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds | log.Lshortfile)
	log.Println("[Main] Starting Smart Flood Detection backend…")

	// ── 1. Config ──────────────────────────────────────────────────────────────
	cfg := config.Load()
	log.Printf("[Main] Config loaded: port=%s broker=%s topic=%s demo=%v",
		cfg.Port, cfg.MQTTBrokerURL, cfg.MQTTTopic, cfg.DemoMode)

	// ── 2. Database ────────────────────────────────────────────────────────────
	db, err := storage.NewDB(cfg.DBPath)
	if err != nil {
		log.Fatalf("[Main] Failed to open database: %v", err)
	}
	if err := db.Init(); err != nil {
		log.Fatalf("[Main] Failed to initialise database schema: %v", err)
	}
	log.Printf("[Main] Database ready at %s", cfg.DBPath)

	// ── 3. Service ─────────────────────────────────────────────────────────────
	svc := service.NewService(cfg, db)

	// ── 4. MQTT client (skipped in demo mode) ──────────────────────────────────
	var mqttClient *mqtt.Client
	if !cfg.DemoMode {
		mqttClient = mqtt.NewClient(cfg, func(payload []byte) {
			svc.ProcessMQTTMessage(payload)
		})

		if err := mqttClient.Connect(); err != nil {
			// Non-fatal: AutoReconnect will keep trying in the background.
			log.Printf("[Main] Initial MQTT connect failed: %v — will retry automatically", err)
			svc.SetMQTTStatus("reconnecting")
		} else {
			svc.SetMQTTStatus("connected")
		}

		// Mirror the MQTT client's live status into the service every 10 s.
		// This handles the case where paho reconnects without a SetOnConnectHandler
		// callback reaching our code (belt-and-suspenders).
		go func() {
			for {
				time.Sleep(10 * time.Second)
				svc.SetMQTTStatus(mqttClient.GetStatus())
			}
		}()
	} else {
		svc.SetMQTTStatus("demo")
		log.Println("[Main] Demo mode — MQTT client not started")
	}

	// ── 5. Service background goroutines ───────────────────────────────────────
	ctx, cancel := context.WithCancel(context.Background())
	svc.Start(ctx)

	// ── 6. HTTP server ─────────────────────────────────────────────────────────
	router := api.NewRouter(svc, cfg)
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 0, // 0 = no timeout — required for SSE long-lived connections
		IdleTimeout:  60 * time.Second,
	}

	serverErrCh := make(chan error, 1)
	go func() {
		log.Printf("[Main] HTTP server listening on :%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			serverErrCh <- err
		}
	}()

	// ── 7. Signal handling ─────────────────────────────────────────────────────
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	select {
	case sig := <-sigCh:
		log.Printf("[Main] Received signal: %v — shutting down…", sig)
	case err := <-serverErrCh:
		log.Printf("[Main] HTTP server error: %v — shutting down…", err)
	}

	// ── 8. Graceful shutdown ───────────────────────────────────────────────────
	// Cancel context → stops stale checker and demo generator goroutines.
	cancel()

	// Give active HTTP connections (including SSE streams) time to drain.
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("[Main] HTTP shutdown error: %v", err)
	}

	// Disconnect MQTT cleanly.
	if mqttClient != nil {
		mqttClient.Disconnect()
	}

	// Close the database connection pool.
	if err := db.Close(); err != nil {
		log.Printf("[Main] DB close error: %v", err)
	}

	log.Println("[Main] Shutdown complete.")
}
