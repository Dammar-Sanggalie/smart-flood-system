// Package api — router wires HTTP routes to handlers with CORS middleware.
package api

import (
	"net/http"

	"smartflood/backend/internal/config"
	"smartflood/backend/internal/service"
)

// NewRouter builds and returns the root http.Handler with all routes registered.
func NewRouter(svc *service.Service, cfg *config.Config) http.Handler {
	mux := http.NewServeMux()

	// Register all application routes.
	mux.HandleFunc("/api/health", HealthHandler(svc))
	mux.HandleFunc("/api/status", StatusHandler(svc))
	mux.HandleFunc("/api/readings/latest", LatestReadingHandler(svc))
	mux.HandleFunc("/api/readings/history", HistoryHandler(svc))
	mux.HandleFunc("/api/config", configRouter(svc)) // GET + PUT on same path
	mux.HandleFunc("/api/events", SSEHandler(svc))

	// Wrap with CORS middleware.
	return corsMiddleware(cfg.FrontendURL)(mux)
}

// configRouter dispatches GET and PUT to the appropriate handler on /api/config.
func configRouter(svc *service.Service) http.HandlerFunc {
	getHandler := GetConfigHandler(svc)
	putHandler := UpdateConfigHandler(svc)

	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			getHandler(w, r)
		case http.MethodPut:
			putHandler(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	}
}

// corsMiddleware returns a middleware that adds CORS headers to every response
// and handles pre-flight OPTIONS requests automatically.
func corsMiddleware(allowedOrigin string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Allow the configured frontend origin.
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control")
			w.Header().Set("Access-Control-Allow-Credentials", "true")

			// Pre-flight: respond with 204 No Content and stop.
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
