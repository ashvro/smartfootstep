import { useState } from 'react';
import { Info, TriangleAlert, X } from 'lucide-react';
import { Header } from './components/Header';
import { VoltageCards } from './components/VoltageCards';
import { LiveChart } from './components/LiveChart';
import { SessionPanel } from './components/SessionPanel';
import { SessionHistory } from './components/SessionHistory';
import { useSteppower } from './hooks/useSteppower';

export default function App() {
  const sp = useSteppower();
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);
  const savedRecently = sp.savedAt !== null && sp.now - sp.savedAt < 3_000;
  const showConnectionBanner =
    sp.connectionMessage !== null &&
    sp.connection !== 'connected' &&
    sp.connectionMessage !== dismissedMessage;

  return (
    <div className="min-h-screen pb-10">
      <Header
        connection={sp.connection}
        dataStatus={sp.dataStatus}
        supported={sp.supported}
        invalidLines={sp.invalidLines}
        onConnect={() => void sp.connect()}
        onDisconnect={() => void sp.disconnect()}
      />

      <main className="mx-auto max-w-[1440px] space-y-5 px-6 pt-6">
        {!sp.supported && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-400/25 bg-rose-400/[0.07] px-5 py-4">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" strokeWidth={2.2} />
            <div>
              <p className="text-sm font-semibold text-rose-200">
                Web Serial API not available in this browser
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Open this dashboard in Chrome or Edge on{' '}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-slate-300">
                  http://localhost:5173
                </code>{' '}
                to connect the Arduino over USB. Firefox and Safari do not
                support Web Serial.
              </p>
            </div>
          </div>
        )}

        {showConnectionBanner && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] px-5 py-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" strokeWidth={2.2} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-200">
                {sp.connection === 'error' ? 'Connection problem' : 'Connection status'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {sp.connectionMessage}
              </p>
            </div>
            <button
              type="button"
              className="mt-0.5 text-slate-500 transition-colors hover:text-slate-300"
              aria-label="Dismiss message"
              onClick={() => setDismissedMessage(sp.connectionMessage)}
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        )}

        <VoltageCards
          lastReading={sp.lastReading}
          avgVoltage={sp.avgVoltage}
          totalVoltage={sp.totalVoltage}
        />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            <LiveChart
              samples={sp.samples}
              now={sp.now}
              windowMs={sp.chartWindowMs}
              connectionStatus={sp.connection}
              dataStatus={sp.dataStatus}
            />
            <SessionHistory
              history={sp.history}
              onClear={sp.clearHistory}
            />
          </div>

          <div className="space-y-5">
            <SessionPanel
              session={sp.session}
              elapsedMs={sp.elapsedMs}
              steps={sp.steps}
              savedRecently={savedRecently}
              onStart={sp.startSession}
              onEnd={sp.endSession}
              onReset={sp.resetSession}
            />
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5 pb-1 text-[11px] text-slate-600">
          <p>
            StepPower · Smart Footstep Energy Monitoring System · Prototype
            dashboard for exhibition use
          </p>
          <p>
            All readings stay on this computer · Web Serial over USB · No
            cloud, no Wi-Fi
          </p>
        </footer>
      </main>
    </div>
  );
}
