"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
  Mic2,
} from "lucide-react";
import {
  DateRangeFilter,
  defaultDateRange,
  type DateRange,
} from "@/components/DateRangeFilter";
import { Card, StatCard } from "@/components/Card";
import { fetchByCity, fetchPerformerDetail } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import type { CityStat, PerformerDetailResponse, PerformerEventRow } from "@/lib/types";

export default function PerformerDetailWrapper() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PerformerDetailPage />
    </Suspense>
  );
}

function sourceBadgeClass(source: string) {
  if (source === "bubilet")
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
  if (source === "biletzero")
    return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100";
  return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
}

function usePerformerEventStats(events: PerformerEventRow[]) {
  return useMemo(() => {
    const now = Date.now();
    let upcoming = 0;
    let past = 0;
    const cityMap = new Map<string, number>();
    const sourceMap = new Map<string, number>();
    for (const ev of events) {
      const t = ev.startTime ? Date.parse(ev.startTime) : NaN;
      if (Number.isFinite(t)) {
        if (t >= now) upcoming += 1;
        else past += 1;
      }
      const c = ev.venueCity?.trim() || "Bilinmiyor";
      cityMap.set(c, (cityMap.get(c) ?? 0) + 1);
      for (const s of ev.sources) {
        sourceMap.set(s, (sourceMap.get(s) ?? 0) + 1);
      }
    }
    const cities = [...cityMap.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))
      .slice(0, 8);
    const sources = [...sourceMap.entries()].sort((a, b) => b[1] - a[1]);
    const multiSource = events.filter((e) => e.sources.length >= 2).length;
    return { upcoming, past, cities, sources, total: events.length, multiSource };
  }, [events]);
}

function PerformerDetailSummary({ events }: { events: PerformerEventRow[] }) {
  const s = usePerformerEventStats(events);
  const maxCity = s.cities[0]?.[1] ?? 1;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Filtreli etkinlik" value={formatNumber(s.total)} />
        <StatCard
          label="Yaklaşan"
          value={formatNumber(s.upcoming)}
          hint={`Geçmiş: ${formatNumber(s.past)}`}
        />
        <StatCard
          label="Şehir çeşitliliği"
          value={formatNumber(s.cities.length)}
          hint="Farklı şehir"
        />
        <StatCard
          label="Çok kaynaklı"
          value={formatNumber(s.multiSource)}
          hint="2+ platform"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Şehir dağılımı
          </h3>
          <ul className="space-y-2">
            {s.cities.map(([city, count]) => (
              <li key={city} className="flex items-center gap-2 text-sm">
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${Math.max(6, (count / maxCity) * 100)}%` }}
                  />
                </div>
                <span className="w-28 shrink-0 truncate text-right text-zinc-700 dark:text-zinc-300">
                  {city}
                </span>
                <span className="w-10 shrink-0 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                  {formatNumber(count)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Kaynak görünürlüğü
          </h3>
          <ul className="space-y-2">
            {s.sources.map(([src, count]) => (
              <li key={src} className="flex items-center justify-between gap-2 text-sm">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${sourceBadgeClass(src)}`}
                >
                  {src}
                </span>
                <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                  {formatNumber(count)} etkinlik
                </span>
              </li>
            ))}
          </ul>
          {!s.sources.length ? (
            <p className="text-sm text-zinc-500">Kaynak bilgisi yok.</p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function PerformerDetailPage() {
  const searchParams = useSearchParams();
  const keyParam = searchParams.get("key");

  const [cities, setCities] = useState<CityStat[]>([]);
  const [city, setCity] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [useDateRange, setUseDateRange] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(() => defaultDateRange());

  const [data, setData] = useState<PerformerDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchByCity().then(setCities);
  }, []);

  useEffect(() => {
    if (!keyParam) {
      setError("Sanatçı anahtarı (key) eksik");
      setLoading(false);
      setData(null);
      return;
    }
    const key = decodeURIComponent(keyParam);
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPerformerDetail(key, {
      city: city || undefined,
      sourceId: sourceId || undefined,
      from: useDateRange ? dateRange.from : undefined,
      to: useDateRange ? dateRange.to : undefined,
    })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [keyParam, city, sourceId, useDateRange, dateRange.from, dateRange.to]);

  if (!keyParam) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (loading) return <LoadingSkeleton />;
  if (error || !data) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {error ?? "Yüklenemedi"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <div>
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <Mic2 className="size-6" />
          <span className="text-sm font-medium">Sanatçı</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {data.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {data.eventCount} etkinlik · Tarih sırası: bugüne en yakın oturumlar önce
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">Tüm şehirler</option>
          {cities.map((c) => (
            <option key={c.city ?? "_none"} value={c.city ?? ""}>
              {c.city ?? "Bilinmiyor"}
            </option>
          ))}
        </select>
        <select
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">Tüm kaynaklar</option>
          <option value="bubilet">Bubilet</option>
          <option value="biletzero">Biletzero</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={useDateRange}
            onChange={(e) => setUseDateRange(e.target.checked)}
            className="size-4 accent-purple-600"
          />
          Tarih aralığı
        </label>
      </div>
      {useDateRange && (
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      )}

      <PerformerDetailSummary events={data.events} />

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Etkinlik</th>
              <th className="px-4 py-3">Mekân</th>
              <th className="px-4 py-3">Şehir</th>
              <th className="px-4 py-3">Kaynaklar</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.events.map((ev) => (
              <tr key={ev.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40">
                <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3.5 shrink-0 text-zinc-400" />
                    {formatDate(ev.startTime)}
                  </span>
                </td>
                <td className="max-w-[220px] px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  <span className="line-clamp-2">{ev.title}</span>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 shrink-0 text-zinc-400" />
                    {ev.venueName ?? "—"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {ev.venueCity ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {ev.sources.length ? (
                      ev.sources.map((s) => (
                        <span
                          key={s}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${sourceBadgeClass(s)}`}
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/events/detail/?id=${ev.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline dark:text-purple-400"
                  >
                    Detay
                    <ExternalLink className="size-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/sanatcilar/"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      <ArrowLeft className="size-4" />
      Sanatçılara dön
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-10 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
      <div className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}
