#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>

// QMI8658 I2C Address
#define QMI8658_I2C_ADDR 0x6B

// QMI8658 Register Addresses
#define QMI8658_WHO_AM_I     0x00
#define QMI8658_CTRL1        0x02
#define QMI8658_CTRL2        0x03
#define QMI8658_CTRL3        0x04
#define QMI8658_CTRL5        0x06
#define QMI8658_CTRL7        0x08
#define QMI8658_FIFO_WTM_TH  0x13
#define QMI8658_FIFO_CTRL    0x14
#define QMI8658_FIFO_SMPL_CNT 0x15
#define QMI8658_FIFO_STATUS  0x16
#define QMI8658_FIFO_DATA    0x17
#define QMI8658_TEMP_L       0x33
#define QMI8658_TEMP_H       0x34
#define QMI8658_AX_L         0x35
#define QMI8658_AX_H         0x36
#define QMI8658_AY_L         0x37
#define QMI8658_AY_H         0x38
#define QMI8658_AZ_L         0x39
#define QMI8658_AZ_H         0x3A
#define QMI8658_GX_L         0x3B
#define QMI8658_GX_H         0x3C
#define QMI8658_GY_L         0x3D
#define QMI8658_GY_H         0x3E
#define QMI8658_GZ_L         0x3F
#define QMI8658_GZ_H         0x40

// GPIO Pins for LED indicators
#define LED_GREEN    2   // Aligned indicator
#define LED_RED      4   // Misaligned indicator
#define LED_YELLOW   5   // Calibration indicator
#define BUTTON_CAL   0   // Calibration button (boot button)

// Putting analysis parameters
#define ALIGNMENT_THRESHOLD 2.0  // degrees
#define STABILITY_THRESHOLD 0.5  // for detecting stable position
#define SAMPLE_COUNT 10          // samples for averaging

// Sensor data structure
struct IMUData {
  float ax, ay, az;  // Accelerometer (g)
  float gx, gy, gz;  // Gyroscope (dps)
  float temp;        // Temperature (°C)
};

// Putting analysis variables
float targetYaw = 0.0;           // Target putting direction
float currentYaw = 0.0;          // Current putter orientation
float yawOffset = 0.0;           // Calibration offset
bool isCalibrated = false;       // Calibration status
bool isStable = false;           // Putter stability status
unsigned long lastUpdate = 0;    // Last sensor update time
float yawHistory[SAMPLE_COUNT];  // History for smoothing
int historyIndex = 0;            // Current history index

// Web server for configuration
WebServer server(80);
String ssid = "Golf_Putting_Assistant";
String password = "putting123";

void setup() {
  Serial.begin(115200);
  
  // Initialize LED pins
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(BUTTON_CAL, INPUT_PULLUP);
  
  // Initialize all LEDs off
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_YELLOW, LOW);
  
  // Initialize I2C
  Wire.begin(8, 9); // SDA=8, SCL=9 for ESP32-S3
  Wire.setClock(400000);
  
  Serial.println("Golf Putting Assistant Starting...");
  
  // Initialize QMI8658
  if (initQMI8658()) {
    Serial.println("QMI8658 initialized successfully!");
    digitalWrite(LED_YELLOW, HIGH);
    delay(1000);
    digitalWrite(LED_YELLOW, LOW);
  } else {
    Serial.println("QMI8658 initialization failed!");
    // Blink red LED to indicate error
    for (int i = 0; i < 5; i++) {
      digitalWrite(LED_RED, HIGH);
      delay(200);
      digitalWrite(LED_RED, LOW);
      delay(200);
    }
  }
  
  // Initialize WiFi Access Point
  WiFi.softAP(ssid.c_str(), password.c_str());
  Serial.print("Access Point started. IP: ");
  Serial.println(WiFi.softAPIP());
  
  // Initialize web server
  setupWebServer();
  server.begin();
  
  // Initialize yaw history
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    yawHistory[i] = 0.0;
  }
  
  Serial.println("Setup complete. Ready for putting analysis!");
  Serial.println("Press and hold BOOT button for 2 seconds to calibrate target line.");
}

