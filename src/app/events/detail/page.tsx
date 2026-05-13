"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Calendar, ExternalLink, MapPin, Tag } from "lucide-react";
import { Card } from "@/components/Card";
import { fetchEventDetail } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { EventDetail } from "@/lib/types";

export default function EventDetailPageWrapper() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <EventDetailPage />
    </Suspense>
  );
}

function EventDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [data, setData] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError("Event ID belirtilmedi");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchEventDetail(id)
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (error || !data) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30">
          <h2 className="font-semibold text-red-900 dark:text-red-100">
            Yüklenemedi
          </h2>
          <p className="mt-1 text-sm text-red-700 dark:text-red-200">
            {error ?? "Etkinlik bulunamadı"}
          </p>
        </Card>
      </div>
    );
  }

  const { event, venue, sources } = data;
  const cheapest = sources
    .filter((s) => s.priceMin != null)
    .sort((a, b) => (a.priceMin ?? 0) - (b.priceMin ?? 0))[0];

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="grid gap-6 md:grid-cols-2">
        {event.imageUrl && (
          <div className="aspect-[16/9] overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.imageUrl}
              alt={event.title}
              className="size-full object-cover"
            />
          </div>
        )}
        <div className="flex flex-col justify-center">
          {event.category && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              <Tag className="size-3" />
              {event.category}
            </span>
          )}
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {event.title}
          </h1>
          <div className="mt-3 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <Calendar className="size-4" />
              {formatDateTime(event.startTime)}
              {event.endTime && event.endTime !== event.startTime && (
                <span className="text-zinc-400">
                  → {formatDateTime(event.endTime)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4" />
              {venue?.name ?? "Mekân belirtilmemiş"}
              {venue?.city && (
                <span className="text-zinc-400">· {venue.city}</span>
              )}
            </div>
          </div>
          {cheapest && (
            <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-900/40 dark:bg-purple-950/20">
              <div className="text-xs font-medium uppercase tracking-wide text-purple-700 dark:text-purple-300">
                En ucuz
              </div>
              <div className="mt-0.5 text-lg font-bold tabular-nums text-purple-900 dark:text-purple-100">
                {formatPrice(cheapest.priceMin, cheapest.priceMax, cheapest.currency)}
              </div>
              <div className="mt-0.5 text-xs text-purple-700 dark:text-purple-300">
                kaynak: {cheapest.sourceId}
              </div>
            </div>
          )}
        </div>
      </div>

      {event.description && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Açıklama
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {event.description}
          </p>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Kaynaklar ({sources.length})
        </h2>
        <div className="space-y-2">
          {sources.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {s.sourceId}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {s.externalId}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
                  {formatPrice(s.priceMin, s.priceMax, s.currency)}
                </span>
                <a
                  href={s.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  Bilet al
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/events/"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      <ArrowLeft className="size-4" />
      Etkinliklere dön
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
      <div className="h-32 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}
