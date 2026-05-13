"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  LayoutDashboard,
  LineChart,
  Map,
  Mic2,
  Settings2,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Genel bakış", icon: LayoutDashboard },
  { href: "/analytics/", label: "Analitik", icon: LineChart },
  { href: "/events/", label: "Etkinlikler", icon: Calendar },
  { href: "/sanatcilar/", label: "Sanatçılar", icon: Mic2 },
  { href: "/map/", label: "Harita", icon: Map },
  { href: "/admin/", label: "Yönetim", icon: Settings2 },
];

function stripSlash(p: string) {
  const s = p.replace(/\/$/, "");
  return s === "" ? "/" : s;
}

export function Header() {
  const pathname = usePathname();
  const pathBase = stripSlash(pathname);

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          eventradar
          <span className="ml-1 rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            v0
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const target = stripSlash(item.href);
            const active =
              target === "/"
                ? pathBase === "/"
                : pathBase === target || pathBase.startsWith(`${target}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
