import { spawn } from "node:child_process";
import path from "node:path";
import { NextRequest } from "next/server";
import { adminUnauthorized, requireAdmin } from "@/lib/server/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 300;

function platformRoot(): string {
  return (
    process.env.EVENTRADAR_PLATFORM_ROOT?.trim() ||
    path.resolve(process.cwd(), "../eventradar-platform")
  );
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return adminUnauthorized();

  if (
    !process.env.CLOUDFLARE_ACCOUNT_ID ||
    !process.env.CLOUDFLARE_D1_DATABASE_ID ||
    !process.env.CLOUDFLARE_API_TOKEN
  ) {
    return Response.json(
      { error: "CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN gerekli" },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    cities?: string[];
    sources?: string[];
    detailLimit?: number | null;
    stream?: boolean;
  };

  const cwd = platformRoot();
  const childEnv: NodeJS.ProcessEnv = {
    ...process.env,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_D1_DATABASE_ID: process.env.CLOUDFLARE_D1_DATABASE_ID,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    BUBILET_VENUE_ENRICH: process.env.BUBILET_VENUE_ENRICH ?? "true",
  };

  if (body.cities?.length) {
    childEnv.CITIES = body.cities.map((c) => c.trim().toLowerCase()).join(",");
  }
  if (body.sources?.length) {
    childEnv.SOURCES = body.sources.map((s) => s.trim().toLowerCase()).join(",");
  }
  if (body.detailLimit != null && body.detailLimit > 0) {
    childEnv.DETAIL_LIMIT = String(body.detailLimit);
  }

  const useStream = body.stream !== false;

  if (!useStream) {
    const chunks: Buffer[] = [];
    const code: number = await new Promise((resolve, reject) => {
      const child = spawn("npm", ["run", "scrape:remote", "--silent"], {
        cwd,
        env: childEnv,
        shell: process.platform === "win32",
      });
      child.stdout?.on("data", (c: Buffer) => chunks.push(c));
      child.stderr?.on("data", (c: Buffer) => chunks.push(c));
      child.on("error", reject);
      child.on("close", (c) => resolve(c ?? 1));
    });
    const output = Buffer.concat(chunks).toString("utf8");
    return Response.json({ exitCode: code, output });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const child = spawn("npm", ["run", "scrape:remote", "--silent"], {
        cwd,
        env: childEnv,
        shell: process.platform === "win32",
      });

      const onChunk = (buf: Buffer) => {
        controller.enqueue(new Uint8Array(buf));
      };
      child.stdout?.on("data", onChunk);
      child.stderr?.on("data", onChunk);
      child.on("error", (err) => {
        controller.enqueue(encoder.encode(`\n[HATA] ${String(err)}\n`));
        controller.close();
      });
      child.on("close", (code) => {
        controller.enqueue(
          encoder.encode(`\n--- bitti (exit ${code ?? "?"}) ---\n`),
        );
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
