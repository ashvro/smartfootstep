import { Clock, Trash2 } from 'lucide-react';
import { formatDateTime, formatDuration, formatCount } from '../lib/format';
import type { SessionRecord } from '../lib/types';

interface SessionHistoryProps {
  history: SessionRecord[];
  onClear: () => void;
}

export function SessionHistory({ history, onClear }: SessionHistoryProps) {
  return (
    <section className="glass animate-fade-up rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="card-title text-base font-semibold text-white">
            Session History
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Stored locally in this browser · latest 10 sessions
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost !px-3 !py-1.5 !text-[11px]"
          onClick={onClear}
          disabled={history.length === 0}
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
          Clear
        </button>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-4 py-8 text-center">
          <Clock className="h-6 w-6 text-slate-600" strokeWidth={1.6} />
          <p className="text-sm font-medium text-slate-400">No sessions yet</p>
          <p className="text-[11px] text-slate-600">
            Run START SESSION, walk, then END SESSION to record one.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="micro-label pb-2 pr-3">#</th>
                <th className="micro-label pb-2 pr-3">Date / time</th>
                <th className="micro-label pb-2 pr-3 text-right">Duration</th>
                <th className="micro-label pb-2 pr-3 text-right">Steps</th>
                <th className="micro-label pb-2 pr-3 text-right">Avg V</th>
                <th className="micro-label pb-2 text-right">Total V</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record, index) => (
                <tr
                  key={record.id}
                  className="group border-b border-white/[0.04] transition-colors hover:bg-white/[0.035]"
                >
                  <td className="py-2.5 pr-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/[0.05] text-[11px] font-bold text-slate-400 group-hover:border-cyan-400/30 group-hover:text-cyan-300">
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-sm text-slate-300">
                    {formatDateTime(record.startedAt)}
                  </td>
                  <td className="card-title py-2.5 pr-3 text-right text-sm font-semibold tabular-nums text-white">
                    {formatDuration(record.durationMs)}
                  </td>
                  <td className="py-2.5 pr-3 text-right text-sm font-semibold tabular-nums text-cyan-300">
                    {formatCount(record.steps)}
                  </td>
                  <td className="py-2.5 pr-3 text-right text-sm tabular-nums text-slate-300">
                    {record.avgVoltage.toFixed(2)} V
                  </td>
                  <td className="py-2.5 text-right text-sm font-semibold tabular-nums text-emerald-300">
                    {record.totalVoltage.toFixed(2)} V
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