void loop() {
  server.handleClient();
  
  // Check calibration button
  if (digitalRead(BUTTON_CAL) == LOW) {
    delay(50); // Debounce
    if (digitalRead(BUTTON_CAL) == LOW) {
      calibrateTargetLine();
    }
  }
  
  // Read IMU data
  IMUData imuData;
  if (readIMUData(imuData)) {
    // Calculate yaw angle
    currentYaw = calculateYaw(imuData);
    
    // Add to history for smoothing
    yawHistory[historyIndex] = currentYaw;
    historyIndex = (historyIndex + 1) % SAMPLE_COUNT;
    
    // Calculate smoothed yaw
    float smoothedYaw = calculateSmoothedYaw();
    
    // Check stability
    isStable = checkStability();
    
    // Provide putting direction feedback
    if (isCalibrated && isStable) {
      providePuttingFeedback(smoothedYaw);
    }
    
    // Debug output every 500ms
    if (millis() - lastUpdate > 500) {
      Serial.printf("Yaw: %.2f°, Target: %.2f°, Stable: %s, Calibrated: %s\n", 
                    smoothedYaw, targetYaw, isStable ? "Yes" : "No", isCalibrated ? "Yes" : "No");
      lastUpdate = millis();
    }
  }
  
  delay(10); // Small delay to prevent overwhelming the processor
}

bool initQMI8658() {
  // Check WHO_AM_I register
  uint8_t whoAmI = readRegister(QMI8658_WHO_AM_I);
  if (whoAmI != 0x05) {
    Serial.printf("WHO_AM_I mismatch: 0x%02X (expected 0x05)\n", whoAmI);
    return false;
  }
  
  // Configure accelerometer: ±4g, 100Hz
  writeRegister(QMI8658_CTRL2, 0x24);
  
  // Configure gyroscope: ±512dps, 100Hz
  writeRegister(QMI8658_CTRL3, 0x54);
  
  // Enable accelerometer and gyroscope
  writeRegister(QMI8658_CTRL1, 0x03);
  
  delay(100); // Wait for sensor to stabilize
  
  return true;
}

bool readIMUData(IMUData &data) {
  uint8_t buffer[12];
  
  // Read accelerometer and gyroscope data
  if (!readMultipleRegisters(QMI8658_AX_L, buffer, 12)) {
    return false;
  }
  
  // Convert raw data to physical units
  int16_t ax_raw = (buffer[1] << 8) | buffer[0];
  int16_t ay_raw = (buffer[3] << 8) | buffer[2];
  int16_t az_raw = (buffer[5] << 8) | buffer[4];
  int16_t gx_raw = (buffer[7] << 8) | buffer[6];
  int16_t gy_raw = (buffer[9] << 8) | buffer[8];
  int16_t gz_raw = (buffer[11] << 8) | buffer[10];
  
  // Convert to physical units
  data.ax = ax_raw * 4.0 / 32768.0;      // ±4g range
  data.ay = ay_raw * 4.0 / 32768.0;
  data.az = az_raw * 4.0 / 32768.0;
  data.gx = gx_raw * 512.0 / 32768.0;    // ±512dps range
  data.gy = gy_raw * 512.0 / 32768.0;
  data.gz = gz_raw * 512.0 / 32768.0;
  
  return true;
}

float calculateYaw(const IMUData &data) {
  // Simple yaw calculation using accelerometer data
  // For more accurate results, you might want to implement a complementary filter
  float yaw = atan2(data.ay, data.ax) * 180.0 / PI;
  
  // Normalize to 0-360 degrees
  if (yaw < 0) {
    yaw += 360.0;
  }
  
  return yaw;
}

float calculateSmoothedYaw() {
  float sum = 0.0;
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    sum += yawHistory[i];
  }
  return sum / SAMPLE_COUNT;
}

bool checkStability() {
  // Check if the putter is stable by analyzing variance in yaw
  float smoothedYaw = calculateSmoothedYaw();
  float variance = 0.0;
  
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    float diff = yawHistory[i] - smoothedYaw;
    variance += diff * diff;
  }
  variance /= SAMPLE_COUNT;
  
  return sqrt(variance) < STABILITY_THRESHOLD;
}

