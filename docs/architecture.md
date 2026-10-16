# Smart Flood Detection System — Architecture

## Overview

```
ESP32 + HC-SR04
    |
    | Wi-Fi (MQTT over TCP port 1883)
    v
MQTT Broker (test.mosquitto.org)
    |
    v
Backend (Go)
    |--- MQTT Client (subscribe to topic)
    |--- REST API (http://localhost:8080/api/...)
    |--- SSE Stream (http://localhost:8080/api/events)
    |--- SQLite DB (./data/smartflood.db)
    |
    v
Frontend (Next.js)  http://localhost:3000
    |--- Dashboard (SSE listener)
    |--- 3D Tank Visualization (React Three Fiber)
    |--- History Chart (Recharts)
    |--- Config Panel
    |--- Activity Log
```

## Data Flow

```
1. ESP32 reads HC-SR04 distance every N seconds
2. ESP32 publishes MQTT message to topic: ti2024i/kelompok3/smartflood/data
3. Go backend receives MQTT message
4. Go backend validates payload (check sensorValid, distanceCm range)
5. Go backend calculates:
   - waterLevelCm = clamp(sensorHeightCm - distanceCm, 0, tankDepthCm)
   - fillPercentage = (waterLevelCm / tankDepthCm) * 100
   - volumeLiters = (length * width * waterLevelCm) / 1000
   - calculatedStatus = based on fillPercentage vs thresholds
6. Go backend saves reading to SQLite
7. Go backend broadcasts SSE event to all connected browsers
8. Next.js frontend receives SSE event
9. Frontend updates MetricCards, 3D Tank model, Charts, Activity Log
```

## Key Design Decisions

### Why SSE instead of WebSocket?
- Data flows only one direction: server → browser
- SSE is simpler to implement and more reliable for this use case
- SSE auto-reconnects natively in most browsers
- WebSocket would be needed if browser needs to send real-time commands to ESP32

### Why Go backend instead of frontend connecting directly to MQTT?
- Browser cannot connect to MQTT over plain TCP port 1883
- Backend validates, calculates, and stores data before sending to frontend
- Single MQTT connection from backend (not one per browser tab)
- Credentials stay on the server

### Why SQLite?
- Zero configuration for local development and academic demos
- Sufficient for storing thousands of sensor readings
- Easy to backup (single file)
- Can be swapped for PostgreSQL later

### Why React Three Fiber?
- Interactive 3D visualization better represents the physical tank
- OrbitControls lets user inspect tank from different angles
- Smooth water level animation with lerp

## MQTT Status vs. Calculated Status

The system maintains TWO separate statuses:

| Field | Source | Meaning |
|-------|--------|---------|
| `deviceStatus` | Sent by ESP32 in payload | ESP32's own assessment |
| `calculatedStatus` | Computed by Go backend | Based on fillPercentage vs thresholds |

These may differ! The dashboard shows both when they differ.

**ESP32 default thresholds (from firmware):**
- SAFE: distance < 50 cm
- WARNING: 50 ≤ distance < 80 cm  
- DANGER: distance ≥ 80 cm

**Important Note:** These thresholds describe sensor-to-water DISTANCE, not water level.
Since larger distance = lower water level, a DANGER threshold at 80cm distance means
water is far from the sensor, which is actually LOW water. This is counter-intuitive
for a flood detection system. The dashboard's calculated status uses fill percentage
thresholds (configurable) which are more intuitive.

## Security Notes

- MQTT broker is public (test.mosquitto.org) — not suitable for private data
- No authentication on REST API for academic/local use
- Do not expose backend port to the internet without adding authentication
- All secrets (MQTT password if any) stay in .env, never in frontend

## Component Map

```
app/page.tsx
└── DashboardHeader
└── DemoModeBanner (if demo)
└── MetricGrid
│   └── MetricCard × 6
└── TankVisualization
│   └── TankScene (dynamic, no SSR)
│       └── WaterMesh (animated)
│       └── TankBox (wireframe)
│       └── SensorIndicator
│       └── DistanceLine
│       └── Labels (Text)
│       └── OrbitControls
└── WaterLevelChart (Recharts)
└── ConnectionStatus
└── TankConfigForm
└── ActivityLog
```
