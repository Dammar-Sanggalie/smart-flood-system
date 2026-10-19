#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ============================================================
// SMART FLOOD DETECTION & EARLY WARNING SYSTEM + LCD 16x2 I2C
// Kelompok 3 TI 2024I | ESP32 DevKit-C V4 | Wokwi
// ============================================================

// Wi-Fi Wokwi
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// MQTT publik untuk praktikum
const char* MQTT_SERVER = "test.mosquitto.org";
const uint16_t MQTT_PORT = 1883;
const char* MQTT_TOPIC = "ti2024i/kelompok3/smartflood/data";

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// LCD1602 I2C default address 0x27
LiquidCrystal_I2C lcd(0x27, 16, 2);
const uint8_t LCD_SDA_PIN = 21;
const uint8_t LCD_SCL_PIN = 22;

// Pin mapping. GPIO21/22 are reserved for LCD I2C.
const uint8_t TRIG_PIN = 5;
const uint8_t ECHO_PIN = 18;
const uint8_t LED_HIJAU = 25;
const uint8_t LED_KUNING = 26;
const uint8_t LED_MERAH = 27;
const uint8_t BUZZER_PIN = 14; // Moved from GPIO21 to avoid SDA conflict

// Simple simulated container model: sensor-to-bottom reference = 100 cm
const float TINGGI_REFERENSI_CM = 100.0f;
const float THRESHOLD_WARNING_CM = 50.0f;
const float THRESHOLD_DANGER_CM = 80.0f;
const float MIN_SENSOR_DISTANCE_CM = 2.0f;
const float MAX_SENSOR_DISTANCE_CM = 400.0f;

const unsigned long SENSOR_INTERVAL_MS = 500;
const unsigned long LCD_PAGE_INTERVAL_MS = 2500;
const unsigned long MQTT_INTERVAL_MS = 2000;
const unsigned long SERIAL_INTERVAL_MS = 1000;
const unsigned long WIFI_RETRY_INTERVAL_MS = 10000;
const unsigned long MQTT_RETRY_INTERVAL_MS = 5000;

unsigned long lastSensorRead = 0;
unsigned long lastLCDUpdate = 0;
unsigned long lastMqttPublish = 0;
unsigned long lastSerialPrint = 0;
unsigned long lastWifiRetry = 0;
unsigned long lastMqttRetry = 0;

float distanceCm = -1.0f;
float waterLevelCm = -1.0f;
String floodStatus = "SENSOR_ERROR";
bool sensorValid = false;

// Print exactly 16 characters per LCD row to remove remnants of old text.
void lcdPrintLine(uint8_t row, const String& text) {
  String line = text;
  if (line.length() > 16) line = line.substring(0, 16);
  while (line.length() < 16) line += ' ';
  lcd.setCursor(0, row);
  lcd.print(line);
}

void updateLCD() {
  // The display cycles through three pages because a 16x2 LCD
  // cannot show all sensor values and network state at once.
  const uint8_t page = (millis() / LCD_PAGE_INTERVAL_MS) % 3;

  if (page == 0) {
    if (sensorValid) {
      lcdPrintLine(0, "Jarak: " + String(distanceCm, 0) + " cm");
      lcdPrintLine(1, "Tinggi: " + String(waterLevelCm, 0) + " cm");
    } else {
      lcdPrintLine(0, "Sensor: ERROR");
      lcdPrintLine(1, "Cek HC-SR04");
    }
  } else if (page == 1) {
    if (floodStatus == "SAFE") {
      lcdPrintLine(0, "STATUS: SAFE");
      lcdPrintLine(1, "Air normal");
    } else if (floodStatus == "WARNING") {
      lcdPrintLine(0, "STATUS: WARNING");
      lcdPrintLine(1, "Air meninggi!");
    } else if (floodStatus == "DANGER") {
      lcdPrintLine(0, "STATUS: DANGER");
      lcdPrintLine(1, "BAHAYA BANJIR!");
    } else {
      lcdPrintLine(0, "STATUS: ERROR");
      lcdPrintLine(1, "Sensor invalid");
    }
  } else {
    lcdPrintLine(0, WiFi.status() == WL_CONNECTED ? "WiFi: ONLINE" : "WiFi: OFFLINE");
    lcdPrintLine(1, mqttClient.connected() ? "MQTT: ONLINE" : "MQTT: OFFLINE");
  }
}

// Drive local indicators. They remain independent of Wi-Fi/MQTT.
void setActuators(const String& status) {
  digitalWrite(LED_HIJAU, LOW);
  digitalWrite(LED_KUNING, LOW);
  digitalWrite(LED_MERAH, LOW);
  noTone(BUZZER_PIN);

  if (status == "SAFE") {
    digitalWrite(LED_HIJAU, HIGH);
  } else if (status == "WARNING") {
    digitalWrite(LED_KUNING, HIGH);
  } else if (status == "DANGER") {
    digitalWrite(LED_MERAH, HIGH);
    tone(BUZZER_PIN, 1000);
  } else {
    // Red indicates a sensor fault; buzzer remains off so the fault
    // is distinguishable from a confirmed danger condition.
    digitalWrite(LED_MERAH, HIGH);
  }
}

