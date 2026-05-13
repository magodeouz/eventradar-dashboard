"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Database,
  Map as MapIcon,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Card, StatCard } from "@/components/Card";
import { fetchOverview, fetchScrapeSummary } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { Overview, ScrapeSummaryResponse } from "@/lib/types";

const QUICK = [
  {
    href: "/analytics/",
    title: "Analitik",
    desc: "Zaman serisi, kategori / şehir, kaynak overlap ve etkinlik içgörüleri.",
    icon: BarChart3,
  },
  {
    href: "/events/",
    title: "Etkinlikler",
    desc: "Filtrele, ara, tarih aralığı ve sayfalı liste.",
    icon: Calendar,
  },
  {
    href: "/map/",
    title: "Harita",
    desc: "Koordinatlı mekânlara göre harita görünümü.",
    icon: MapIcon,
  },
  {
    href: "/analytics/?tab=ops",
    title: "Operasyon",
    desc: "Scrape run geçmişi ve son çalışmalarda oluşan metrikler.",
    icon: Database,
  },
] as const;

export default function HomePage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [scrape, setScrape] = useState<ScrapeSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [o, sc] = await Promise.all([
          fetchOverview(),
          fetchScrapeSummary(1),
        ]);
        if (cancelled) return;
        setOverview(o);
        setScrape(sc);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingShell />;
  if (error) return <ErrorShell message={error} />;
  if (!overview) return null;

  const latestRun = scrape?.runs?.[0];

  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Genel bakış
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Veritabanı özeti ve hızlı gezinme. Grafikler ve detaylı dağılımlar{" "}
          <Link
            href="/analytics/"
            className="font-medium text-purple-600 underline-offset-2 hover:underline dark:text-purple-400"
          >
            Analitik
          </Link>{" "}
          sekmesinde toplanır.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Toplam etkinlik"
          value={formatNumber(overview.totalEvents)}
          icon={<Calendar className="size-4" />}
        />
        <StatCard
          label="Aktif"
          value={formatNumber(overview.activeEvents)}
          icon={<Sparkles className="size-4" />}
        />
        <StatCard
          label="Yaklaşan"
          value={formatNumber(overview.upcomingEvents)}
          hint="bugünden sonra"
          icon={<Calendar className="size-4" />}
        />
        <StatCard
          label="Mekân"
          value={formatNumber(overview.totalVenues)}
          icon={<MapPin className="size-4" />} />
        <StatCard
          label="Kayıt (kaynak)"
          value={formatNumber(overview.totalSources)}
          icon={<Database className="size-4" />}
        />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK.map(({ href, title, desc, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:border-purple-300 hover:bg-purple-50/40 dark:hover:border-purple-800 dark:hover:bg-purple-950/20">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-lg bg-purple-100 p-2 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  <Icon className="size-5" />
                </span>
                <ArrowRight className="size-4 shrink-0 text-zinc-400" />
              </div>
              <h2 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-100">
                {title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {desc}
              </p>
            </Card>
          </Link>
        ))}
      </section>

      <Card className="border-dashed">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Son pipeline özeti
        </p>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          {latestRun ? (
            <>
              <span className="font-medium capitalize text-zinc-900 dark:text-zinc-100">
                {latestRun.sourceId}
              </span>
              {latestRun.city ? (
                <span className="text-zinc-500"> · {latestRun.city}</span>
              ) : null}
              {" — "}
              {new Date(latestRun.startedAt).toLocaleString("tr-TR")}
              {" · "}
              <span className="capitalize">{latestRun.status}</span>
            </>
          ) : (
            "Henüz scrape kaydı yok veya API yanıtı boş."
          )}
        </p>
        <Link
          href="/analytics/?tab=ops"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-purple-600 dark:text-purple-400"
        >
          Tüm run’ları gör
          <ArrowRight className="size-3.5" />
        </Link>
      </Card>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-3 h-7 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </Card>
      ))}
    </div>
  );
}

function ErrorShell({ message }: { message: string }) {
  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30">
      <h2 className="font-semibold text-red-900 dark:text-red-100">
        API&apos;ye ulaşılamıyor
      </h2>
      <p className="mt-1 text-sm text-red-700 dark:text-red-200">{message}</p>
    </Card>
  );
}
