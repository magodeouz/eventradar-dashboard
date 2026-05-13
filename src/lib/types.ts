/**
 * eventradar-platform API response tipleri.
 * Backend `src/db/schema.ts` ile manuel senkron tutulmalı.
 */

export interface Event {
  id: string;
  title: string;
  category: string | null;
  startTime: string | null;
  endTime: string | null;
  imageUrl: string | null;
  venueName: string | null;
  venueCity: string | null;
  venueLat?: number | null;
  venueLon?: number | null;
  performers?: Array<{
    id: string | number;
    name: string;
    slug?: string | null;
  }>;
}

export interface MapEvent {
  id: string;
  title: string;
  category: string | null;
  startTime: string | null;
  venueName: string | null;
  venueCity: string | null;
  lat: number;
  lon: number;
}

export interface MapResponse {
  events: MapEvent[];
  count: number;
  filters: {
    from: string | null;
    to: string | null;
    category: string | null;
    city: string | null;
  };
}

export interface MapFilters {
  from?: string;
  to?: string;
  category?: string;
  city?: string;
}

export interface EventDetail {
  event: {
    id: string;
    fingerprint: string;
    title: string;
    normalizedTitle: string;
    category: string | null;
    startTime: string | null;
    endTime: string | null;
    venueId: number | null;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
    firstSeenAt: string;
    lastSeenAt: string;
    performers?: Array<{
      id: string | number;
      name: string;
      slug?: string | null;
    }>;
  };
  venue: {
    id: number;
    name: string;
    normalizedName: string;
    city: string | null;
  } | null;
  sources: Array<{
    id: number;
    eventId: string;
    sourceId: string;
    externalId: string;
    ticketUrl: string;
    priceMin: number | null;
    priceMax: number | null;
    currency: string;
    firstSeenAt: string;
    lastSeenAt: string;
  }>;
}

export interface Overview {
  totalEvents: number;
  activeEvents: number;
  upcomingEvents: number;
  totalSources: number;
  totalVenues: number;
}

export interface CategoryStat {
  category: string | null;
  count: number;
}

export interface CityStat {
  city: string | null;
  count: number;
}

export interface SourceStat {
  sourceId: string;
  count: number;
}

export interface TimeSeriesPoint {
  day: string;
  newEvents: number;
  priceChanges: number;
}

export interface TimeSeriesResponse {
  days: number;
  series: TimeSeriesPoint[];
  /** `groupBy=city` ile istenince gelir. */
  byCity?: {
    topCities: string[];
    newEventsSeries: Array<{ day: string; cities: Record<string, number> }>;
    totalsByCity: Array<{ city: string; newEvents: number }>;
  };
}

export interface SourceOverlapItem {
  sourceCount: number;
  events: number;
}

export interface ScrapeSummaryResponse {
  runs: ScrapeRun[];
  summary: {
    windowRuns: number;
    success: number;
    partial: number;
    failed: number;
    running: number;
    eventsNew: number;
    eventsUpdated: number;
    priceChanges: number;
  };
}

export interface PerformerInsightRow {
  name: string;
  eventCount: number;
  cityCount: number;
  cities: string[];
}

export interface EventInsightsResponse {
  summary: {
    totalActiveEvents: number;
    uniquePerformers: number;
    citiesRepresented: number;
  };
  byCity: Array<{ city: string; count: number }>;
  topPerformers: PerformerInsightRow[];
  multiCityActs: PerformerInsightRow[];
  note: string;
}

export interface ScrapeRun {
  id: number;
  sourceId: string;
  city: string | null;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "success" | "partial" | "failed";
  eventsFound: number;
  eventsNew: number;
  eventsUpdated: number;
  priceChanges: number;
  errorMessage: string | null;
}

export interface EventsResponse {
  events: Event[];
  total: number;
  limit: number;
  offset: number;
}

export interface EventsFilters {
  category?: string;
  city?: string;
  q?: string;
  upcomingOnly?: boolean;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface PerformerListItem {
  key: string;
  name: string;
  /** Pasif dahil (filtre kümesi) */
  totalEventCount: number;
  /** is_active = true */
  activeEventCount: number;
  cityCount: number;
}

export interface PerformersListResponse {
  performers: PerformerListItem[];
  total: number;
  limit: number;
  offset: number;
  filters: {
    city: string | null;
    sourceId: string | null;
    from: string | null;
    to: string | null;
    q: string | null;
  };
}

export interface PerformersFilters {
  city?: string;
  sourceId?: string;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface PerformersStatsTotals {
  performers: number;
  uniqueEvents: number;
  totalArtistEventPairs: number;
  avgEventsPerPerformer: number;
  singleEventArtists: number;
  multiCityArtists: number;
  multiSourceEvents: number;
  upcomingEvents: number;
  maxEventCount: number;
  medianEventCount: number;
}

export interface PerformersStatsResponse {
  totals: PerformersStatsTotals;
  topPerformers: PerformerListItem[];
  eventCountBuckets: Array<{
    label: string;
    min: number;
    max: number | null;
    count: number;
  }>;
  citiesTop: Array<{ city: string; count: number }>;
  sourcesTop: Array<{ sourceId: string; count: number }>;
  eventsByMonth: Array<{ month: string; count: number }>;
  filters: {
    city: string | null;
    sourceId: string | null;
    from: string | null;
    to: string | null;
    q: string | null;
  };
}

export interface PerformerEventRow {
  id: string;
  title: string;
  startTime: string | null;
  venueName: string | null;
  venueCity: string | null;
  sources: string[];
}

export interface PerformerDetailResponse {
  key: string;
  name: string;
  eventCount: number;
  events: PerformerEventRow[];
}
