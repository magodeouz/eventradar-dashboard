import type {
  CategoryStat,
  CityStat,
  EventDetail,
  EventsFilters,
  EventsResponse,
  MapFilters,
  MapResponse,
  Overview,
  PerformerDetailResponse,
  PerformersFilters,
  PerformersListResponse,
  PerformersStatsResponse,
  ScrapeRun,
  ScrapeSummaryResponse,
  SourceOverlapItem,
  SourceStat,
  TimeSeriesResponse,
  EventInsightsResponse,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://eventradar-platform.oguzakpinar1997.workers.dev";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function fetchOverview(): Promise<Overview> {
  return get<Overview>("/api/stats/overview");
}

export async function fetchByCategory(): Promise<CategoryStat[]> {
  const { items } = await get<{ items: CategoryStat[] }>(
    "/api/stats/by-category",
  );
  return items;
}

export async function fetchByCity(): Promise<CityStat[]> {
  const { items } = await get<{ items: CityStat[] }>("/api/stats/by-city");
  return items;
}

export async function fetchBySource(): Promise<SourceStat[]> {
  const { items } = await get<{ items: SourceStat[] }>(
    "/api/stats/by-source",
  );
  return items;
}

export async function fetchTimeSeries(
  days = 30,
  opts?: { groupByCity?: boolean; top?: number },
): Promise<TimeSeriesResponse> {
  const params = new URLSearchParams({ days: String(days) });
  if (opts?.groupByCity) {
    params.set("groupBy", "city");
    if (opts.top != null) params.set("top", String(opts.top));
  }
  return get<TimeSeriesResponse>(`/api/stats/time-series?${params}`);
}

export async function fetchSourceOverlap(): Promise<SourceOverlapItem[]> {
  const { items } = await get<{ items: SourceOverlapItem[] }>(
    "/api/stats/source-overlap",
  );
  return items;
}

export async function fetchScrapeSummary(
  limit = 50,
): Promise<ScrapeSummaryResponse> {
  return get<ScrapeSummaryResponse>(
    `/api/stats/scrape-summary?limit=${limit}`,
  );
}

export async function fetchEventInsights(): Promise<EventInsightsResponse> {
  return get<EventInsightsResponse>("/api/stats/event-insights");
}

export async function fetchPerformers(
  filters: PerformersFilters = {},
): Promise<PerformersListResponse> {
  const params = new URLSearchParams();
  if (filters.city) params.set("city", filters.city);
  if (filters.sourceId) params.set("sourceId", filters.sourceId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.q) params.set("q", filters.q);
  if (filters.limit != null) params.set("limit", String(filters.limit));
  if (filters.offset != null) params.set("offset", String(filters.offset));
  const qs = params.toString();
  return get<PerformersListResponse>(`/api/performers${qs ? `?${qs}` : ""}`);
}

/** İstatistikler; sayfalama yok, filtreler liste ile aynı. */
export async function fetchPerformersStats(
  filters: Omit<PerformersFilters, "limit" | "offset"> = {},
): Promise<PerformersStatsResponse> {
  const params = new URLSearchParams();
  if (filters.city) params.set("city", filters.city);
  if (filters.sourceId) params.set("sourceId", filters.sourceId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return get<PerformersStatsResponse>(
    `/api/performers/stats${qs ? `?${qs}` : ""}`,
  );
}

export async function fetchPerformerDetail(
  key: string,
  filters: Omit<PerformersFilters, "q" | "limit" | "offset"> = {},
): Promise<PerformerDetailResponse> {
  const params = new URLSearchParams();
  params.set("key", encodeURIComponent(key));
  if (filters.city) params.set("city", filters.city);
  if (filters.sourceId) params.set("sourceId", filters.sourceId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return get<PerformerDetailResponse>(
    `/api/performers/detail?${params.toString()}`,
  );
}

export async function fetchEvents(
  filters: EventsFilters = {},
): Promise<EventsResponse> {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.city) params.set("city", filters.city);
  if (filters.q) params.set("q", filters.q);
  if (filters.upcomingOnly) params.set("upcomingOnly", "true");
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));
  const qs = params.toString();
  return get<EventsResponse>(`/api/events${qs ? `?${qs}` : ""}`);
}

export async function fetchMapEvents(
  filters: MapFilters = {},
): Promise<MapResponse> {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.category) params.set("category", filters.category);
  if (filters.city) params.set("city", filters.city);
  const qs = params.toString();
  return get<MapResponse>(`/api/events/map${qs ? `?${qs}` : ""}`);
}

export async function fetchEventDetail(id: string): Promise<EventDetail> {
  return get<EventDetail>(`/api/events/${id}`);
}

export async function fetchRuns(limit = 50): Promise<ScrapeRun[]> {
  const { runs } = await get<{ runs: ScrapeRun[] }>(
    `/api/runs?limit=${limit}`,
  );
  return runs;
}

export { API_BASE };
