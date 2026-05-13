"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import type { MapEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

// Türkiye merkez + tüm yurt sığacak zoom
const TURKEY_CENTER: [number, number] = [39.0, 35.5];
const DEFAULT_ZOOM = 6;

const CATEGORY_COLORS: Record<string, string> = {
  Konser: "#a855f7",
  Müzik: "#a855f7",
  Tiyatro: "#3b82f6",
  "Stand-up": "#f59e0b",
  Workshop: "#10b981",
  Festival: "#ec4899",
  "Çocuk & Aile": "#06b6d4",
  Eğlence: "#f97316",
  Yemek: "#84cc16",
  Eğitim: "#6366f1",
  Spor: "#ef4444",
  Yarışma: "#8b5cf6",
};

const DEFAULT_COLOR = "#71717a";

function categoryColor(category: string | null): string {
  if (!category) return DEFAULT_COLOR;
  return CATEGORY_COLORS[category] ?? DEFAULT_COLOR;
}

/**
 * Renkli SVG ikonunu inline data URI olarak üretir.
 * Leaflet'in default ikonu Next.js statik export'ta path sorunu çıkardığı için
 * tamamen inline yaklaşım kullanıyoruz.
 */
function makeIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <svg viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 14 8 14s8-8.6 8-14c0-4.4-3.6-8-8-8z"
          fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="8" r="3" fill="white"/>
      </svg>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

interface MapViewProps {
  events: MapEvent[];
}

export default function MapView({ events }: MapViewProps) {
  const iconCache = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    return (category: string | null) => {
      const color = categoryColor(category);
      if (!cache.has(color)) cache.set(color, makeIcon(color));
      return cache.get(color)!;
    };
  }, []);

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <MapContainer
        center={TURKEY_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="size-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> katılımcıları'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToMarkers events={events} />
        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.lat, event.lon]}
            icon={iconCache(event.category)}
          >
            <Popup>
              <div className="min-w-[200px] max-w-[260px] space-y-1.5">
                {event.category && (
                  <div
                    className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: categoryColor(event.category) }}
                  >
                    {event.category}
                  </div>
                )}
                <div className="font-semibold leading-tight text-zinc-900">
                  {event.title}
                </div>
                <div className="text-xs text-zinc-600">
                  📅 {formatDateTime(event.startTime)}
                </div>
                <div className="text-xs text-zinc-600">
                  📍 {event.venueName ?? "?"}
                  {event.venueCity ? ` · ${event.venueCity}` : ""}
                </div>
                <Link
                  href={`/events/detail/?id=${event.id}`}
                  className="mt-1 inline-block text-xs font-medium text-purple-700 hover:underline"
                >
                  Detayı görüntüle →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

/**
 * Marker'lar geldikçe view'i otomatik bounds'a fit eder
 * (kullanıcı haritayı manuel hareket ettirdikten sonra zorlamamak için
 * sadece events değişince çalışır).
 */
function FitToMarkers({ events }: { events: MapEvent[] }) {
  const map = useMap();
  useEffect(() => {
    if (!events.length) return;
    const bounds = L.latLngBounds(events.map((e) => [e.lat, e.lon]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
  }, [events, map]);
  return null;
}
