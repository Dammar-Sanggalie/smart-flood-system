#heading(numbering: none)[Lampiran]

#heading(level: 2, numbering: none)[Lampiran A: Kode Firmware ESP32 (Arduino C++)]

Berikut adalah kode sumber program tertanam (_embedded firmware_) yang telah berhasil dikompilasi, diunggah, dan diverifikasi kinerjanya pada perangkat keras fisik ESP32:

```cpp
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Konfigurasi Pin LCD I2C ESP32
const int LCD_SDA_PIN = 21;
const int LCD_SCL_PIN = 22;

#define LCD_ADDRESS 0x27
LiquidCrystal_I2C lcd(LCD_ADDRESS, 16, 2);

// Konfigurasi Pin Sensor HC-SR04
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

// Konfigurasi Pin Aktuator LED dan Buzzer
const int LED_HIJAU   = 25;
const int LED_KUNING  = 26;
const int LED_MERAH_1 = 27; // Merah Kiri
const int LED_MERAH_2 = 33; // Merah Tengah
const int LED_MERAH_3 = 32; // Merah Kanan
const int BUZZER_PIN  = 14;

// Parameter Wadah Acuan dan Ambang Batas
const float TINGGI_REFERENSI_CM = 100.0;
const float THRESHOLD_WARNING   = 50.0;
const float THRESHOLD_DANGER    = 80.0;

// Penjadwalan Waktu Non-blocking (millis)
const unsigned long SENSOR_INTERVAL        = 500;  // Baca sensor (2 Hz)
const unsigned long LCD_ANIMATION_INTERVAL = 150;  // Kedip strobo LCD
const unsigned long LED_ANIMATION_INTERVAL = 100;  // Kecepatan lari 3 LED
const unsigned long PUBLISH_INTERVAL       = 2000; // Kirim HTTP POST (2s)

// Kredensial Jaringan Wi-Fi & Endpoint Backend
const char* WIFI_SSID     = "JEV AQUATIC_4G";
const char* WIFI_PASSWORD = "jevaquatic12345";
const char* BACKEND_URL   = "http://192.168.1.8:8080/api/readings";
const char* DEVICE_ID     = "smartflood-esp32-01";

unsigned long lastSensorRead = 0;
unsigned long lastLCDUpdate  = 0;
unsigned long lastLEDUpdate  = 0;
unsigned long lastPublish    = 0;

float distanceCm   = 0;
float waterLevelCm = 0;
bool sensorValid   = false;

enum WaterStatus { SAFE_STATE, WARNING_STATE, DANGER_STATE, SENSOR_ERROR_STATE };
WaterStatus currentStatus = SENSOR_ERROR_STATE;

const char* statusName(WaterStatus status) {
  switch (status) {
    case SAFE_STATE:    return "AMAN";
    case WARNING_STATE: return "SIAGA";
    case DANGER_STATE:  return "BAHAYA";
    default:            return "ERROR";
  }
}

const char* backendStatus(WaterStatus status) {
  switch (status) {
    case SAFE_STATE:    return "SAFE";
    case WARNING_STATE: return "WARNING";
    case DANGER_STATE:  return "DANGER";
    default:            return "INVALID";
  }
}

void lcdPrintLine(int row, String text) {
  if (text.length() > 16) text = text.substring(0, 16);
  while (text.length() < 16) text += ' ';
  lcd.setCursor(0, row);
  lcd.print(text);
}

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

WaterStatus determineStatus(float level) {
  if (level >= THRESHOLD_DANGER) return DANGER_STATE;
  if (level >= THRESHOLD_WARNING) return WARNING_STATE;
  return SAFE_STATE;
}

void updateActuators() {
  if (currentStatus == SAFE_STATE) {
    digitalWrite(LED_HIJAU, HIGH);
    digitalWrite(LED_KUNING, LOW);
    digitalWrite(LED_MERAH_1, LOW);
    digitalWrite(LED_MERAH_2, LOW);
    digitalWrite(LED_MERAH_3, LOW);
    noTone(BUZZER_PIN);
  } else if (currentStatus == WARNING_STATE) {
    digitalWrite(LED_HIJAU, LOW);
    digitalWrite(LED_KUNING, HIGH);
    digitalWrite(LED_MERAH_1, LOW);
    digitalWrite(LED_MERAH_2, LOW);
    digitalWrite(LED_MERAH_3, LOW);
    noTone(BUZZER_PIN);
  } else if (currentStatus == DANGER_STATE) {
    digitalWrite(LED_HIJAU, LOW);
    digitalWrite(LED_KUNING, LOW);
    tone(BUZZER_PIN, 1000);
    int ledFrame = (millis() / LED_ANIMATION_INTERVAL) % 4;
    if (ledFrame == 0 || ledFrame == 2) {
      digitalWrite(LED_MERAH_1, LOW);
      digitalWrite(LED_MERAH_2, HIGH);
      digitalWrite(LED_MERAH_3, LOW);
    } else if (ledFrame == 1) {
      digitalWrite(LED_MERAH_1, HIGH);
      digitalWrite(LED_MERAH_2, LOW);
      digitalWrite(LED_MERAH_3, LOW);
    } else if (ledFrame == 3) {
      digitalWrite(LED_MERAH_1, LOW);
      digitalWrite(LED_MERAH_2, LOW);
      digitalWrite(LED_MERAH_3, HIGH);
    }
  } else {
    digitalWrite(LED_HIJAU, LOW);
    digitalWrite(LED_KUNING, LOW);
    digitalWrite(LED_MERAH_1, HIGH);
    digitalWrite(LED_MERAH_2, HIGH);
    digitalWrite(LED_MERAH_3, HIGH);
    noTone(BUZZER_PIN);
  }
}

void updateLCD() {
  if (!sensorValid) {
    lcdPrintLine(0, "SENSOR ERROR!");
    lcdPrintLine(1, "Cek HC-SR04");
    return;
  }
  lcdPrintLine(0, "Jarak: " + String(distanceCm, 1) + " cm");
  if (currentStatus == DANGER_STATE) {
    int blinkFrame = (millis() / LCD_ANIMATION_INTERVAL) % 4;
    char kotak = 255;
    String strobo = String(kotak) + String(kotak) + String(kotak);
    if (blinkFrame == 0)      lcdPrintLine(1, strobo + "  BAHAYA     ");
    else if (blinkFrame == 1) lcdPrintLine(1, "     BAHAYA  " + strobo);
    else if (blinkFrame == 2) lcdPrintLine(1, strobo + "  BAHAYA  " + strobo);
    else                      lcdPrintLine(1, "     BAHAYA     ");
  } else {
    lcdPrintLine(1, "Status: " + String(statusName(currentStatus)));
  }
}

void setupWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("Connecting to WiFi: "); Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500); Serial.print("."); attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi OK! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi gagal, retry di loop.");
  }
}

void sendToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
    if (WiFi.status() != WL_CONNECTED) return;
  }
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  if (sensorValid) doc["distanceCm"] = serialized(String(distanceCm, 1));
  else             doc["distanceCm"] = -1.0;
  doc["status"]         = backendStatus(currentStatus);
  doc["sensorValid"]    = sensorValid;
  doc["wifiConnected"]  = (WiFi.status() == WL_CONNECTED);
  doc["uptimeSeconds"]  = millis() / 1000;

  char buffer[256];
  serializeJson(doc, buffer);
  Serial.print("POST -> "); Serial.println(buffer);

  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(3000);
  int code = http.POST(buffer);
  if (code > 0) Serial.println("Backend response: " + String(code));
  else          Serial.println("HTTP error: " + String(code));
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
  setupWiFi();
}

void loop() {
  unsigned long now = millis();
  if (now - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = now;
    sensorValid = readWaterLevel();
    currentStatus = sensorValid ? determineStatus(waterLevelCm) : SENSOR_ERROR_STATE;
  }
  if (now - lastLEDUpdate >= LED_ANIMATION_INTERVAL) {
    lastLEDUpdate = now;
    updateActuators();
  }
  if (now - lastLCDUpdate >= LCD_ANIMATION_INTERVAL) {
    lastLCDUpdate = now;
    updateLCD();
  }
  if (now - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = now;
    sendToBackend();
  }
}
```

#heading(level: 2, numbering: none)[Lampiran B: Contoh Respons Server Backend dan Payload Telemetri]

Data yang dipublikasikan oleh ESP32 setiap 2 detik diterima oleh server Go dan menghasilkan respons status `200 OK` atau `201 Created` dengan contoh log serial:

```text
POST -> {"deviceId":"smartflood-esp32-01","distanceCm":35.2,"status":"SAFE",
         "sensorValid":true,"wifiConnected":true,"uptimeSeconds":142}
Backend response: 200
```
