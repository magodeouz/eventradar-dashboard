import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `output: "export"` kullanılamaz: `/api/admin/*` route'ları istek başlığı,
  // query ve POST/stream ile çalışır (Next static export yalnızca sabit GET
  // üretir). Admin ve uzaktan scrape için Node/Vercel veya benzeri hedef gerekir.
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
