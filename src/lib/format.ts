/**
 * Görsel formatlama yardımcıları.
 */

const FORMATTER_DATE = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const FORMATTER_DATE_SHORT = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const FORMATTER_NUMBER = new Intl.NumberFormat("tr-TR");

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return FORMATTER_DATE.format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return FORMATTER_DATE_SHORT.format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return FORMATTER_NUMBER.format(n);
}

export function formatPrice(
  min: number | null,
  max: number | null,
  currency = "TRY",
): string {
  if (min == null && max == null) return "—";
  const symbol = currency === "TRY" ? "₺" : currency;
  if (min != null && max != null && min !== max) {
    return `${formatNumber(min)} – ${formatNumber(max)} ${symbol}`;
  }
  return `${formatNumber(min ?? max ?? 0)} ${symbol}`;
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (Math.abs(diffMin) < 1) return "az önce";
  if (Math.abs(diffMin) < 60)
    return `${diffMin > 0 ? diffMin + " dk önce" : Math.abs(diffMin) + " dk sonra"}`;
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24)
    return `${diffHr > 0 ? diffHr + " sa önce" : Math.abs(diffHr) + " sa sonra"}`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay > 0 ? diffDay + " g önce" : Math.abs(diffDay) + " g sonra"}`;
}
