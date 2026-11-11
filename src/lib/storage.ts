import type { SessionRecord } from './types';

const STORAGE_KEY = 'steppower.sessions.v1';
const MAX_SESSIONS = 10;

function isSessionRecord(value: unknown): value is SessionRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.startedAt === 'number' &&
    typeof record.durationMs === 'number' &&
    typeof record.steps === 'number' &&
    typeof record.peakVoltage === 'number' &&
    typeof record.avgVoltage === 'number'
  );
}

/** Older records were saved without totalVoltage - default them to 0. */
function normalize(record: SessionRecord): SessionRecord {
  const total = (record as Partial<SessionRecord>).totalVoltage;
  return { ...record, totalVoltage: typeof total === 'number' ? total : 0 };
}

export function loadSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSessionRecord).map(normalize).slice(0, MAX_SESSIONS);
  } catch {
    return [];
  }
}

export function saveSessions(records: SessionRecord[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records.slice(0, MAX_SESSIONS)),
    );
  } catch {
    // Storage unavailable (private mode / quota) — sessions stay in memory.
  }
}

export function clearStoredSessions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
