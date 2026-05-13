"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  KeyRound,
  Loader2,
  Play,
  RefreshCw,
  Terminal,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/Card";
import type { ScrapeRun } from "@/lib/types";

const STORAGE_KEY = "eventradar_admin_secret";

const SCRAPERS: { id: string; label: string; hint: string }[] = [
  {
    id: "bubilet",
    label: "Bubilet",
    hint: "platform.api.bubilet.com.tr — şehir + etiket listeleri",
  },
  {
    id: "biletzero",
    label: "Biletzero",
    hint: "apiv2.biletzero.com — EventGroup + detay API",
  },
  {
    id: "konserlist",
    label: "Konserlist",
    hint: "konserlist.com — sitemap + HTML (ulusal kapsam)",
  },
];

const DEFAULT_CITY_SLUGS = [
  "istanbul",
  "ankara",
  "izmir",
  "bursa",
  "antalya",
];

function formatRunTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR");
  } catch {
    return iso;
  }
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [sources, setSources] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SCRAPERS.map((s) => [s.id, true])),
  );
  const [citiesLine, setCitiesLine] = useState(DEFAULT_CITY_SLUGS.join(", "));
  const [detailLimit, setDetailLimit] = useState("300");
  const [streamLogs, setStreamLogs] = useState(true);

  const [logs, setLogs] = useState("");
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState<string | null>(null);

  const [scrapeRunning, setScrapeRunning] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem(STORAGE_KEY);
      if (s) setSecret(s);
    } catch {
      /* ignore */
    }
  }, []);

  const persistSecret = useCallback(() => {
    try {
      if (secret.trim()) sessionStorage.setItem(STORAGE_KEY, secret.trim());
    } catch {
      /* ignore */
    }
  }, [secret]);

  const clearSecret = useCallback(() => {
    setSecret("");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const loadRuns = useCallback(async () => {
    if (!secret.trim()) {
      setRunsError("Önce yönetim anahtarını girin.");
      return;
    }
    setRunsLoading(true);
    setRunsError(null);
    try {
      const res = await fetch("/api/admin/runs?limit=50", {
        headers: { "x-admin-secret": secret.trim() },
      });
      const data = (await res.json().catch(() => ({}))) as {
        runs?: ScrapeRun[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? res.statusText);
      }
      setRuns(data.runs ?? []);
    } catch (e) {
      setRunsError((e as Error).message);
      setRuns([]);
    } finally {
      setRunsLoading(false);
    }
  }, [secret]);

  const runScrape = useCallback(async () => {
    if (!secret.trim()) {
      setScrapeError("Yönetim anahtarı gerekli (sunucuda ADMIN_SECRET).");
      return;
    }
    const selectedIds = SCRAPERS.filter((s) => sources[s.id]).map((s) => s.id);
    if (selectedIds.length === 0) {
      setScrapeError("En az bir kaynak seçin.");
      return;
    }

    const cities = citiesLine
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    if (cities.length === 0) {
      setScrapeError("En az bir şehir slug’ı girin.");
      return;
    }

    let detailLimitArg: number | null = null;
    if (detailLimit.trim() !== "") {
      const n = Number.parseInt(detailLimit.trim(), 10);
      if (Number.isNaN(n) || n < 1) {
        setScrapeError("Detay limiti boş veya pozitif sayı olmalı.");
        return;
      }
      detailLimitArg = n;
    }

    persistSecret();
    setScrapeRunning(true);
    setScrapeError(null);
    setLogs("");

    const body = {
      cities,
      sources: selectedIds,
      detailLimit: detailLimitArg,
      stream: streamLogs,
    };

    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret.trim(),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errJson.error ?? res.statusText);
      }

      if (streamLogs && res.body) {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          setLogs(acc);
        }
      } else {
        const j = (await res.json()) as { exitCode?: number; output?: string };
        setLogs(
          `exitCode: ${j.exitCode ?? "?"}\n\n${j.output ?? "(çıktı yok)"}`,
        );
      }

      await loadRuns();
    } catch (e) {
      setScrapeError((e as Error).message);
    } finally {
      setScrapeRunning(false);
    }
  }, [
    secret,
    sources,
    citiesLine,
    detailLimit,
    streamLogs,
    persistSecret,
    loadRuns,
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Yönetim
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Scraper’ları bu makinede (Next.js sunucusu) çalıştırır; çıktı uzaktaki
          D1’e yazar.{" "}
          <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">
            EVENTRADAR_PLATFORM_ROOT
          </code>{" "}
          ve Cloudflare env’leri sunucuda tanımlı olmalı.
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/analytics/?tab=ops"
            className="font-medium text-purple-600 underline-offset-2 hover:underline dark:text-purple-400"
          >
            Analitik → Operasyon
          </Link>{" "}
          özet grafiği için.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="size-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Yönetim anahtarı
            </h2>
          </div>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            Sunucu ortamındaki{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">
              ADMIN_SECRET
            </code>{" "}
            ile aynı olmalı (en az 8 karakter). Tarayıcıda yalnızca
            sessionStorage’da saklanır.
          </p>
          <input
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="ADMIN_SECRET"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={persistSecret}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Tarayıcıda sakla
            </button>
            <button
              type="button"
              onClick={clearSecret}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-600"
            >
              <Trash2 className="size-3.5" />
              Temizle
            </button>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Terminal className="size-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Kaynaklar
            </h2>
          </div>
          <ul className="space-y-3">
            {SCRAPERS.map((s) => (
              <li key={s.id} className="flex gap-3">
                <label className="flex flex-1 cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={sources[s.id] ?? false}
                    onChange={(e) =>
                      setSources((prev) => ({ ...prev, [s.id]: e.target.checked }))
                    }
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {s.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                      {s.hint}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Şehir slug’ları
          </h2>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Virgülle: bubilet ve biletzero şehir bazlı; konserlist ulusal (yine de
            liste aynı kalır).
          </p>
          <textarea
            rows={3}
            value={citiesLine}
            onChange={(e) => setCitiesLine(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </Card>

        <Card>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Detay limiti
          </h2>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Bubilet / Biletzero için üst sınır (boş = platform varsayılanı).
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={detailLimit}
            onChange={(e) => setDetailLimit(e.target.value)}
            placeholder="örn. 300"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={streamLogs}
              onChange={(e) => setStreamLogs(e.target.checked)}
            />
            Canlı log akışı (stdout/stderr)
          </label>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={scrapeRunning}
          onClick={runScrape}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50"
        >
          {scrapeRunning ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          Scrape çalıştır
        </button>
        <button
          type="button"
          disabled={runsLoading}
          onClick={loadRuns}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium dark:border-zinc-600 dark:bg-zinc-950"
        >
          {runsLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Run listesini yenile
        </button>
      </div>

      {scrapeError && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30">
          <p className="text-sm text-red-800 dark:text-red-200">{scrapeError}</p>
        </Card>
      )}

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Log
        </h2>
        <pre className="max-h-[420px] overflow-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs text-zinc-100">
          {logs || "(Henüz çalıştırma yok)"}
        </pre>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Son scrape run’ları (D1)
          </h2>
        </div>
        {runsError && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400">{runsError}</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
                <th className="pb-2 pr-2">id</th>
                <th className="pb-2 pr-2">kaynak</th>
                <th className="pb-2 pr-2">şehir</th>
                <th className="pb-2 pr-2">durum</th>
                <th className="pb-2 pr-2">bulunan</th>
                <th className="pb-2 pr-2">yeni</th>
                <th className="pb-2 pr-2">başlangıç</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-zinc-100 dark:border-zinc-800/80"
                >
                  <td className="py-2 pr-2 font-mono text-xs">{r.id}</td>
                  <td className="py-2 pr-2">{r.sourceId}</td>
                  <td className="py-2 pr-2 font-mono text-xs">{r.city ?? "—"}</td>
                  <td className="py-2 pr-2">
                    <span
                      className={
                        r.status === "success"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : r.status === "partial"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2 pr-2">{r.eventsFound}</td>
                  <td className="py-2 pr-2">{r.eventsNew}</td>
                  <td className="py-2 pr-2 text-xs text-zinc-500">
                    {formatRunTime(r.startedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!runs.length && !runsLoading && !runsError && (
            <p className="py-6 text-center text-sm text-zinc-500">
              Liste boş — anahtarı girip &quot;Run listesini yenile&quot; deyin.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
