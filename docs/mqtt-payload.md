# MQTT Payload Contract — Smart Flood Detection System

## Topic

```
ti2024i/kelompok3/smartflood/data
```

## Broker

| Setting | Default Value |
|---------|--------------|
| Host | test.mosquitto.org |
| Port | 1883 |
| Protocol | MQTT 3.1.1 |
| Auth | None (public broker) |

⚠️ **Warning:** The public broker does not guarantee uptime or data privacy.
For production, use a private broker (e.g., Mosquitto self-hosted, HiveMQ Cloud).

## Payload Format

The backend accepts JSON payloads. All fields except `distanceCm` are optional —
the backend will work with just the distance value.

### Full Payload (all fields)
```json
{
  "deviceId": "smartflood-esp32-01",
  "distanceCm": 40.0,
  "status": "SAFE",
  "sensorValid": true,
  "wifiConnected": true,
  "uptimeSeconds": 120,
  "timestamp": "2026-10-16T10:00:00Z"
}
```

### Minimal Payload (distance only)
```json
{
  "distanceCm": 40.0
}
```

## Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `deviceId` | string | No | Unique identifier for the ESP32 device |
| `distanceCm` | number | **YES** | Distance from sensor to water surface in cm |
| `status` | string | No | Status determined by ESP32 firmware ("SAFE"/"WARNING"/"DANGER") |
| `sensorValid` | boolean | No | Whether the HC-SR04 returned a valid reading |
| `wifiConnected` | boolean | No | Whether ESP32 is connected to WiFi |
| `uptimeSeconds` | integer | No | ESP32 uptime in seconds |
| `timestamp` | string | No | ISO 8601 UTC timestamp from ESP32 |

## Validation Rules (Backend)

The backend rejects or marks readings as invalid if:
- `distanceCm` is missing
- `distanceCm` is not a finite number (NaN, Infinity, -Infinity)
- `distanceCm` is negative
- `distanceCm` is exactly 0 (likely sensor error)
- `sensorValid` is explicitly `false`
- JSON payload is malformed

## Status Logic

### ESP32 Default Distance Thresholds (from existing firmware)
```
SAFE    : distance < 50 cm
WARNING : 50 ≤ distance < 80 cm
DANGER  : distance ≥ 80 cm
```

⚠️ **Note:** These thresholds describe the sensor-to-water DISTANCE.
Since greater distance = lower water level:
- DANGER at 80+ cm distance = VERY LOW water (far from sensor)
- SAFE at <50 cm distance = HIGH water (close to sensor)

This is counter-intuitive for flood detection. The ESP32 firmware thresholds
should be verified against actual physical behavior.

### Dashboard Calculated Status (based on fill percentage)
```
SAFE    : fill < warnThresholdPercent
WARNING : warnThresholdPercent ≤ fill < dangerThresholdPercent
DANGER  : fill ≥ dangerThresholdPercent
```

Default thresholds: WARN=60%, DANGER=80%

Both statuses are stored and displayed separately.

## Calculation Formulas

Given sensor reading `distanceCm` and tank config:

```
waterLevelCm    = clamp(sensorHeightCm - distanceCm, 0, tankDepthCm)
fillPercentage  = clamp((waterLevelCm / tankDepthCm) * 100, 0, 100)
volumeLiters    = (tankLengthCm × tankWidthCm × waterLevelCm) / 1000
capacityLiters  = (tankLengthCm × tankWidthCm × tankDepthCm) / 1000
```

### Example Calculation
```
Tank: 100cm × 50cm × 100cm deep
Sensor height from bottom: 100cm
Distance reading: 40cm

waterLevel    = 100 - 40 = 60 cm
fillPercent   = (60 / 100) × 100 = 60%
volume        = (100 × 50 × 60) / 1000 = 300 liters
capacity      = (100 × 50 × 100) / 1000 = 500 liters
```

## How to Verify MQTT Messages

### Using mosquitto_sub (install Mosquitto tools)
```powershell
mosquitto_sub -h test.mosquitto.org -p 1883 -t "ti2024i/kelompok3/smartflood/data" -v
```

### Using MQTT Explorer (GUI)
1. Download MQTT Explorer from http://mqtt-explorer.com
2. Connect to test.mosquitto.org:1883
3. Subscribe to ti2024i/kelompok3/smartflood/data

### Sending Test Message (mosquitto_pub)
```powershell
mosquitto_pub -h test.mosquitto.org -p 1883 -t "ti2024i/kelompok3/smartflood/data" -m '{"deviceId":"test","distanceCm":40.0,"status":"SAFE","sensorValid":true}'
```

## Adjusting Firmware (Minimal Patch)

If the current ESP32 firmware does not send `sensorValid` or `deviceId`,
the backend will still work using `distanceCm` alone.

To add `sensorValid` to the ESP32 payload (Arduino/PlatformIO):
```cpp
// In the JSON serialization section, add:
doc["sensorValid"] = (distance > 0 && distance < 400); // HC-SR04 range
doc["deviceId"] = "smartflood-esp32-01";
doc["uptimeSeconds"] = millis() / 1000;
```

Do NOT change GPIO pins, Wi-Fi connection logic, or sensor reading logic
unless there is a technical reason. Only add the new JSON fields.
