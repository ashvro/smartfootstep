import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity } from 'lucide-react';
import type { DataStatus, Sample } from '../lib/types';

interface LiveChartProps {
  samples: Sample[];
  now: number;
  windowMs: number;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error' | 'unsupported';
  dataStatus: DataStatus;
}

interface ChartPoint {
  t: number;
  v: number;
  step: number | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function VoltageTooltip(props: any) {
  const active = props.active as boolean | undefined;
  const payload = props.payload as Array<{ payload: ChartPoint }> | undefined;
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const secondsAgo = Math.max(0, Math.round((Date.now() - point.t) / 1000));
  return (
    <div className="rounded-lg border border-white/10 bg-[#0a101c]/95 px-3 py-2 shadow-xl backdrop-blur">
      <p className="card-title text-sm font-semibold text-cyan-300">
        {point.v.toFixed(2)} V
      </p>
      <p className="mt-0.5 text-[10px] text-slate-400">
        {secondsAgo === 0 ? 'now' : `${secondsAgo}s ago`}
        {point.step !== null ? ' · footstep detected' : ''}
      </p>
    </div>
  );
}

export function LiveChart({
  samples,
  now,
  windowMs,
  connectionStatus,
  dataStatus,
}: LiveChartProps) {
  const lastSampleT = samples.length > 0 ? samples[samples.length - 1].t : null;
  const chartNow = Math.max(now, lastSampleT ?? now);
  const domainStart = chartNow - windowMs;

  const data: ChartPoint[] = samples.map((s) => ({
    t: s.t,
    v: s.v,
    step: s.step ? s.v : null,
  }));

  let peak = 0;
  for (const s of samples) peak = Math.max(peak, s.v);
  const yMax = Math.max(1, Math.ceil(peak * 1.3 * 10) / 10);

  const waitingForData = connectionStatus === 'connected' && dataStatus === 'waiting';

  return (
    <section className="glass animate-fade-up rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="card-title text-base font-semibold text-white">
            Live Voltage
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Rolling {Math.round(windowMs / 1000)}-second window · voltage vs time
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
            <span className="h-0.5 w-5 rounded bg-cyan-400" aria-hidden />
            Voltage (V)
          </span>
          <span className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
            <span
              className="h-2.5 w-2.5 rounded-full bg-violet-400 ring-2 ring-violet-400/25"
              aria-hidden
            />
            Detected footstep
          </span>
        </div>
      </div>

      <div className="relative h-[320px] w-full">
        {samples.length === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/[0.015] text-center">
            <Activity className="h-7 w-7 text-slate-600" strokeWidth={1.6} />
            <div>
              <p className="text-sm font-medium text-slate-300">
                {waitingForData
                  ? 'Connected — waiting for the first reading…'
                  : connectionStatus === 'connected'
                    ? 'Connected — no samples yet'
                    : 'Connect your Arduino to stream live voltage'}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Data arrives as V:/STEP: lines at 9600 baud over USB
              </p>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -6 }}>
            <defs>
              <linearGradient id="voltageFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.015} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="rgba(148,163,184,0.09)"
              strokeDasharray="3 6"
            />
            <XAxis
              dataKey="t"
              type="number"
              domain={[domainStart, chartNow]}
              allowDataOverflow
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(value: number) =>
                `${Math.round((value - chartNow) / 1000)}s`
              }
              minTickGap={40}
            />
            <YAxis
              domain={[0, yMax]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(value: number) => value.toFixed(1)}
              width={44}
            />
            <Tooltip
              content={<VoltageTooltip />}
              cursor={{ stroke: 'rgba(34,211,238,0.4)', strokeDasharray: '4 4' }}
            />
            <Area
              dataKey="v"
              type="monotone"
              stroke="#22d3ee"
              strokeWidth={2.25}
              fill="url(#voltageFill)"
              dot={false}
              activeDot={{ r: 4, fill: '#22d3ee', stroke: '#05070d', strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              dataKey="step"
              type="linear"
              stroke="none"
              connectNulls={false}
              dot={{
                r: 5,
                fill: '#a78bfa',
                stroke: '#05070d',
                strokeWidth: 2,
              }}
              activeDot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
