"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Mic2, Search } from "lucide-react";
import {
  DateRangeFilter,
  defaultDateRange,
  type DateRange,
} from "@/components/DateRangeFilter";
import { PerformersAnalyticsSection } from "@/components/PerformersAnalyticsSection";
import { fetchByCity, fetchPerformers, fetchPerformersStats } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { CityStat, PerformerListItem, PerformersStatsResponse } from "@/lib/types";

const PAGE_SIZE = 60;
const SOURCES: { value: string; label: string }[] = [
  { value: "", label: "Tüm kaynaklar" },
  { value: "bubilet", label: "Bubilet" },
  { value: "biletzero", label: "Biletzero" },
];

export default function SanatcilarPage() {
  const [performers, setPerformers] = useState<PerformerListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cities, setCities] = useState<CityStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PerformersStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [useDateRange, setUseDateRange] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(() => defaultDateRange());
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setOffset(0);
  }, [search, city, sourceId, useDateRange, dateRange.from, dateRange.to]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPerformers({
      q: search || undefined,
      city: city || undefined,
      sourceId: sourceId || undefined,
      from: useDateRange ? dateRange.from : undefined,
      to: useDateRange ? dateRange.to : undefined,
      limit: PAGE_SIZE,
      offset,
    })
      .then((r) => {
        if (!cancelled) {
          setPerformers(r.performers);
          setTotal(r.total);
        }
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
  }, [search, city, sourceId, useDateRange, dateRange.from, dateRange.to, offset]);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    setStatsError(null);
    fetchPerformersStats({
      q: search || undefined,
      city: city || undefined,
      sourceId: sourceId || undefined,
      from: useDateRange ? dateRange.from : undefined,
      to: useDateRange ? dateRange.to : undefined,
    })
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch((e) => {
        if (!cancelled) setStatsError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, city, sourceId, useDateRange, dateRange.from, dateRange.to]);

  useEffect(() => {
    fetchByCity().then(setCities);
  }, []);

  const rangeLabel = useMemo(() => {
    if (!total) return loading ? "…" : "0 sanatçı";
    const fromN = offset + 1;
    const toN = offset + performers.length;
    return `${fromN}–${toN} / ${total}`;
  }, [total, offset, performers.length, loading]);

  const canPrev = offset > 0;
  const canNext = offset + performers.length < total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          <Mic2 className="size-7 text-purple-600 dark:text-purple-400" />
          Sanatçılar
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Etkinlik sayısına göre sıralı; filtreler API ile aynı anda uygulanır.
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {loading ? "Yükleniyor…" : rangeLabel}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Sanatçı adı ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-white py-2 pl-8 pr-3 text-sm placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">Tüm şehirler</option>
          {cities.map((c) => (
            <option key={c.city ?? "_none"} value={c.city ?? ""}>
              {c.city ?? "Bilinmiyor"} ({c.count})
            </option>
          ))}
        </select>
        <select
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        >
          {SOURCES.map((s) => (
            <option key={s.value || "_all"} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <label className="flex w-fit items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={useDateRange}
          onChange={(e) => setUseDateRange(e.target.checked)}
          className="size-4 accent-purple-600"
        />
        Tarih aralığı (etkinlik tarihi)
      </label>
      {useDateRange && (
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      )}

      <PerformersAnalyticsSection
        stats={stats}
        loading={statsLoading}
        error={statsError}
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          Yüklenemedi: {error}
        </div>
      ) : loading ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="h-10 animate-pulse bg-zinc-100 dark:bg-zinc-900" />
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse border-t border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
            />
          ))}
        </div>
      ) : !performers.length ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Bu filtrelere uyan sanatçı bulunamadı.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                  <th className="w-10 px-3 py-3 text-right">#</th>
                  <th className="px-3 py-3">Sanatçı</th>
                  <th
                    className="hidden px-3 py-3 sm:table-cell"
                    title="Aktif etkinliklerde görülen farklı şehir/mekân etiketi sayısı"
                  >
                    Şehir
                  </th>
                  <th
                    className="px-3 py-3 text-right tabular-nums"
                    title="Pasif kayıtlar dahil benzersiz etkinlik"
                  >
                    Toplam
                  </th>
                  <th
                    className="px-3 py-3 text-right tabular-nums"
                    title="is_active = true"
                  >
                    Aktif
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {performers.map((p, idx) => (
                  <tr
                    key={p.key}
                    className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                  >
                    <td className="px-3 py-3 text-right text-xs tabular-nums text-zinc-400">
                      {offset + idx + 1}
                    </td>
                    <td className="max-w-[200px] px-3 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      <Link
                        href={`/sanatcilar/detail/?key=${encodeURIComponent(p.key)}`}
                        className="line-clamp-2 text-purple-700 hover:underline dark:text-purple-300"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-3 text-zinc-500 dark:text-zinc-400 sm:table-cell">
                      {p.cityCount}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                      {formatNumber(p.totalEventCount)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 font-mono text-xs font-medium tabular-nums text-purple-800 dark:bg-purple-900/40 dark:text-purple-200">
                        {formatNumber(p.activeEventCount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{rangeLabel}</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canPrev || loading}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Önceki
              </button>
              <button
                type="button"
                disabled={!canNext || loading}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Sonraki
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
