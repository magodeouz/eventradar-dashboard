"use client";

import { useMemo } from "react";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (next: DateRange) => void;
}

interface Preset {
  label: string;
  /** Bugünden itibaren kaç gün ileri. */
  offsetDays: number;
}

const PRESETS: Preset[] = [
  { label: "1 hafta", offsetDays: 7 },
  { label: "2 hafta", offsetDays: 14 },
  { label: "1 ay", offsetDays: 30 },
  { label: "3 ay", offsetDays: 90 },
  { label: "1 yıl", offsetDays: 365 },
];

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function offsetIsoDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function defaultDateRange(): DateRange {
  return { from: todayIsoDate(), to: offsetIsoDate(30) };
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const todayIso = useMemo(() => todayIsoDate(), []);

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Tarih Aralığı
        </div>
        <button
          type="button"
          onClick={() => onChange(defaultDateRange())}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Sıfırla
        </button>
      </div>

      {/* Hızlı ön ayarlar */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => {
          const presetTo = offsetIsoDate(preset.offsetDays);
          const isActive = value.from === todayIso && value.to === presetTo;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange({ from: todayIso, to: presetTo })}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Custom range */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Başlangıç
          </label>
          <input
            type="date"
            value={value.from}
            max={value.to}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Bitiş
          </label>
          <input
            type="date"
            value={value.to}
            min={value.from}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>
      </div>
    </div>
  );
}
