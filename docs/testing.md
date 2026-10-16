# Testing Guide — Smart Flood Detection System

## Unit Test Coverage (Backend Go)

All water calculation tests are in `backend/internal/calculation/water_test.go`.

### Run Tests

```powershell
cd "c:\Users\mohre\Documents\Kuliah Dammar\Project\IOT\smart-flood-system\backend"
go test ./internal/calculation/... -v
```

### Test Cases

| Case | Input | Expected Output |
|------|-------|----------------|
| A — Empty tank | distance=100, sensorH=100, depth=100 | level=0, fill=0%, vol=0 |
| B — Half full | distance=50, sensorH=100, depth=100, 100×50 | level=50, fill=50%, vol=250L |
| C — 60% full | distance=40, sensorH=100, depth=100, 100×50 | level=60, fill=60%, vol=300L |
| D — Distance > sensorH | distance=120, sensorH=100 | level=0 (clamped, not negative) |
| E — Zero distance | distance=0 | IsValid=false |
| F — Negative distance | distance=-5 | IsValid=false |
| G — NaN/Inf distance | distance=NaN/Inf | IsValid=false |
| H — Zero depth | waterLevel=50, depth=0 | fillPct=0 (no divide-by-zero) |

## Integration Testing

### Test 1: Verify MQTT → Backend → SSE Chain

```powershell
# Terminal 1: Start backend
go run ./cmd/server/main.go

# Terminal 2: Listen to SSE
$sse = [System.Net.WebRequest]::Create("http://localhost:8080/api/events")
$sse.Method = "GET"
$response = $sse.GetResponse()
$reader = New-Object System.IO.StreamReader($response.GetResponseStream())
while (!$reader.EndOfStream) { Write-Host $reader.ReadLine() }

# Terminal 3: Send test MQTT message
mosquitto_pub -h test.mosquitto.org -p 1883 -t "ti2024i/kelompok3/smartflood/data" `
  -m '{"deviceId":"test-01","distanceCm":40.0,"status":"SAFE","sensorValid":true}'
```

Expected: SSE stream in Terminal 2 receives a "reading" event with calculated values.

### Test 2: Verify Config Update

```powershell
# Get current config
Invoke-RestMethod -Uri "http://localhost:8080/api/config" | ConvertTo-Json

# Update config
$body = @{
  lengthCm = 100
  widthCm = 50
  depthCm = 100
  sensorHeightCm = 100
  warnThresholdPercent = 60
  dangerThresholdPercent = 80
  staleTimeoutSeconds = 30
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/config" -Method PUT `
  -Body $body -ContentType "application/json"
```

### Test 3: Verify Invalid Payload Handling

```powershell
# Send invalid payload (negative distance)
mosquitto_pub -h test.mosquitto.org -p 1883 -t "ti2024i/kelompok3/smartflood/data" `
  -m '{"distanceCm":-5.0}'

# Expected: Backend logs "Invalid distance" and does NOT update latest reading
Invoke-RestMethod -Uri "http://localhost:8080/api/readings/latest"
```

### Test 4: Stale Data Detection

1. Stop ESP32 or stop sending MQTT messages
2. Wait for staleTimeoutSeconds (default: 30s)
3. Dashboard should show STALE indicator
4. `/api/readings/latest` response should have `"isStale": true`

### Test 5: Demo Mode

```powershell
$env:DEMO_MODE = "true"
go run ./cmd/server/main.go

# Dashboard should show DEMO banner
# SSE should receive readings every 2 seconds
# Readings should NOT be saved to database
Invoke-RestMethod -Uri "http://localhost:8080/api/readings/history"
# Expected: empty array [] (demo readings not saved)
```

## Manual Formula Verification

Verify the dashboard shows correct values:

| Scenario | Distance | Expected Water Level | Expected Fill % | Expected Volume |
|----------|----------|---------------------|----------------|----------------|
| Tank empty | 100cm | 0 cm | 0% | 0 L |
| Tank 25% full | 75cm | 25 cm | 25% | 125 L |
| Tank 50% full | 50cm | 50 cm | 50% | 250 L |
| Tank 60% full | 40cm | 60 cm | 60% | 300 L |
| Tank 80% full | 20cm | 80 cm | 80% | 400 L |
| Tank full | 0cm* | 100 cm | 100% | 500 L |

*Distance of 0 is treated as invalid by default. At distance ~2cm, the tank would be considered nearly full.

Tank dimensions for above table: 100cm × 50cm × 100cm, sensorHeight=100cm

## Known Limitations

1. HC-SR04 minimum range ≈ 2cm — readings below 2cm may be unreliable
2. HC-SR04 maximum range ≈ 400cm — readings above ~350cm are unreliable
3. Public MQTT broker (test.mosquitto.org) may be unavailable or slow
4. SQLite is suitable for development/demo, not high-throughput production use
5. SSE connections may drop on poor networks — auto-reconnect is implemented
