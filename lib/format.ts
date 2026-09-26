// lib/format.ts — display helpers shared by server and client components.
// Dates are formatted in UTC so server and browser render the same text.

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds < 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatMinutes(seconds: number | null | undefined) {
  if (!seconds) return null;
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
export function formatViews(count: number) {
  return `${compact.format(count)} ${count === 1 ? "view" : "views"}`;
}

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });
export function formatDate(value: string | null | undefined) {
  return value ? dateFormat.format(new Date(value)) : "—";
}

export function initials(name: string | null | undefined, fallback = "?") {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}
