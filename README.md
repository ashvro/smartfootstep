# StepPower – Smart Footstep Energy Monitoring System

A single-page, local-only dashboard for an Arduino piezoelectric footstep-energy
prototype. The Arduino measures voltage from 6 combined piezo discs and streams
structured readings over USB; the dashboard visualizes them live using the
**Web Serial API** — no Wi-Fi, no Bluetooth, no cloud, no backend.

```
Footstep → Piezo Array → Electrical Output → Arduino → USB → Live Dashboard
```

## Hardware (unchanged wiring)

Arduino UNO · 6 piezo discs (combined) · bridge rectifier · 10 µF capacitor ·
0–25 V voltage sensor on **A0** · 16×2 I2C LCD (**0x27**) · LED on **D8**

## Repository layout

```
arduino/StepPower/StepPower.ino   Arduino sketch (LCD + LED + step detection + serial)
src/                              React + TypeScript + Tailwind dashboard (Vite)
  hooks/useSteppower.ts           Web Serial connection, parsing, stats, sessions
  lib/parse.ts                    Strict "V:…,STEP:…" line parser
  components/                     Header, voltage cards, chart, session panel/history
```

## 1. Flash the Arduino

1. Open `arduino/StepPower/StepPower.ino` in the Arduino IDE.
2. Install the library **LiquidCrystal I2C** by Frank de Brabander
   (*Sketch → Include Library → Manage Libraries…*).
3. Select **Tools → Board → Arduino Uno** and your serial port.
4. Upload. Keep the Serial Monitor closed — the dashboard needs the port.

Serial output at **9600 baud**, one line per sample (~5 Hz):

```
V:0.74,STEP:0
V:0.81,STEP:1
```

- `V:` **peak** voltage measured inside the last 200 ms window (0–25 V sensor, 2 decimals)
- `STEP:` cumulative step count
- The ADC is sampled every **5 ms** and only the window peak is reported, so
  the few-millisecond piezo spike is never missed
- Step detection: rising edge crossing the **adaptive noise floor + 0.10 V**
  with **hysteresis + 500 ms debounce** (one press on the sensor = one step),
  while the LCD shows the window peak and the LED lights during a press

> **Weak readings?** If the peak never exceeds ~0.1 V when pressing hard, the
> smoothing capacitor is absorbing the piezo charge — replace the 10 µF
> capacitor with **0.1 µF–1 µF** (or remove it). You can also lower
> `STEP_THRESHOLD` in the sketch if your presses are still faint.

## 2. Run the dashboard

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in **Chrome or Edge** (Web Serial is
Chromium-only), click **Connect**, and pick the Arduino port.

Data flows at ~5 readings/second. The graph shows a rolling 60-second window
with detected footsteps marked as dots.

> **Note:** opening the serial port resets the Arduino (DTR). The dashboard
> shows "Waiting for data…" for the ~2 seconds until the board boots.

## Features

- **Three stats** — current voltage, average voltage, total voltage for the session
- **Live graph** — voltage vs time, rolling 60 s, footstep markers
- **Sessions** — START resets stats and timer, END saves to `localStorage` history (latest 10), RESET clears current stats
- **Session history table** — date/time, duration, steps, average V, total V per session
- **Step counter** — one press on the sensor = one step, shown in the session panel
- **Robust connection handling** — unsupported browser, connect/disconnect,
  unplug mid-stream, invalid/corrupted lines (ignored + counted, never invented)

## Production build

```bash
npm run build     # type-checks and bundles to dist/
npm run preview   # serves dist/ locally
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Connect button does nothing | Use Chrome/Edge on `http://localhost` (not `file://`) |
| "Waiting for data…" forever | Press the Arduino reset button; close the Serial Monitor |
| Port won't open | Unplug/replug the Arduino; close other programs using the port |
| "N invalid lines ignored" | Boot noise/corrupted bytes — ignored on purpose, stream continues |
# smartfootstep
