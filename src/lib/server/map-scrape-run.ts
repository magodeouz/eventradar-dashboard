import type { ScrapeRun } from "@/lib/types";

/** D1 satırı (snake_case) → dashboard `ScrapeRun` */
export function mapScrapeRunRow(r: Record<string, unknown>): ScrapeRun {
  const started = r.started_at;
  const finished = r.finished_at;
  const startedAt =
    typeof started === "number"
      ? new Date(started * 1000).toISOString()
      : started != null
        ? String(started)
        : new Date(0).toISOString();
  const finishedAt =
    finished == null
      ? null
      : typeof finished === "number"
        ? new Date(finished * 1000).toISOString()
        : String(finished);

  return {
    id: Number(r.id),
    sourceId: String(r.source_id ?? ""),
    city: r.city != null ? String(r.city) : null,
    startedAt,
    finishedAt,
    status: (r.status as ScrapeRun["status"]) ?? "failed",
    eventsFound: Number(r.events_found ?? 0),
    eventsNew: Number(r.events_new ?? 0),
    eventsUpdated: Number(r.events_updated ?? 0),
    priceChanges: Number(r.price_changes ?? 0),
    errorMessage: r.error_message != null ? String(r.error_message) : null,
  };
}
