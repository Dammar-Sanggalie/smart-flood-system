#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ── TAMBAHAN: WiFi & HTTP POST ke backend ──────────
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// LCD I2C ESP32
const int LCD_SDA_PIN = 21;
const int LCD_SCL_PIN = 22;

// Ganti sesuai hasil I2C Scanner (0x27 atau 0x3F)
#define LCD_ADDRESS 0x27
LiquidCrystal_I2C lcd(LCD_ADDRESS, 16, 2);

// HC-SR04
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

// LED dan buzzer
const int LED_HIJAU = 25;
const int LED_KUNING = 26;
const int LED_MERAH_1 = 27; // Merah Kiri
const int LED_MERAH_2 = 33; // Merah Tengah (Tersambung ke pin 33)
const int LED_MERAH_3 = 32; // Merah Kanan (Tersambung ke pin 32)
const int BUZZER_PIN = 14;

// Model wadah simulasi
const float TINGGI_REFERENSI_CM = 100.0;
const float THRESHOLD_WARNING = 50.0;
const float THRESHOLD_DANGER = 80.0;

// Interval waktu (Non-blocking)
const unsigned long SENSOR_INTERVAL = 500;
const unsigned long LCD_ANIMATION_INTERVAL = 150; // Kedip LCD
const unsigned long LED_ANIMATION_INTERVAL = 100; // Kecepatan lari 3 LED Merah

// ── TAMBAHAN: Config WiFi & Backend ────────────────
// Isi 3 variable ini!
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
// IP laptop kamu (cari dengan: ipconfig → IPv4 Address)
const char* BACKEND_URL   = "http://192.168.1.8:8080/api/readings";
const char* DEVICE_ID     = "smartflood-esp32-01";
const unsigned long PUBLISH_INTERVAL = 2000; // Kirim data setiap 2 detik

unsigned long lastSensorRead = 0;
unsigned long lastLCDUpdate = 0;
unsigned long lastLEDUpdate = 0;
unsigned long lastPublish = 0;  // TAMBAHAN

float distanceCm = 0;
float waterLevelCm = 0;
bool sensorValid = false;

enum WaterStatus { SAFE_STATE, WARNING_STATE, DANGER_STATE, SENSOR_ERROR_STATE };
WaterStatus currentStatus = SENSOR_ERROR_STATE;

const char* statusName(WaterStatus status) {
  switch (status) {
    case SAFE_STATE: return "AMAN";
    case WARNING_STATE: return "SIAGA";
    case DANGER_STATE: return "BAHAYA";
    default: return "ERROR";
  }
}

// ── TAMBAHAN: Status untuk backend (English) ──────
const char* backendStatus(WaterStatus status) {
  switch (status) {
    case SAFE_STATE: return "SAFE";
    case WARNING_STATE: return "WARNING";
    case DANGER_STATE: return "DANGER";
    default: return "INVALID";
  }
}

// Tulis maksimal 16 karakter pada satu baris LCD
void lcdPrintLine(int row, String text) {
  if (text.length() > 16) text = text.substring(0, 16);
  while (text.length() < 16) text += ' ';
  lcd.setCursor(0, row);
  lcd.print(text);
}

// Baca jarak dan hitung tinggi air
bool readWaterLevel() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(3);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  if (duration == 0) return false;

  float measuredDistance = duration / 58.0;
  if (measuredDistance > 400.0) return false;

  distanceCm = measuredDistance;

  if (measuredDistance <= 2.0) {
    waterLevelCm = TINGGI_REFERENSI_CM;
    return true;
  }

  waterLevelCm = TINGGI_REFERENSI_CM - measuredDistance;
  if (waterLevelCm < 0) waterLevelCm = 0;
  if (waterLevelCm > TINGGI_REFERENSI_CM) waterLevelCm = TINGGI_REFERENSI_CM;

  return true;
}

// Tentukan status berdasarkan tinggi air
WaterStatus determineStatus(float level) {
  if (level >= THRESHOLD_DANGER) return DANGER_STATE;
  if (level >= THRESHOLD_WARNING) return WARNING_STATE;
  return SAFE_STATE;
}

// Kontrol LED dan Buzzer
void updateActuators() {
  if (currentStatus == SAFE_STATE) {
    digitalWrite(LED_HIJAU, HIGH);
    digitalWrite(LED_KUNING, LOW);
    digitalWrite(LED_MERAH_1, LOW);
    digitalWrite(LED_MERAH_2, LOW);
    digitalWrite(LED_MERAH_3, LOW);
    noTone(BUZZER_PIN);
  } 
  else if (currentStatus == WARNING_STATE) {
    digitalWrite(LED_HIJAU, LOW);
    digitalWrite(LED_KUNING, HIGH);
    digitalWrite(LED_MERAH_1, LOW);
    digitalWrite(LED_MERAH_2, LOW);
    digitalWrite(LED_MERAH_3, LOW);
    noTone(BUZZER_PIN);
  } 
  else if (currentStatus == DANGER_STATE) {
    digitalWrite(LED_HIJAU, LOW);
    digitalWrite(LED_KUNING, LOW);
    tone(BUZZER_PIN, 1000); // Alarm bunyi konstan
    
    // Animasi 3 LED Merah memancar dari tengah
    int ledFrame = (millis() / LED_ANIMATION_INTERVAL) % 4; 
    
    if (ledFrame == 0 || ledFrame == 2) {
      digitalWrite(LED_MERAH_1, LOW);
      digitalWrite(LED_MERAH_2, HIGH); // Tengah nyala
      digitalWrite(LED_MERAH_3, LOW);
    } else if (ledFrame == 1) {
      digitalWrite(LED_MERAH_1, HIGH); // Kiri nyala
      digitalWrite(LED_MERAH_2, LOW);
      digitalWrite(LED_MERAH_3, LOW);
    } else if (ledFrame == 3) {
      digitalWrite(LED_MERAH_1, LOW);
      digitalWrite(LED_MERAH_2, LOW);
      digitalWrite(LED_MERAH_3, HIGH); // Kanan nyala
    }
  } 
  else { // SENSOR ERROR
    digitalWrite(LED_HIJAU, LOW);
    digitalWrite(LED_KUNING, LOW);
    // Kalau error, ke-3 lampu merah nyala diam
    digitalWrite(LED_MERAH_1, HIGH); 
    digitalWrite(LED_MERAH_2, HIGH); 
    digitalWrite(LED_MERAH_3, HIGH); 
    noTone(BUZZER_PIN);
  }
}

