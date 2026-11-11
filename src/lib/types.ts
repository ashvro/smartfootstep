export interface Sample {
  t: number;
  v: number;
  step: boolean;
}

export interface Reading {
  v: number;
  step: number;
  t: number;
}

export interface SessionRecord {
  id: string;
  startedAt: number;
  durationMs: number;
  steps: number;
  peakVoltage: number;
  avgVoltage: number;
  totalVoltage: number;
}

export interface SessionState {
  active: boolean;
  startedAt: number | null;
  lastDurationMs: number;
}

export type ConnectionStatus =
  | 'unsupported'
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export type DataStatus = 'idle' | 'waiting' | 'live' | 'stale';
