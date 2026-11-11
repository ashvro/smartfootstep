import { useCallback, useEffect, useRef, useState } from 'react';
import { parseLine } from '../lib/parse';
import { clearStoredSessions, loadSessions, saveSessions } from '../lib/storage';
import type {
  ConnectionStatus,
  DataStatus,
  Reading,
  Sample,
  SessionRecord,
  SessionState,
} from '../lib/types';

const BAUD_RATE = 9600;
const CHART_WINDOW_MS = 60_000;
const SAMPLE_KEEP_MS = 90_000;
const STALE_AFTER_MS = 3_000;

const IDLE_SESSION: SessionState = {
  active: false,
  startedAt: null,
  lastDurationMs: 0,
};

function describeError(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'InvalidStateError':
        return 'Serial port is already open or busy. Unplug the Arduino, plug it back in, then retry.';
      case 'SecurityError':
        return 'Serial access was blocked. Use Chrome/Edge on http://localhost and click Connect again.';
      case 'NetworkError':
        return 'Could not open the serial port. It may be in use by another program (e.g. the Arduino IDE Serial Monitor).';
      default:
        return error.message;
    }
  }
  if (error instanceof Error) return error.message;
  return 'Unknown serial error';
}

export function useSteppower() {
  const supported =
    typeof navigator !== 'undefined' && 'serial' in navigator;

  const [connection, setConnection] = useState<ConnectionStatus>(
    supported ? 'disconnected' : 'unsupported',
  );
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [dataStatus, setDataStatus] = useState<DataStatus>('idle');
  const [lastReading, setLastReading] = useState<Reading | null>(null);
  const [invalidLines, setInvalidLines] = useState(0);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [steps, setSteps] = useState(0);
  const [peakVoltage, setPeakVoltage] = useState(0);
  const [totalVoltage, setTotalVoltage] = useState(0);
  const [aggregate, setAggregate] = useState({ sum: 0, count: 0 });
  const [session, setSession] = useState<SessionState>(IDLE_SESSION);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const prevDeviceStepsRef = useRef<number | null>(null);
  const lastDataAtRef = useRef<number | null>(null);

  useEffect(() => {
    setHistory(loadSessions());
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (connection !== 'connected') {
      setDataStatus('idle');
      return;
    }
    const id = window.setInterval(() => {
      const last = lastDataAtRef.current;
      setDataStatus(
        last === null
          ? 'waiting'
          : Date.now() - last < STALE_AFTER_MS
            ? 'live'
            : 'stale',
      );
    }, 400);
    return () => window.clearInterval(id);
  }, [connection]);

  const ingest = useCallback((rawLine: string) => {
    const line = rawLine.trim();
    if (!line) return;

    const parsed = parseLine(line);
    if (!parsed) {
      setInvalidLines((count) => count + 1);
      return;
    }

    const t = Date.now();
    lastDataAtRef.current = t;
    setLastReading({ v: parsed.voltage, step: parsed.steps, t });
    setAggregate((a) => ({ sum: a.sum + parsed.voltage, count: a.count + 1 }));
    setTotalVoltage((sum) => sum + parsed.voltage);
    setPeakVoltage((peak) =>
      parsed.voltage > peak ? parsed.voltage : peak,
    );

    // The STEP field is a cumulative counter on the device. The first
    // reading only sets the baseline so pre-connection steps are not
    // claimed. A lower value means the Arduino rebooted (e.g. DTR reset
    // on connect) — count the new value as progress since that reset.
    const previous = prevDeviceStepsRef.current;
    let delta = 0;
    if (previous !== null) {
      delta = parsed.steps >= previous ? parsed.steps - previous : parsed.steps;
    }
    prevDeviceStepsRef.current = parsed.steps;

    if (delta > 0) {
      setSteps((count) => count + delta);
    }

    setSamples((prev) => {
      const entry: Sample = { t, v: parsed.voltage, step: delta > 0 };
      const next = [...prev, entry];
      const cutoff = t - SAMPLE_KEEP_MS;
      return next[0].t < cutoff ? next.filter((s) => s.t >= cutoff) : next;
    });
  }, []);

  const readLoop = useCallback(
    async (port: SerialPort) => {
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        while (port.readable) {
          const reader = port.readable.getReader();
          readerRef.current = reader;
          try {
            for (;;) {
              const { value, done } = await reader.read();
              if (done) break;
              if (!value) continue;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split(/\r?\n/);
              buffer = lines.pop() ?? '';
              for (const line of lines) ingest(line);
            }
          } finally {
            try {
              reader.releaseLock();
            } catch {
              // Lock already released.
            }
            if (readerRef.current === reader) readerRef.current = null;
          }
        }
      } catch {
        if (portRef.current === port) {
          setConnection('disconnected');
          setConnectionMessage(
            'Arduino disconnected unexpectedly. Plug it in and reconnect.',
          );
        }
      } finally {
        try {
          await port.close();
        } catch {
          // Port already closed by an explicit disconnect.
        }
        if (portRef.current === port) portRef.current = null;
      }
    },
    [ingest],
  );

  const connect = useCallback(async () => {
    const serial = typeof navigator !== 'undefined' ? navigator.serial : undefined;
    if (!serial) {
      setConnection('unsupported');
      return;
    }
    setConnection('connecting');
    setConnectionMessage(null);
    try {
      const port = await serial.requestPort();
      await port.open({ baudRate: BAUD_RATE });
      portRef.current = port;
      prevDeviceStepsRef.current = null;
      lastDataAtRef.current = null;
      setInvalidLines(0);
      setLastReading(null);
      setConnection('connected');
      setDataStatus('waiting');
      void readLoop(port);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        // User closed the port picker.
        setConnection('disconnected');
        return;
      }
      setConnection('error');
      setConnectionMessage(describeError(error));
    }
  }, [readLoop]);

  const disconnect = useCallback(async () => {
    const reader = readerRef.current;
    if (reader) {
      try {
        await reader.cancel();
      } catch {
        // Ignore.
      }
    }
    const port = portRef.current;
    if (port) {
      try {
        await port.close();
      } catch {
        // Ignore.
      }
    }
    portRef.current = null;
    setConnection('disconnected');
    setConnectionMessage(null);
    setDataStatus('idle');
  }, []);

  useEffect(() => {
    const serial = typeof navigator !== 'undefined' ? navigator.serial : undefined;
    if (!serial) return;
    const onDisconnect = () => {
      if (!portRef.current) return;
      portRef.current = null;
      setConnection('disconnected');
      setConnectionMessage('Arduino unplugged. Reconnect when ready.');
      setDataStatus('idle');
    };
    serial.addEventListener('disconnect', onDisconnect);
    return () => serial.removeEventListener('disconnect', onDisconnect);
  }, []);

  const startSession = useCallback(() => {
    setSteps(0);
    setPeakVoltage(0);
    setTotalVoltage(0);
    setAggregate({ sum: 0, count: 0 });
    setSamples([]);
    setInvalidLines(0);
    setSavedAt(null);
    setSession({ active: true, startedAt: Date.now(), lastDurationMs: 0 });
  }, []);

  const endSession = useCallback(() => {
    if (!session.active || session.startedAt === null) return;
    const durationMs = Date.now() - session.startedAt;
    const record: SessionRecord = {
      id: String(session.startedAt),
      startedAt: session.startedAt,
      durationMs,
      steps,
      peakVoltage,
      avgVoltage: aggregate.count > 0 ? aggregate.sum / aggregate.count : 0,
      totalVoltage,
    };
    const next = [record, ...history].slice(0, 10);
    setHistory(next);
    saveSessions(next);
    setSession({ active: false, startedAt: null, lastDurationMs: durationMs });
    setSavedAt(Date.now());
  }, [session, steps, peakVoltage, aggregate, totalVoltage, history]);

  const resetSession = useCallback(() => {
    setSteps(0);
    setPeakVoltage(0);
    setTotalVoltage(0);
    setAggregate({ sum: 0, count: 0 });
    setSamples([]);
    setInvalidLines(0);
    setSession(IDLE_SESSION);
    setSavedAt(null);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    clearStoredSessions();
  }, []);

  const avgVoltage =
    aggregate.count > 0 ? aggregate.sum / aggregate.count : 0;
  const elapsedMs =
    session.active && session.startedAt !== null
      ? Math.max(0, now - session.startedAt)
      : session.lastDurationMs;

  return {
    supported,
    connection,
    connectionMessage,
    dataStatus,
    lastReading,
    invalidLines,
    samples,
    steps,
    peakVoltage,
    totalVoltage,
    avgVoltage,
    elapsedMs,
    session,
    history,
    savedAt,
    now,
    connect,
    disconnect,
    startSession,
    endSession,
    resetSession,
    clearHistory,
    chartWindowMs: CHART_WINDOW_MS,
  };
}

export type Steppower = ReturnType<typeof useSteppower>;
