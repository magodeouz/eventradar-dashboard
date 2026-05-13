"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Card } from "@/components/Card";
import {
  DateRangeFilter,
  defaultDateRange,
  type DateRange,
} from "@/components/DateRangeFilter";
import { fetchByCategory, fetchByCity, fetchMapEvents } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { CategoryStat, CityStat, MapEvent } from "@/lib/types";

// Leaflet window/document'a bağlı; statik export'ta SSR'de import edilmemeli.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
  ),
});

// Leaflet CSS sadece client tarafında yüklenmeli
function LeafletCss() {
  return (
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossOrigin=""
    />
  );
}

export default function MapPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange());
  const [category, setCategory] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [cities, setCities] = useState<CityStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter seçenekleri (tek sefer)
  useEffect(() => {
    Promise.all([fetchByCategory(), fetchByCity()]).then(([c, ci]) => {
      setCategories(c);
      setCities(ci);
    });
  }, []);

  // Filtreler değiştikçe haritayı yeniden çek
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMapEvents({
      from: dateRange.from,
      to: dateRange.to,
      category: category || undefined,
      city: city || undefined,
    })
      .then((r) => {
        if (!cancelled) {
          setEvents(r.events);
          setError(null);
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
  }, [dateRange, category, city]);

  return (
    <>
      <LeafletCss />
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Harita
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Türkiye'deki etkinliklerin coğrafi dağılımı.{" "}
              {loading ? "Yükleniyor..." : `${formatNumber(events.length)} etkinlik gösteriliyor.`}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />

            <Card>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    <option value="">Tümü</option>
                    {categories.map((c) => (
                      <option
                        key={c.category ?? "_none"}
                        value={c.category ?? ""}
                      >
                        {c.category ?? "Kategorisiz"} ({c.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Şehir
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    <option value="">Tümü</option>
                    {cities.map((c) => (
                      <option key={c.city ?? "_none"} value={c.city ?? ""}>
                        {c.city ?? "Bilinmiyor"} ({c.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <MapPin className="size-4 shrink-0 text-zinc-400" />
                <p>
                  Pin renkleri kategoriye göre değişir. Pin'e tıklayarak detayı
                  ve bilet linkini görebilirsin.
                </p>
              </div>
            </Card>
          </div>

          <div>
            {error ? (
              <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30">
                <h2 className="font-semibold text-red-900 dark:text-red-100">
                  Yüklenemedi
                </h2>
                <p className="mt-1 text-sm text-red-700 dark:text-red-200">
                  {error}
                </p>
              </Card>
            ) : (
              <MapView events={events} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