void calibrateTargetLine() {
  Serial.println("Calibrating target line...");
  digitalWrite(LED_YELLOW, HIGH);
  
  // Wait for button release
  while (digitalRead(BUTTON_CAL) == LOW) {
    delay(10);
  }
  
  // Collect samples for calibration
  float yawSum = 0.0;
  int sampleCount = 0;
  
  for (int i = 0; i < 100; i++) {
    IMUData imuData;
    if (readIMUData(imuData)) {
      yawSum += calculateYaw(imuData);
      sampleCount++;
    }
    delay(10);
  }
  
  if (sampleCount > 0) {
    targetYaw = yawSum / sampleCount;
    isCalibrated = true;
    Serial.printf("Target line calibrated to: %.2f degrees\n", targetYaw);
    
    // Blink green LED to confirm calibration
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_GREEN, HIGH);
      delay(200);
      digitalWrite(LED_GREEN, LOW);
      delay(200);
    }
  } else {
    Serial.println("Calibration failed!");
    // Blink red LED to indicate error
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_RED, HIGH);
      delay(200);
      digitalWrite(LED_RED, LOW);
      delay(200);
    }
  }
  
  digitalWrite(LED_YELLOW, LOW);
}

void providePuttingFeedback(float currentYaw) {
  float angleDifference = abs(currentYaw - targetYaw);
  
  // Handle wraparound (e.g., 359° vs 1°)
  if (angleDifference > 180) {
    angleDifference = 360 - angleDifference;
  }
  
  // Provide visual feedback
  if (angleDifference <= ALIGNMENT_THRESHOLD) {
    // Well aligned
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_RED, LOW);
  } else {
    // Misaligned
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_RED, HIGH);
  }
}

void setupWebServer() {
  server.on("/", []() {
    String html = "<!DOCTYPE html><html><head><title>Golf Putting Assistant</title></head><body>";
    html += "<h1>Golf Putting Assistant</h1>";
    html += "<p>Current Status:</p>";
    html += "<ul>";
    html += "<li>Calibrated: " + String(isCalibrated ? "Yes" : "No") + "</li>";
    html += "<li>Stable: " + String(isStable ? "Yes" : "No") + "</li>";
    html += "<li>Current Yaw: " + String(currentYaw, 2) + "°</li>";
    html += "<li>Target Yaw: " + String(targetYaw, 2) + "°</li>";
    html += "</ul>";
    html += "<p>Press the BOOT button on the device to calibrate the target line.</p>";
    html += "</body></html>";
    server.send(200, "text/html", html);
  });
  
  server.on("/calibrate", []() {
    calibrateTargetLine();
    server.send(200, "text/plain", "Calibration completed!");
  });
  
  server.on("/status", []() {
    String json = "{";
    json += "\"calibrated\":" + String(isCalibrated ? "true" : "false") + ",";
    json += "\"stable\":" + String(isStable ? "true" : "false") + ",";
    json += "\"currentYaw\":" + String(currentYaw, 2) + ",";
    json += "\"targetYaw\":" + String(targetYaw, 2) + ",";
    json += "\"angleDifference\":" + String(abs(currentYaw - targetYaw), 2);
    json += "}";
    server.send(200, "application/json", json);
  });
}

uint8_t readRegister(uint8_t reg) {
  Wire.beginTransmission(QMI8658_I2C_ADDR);
  Wire.write(reg);
  Wire.endTransmission(false);
  Wire.requestFrom(QMI8658_I2C_ADDR, 1);
  return Wire.read();
}

void writeRegister(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(QMI8658_I2C_ADDR);
  Wire.write(reg);
  Wire.write(value);
  Wire.endTransmission();
}

bool readMultipleRegisters(uint8_t reg, uint8_t *buffer, uint8_t count) {
  Wire.beginTransmission(QMI8658_I2C_ADDR);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) {
    return false;
  }
  
  Wire.requestFrom(QMI8658_I2C_ADDR, count);
  for (int i = 0; i < count; i++) {
    if (Wire.available()) {
      buffer[i] = Wire.read();
    } else {
      return false;
    }
  }
  
  return true;
}