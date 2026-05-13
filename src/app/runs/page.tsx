"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";

/**
 * Eski /runs rotası — scrape listesi artık Analitik → Operasyon sekmesinde.
 */
export default function RunsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/analytics/?tab=ops");
  }, [router]);

  return (
    <Card className="text-center">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Scrape run listesi taşındı.
      </p>
      <p className="mt-2 text-sm">
        <Link
          href="/analytics/?tab=ops"
          className="font-medium text-purple-600 underline-offset-2 hover:underline dark:text-purple-400"
        >
          Analitik → Operasyon
        </Link>{" "}
        sayfasına yönlendiriliyorsunuz…
      </p>
    </Card>
  );
}
