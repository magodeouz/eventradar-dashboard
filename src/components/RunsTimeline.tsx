"use client";

import type { ScrapeRun } from "@/lib/types";
import { formatDateTime, relativeTime } from "@/lib/format";

const STATUS_BADGE: Record<ScrapeRun["status"], string> = {
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  partial: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const STATUS_LABEL: Record<ScrapeRun["status"], string> = {
  success: "Başarılı",
  partial: "Kısmi",
  failed: "Hata",
  running: "Çalışıyor",
};

export function RunsTimeline({ runs }: { runs: ScrapeRun[] }) {
  if (!runs.length) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Henüz scrape run kaydı yok.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Şehir</th>
            <th className="px-4 py-3 font-medium">Başlangıç</th>
            <th className="px-4 py-3 font-medium">Durum</th>
            <th className="px-4 py-3 text-right font-medium">Bulundu</th>
            <th className="px-4 py-3 text-right font-medium">Yeni</th>
            <th className="px-4 py-3 text-right font-medium">Güncel</th>
            <th className="px-4 py-3 text-right font-medium">Fiyat ∆</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {runs.map((run) => (
            <tr
              key={run.id}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
            >
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                {run.sourceId}
              </td>
              <td className="px-4 py-3 capitalize text-zinc-600 dark:text-zinc-400">
                {run.city ?? "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                <span className="font-mono text-xs">
                  {formatDateTime(run.startedAt)}
                </span>
                <span className="ml-1 text-xs text-zinc-400">
                  ({relativeTime(run.startedAt)})
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[run.status]}`}
                >
                  {STATUS_LABEL[run.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-900 dark:text-zinc-100">
                {run.eventsFound}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {run.eventsNew > 0 ? (
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    +{run.eventsNew}
                  </span>
                ) : (
                  <span className="text-zinc-400">0</span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                {run.eventsUpdated}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                {run.priceChanges}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
