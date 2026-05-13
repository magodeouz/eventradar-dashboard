"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  CalendarRange,
  Layers,
  MapPin,
  Mic2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Card, StatCard } from "@/components/Card";
import { formatNumber } from "@/lib/format";
import type { PerformersStatsResponse } from "@/lib/types";

const MONTH_LABEL = new Intl.DateTimeFormat("tr-TR", {
  month: "short",
  year: "numeric",
});

function sourceLabel(sourceId: string): string {
  if (sourceId === "bubilet") return "Bubilet";
  if (sourceId === "biletzero") return "Biletzero";
  return sourceId;
}

function monthLabel(ym: string): string {
  if (ym.length !== 7) return ym;
  try {
    return MONTH_LABEL.format(new Date(`${ym}-01T12:00:00`));
  } catch {
    return ym;
  }
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1)}…`;
}

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid #e4e4e7",
  backgroundColor: "rgba(255,255,255,0.96)",
};

type Props = {
  stats: PerformersStatsResponse | null;
  loading: boolean;
  error: string | null;
};

export function PerformersAnalyticsSection({ stats, loading, error }: Props) {
  if (error && !stats) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/25">
        <p className="text-sm text-amber-900 dark:text-amber-200">
          Analitik yüklenemedi: {error}
        </p>
      </Card>
    );
  }

  if (loading && !stats) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <div className="h-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="h-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </Card>
          <Card>
            <div className="h-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </Card>
        </div>
      </div>
    );
  }

  if (!stats || stats.totals.performers === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Mic2 className="size-5 text-purple-500" />
          <p className="text-sm">
            Bu filtrelere uyan sanatçı yok; analitik gösterilemiyor.
          </p>
        </div>
      </Card>
    );
  }

  const t = stats.totals;
  const topBarData = stats.topPerformers.map((p) => ({
    ...p,
    short: truncate(p.name, 14),
  }));
  const bucketData = stats.eventCountBuckets.map((b) => ({
    name: b.label,
    sanatçı: b.count,
  }));
  const cityData = stats.citiesTop.map((c) => ({
    name: truncate(c.city, 12),
    full: c.city,
    etkinlik: c.count,
  }));
  const sourceData = stats.sourcesTop.map((s) => ({
    name: sourceLabel(s.sourceId),
    etkinlik: s.count,
  }));
  const monthData = stats.eventsByMonth.map((m) => ({
    key: m.month,
    label: monthLabel(m.month),
    etkinlik: m.count,
  }));

  return (
    <div className="space-y-6">
      {error && stats ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          Analitik yenilenemedi; aşağıdaki özet önceki veya kısmi veri olabilir: {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            <Sparkles className="size-5 text-amber-500" />
            Analitik özeti
          </h2>
          <p className="mt-0.5 max-w-2xl text-xs text-zinc-500 dark:text-zinc-400">
            Aşağıdaki göstergeler üstteki filtrelerle aynı etkinlik kümesinden
            hesaplanır (sayfa numarası hariç).
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={<Mic2 className="size-4" />}
          label="Sanatçı"
          value={formatNumber(t.performers)}
          hint={`Medyan ${formatNumber(t.medianEventCount)} aktif / sanatçı`}
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="Benzersiz etkinlik"
          value={formatNumber(t.uniqueEvents)}
          hint={`${formatNumber(t.totalArtistEventPairs)} sanatçı–etkinlik eşlemesi`}
        />
        <StatCard
          label="Ort. aktif / sanatçı"
          value={String(t.avgEventsPerPerformer)}
          hint={`En yoğun: ${formatNumber(t.maxEventCount)} aktif`}
        />
        <StatCard
          icon={<Layers className="size-4" />}
          label="Çok kaynaklı etkinlik"
          value={formatNumber(t.multiSourceEvents)}
          hint="2+ platformda listelenen"
        />
        <StatCard
          icon={<CalendarRange className="size-4" />}
          label="Yaklaşan etkinlik"
          value={formatNumber(t.upcomingEvents)}
          hint="Şu andan sonra başlayan"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Tek etkinlikli sanatçı"
          value={formatNumber(t.singleEventArtists)}
          hint="Filtre kümesinde 1 aktif etkinlik"
        />
        <StatCard
          icon={<MapPin className="size-4" />}
          label="2+ şehirde olan"
          value={formatNumber(t.multiCityArtists)}
          hint="Çeşitli şehirlerde etkinlik"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="size-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              En çok aktif etkinliği olanlar (ilk 15)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={topBarData}
              layout="vertical"
              margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="short"
                width={100}
                tick={{ fontSize: 10, fill: "#71717a" }}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v) => [
                  formatNumber(typeof v === "number" ? v : Number(v)),
                  "Aktif",
                ]}
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload as {
                    name?: string;
                    totalEventCount?: number;
                    activeEventCount?: number;
                  };
                  if (!p?.name) return "";
                  return `${p.name} · Toplam ${formatNumber(p.totalEventCount ?? 0)} · Aktif ${formatNumber(p.activeEventCount ?? 0)}`;
                }}
              />
              <Bar
                dataKey="activeEventCount"
                fill="#9333ea"
                radius={[0, 4, 4, 0]}
                name="Aktif etkinlik"
              />
            </BarChart>
          </ResponsiveContainer>
          <ul className="mt-2 divide-y divide-zinc-100 text-xs dark:divide-zinc-800">
            {stats.topPerformers.slice(0, 5).map((p, i) => (
              <li key={p.key} className="flex items-center justify-between py-1.5">
                <span className="text-zinc-500">{i + 1}.</span>
                <Link
                  href={`/sanatcilar/detail/?key=${encodeURIComponent(p.key)}`}
                  className="min-w-0 flex-1 truncate px-2 font-medium text-purple-700 hover:underline dark:text-purple-300"
                >
                  {p.name}
                </Link>
                <span className="shrink-0 tabular-nums text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {formatNumber(p.activeEventCount)}
                  </span>
                  <span className="text-zinc-400"> / </span>
                  {formatNumber(p.totalEventCount)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="size-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Aktif etkinlik sayısı dağılımı (sanatçı başına)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={bucketData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="sanatçı" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Sanatçı" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="size-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Şehirlere göre etkinlik (üst 12)
            </h3>
          </div>
          {cityData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={cityData}
                layout="vertical"
                margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={88}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelFormatter={(_, p) =>
                    (p?.[0]?.payload as { full?: string })?.full ?? ""
                  }
                />
                <Bar dataKey="etkinlik" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-zinc-500">Veri yok.</p>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Layers className="size-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Kaynaklara göre etkinlik
            </h3>
          </div>
          {sourceData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={sourceData}
                layout="vertical"
                margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="etkinlik" fill="#ea580c" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-zinc-500">Kaynak yok.</p>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <CalendarRange className="size-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Aylara göre etkinlik (başlangıç tarihi)
          </h3>
        </div>
        {monthData.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#71717a" }}
                interval={monthData.length > 14 ? Math.ceil(monthData.length / 12) - 1 : 0}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={(_, p) =>
                  (p?.[0]?.payload as { key?: string })?.key ?? ""
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="etkinlik"
                name="Etkinlik"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-zinc-500">Tarih bilgisi olan etkinlik yok.</p>
        )}
      </Card>

      {loading && stats ? (
        <p className="text-center text-xs text-zinc-400">Güncelleniyor…</p>
      ) : null}
    </div>
  );
}
