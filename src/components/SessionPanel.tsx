import { Check, Footprints, Play, RotateCcw, Square } from 'lucide-react';
import { formatCount, formatDuration } from '../lib/format';
import type { SessionState } from '../lib/types';

interface SessionPanelProps {
  session: SessionState;
  elapsedMs: number;
  steps: number;
  savedRecently: boolean;
  onStart: () => void;
  onEnd: () => void;
  onReset: () => void;
}

export function SessionPanel({
  session,
  elapsedMs,
  steps,
  savedRecently,
  onStart,
  onEnd,
  onReset,
}: SessionPanelProps) {
  return (
    <section className="glass animate-fade-up rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="card-title text-base font-semibold text-white">
            Session Control
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Start resets stats · End saves to history
          </p>
        </div>
        <span
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
            session.active
              ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
              : 'border-white/10 bg-white/[0.04] text-slate-400'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${session.active ? 'bg-cyan-400 live-dot' : 'bg-slate-500'}`}
            aria-hidden
          />
          {session.active ? 'Session active' : 'Idle'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-4 text-center">
          <span className="micro-label">Elapsed time</span>
          <p className="card-title mt-1 text-3xl font-bold tabular-nums text-white text-glow">
            {formatDuration(elapsedMs)}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-4 text-center">
          <span className="micro-label">Steps</span>
          <p className="card-title mt-1 flex items-center justify-center gap-2 text-3xl font-bold tabular-nums text-cyan-300">
            <Footprints className="h-5 w-5" strokeWidth={2.2} />
            {formatCount(steps)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="btn btn-success col-span-2"
          onClick={onStart}
          disabled={session.active}
        >
          <Play className="h-4 w-4" strokeWidth={2.6} />
          Start Session
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={onEnd}
          disabled={!session.active}
        >
          <Square className="h-3.5 w-3.5" strokeWidth={2.6} />
          End Session
        </button>
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          <RotateCcw className="h-4 w-4" strokeWidth={2.4} />
          Reset
        </button>
      </div>

      <div className="mt-3 h-5">
        {savedRecently && (
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-300">
            <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
            Session saved to history
          </p>
        )}
      </div>
    </section>
  );
}
