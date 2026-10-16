/*
  Smart Flood Detection System — ESP32 Firmware
  ==============================================
  Hardware:
  - ESP32 DevKit-C V4
  - Ultrasonic Sensor HC-SR04
  - 3x LEDs (Green, Yellow, Red) with 220 Ohm resistors
  - Active/Passive Buzzer
  - I2C LCD 16x2 (Address: 0x27 or 0x3F)

  Pinout:
  - HC-SR04 TRIG : GPIO 5
  - HC-SR04 ECHO : GPIO 18 (USE 1k + 2k VOLTAGE DIVIDER: 5V -> 3.3V!)
  - LED Hijau    : GPIO 25 (SAFE)
  - LED Kuning   : GPIO 26 (WARNING)
  - LED Merah    : GPIO 27 (DANGER)
  - Buzzer       : GPIO 14
  - LCD SDA      : GPIO 21
  - LCD SCL      : GPIO 22

  MQTT Topic : ti2024i/kelompok3/smartflood/data
  MQTT Broker: test.mosquitto.org : 1883
*/

#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// --- WiFi Credentials ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// --- MQTT Settings ---
const char* mqtt_broker = "test.mosquitto.org";
const int mqtt_port = 1883;
const char* mqtt_topic = "ti2024i/kelompok3/smartflood/data";
const char* device_id = "smartflood-esp32-01";

// --- Pin Definitions ---
#define PIN_TRIG 5
#define PIN_ECHO 18
#define PIN_LED_GREEN 25
#define PIN_LED_YELLOW 26
#define PIN_LED_RED 27
#define PIN_BUZZER 14

// --- Distance Thresholds (Sensor-to-surface air gap in cm) ---
// Note: Per existing project spec:
// SAFE    : distance < 50 cm
// WARNING : 50 cm <= distance < 80 cm
// DANGER  : distance >= 80 cm
#define DIST_SAFE_THRESHOLD 50.0
#define DIST_WARN_THRESHOLD 80.0

WiFiClient espClient;
PubSubClient mqttClient(espClient);
LiquidCrystal_I2C lcd(0x27, 16, 2); // Change to 0x3F if 0x27 does not show text

unsigned long lastPublish = 0;
const unsigned long publishInterval = 2000; // Publish every 2 seconds

// Function to read ultrasonic distance with timeout
float readDistanceCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  // pulseIn with 30ms timeout (~5m max distance)
  long duration = pulseIn(PIN_ECHO, HIGH, 30000);
  if (duration == 0) {
    return -1.0; // Invalid / timeout
  }

  // Speed of sound = 343 m/s = 0.0343 cm/us
  // distance = (duration * 0.0343) / 2
  float distance = (duration * 0.0343) / 2.0;
  return distance;
}

void setupWiFi() {
  delay(10);
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed! Will retry in main loop.");
  }
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection to ");
    Serial.print(mqtt_broker);
    Serial.print("...");

    String clientId = String(device_id) + "-" + String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" CONNECTED!");
    } else {
      Serial.print(" FAILED, rc=");
      Serial.print(mqttClient.state());
      Serial.println(". Retrying in 3 seconds...");
      delay(3000);
      if (WiFi.status() != WL_CONNECTED) {
        setupWiFi();
      }
    }
  }
}

void updateActuators(String status, bool sensorValid) {
  if (!sensorValid) {
    // Sensor error: all LEDs blink once or stay off
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
    return;
  }

  if (status == "SAFE") {
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  } else if (status == "WARNING") {
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_YELLOW, HIGH);
    digitalWrite(PIN_LED_RED, LOW);
    // Buzzer beeps slowly
    digitalWrite(PIN_BUZZER, (millis() % 1000 < 200) ? HIGH : LOW);
  } else if (status == "DANGER") {
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
    // Buzzer continuous / fast beep
    digitalWrite(PIN_BUZZER, (millis() % 400 < 200) ? HIGH : LOW);
  }
}

void updateLCD(float distance, String status, bool sensorValid) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Smart Flood Sys");

  lcd.setCursor(0, 1);
  if (!sensorValid) {
    lcd.print("Sensor: ERROR   ");
  } else {
    lcd.print("D:");
    lcd.print((int)distance);
    lcd.print("cm ");
    lcd.print("[");
    lcd.print(status);
    lcd.print("]");
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  // Initialize LCD
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Smart Flood Sys");
  lcd.setCursor(0, 1);
  lcd.print("Booting up...");

  setupWiFi();

  mqttClient.setServer(mqtt_broker, mqtt_port);
  mqttClient.setBufferSize(512);

  delay(1000);
  lcd.clear();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }

  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastPublish >= publishInterval) {
    lastPublish = now;

    float distance = readDistanceCm();
    bool sensorValid = (distance > 0.0 && distance < 400.0);

    String status = "UNKNOWN";
    if (sensorValid) {
      if (distance < DIST_SAFE_THRESHOLD) {
        status = "SAFE";
      } else if (distance < DIST_WARN_THRESHOLD) {
        status = "WARNING";
      } else {
        status = "DANGER";
      }
    } else {
      status = "INVALID";
    }

    // Update physical actuators
    updateActuators(status, sensorValid);

    // Update 16x2 LCD
    updateLCD(distance, status, sensorValid);

    // Build JSON payload matching backend contract
    StaticJsonDocument<256> doc;
    doc["deviceId"] = device_id;
    if (sensorValid) {
      doc["distanceCm"] = serialized(String(distance, 1));
    } else {
      doc["distanceCm"] = -1.0;
    }
    doc["status"] = status;
    doc["sensorValid"] = sensorValid;
    doc["wifiConnected"] = (WiFi.status() == WL_CONNECTED);
    doc["uptimeSeconds"] = millis() / 1000;

    char buffer[256];
    serializeJson(doc, buffer);

    Serial.print("Publishing to ");
    Serial.print(mqtt_topic);
    Serial.print(": ");
    Serial.println(buffer);

    bool ok = mqttClient.publish(mqtt_topic, buffer);
    if (!ok) {
      Serial.println("MQTT publish failed!");
    }
  }
}
