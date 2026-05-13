"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Layers,
  LineChart as LineChartIcon,
  Table2,
} from "lucide-react";
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
import { EventInsightsPanel } from "@/components/analytics/EventInsightsPanel";
import { Card, StatCard } from "@/components/Card";
import { CategoryChart } from "@/components/CategoryChart";
import { CityChart } from "@/components/CityChart";
import { RunsTimeline } from "@/components/RunsTimeline";
import { SourceChart } from "@/components/SourceChart";
import {
  fetchByCategory,
  fetchByCity,
  fetchBySource,
  fetchEventInsights,
  fetchScrapeSummary,
  fetchSourceOverlap,
  fetchTimeSeries,
} from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type {
  CategoryStat,
  CityStat,
  EventInsightsResponse,
  ScrapeSummaryResponse,
  SourceOverlapItem,
  SourceStat,
  TimeSeriesResponse,
} from "@/lib/types";

const DAY_OPTIONS = [14, 30, 90] as const;
type Tab = "overview" | "events" | "ops";

const CITY_LINE_COLORS = [
  "#a855f7",
  "#0ea5e9",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#6366f1",
];

function tabFromQuery(q: string | null): Tab {
  if (q === "events" || q === "ops") return q;
  return "overview";
}

function TabBar({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
}) {
  const items: { id: Tab; label: string }[] = [
    { id: "overview", label: "Veri özeti" },
    { id: "events", label: "Etkinlik & şehir" },
    { id: "ops", label: "Operasyon" },
  ];
  return (
    <div
      className="flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-zinc-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-900/40"
      role="tablist"
    >
      {items.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          onClick={() => onChange(id)}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === id
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function AnalyticsShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() =>
    tabFromQuery(searchParams.get("tab")),
  );

  const [seriesDays, setSeriesDays] = useState<(typeof DAY_OPTIONS)[number]>(
    30,
  );
  const [timeSeries, setTimeSeries] = useState<TimeSeriesResponse | null>(null);
  const [overlap, setOverlap] = useState<SourceOverlapItem[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [cities, setCities] = useState<CityStat[]>([]);
  const [sources, setSources] = useState<SourceStat[]>([]);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [insights, setInsights] = useState<EventInsightsResponse | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsTried, setInsightsTried] = useState(false);

  const [scrape, setScrape] = useState<ScrapeSummaryResponse | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeTried, setScrapeTried] = useState(false);

  useEffect(() => {
    setTab(tabFromQuery(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    if (tab === "events") return;
    setInsightsTried(false);
    setInsights(null);
    setInsightsError(null);
  }, [tab]);

  useEffect(() => {
    if (tab === "ops") return;
    setScrapeTried(false);
    setScrape(null);
    setScrapeError(null);
  }, [tab]);

  const goTab = useCallback(
    (t: Tab) => {
      setTab(t);
      router.replace(`/analytics/?tab=${t}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;
    setOverviewLoading(true);
    setOverviewError(null);
    Promise.all([
      fetchTimeSeries(seriesDays, { groupByCity: true, top: 12 }),
      fetchSourceOverlap(),
      fetchByCategory(),
      fetchByCity(),
      fetchBySource(),
    ])
      .then(([ts, ov, cat, cit, src]) => {
        if (cancelled) return;
        setTimeSeries(ts);
        setOverlap(ov);
        setCategories(cat);
        setCities(cit);
        setSources(src);
      })
      .catch((e) => {
        if (!cancelled) setOverviewError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setOverviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [seriesDays]);

  useEffect(() => {
    if (tab !== "events") return;
    if (insightsTried) return;
    let cancelled = false;
    setInsightsLoading(true);
    setInsightsError(null);
    fetchEventInsights()
      .then((d) => {
        if (!cancelled) setInsights(d);
      })
      .catch((e) => {
        if (!cancelled) setInsightsError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) {
          setInsightsLoading(false);
          setInsightsTried(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tab, insightsTried]);

  useEffect(() => {
    if (tab !== "ops") return;
    if (scrapeTried) return;
    let cancelled = false;
    setScrapeLoading(true);
    setScrapeError(null);
    fetchScrapeSummary(50)
      .then((d) => {
        if (!cancelled) setScrape(d);
      })
      .catch((e) => {
        if (!cancelled) setScrapeError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) {
          setScrapeLoading(false);
          setScrapeTried(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tab, scrapeTried]);

  const lineData =
    timeSeries?.series.map((p) => ({
      ...p,
      label: p.day.slice(5),
    })) ?? [];

  const cityLineData =
    timeSeries?.byCity?.newEventsSeries.map((row) => {
      const top = timeSeries.byCity?.topCities.slice(0, 6) ?? [];
      const pt: Record<string, string | number> = {
        day: row.day,
        label: row.day.slice(5),
      };
      for (const city of top) {
        pt[city] = row.cities[city] ?? 0;
      }
      if (row.cities._other != null) pt._other = row.cities._other;
      return pt;
    }) ?? [];

  const cityLineKeys = timeSeries?.byCity?.topCities.slice(0, 6) ?? [];
  const showOtherLine = cityLineData.some((d) => Number(d._other) > 0);

  const overlapChart = overlap.map((d) => ({
    name: d.sourceCount === 1 ? "1 kaynak" : `${d.sourceCount} kaynak`,
    events: d.events,
    sourceCount: d.sourceCount,
  }));

  const fatalError = overviewError && !timeSeries;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Analitik
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
            Büyüme eğrileri, dağılımlar, etkinlik / şehir içgörüleri ve scrape
            operasyonu — tek sayfada sekmeler halinde.
          </p>
        </div>
        <Link
          href="/events/"
          className="text-sm font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400"
        >
          Etkinlik listesine git →
        </Link>
      </div>

      <TabBar tab={tab} onChange={goTab} />

      {fatalError && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {overviewError}
          </p>
        </Card>
      )}

      {tab === "overview" && (
        <div className="space-y-6">
          {overviewLoading && !timeSeries ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <div className="h-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                </Card>
              ))}
            </div>
          ) : (
            <>
              <Card>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <LineChartIcon className="size-4 text-zinc-400" />
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Zaman serisi
                    </h2>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Yeni etkinlik · fiyat logu
                    </span>
                  </div>
                  <div className="flex gap-1 rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800">
                    {DAY_OPTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSeriesDays(d)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                          seriesDays === d
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {d} gün
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={lineData}
                    margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#71717a" }}
                      interval={
                        seriesDays <= 14 ? 0 : seriesDays <= 30 ? 2 : 6
                      }
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#71717a" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      labelFormatter={(_, payload) =>
                        (payload?.[0]?.payload as { day?: string })?.day ?? ""
                      }
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e4e4e7",
                        backgroundColor: "white",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="newEvents"
                      name="Yeni etkinlik"
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="priceChanges"
                      name="Fiyat kaydı"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {timeSeries?.byCity &&
                cityLineKeys.length > 0 &&
                cityLineData.length > 0 && (
                  <Card>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <LineChartIcon className="size-4 text-zinc-400" />
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Yeni etkinlik (şehir kırılımı)
                        </h2>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          En yoğun şehirler · günlük
                        </span>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart
                        data={cityLineData}
                        margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e4e4e7"
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: "#71717a" }}
                          interval={
                            seriesDays <= 14 ? 0 : seriesDays <= 30 ? 2 : 6
                          }
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#71717a" }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          labelFormatter={(_, payload) =>
                            (payload?.[0]?.payload as { day?: string })?.day ??
                            ""
                          }
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid #e4e4e7",
                            backgroundColor: "white",
                          }}
                        />
                        <Legend />
                        {cityLineKeys.map((city, i) => (
                          <Line
                            key={city}
                            type="monotone"
                            dataKey={city}
                            name={city}
                            stroke={
                              CITY_LINE_COLORS[i % CITY_LINE_COLORS.length]
                            }
                            strokeWidth={2}
                            dot={false}
                          />
                        ))}
                        {showOtherLine && (
                          <Line
                            type="monotone"
                            dataKey="_other"
                            name="Diğer şehirler"
                            stroke="#94a3b8"
                            strokeWidth={2}
                            strokeDasharray="4 3"
                            dot={false}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                )}

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <div className="mb-3 flex items-center gap-2">
                    <BarChart3 className="size-4 text-zinc-400" />
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Kategori
                    </h2>
                  </div>
                  {categories.length ? (
                    <CategoryChart data={categories} />
                  ) : (
                    <p className="text-sm text-zinc-500">Veri yok.</p>
                  )}
                </Card>
                <Card>
                  <div className="mb-3 flex items-center gap-2">
                    <BarChart3 className="size-4 text-zinc-400" />
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Şehir
                    </h2>
                  </div>
                  {cities.length ? (
                    <CityChart data={cities} />
                  ) : (
                    <p className="text-sm text-zinc-500">Veri yok.</p>
                  )}
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <div className="mb-3 flex items-center gap-2">
                    <Layers className="size-4 text-zinc-400" />
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Kaynak overlap
                    </h2>
                  </div>
                  {overlapChart.length ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={overlapChart}
                        layout="vertical"
                        margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={88}
                          tick={{ fontSize: 11, fill: "#71717a" }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid #e4e4e7",
                            backgroundColor: "white",
                          }}
                        />
                        <Bar
                          dataKey="events"
                          fill="#7c3aed"
                          radius={[0, 6, 6, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="py-8 text-center text-sm text-zinc-500">
                      Veri yok.
                    </p>
                  )}
                </Card>
                <Card>
                  <div className="mb-3 flex items-center gap-2">
                    <Layers className="size-4 text-zinc-400" />
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Kaynaklar (event_sources)
                    </h2>
                  </div>
                  {sources.length ? (
                    <SourceChart data={sources} />
                  ) : (
                    <p className="text-sm text-zinc-500">Veri yok.</p>
                  )}
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "events" && (
        <div>
          {insightsError && (
            <Card className="mb-4 border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30">
              <p className="text-sm text-red-800 dark:text-red-200">
                {insightsError}
              </p>
            </Card>
          )}
          {insightsLoading && !insights ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <div className="h-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                </Card>
              ))}
            </div>
          ) : insights ? (
            <EventInsightsPanel data={insights} />
          ) : null}
        </div>
      )}

      {tab === "ops" && (
        <div className="space-y-6">
          {scrapeError && (
            <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30">
              <p className="text-sm text-red-800 dark:text-red-200">
                {scrapeError}
              </p>
            </Card>
          )}
          {scrapeLoading && !scrape ? (
            <div className="h-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          ) : scrape ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Son 50 run"
                  value={formatNumber(scrape.summary.windowRuns)}
                  hint={`Başarılı ${scrape.summary.success} · Kısmi ${scrape.summary.partial} · Hata ${scrape.summary.failed}`}
                />
                <StatCard
                  label="Yeni (pencere)"
                  value={formatNumber(scrape.summary.eventsNew)}
                />
                <StatCard
                  label="Güncellenen"
                  value={formatNumber(scrape.summary.eventsUpdated)}
                />
                <StatCard
                  label="Fiyat değişimi"
                  value={formatNumber(scrape.summary.priceChanges)}
                />
              </div>
              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <Table2 className="size-4 text-zinc-400" />
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Scrape geçmişi
                  </h2>
                </div>
                {scrape.runs.length ? (
                  <RunsTimeline runs={scrape.runs} />
                ) : (
                  <p className="text-sm text-zinc-500">Run listesi boş.</p>
                )}
              </Card>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function AnalyticsFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <div className="h-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </Card>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsFallback />}>
      <AnalyticsShell />
    </Suspense>
  );
}
