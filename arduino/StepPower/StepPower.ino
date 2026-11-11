/*
 * StepPower - Smart Footstep Energy Monitoring System
 * ---------------------------------------------------
 * Arduino UNO + 6 piezo discs (parallel) + bridge rectifier
 * + smoothing capacitor + 0-25 V voltage sensor on A0
 * + 16x2 I2C LCD (0x27) + status LED on D8
 *
 * Serial output at 9600 baud, one line every 200 ms (~5 Hz):
 *
 *   V:1.24,STEP:3
 *
 *   V    = peak voltage measured inside the last 200 ms window
 *   STEP = cumulative step count (1 press on the sensor = 1 step)
 *
 * The ADC is sampled every 5 ms and only the window peak is reported.
 * A piezo pulse lasts a few milliseconds, so a 200 ms sample rate used
 * to miss the spike entirely - that is why readings stayed near 0.05 V.
 *
 * Step detection: a rising edge that crosses the adaptive noise floor by
 * STEP_THRESHOLD, with hysteresis + 500 ms debounce, so one press counts
 * exactly once.
 *
 * If the peak still never exceeds ~0.1 V when pressing hard, the
 * smoothing capacitor is eating the piezo charge: replace the 10 uF
 * capacitor with 0.1 uF - 1 uF (or remove it).
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

const int voltageSensorPin = A0;
const int ledPin = 8;

// Volts the signal must rise above the idle noise floor to count a step.
// Lower it (e.g. 0.06) if your presses stay weaker than this.
const float STEP_THRESHOLD = 0.10;
const unsigned long STEP_DEBOUNCE_MS = 500;    // ms - one press counted once
const unsigned long SAMPLE_INTERVAL_MS = 5;    // ms - catches short spikes
const unsigned long REPORT_INTERVAL_MS = 200;  // ms - LCD + serial rate

int stepCount = 0;
bool stepArmed = true;
unsigned long lastStepMs = 0;

float baseline = 0.0;     // adaptive noise floor
float windowPeak = 0.0;   // highest voltage in the current window
unsigned long lastReportMs = 0;

void setup() {
  Serial.begin(9600);

  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  lcd.init();
  lcd.backlight();
  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Piezo Voltage");

  lcd.setCursor(0, 1);
  lcd.print("0.00 V");
}

void loop() {
  unsigned long now = millis();

  int rawValue = analogRead(voltageSensorPin);

  // Convert A0 reading to voltage
  float sensorVoltage = (rawValue * 5.0) / 1023.0;

  // 0-25V voltage sensor
  float actualVoltage = sensorVoltage * 5.0;

  // Adaptive noise floor: drops immediately with the signal, creeps up
  // very slowly while the signal is high, so the step trigger is always
  // measured against the idle level instead of a fixed constant.
  if (actualVoltage < baseline) {
    baseline = actualVoltage;
  } else {
    baseline += (actualVoltage - baseline) * 0.002;
  }

  // Peak-hold inside the reporting window - never miss a short spike
  if (actualVoltage > windowPeak) {
    windowPeak = actualVoltage;
  }

  // Step detection: hysteresis + debounce => 1 press = 1 step
  if (stepArmed && (now - lastStepMs) >= STEP_DEBOUNCE_MS &&
      actualVoltage >= baseline + STEP_THRESHOLD) {
    stepCount++;
    lastStepMs = now;
    stepArmed = false;
  }
  if (!stepArmed && actualVoltage < baseline + STEP_THRESHOLD * 0.5) {
    stepArmed = true;
  }

  // LED turns ON when pressure is detected
  if (actualVoltage >= baseline + STEP_THRESHOLD) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }

  // LCD + serial, once per report window
  if (now - lastReportMs >= REPORT_INTERVAL_MS) {
    lastReportMs = now;
    float reportedVoltage = windowPeak;
    windowPeak = 0.0;

    lcd.setCursor(0, 0);
    lcd.print("Piezo Voltage   ");

    lcd.setCursor(0, 1);
    lcd.print("                ");
    lcd.setCursor(0, 1);
    lcd.print(reportedVoltage, 2);
    lcd.print(" V");

    // Structured serial line for the dashboard
    Serial.print("V:");
    Serial.print(reportedVoltage, 2);
    Serial.print(",STEP:");
    Serial.println(stepCount);
  }

  delay(SAMPLE_INTERVAL_MS);
}
