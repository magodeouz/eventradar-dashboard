import { NextRequest } from "next/server";
import { requireAdmin, adminUnauthorized } from "@/lib/server/admin-auth";
import { d1EnvReady, d1Query } from "@/lib/server/d1-http";
import { mapScrapeRunRow } from "@/lib/server/map-scrape-run";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return adminUnauthorized();
  if (!d1EnvReady()) {
    return Response.json(
      { error: "D1 ortam değişkenleri tanımlı değil (CLOUDFLARE_*)" },
      { status: 503 },
    );
  }

  const limit = Math.min(
    100,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 50),
  );

  const rows = await d1Query(
    `SELECT id, source_id, city, started_at, finished_at, status,
            events_found, events_new, events_updated, price_changes, error_message
     FROM scrape_runs
     ORDER BY id DESC
     LIMIT ?`,
    [limit],
  );

  const runs = rows.map(mapScrapeRunRow);
  return Response.json({ runs });
}
