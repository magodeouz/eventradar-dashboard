"use client";

import type { ReactNode } from "react";
import { MapPin, Mic2, Route } from "lucide-react";
import { Card, StatCard } from "@/components/Card";
import { CityChart } from "@/components/CityChart";
import { formatNumber } from "@/lib/format";
import type { CityStat, EventInsightsResponse } from "@/lib/types";

function cityStatsFromInsights(
  byCity: EventInsightsResponse["byCity"],
): CityStat[] {
  return byCity.map((r) => ({
    city: r.city === "Mekân yok" ? null : r.city,
    count: r.count,
  }));
}

function PerformerTable({
  title,
  rows,
  hint,
  icon,
}: {
  title: string;
  rows: EventInsightsResponse["topPerformers"];
  hint?: string;
  icon: ReactNode;
}) {
  if (!rows.length) {
    return (
      <Card>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Veri yok.</p>
      </Card>
    );
  }
  return (
    <Card>
      <div className="mb-3 flex items-start gap-2">
        <span className="text-zinc-400">{icon}</span>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          {hint && (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {hint}
            </p>
          )}
        </div>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="pb-2 pr-2 font-medium">Gösteri / sanatçı</th>
              <th className="pb-2 pr-2 text-right font-medium">Etkinlik</th>
              <th className="pb-2 pr-2 text-right font-medium">Şehir</th>
              <th className="pb-2 font-medium">Şehirler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((p) => (
              <tr key={p.name} className="align-top">
                <td className="py-2 pr-2 font-medium text-zinc-900 dark:text-zinc-100">
                  {p.name}
                </td>
                <td className="py-2 pr-2 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {p.eventCount}
                </td>
                <td className="py-2 pr-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                  {p.cityCount}
                </td>
                <td className="py-2 text-xs text-zinc-600 dark:text-zinc-400">
                  {p.cities.slice(0, 6).join(", ")}
                  {p.cities.length > 6 ? "…" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function EventInsightsPanel({ data }: { data: EventInsightsResponse }) {
  const { summary, byCity, topPerformers, multiCityActs, note } = data;
  const cityChartData = cityStatsFromInsights(byCity);

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200/90">
        {note}
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Aktif etkinlik"
          value={formatNumber(summary.totalActiveEvents)}
        />
        <StatCard
          label="Türetilen gösteri grubu"
          value={formatNumber(summary.uniquePerformers)}
        />
        <StatCard
          label="Şehir (mekânı olan)"
          value={formatNumber(summary.citiesRepresented)}
        />
      </div>

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="size-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Etkinlikler hangi şehirde?
          </h2>
        </div>
        {cityChartData.length ? (
          <CityChart data={cityChartData} />
        ) : (
          <p className="text-sm text-zinc-500">Şehir verisi yok.</p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <PerformerTable
          title="En çok kaydı olan gösteriler"
          hint="Başlıktan ayrıştırılan isim; aynı sanatçı farklı yazımla gruplanabilir."
          rows={topPerformers}
          icon={<Mic2 className="size-4" />}
        />
        <PerformerTable
          title="Birden fazla şehirde listelenenler"
          hint="Tura / turne benzeri dağılım ipucu (≥2 şehir)."
          rows={multiCityActs}
          icon={<Route className="size-4" />}
        />
      </div>
    </div>
  );
}
