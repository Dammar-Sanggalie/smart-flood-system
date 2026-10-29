#heading(numbering: none)[Lampiran]

#show raw: set text(size: 7.5pt)
#show raw.where(block: true): set par(leading: 0.45em)
#show raw.where(block: true): it => block(
  width: 100%,
  stroke: 0.5pt + black,
  inset: 5pt,
  fill: luma(252),
  breakable: true,
  it,
)

#heading(level: 2, numbering: none)[Lampiran A: Algoritma Inti Firmware ESP32 (Arduino C++)]

```cpp
// 1. Pembacaan Ultrasonik & Konversi Elevasi Wadah
bool readWaterLevel() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(3);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  if (duration == 0) return false;
  float measuredDistance = duration / 58.0;
  if (measuredDistance > 400.0) return false;
  distanceCm = measuredDistance;
  if (measuredDistance <= 2.0) waterLevelCm = TINGGI_REFERENSI_CM;
  else {
    waterLevelCm = TINGGI_REFERENSI_CM - measuredDistance;
    if (waterLevelCm < 0) waterLevelCm = 0;
    if (waterLevelCm > TINGGI_REFERENSI_CM) waterLevelCm = TINGGI_REFERENSI_CM;
  }
  return true;
}

// 2. Evaluasi Mesin Status Bahaya (Four-State FSM)
WaterStatus determineStatus(float level) {
  if (level >= THRESHOLD_DANGER)  return DANGER_STATE;  // level >= 80 cm (Bahaya)
  if (level >= THRESHOLD_WARNING) return WARNING_STATE; // 50 <= level < 80 cm (Siaga)
  return SAFE_STATE;                                    // level < 50 cm (Aman)
}

// 3. Penjadwalan Multi-Interval Non-Blocking Berbasis millis()
void loop() {
  unsigned long now = millis();
  if (now - lastSensorRead >= SENSOR_INTERVAL) { // Task 1: Akuisisi Sensor (2 Hz)
    lastSensorRead = now;
    sensorValid = readWaterLevel();
    currentStatus = sensorValid ? determineStatus(waterLevelCm) : SENSOR_ERROR_STATE;
  }
  if (now - lastLEDUpdate >= LED_ANIMATION_INTERVAL) { // Task 2: Running LED (10 Hz)
    lastLEDUpdate = now;
    updateActuators();
  }
  if (now - lastLCDUpdate >= LCD_ANIMATION_INTERVAL) { // Task 3: Strobo LCD (6.6 Hz)
    lastLCDUpdate = now;
    updateLCD();
  }
  if (now - lastPublish >= PUBLISH_INTERVAL) { // Task 4: HTTP POST JSON (0.5 Hz)
    lastPublish = now;
    sendToBackend();
  }
}
```

#heading(level: 2, numbering: none)[Lampiran B: Format Telemetri JSON & Log Respons Backend]

```text
POST -> {"deviceId":"smartflood-esp32-01","distanceCm":35.2,"waterLevelCm":64.8,
         "status":"WARNING","sensorValid":true,"wifiConnected":true,"uptimeSeconds":142}
Backend response: 200 OK (Ingested to SQLite & Broadcasted via SSE)
```
