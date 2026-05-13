"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, Calendar as CalendarIcon, MapPin } from "lucide-react";
import {
  DateRangeFilter,
  defaultDateRange,
  type DateRange,
} from "@/components/DateRangeFilter";
import {
  fetchByCategory,
  fetchByCity,
  fetchEvents,
} from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { CategoryStat, CityStat, Event } from "@/lib/types";

const PAGE_SIZE = 24;

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [cities, setCities] = useState<CityStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [useDateRange, setUseDateRange] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(() => defaultDateRange());
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setOffset(0);
  }, [search, category, city, upcomingOnly, useDateRange, dateRange.from, dateRange.to]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchEvents({
      q: search || undefined,
      category: category || undefined,
      city: city || undefined,
      upcomingOnly,
      from: useDateRange ? dateRange.from : undefined,
      to: useDateRange ? dateRange.to : undefined,
      limit: PAGE_SIZE,
      offset,
    })
      .then((r) => {
        if (!cancelled) {
          setEvents(r.events);
          setTotalCount(typeof r.total === "number" ? r.total : r.events.length);
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
  }, [
    search,
    category,
    city,
    upcomingOnly,
    useDateRange,
    dateRange.from,
    dateRange.to,
    offset,
  ]);

  useEffect(() => {
    Promise.all([fetchByCategory(), fetchByCity()]).then(([c, ci]) => {
      setCategories(c);
      setCities(ci);
    });
  }, []);

  const rangeLabel = useMemo(() => {
    if (!totalCount) return loading ? "…" : "0 sonuç";
    const fromN = offset + 1;
    const toN = offset + events.length;
    return `${fromN}–${toN} / ${totalCount}`;
  }, [totalCount, offset, events.length, loading]);

  const canPrev = offset > 0;
  const canNext = offset + events.length < totalCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Etkinlikler
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {loading ? "Yükleniyor…" : rangeLabel}
        </p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Şehir / sanatçı özetleri için{" "}
          <Link
            href="/analytics/?tab=events"
            className="font-medium text-purple-600 hover:underline dark:text-purple-400"
          >
            Analitik → Etkinlik & şehir
          </Link>
          .
        </p>
      </div>

      {/* FILTERS */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Etkinlik ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-white py-2 pl-8 pr-3 text-sm placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c.category ?? "_none"} value={c.category ?? ""}>
              {c.category ?? "Kategorisiz"} ({c.count})
            </option>
          ))}
        </select>
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
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={upcomingOnly}
            onChange={(e) => setUpcomingOnly(e.target.checked)}
            className="size-4 accent-purple-600"
          />
          Sadece yaklaşan etkinlikler
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={useDateRange}
            onChange={(e) => setUseDateRange(e.target.checked)}
            className="size-4 accent-purple-600"
          />
          Tarih aralığı ile sınırla
        </label>
      </div>

      {useDateRange && (
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      )}

      {/* GRID */}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          Yüklenemedi: {error}
        </div>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900"
            />
          ))}
        </div>
      ) : !events.length ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Hiç etkinlik bulunamadı.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
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

function EventCard({ event }: { event: Event }) {
  return (
    <Link
      href={`/events/detail/?id=${event.id}`}
      className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-purple-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-purple-700"
    >
      <div className="aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageUrl}
            alt={event.title}
            className="size-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-zinc-400">
            görsel yok
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="mb-1.5 flex items-center gap-1.5">
          {event.category && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              {event.category}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
          {event.title}
        </h3>
        {event.performers && event.performers.length > 0 && (
          <p className="mt-1 line-clamp-1 text-xs text-purple-700 dark:text-purple-300">
            {event.performers.map((p) => p.name).join(" · ")}
          </p>
        )}
        <div className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="size-3" />
            {formatDate(event.startTime)}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3" />
            {event.venueName ?? "Mekân belirtilmemiş"}
            {event.venueCity && (
              <span className="text-zinc-400">· {event.venueCity}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
