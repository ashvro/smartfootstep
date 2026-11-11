import { Plug, Unplug, Zap } from 'lucide-react';
import type { ConnectionStatus, DataStatus } from '../lib/types';

interface HeaderProps {
  connection: ConnectionStatus;
  dataStatus: DataStatus;
  supported: boolean;
  invalidLines: number;
  onConnect: () => void;
  onDisconnect: () => void;
}

const CONNECTION_META: Record<
  ConnectionStatus,
  { label: string; dot: string; text: string }
> = {
  unsupported: {
    label: 'Web Serial unavailable',
    dot: 'bg-rose-400',
    text: 'text-rose-300',
  },
  disconnected: {
    label: 'Disconnected',
    dot: 'bg-slate-500',
    text: 'text-slate-400',
  },
  connecting: {
    label: 'Connecting…',
    dot: 'bg-amber-400 animate-pulse',
    text: 'text-amber-300',
  },
  connected: {
    label: 'Arduino connected',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
  },
  error: {
    label: 'Connection error',
    dot: 'bg-rose-500',
    text: 'text-rose-300',
  },
};

const DATA_META: Record<
  'live' | 'waiting' | 'stale',
  { label: string; dot: string; text: string; pulse: boolean }
> = {
  live: {
    label: 'Streaming',
    dot: 'bg-cyan-400',
    text: 'text-cyan-300',
    pulse: true,
  },
  waiting: {
    label: 'Waiting for data…',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
    pulse: true,
  },
  stale: {
    label: 'No incoming data',
    dot: 'bg-orange-400',
    text: 'text-orange-300',
    pulse: false,
  },
};

export function Header({
  connection,
  dataStatus,
  supported,
  invalidLines,
  onConnect,
  onDisconnect,
}: HeaderProps) {
  const connectionMeta = CONNECTION_META[connection];
  const dataMeta =
    connection === 'connected' && dataStatus !== 'idle'
      ? DATA_META[dataStatus as 'live' | 'waiting' | 'stale']
      : null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#05070d]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/90 via-cyan-500/80 to-violet-500/80 shadow-[0_10px_30px_-10px_rgba(34,211,238,0.7)]">
              <Zap className="h-6 w-6 text-[#04141a]" strokeWidth={2.4} />
            </div>
            <span className="glow-ring absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
          </div>
          <div>
            <h1 className="card-title text-xl font-bold leading-none text-white text-glow">
              StepPower
            </h1>
            <p className="mt-1 text-xs font-medium tracking-wide text-slate-400">
              Smart Footstep Energy Monitoring System
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-2">
            <span
              className={`h-2 w-2 rounded-full ${connectionMeta.dot}`}
              aria-hidden
            />
            <span
              className={`text-xs font-semibold ${connectionMeta.text}`}
            >
              {connectionMeta.label}
            </span>
          </div>

          {dataMeta && (
            <div className="flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-3.5 py-2">
              <span
                className={`h-2 w-2 rounded-full ${dataMeta.dot} ${dataMeta.pulse ? 'live-dot' : ''}`}
                aria-hidden
              />
              <span className={`text-xs font-semibold ${dataMeta.text}`}>
                {dataMeta.label}
              </span>
            </div>
          )}

          {invalidLines > 0 && (
            <div
              className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3.5 py-2"
              title="Lines that did not match the expected V:/STEP: format were ignored"
            >
              <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
              <span className="text-xs font-semibold text-amber-300">
                {invalidLines} invalid line{invalidLines === 1 ? '' : 's'} ignored
              </span>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={onConnect}
            disabled={!supported || connection === 'connecting' || connection === 'connected'}
          >
            <Plug className="h-4 w-4" strokeWidth={2.4} />
            Connect
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onDisconnect}
            disabled={connection === 'disconnected' || connection === 'unsupported'}
          >
            <Unplug className="h-4 w-4" strokeWidth={2.4} />
            Disconnect
          </button>
        </div>
      </div>
    </header>
  );
}
