const LINE_PATTERN = /^V:\s*(\d{1,3}(?:\.\d{1,3})?)\s*,\s*STEP:\s*(\d{1,6})\s*$/;

export interface ParsedReading {
  voltage: number;
  steps: number;
}

/**
 * Parses a structured line from the Arduino, e.g. "V:0.74,STEP:3".
 * Returns null for anything that does not match (boot noise, partial
 * reads, corrupted data) so the dashboard can flag it instead of
 * inventing a value. Voltage is sanity-checked against the 0-25 V
 * sensor range.
 */
export function parseLine(line: string): ParsedReading | null {
  const match = LINE_PATTERN.exec(line);
  if (!match) return null;

  const voltage = Number(match[1]);
  const steps = Number(match[2]);

  if (!Number.isFinite(voltage) || voltage < 0 || voltage > 26) return null;
  if (!Number.isInteger(steps) || steps < 0) return null;

  return { voltage, steps };
}
