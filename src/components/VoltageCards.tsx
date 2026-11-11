import { Gauge, TrendingUp, Zap } from 'lucide-react';
import type { Reading } from '../lib/types';

interface VoltageCardsProps {
  lastReading: Reading | null;
  avgVoltage: number;
  totalVoltage: number;
}

interface CardConfig {
  label: string;
  value: string;
  sub: string;
}

export function VoltageCards({
  lastReading,
  avgVoltage,
  totalVoltage,
}: VoltageCardsProps) {
  const cards: CardConfig[] = [
    {
      label: 'Current Voltage',
      value: lastReading ? `${lastReading.v.toFixed(2)} V` : '—',
      sub: lastReading ? 'Latest reading' : 'No reading yet',
    },
    {
      label: 'Average Voltage',
      value: avgVoltage > 0 ? `${avgVoltage.toFixed(2)} V` : '—',
      sub: 'Mean of all readings',
    },
    {
      label: 'Total Voltage',
      value: totalVoltage > 0 ? `${totalVoltage.toFixed(2)} V` : '—',
      sub: 'Sum for this session',
    },
  ];

  const icons = [Zap, Gauge, TrendingUp];
  const accents = ['text-cyan-300', 'text-violet-300', 'text-emerald-300'];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = icons[index];
        return (
          <div
            key={card.label}
            className="glass glass-hover animate-fade-up relative overflow-hidden rounded-2xl p-5"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="micro-label">{card.label}</span>
              <Icon className={`h-4 w-4 ${accents[index]}`} strokeWidth={2} />
            </div>
            <p
              className={`card-title mt-3 truncate text-3xl font-bold ${accents[index]}`}
            >
              {card.value}
            </p>
            <p className="mt-1.5 truncate text-[11px] text-slate-500">
              {card.sub}
            </p>
          </div>
        );
      })}
    </div>
  );
}