// Update LCD dengan animasi strobo blok hitam
void updateLCD() {
  if (!sensorValid) {
    lcdPrintLine(0, "SENSOR ERROR!");
    lcdPrintLine(1, "Cek HC-SR04");
    return;
  }

  // Baris Atas: Angka jarak
  lcdPrintLine(0, "Jarak: " + String(distanceCm, 1) + " cm");

  // Baris Bawah: Animasi saat BAHAYA
  if (currentStatus == DANGER_STATE) {
    int blinkFrame = (millis() / LCD_ANIMATION_INTERVAL) % 4;
    char kotak = 255; 
    String strobo = String(kotak) + String(kotak) + String(kotak); 

    if (blinkFrame == 0) {
      lcdPrintLine(1, strobo + "  BAHAYA     "); 
    } else if (blinkFrame == 1) {
      lcdPrintLine(1, "     BAHAYA  " + strobo); 
    } else if (blinkFrame == 2) {
      lcdPrintLine(1, strobo + "  BAHAYA  " + strobo); 
    } else {
      lcdPrintLine(1, "     BAHAYA     "); 
    }
  } else {
    lcdPrintLine(1, "Status: " + String(statusName(currentStatus)));
  }
}

// ── TAMBAHAN: Connect WiFi ─────────────────────────
void setupWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  // Reset WiFi state sebelum connect (fix "cannot set config" error)
  WiFi.disconnect(true);
  delay(200);

  // Jangan panggil WiFi.mode() di sini — sudah dipanggil sekali di setup()
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi OK! IP: " + WiFi.localIP().toString());
    Serial.println("Backend: " + String(BACKEND_URL));
  } else {
    Serial.println("\nWiFi gagal, retry di loop.");
    Serial.println("Pastikan SSID adalah jaringan 2.4GHz (bukan _5G)");
  }
}

// ── TAMBAHAN: Kirim data ke backend via HTTP POST ──
void sendToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
    if (WiFi.status() != WL_CONNECTED) return;
  }

  // Build JSON payload
  // Format yang diterima backend:
  // {"deviceId":"...","distanceCm":35.2,"status":"SAFE","sensorValid":true,...}
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;

  if (sensorValid) {
    doc["distanceCm"] = serialized(String(distanceCm, 1));
  } else {
    doc["distanceCm"] = -1.0;
  }

  doc["status"] = backendStatus(currentStatus);
  doc["sensorValid"] = sensorValid;
  doc["wifiConnected"] = (WiFi.status() == WL_CONNECTED);
  doc["uptimeSeconds"] = millis() / 1000;

  char buffer[256];
  serializeJson(doc, buffer);

  Serial.print("POST -> ");
  Serial.println(buffer);

  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(3000);

  int code = http.POST(buffer);

  if (code > 0) {
    Serial.print("Backend response: ");
    Serial.println(code);
  } else {
    Serial.print("HTTP error: ");
    Serial.println(code);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);

  Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
  Wire.setClock(100000);
  delay(100);

  lcd.init();
  lcd.backlight();
  lcd.clear();

  lcdPrintLine(0, "SMART FLOOD K3");
  lcdPrintLine(1, "Sistem Menyala..");

  delay(1500);
  lcd.clear();

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_HIJAU, OUTPUT);
  pinMode(LED_KUNING, OUTPUT);
  pinMode(LED_MERAH_1, OUTPUT);
  pinMode(LED_MERAH_2, OUTPUT);
  pinMode(LED_MERAH_3, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(TRIG_PIN, LOW);
  updateActuators();

  Serial.println("Smart Flood dimulai");

  // ── TAMBAHAN: Connect WiFi saat startup ────────
  WiFi.mode(WIFI_STA);  // Set mode sekali aja di sini
  setupWiFi();
}

void loop() {
  unsigned long now = millis();

  // 1. Baca sensor (500ms)
  if (now - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = now;
    sensorValid = readWaterLevel();
    currentStatus = sensorValid ? determineStatus(waterLevelCm) : SENSOR_ERROR_STATE;
    
    if (sensorValid) {
      Serial.print("Jarak: "); Serial.print(distanceCm, 1);
      Serial.print(" cm | Air: "); Serial.print(waterLevelCm, 1);
      Serial.print(" cm | Status: "); Serial.println(statusName(currentStatus));
    }
  }

  // 2. Animasi LED Lari (100ms)
  if (now - lastLEDUpdate >= LED_ANIMATION_INTERVAL) {
    lastLEDUpdate = now;
    updateActuators();
  }

  // 3. Animasi LCD Ajep-ajep (150ms)
  if (now - lastLCDUpdate >= LCD_ANIMATION_INTERVAL) {
    lastLCDUpdate = now;
    updateLCD();
  }

  // ── TAMBAHAN: Kirim data ke backend (2000ms) ───
  if (now - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = now;
    sendToBackend();
  }
}
