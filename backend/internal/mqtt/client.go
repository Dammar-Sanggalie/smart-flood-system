// Package mqtt provides an MQTT client with automatic reconnection.
// It subscribes to a configurable topic and forwards raw payloads to a handler.
package mqtt

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	pahomqtt "github.com/eclipse/paho.mqtt.golang"

	"smartflood/backend/internal/calculation"
	"smartflood/backend/internal/config"
	"smartflood/backend/internal/models"
)

// MessageHandler is called with the raw JSON bytes of each valid incoming MQTT message.
// It runs in the MQTT library's goroutine, so implementations must be concurrency-safe.
type MessageHandler func(payload []byte)

// statusConnected and friends are the possible values returned by GetStatus().
const (
	statusConnected     = "connected"
	statusDisconnected  = "disconnected"
	statusReconnecting  = "reconnecting"
	statusError         = "error"
)

// Client wraps the paho MQTT client with status tracking and reconnect logic.
type Client struct {
	mu      sync.RWMutex
	paho    pahomqtt.Client
	cfg     *config.Config
	handler MessageHandler
	status  string
}

// NewClient builds an MQTT Client but does not connect yet.
// Call Connect() to establish the broker connection.
func NewClient(cfg *config.Config, handler MessageHandler) *Client {
	c := &Client{
		cfg:     cfg,
		handler: handler,
		status:  statusDisconnected,
	}

	opts := pahomqtt.NewClientOptions()
	opts.AddBroker(cfg.MQTTBrokerURL)
	opts.SetClientID(cfg.MQTTClientID)
	opts.SetCleanSession(true)
	opts.SetAutoReconnect(true)
	opts.SetMaxReconnectInterval(30 * time.Second)
	opts.SetConnectRetryInterval(5 * time.Second)
	opts.SetConnectRetry(true)
	opts.SetKeepAlive(30 * time.Second)
	opts.SetPingTimeout(10 * time.Second)

	// Only set credentials when provided — avoid sending empty username.
	if cfg.MQTTUsername != "" {
		opts.SetUsername(cfg.MQTTUsername)
		opts.SetPassword(cfg.MQTTPassword) // password is intentionally never logged
	}

	// OnConnect fires both for the initial connection and after every reconnect.
	// We subscribe here so the subscription is restored after broker restarts.
	opts.SetOnConnectHandler(func(cl pahomqtt.Client) {
		c.setStatus(statusConnected)
		log.Printf("[MQTT] Connected to %s (clientID=%s)", cfg.MQTTBrokerURL, cfg.MQTTClientID)
		c.subscribe(cl)
	})

	opts.SetConnectionLostHandler(func(cl pahomqtt.Client, err error) {
		c.setStatus(statusReconnecting)
		// Log the error but NEVER log the password.
		log.Printf("[MQTT] Connection lost (broker=%s): %v — reconnecting…", cfg.MQTTBrokerURL, err)
	})

	opts.SetReconnectingHandler(func(cl pahomqtt.Client, opts *pahomqtt.ClientOptions) {
		c.setStatus(statusReconnecting)
		log.Printf("[MQTT] Attempting reconnect to %s…", cfg.MQTTBrokerURL)
	})

	c.paho = pahomqtt.NewClient(opts)
	return c
}

// Connect initiates the connection to the broker.
// It returns an error if the initial connection attempt fails.
func (c *Client) Connect() error {
	token := c.paho.Connect()
	if token.WaitTimeout(15 * time.Second) && token.Error() != nil {
		c.setStatus(statusError)
		return fmt.Errorf("mqtt: connect: %w", token.Error())
	}
	// If timeout but no error yet, let AutoReconnect handle it.
	return nil
}

// Disconnect cleanly shuts down the MQTT connection.
func (c *Client) Disconnect() {
	log.Println("[MQTT] Disconnecting…")
	c.paho.Disconnect(500) // 500 ms quiesce window
	c.setStatus(statusDisconnected)
}

// GetStatus returns the current connection status string.
// Safe to call from any goroutine.
func (c *Client) GetStatus() string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.status
}

// ─── internal ────────────────────────────────────────────────────────────────

func (c *Client) setStatus(s string) {
	c.mu.Lock()
	c.status = s
	c.mu.Unlock()
}

// subscribe registers the message callback for the configured topic.
// QoS 1 ensures at-least-once delivery.
func (c *Client) subscribe(cl pahomqtt.Client) {
	topic := c.cfg.MQTTTopic
	token := cl.Subscribe(topic, 1, c.messageCallback)
	go func() {
		token.Wait()
		if err := token.Error(); err != nil {
			log.Printf("[MQTT] Subscribe error (topic=%s): %v", topic, err)
		} else {
			log.Printf("[MQTT] Subscribed to topic: %s", topic)
		}
	}()
}

// messageCallback is invoked by the paho library for every received message.
// It validates the payload before forwarding it to the handler.
func (c *Client) messageCallback(_ pahomqtt.Client, msg pahomqtt.Message) {
	raw := msg.Payload()

	// Quick structural validation — must be valid JSON with a distanceCm field.
	var payload models.MQTTPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		log.Printf("[MQTT] Malformed JSON on topic %s: %v — payload dropped", msg.Topic(), err)
		return
	}

	// Reject sensor readings with invalid distance values.
	if !calculation.IsValidDistance(payload.DistanceCm) {
		log.Printf("[MQTT] Invalid distanceCm=%v from device=%q — payload dropped",
			payload.DistanceCm, payload.DeviceID)
		return
	}

	// Forward the raw bytes to the service layer — it owns the business logic.
	c.handler(raw)
}
