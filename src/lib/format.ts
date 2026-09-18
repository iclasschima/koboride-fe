export function formatKm(km: number): string {
  const rounded = Math.round(km * 10) / 10;
  if (!Number.isFinite(rounded) || rounded <= 0) return "0 km";
  return Number.isInteger(rounded) ? `${rounded} km` : `${rounded.toFixed(1)} km`;
}

export function commissionNgn(feeNgn: number, payoutNgn: number): number {
  return Math.max(0, Math.round(feeNgn - payoutNgn));
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Relative time for job cards, e.g. "just now", "10 minutes ago". */
export function formatTimeAgo(iso: string, nowMs = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.max(0, Math.round((nowMs - then) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? "1 day ago" : `${days} days ago`;
  return formatDate(iso);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function tripDurationSeconds(trip: {
  createdAt: string;
  completedAt?: string | null;
  durationSeconds?: number | null;
}): number | null {
  if (trip.durationSeconds != null) return trip.durationSeconds;
  if (!trip.completedAt) return null;
  return Math.max(
    0,
    Math.round(
      (new Date(trip.completedAt).getTime() - new Date(trip.createdAt).getTime()) / 1000,
    ),
  );
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return s <= 1 ? "1 sec" : `${s} sec`;
  const totalMinutes = Math.round(s / 60);
  if (totalMinutes < 60) return totalMinutes === 1 ? "1 min" : `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hourText = hours === 1 ? "1 hr" : `${hours} hr`;
  if (minutes === 0) return hourText;
  return `${hourText} ${minutes} min`;
}

export function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  if (totalMinutes < 1) return "less than a minute";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hourText = hours === 1 ? "1 hour" : `${hours} hours`;
  const minuteText = minutes === 1 ? "1 minute" : `${minutes} minutes`;

  if (hours > 0 && minutes > 0) return `${hourText} ${minuteText}`;
  if (hours > 0) return hourText;
  return minuteText;
}

export function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}