// Return false only when no echo is received or the reading is invalid.
bool readWaterLevel() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  const unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  if (duration == 0) return false;

  const float measuredDistance = duration / 58.0f;
  if (measuredDistance > MAX_SENSOR_DISTANCE_CM) return false;

  // HC-SR04 nominal minimum range is about 2 cm. For the simulation,
  // a smaller reported distance is treated as immediate DANGER.
  if (measuredDistance < MIN_SENSOR_DISTANCE_CM) {
    distanceCm = measuredDistance;
    waterLevelCm = TINGGI_REFERENSI_CM;
    return true;
  }

  float measuredLevel = TINGGI_REFERENSI_CM - measuredDistance;
  if (measuredLevel < 0.0f) measuredLevel = 0.0f;
  if (measuredLevel > TINGGI_REFERENSI_CM) measuredLevel = TINGGI_REFERENSI_CM;

  distanceCm = measuredDistance;
  waterLevelCm = measuredLevel;
  return true;
}

String determineStatus(float levelCm) {
  if (levelCm >= THRESHOLD_DANGER_CM) return "DANGER";
  if (levelCm >= THRESHOLD_WARNING_CM) return "WARNING";
  return "SAFE";
}

void maintainWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  const unsigned long now = millis();
  if (now - lastWifiRetry >= WIFI_RETRY_INTERVAL_MS) {
    lastWifiRetry = now;
    Serial.println("[WiFi] Retrying connection...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD, 6);
  }
}

void maintainMQTT() {
  if (WiFi.status() != WL_CONNECTED || mqttClient.connected()) return;

  const unsigned long now = millis();
  if (now - lastMqttRetry < MQTT_RETRY_INTERVAL_MS) return;
  lastMqttRetry = now;

  char clientId[40];
  const uint64_t chipId = ESP.getEfuseMac();
  snprintf(clientId, sizeof(clientId), "SmartFloodLCD-K3-%04X",
           static_cast<unsigned int>(chipId & 0xFFFF));

  Serial.print("[MQTT] Connecting... ");
  if (mqttClient.connect(clientId)) {
    Serial.println("CONNECTED");
  } else {
    Serial.print("FAILED, state = ");
    Serial.println(mqttClient.state());
  }
}

void printStatus() {
  Serial.println();
  Serial.println("========================================");
  Serial.println(" SMART FLOOD MONITORING SYSTEM + LCD   ");
  Serial.println("========================================");
  if (sensorValid) {
    Serial.print("Jarak sensor : ");
    Serial.print(distanceCm, 1);
    Serial.println(" cm");
    Serial.print("Tinggi air   : ");
    Serial.print(waterLevelCm, 1);
    Serial.println(" cm");
  } else {
    Serial.println("Jarak sensor : INVALID");
    Serial.println("Tinggi air   : INVALID");
  }
  Serial.print("Status       : "); Serial.println(floodStatus);
  Serial.print("Wi-Fi        : "); Serial.println(WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED");
  Serial.print("MQTT         : "); Serial.println(mqttClient.connected() ? "CONNECTED" : "DISCONNECTED");
  Serial.println("LCD          : 3 rotating information pages");
  Serial.println("========================================");
}

void publishSensorData() {
  if (!mqttClient.connected()) {
    Serial.println("[MQTT] Not connected; data not published.");
    return;
  }

  String payload;
  if (sensorValid) {
    payload = "{\"distance_cm\":";
    payload += String(distanceCm, 1);
    payload += ",\"water_level_cm\":";
    payload += String(waterLevelCm, 1);
    payload += ",\"status\":\"";
    payload += floodStatus;
    payload += "\"}";
  } else {
    payload = "{\"status\":\"SENSOR_ERROR\"}";
  }

  const bool published = mqttClient.publish(MQTT_TOPIC, payload.c_str());
  Serial.print("[MQTT] Publish: "); Serial.println(published ? "OK" : "FAILED");
  Serial.print("[MQTT] Topic: "); Serial.println(MQTT_TOPIC);
  Serial.print("[MQTT] Payload: "); Serial.println(payload);
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_HIJAU, OUTPUT);
  pinMode(LED_KUNING, OUTPUT);
  pinMode(LED_MERAH, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(TRIG_PIN, LOW);
  setActuators("SENSOR_ERROR");

  // LCD I2C on ESP32 default pins: SDA=21, SCL=22.
  Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcdPrintLine(0, "SMART FLOOD K3");
  lcdPrintLine(1, "Starting...");

  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setSocketTimeout(2);
  mqttClient.setKeepAlive(15);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD, 6);

  Serial.println();
  Serial.println("Smart Flood System + LCD starting...");
  Serial.println("LCD I2C address: 0x27, SDA GPIO21, SCL GPIO22");
  Serial.println("Buzzer moved to GPIO14 to avoid I2C conflict.");
  Serial.println("Wi-Fi: Wokwi-GUEST | MQTT: test.mosquitto.org:1883");
}

void loop() {
  maintainWiFi();
  maintainMQTT();
  mqttClient.loop();

  const unsigned long now = millis();
  if (now - lastSensorRead >= SENSOR_INTERVAL_MS) {
    lastSensorRead = now;
    sensorValid = readWaterLevel();
    floodStatus = sensorValid ? determineStatus(waterLevelCm) : "SENSOR_ERROR";
    setActuators(floodStatus);
    updateLCD();
  }

  // Refresh LCD periodically so its connection page updates too.
  if (now - lastLCDUpdate >= 250) {
    lastLCDUpdate = now;
    updateLCD();
  }

  if (now - lastSerialPrint >= SERIAL_INTERVAL_MS) {
    lastSerialPrint = now;
    printStatus();
  }

  if (now - lastMqttPublish >= MQTT_INTERVAL_MS) {
    lastMqttPublish = now;
    publishSensorData();
  }
}