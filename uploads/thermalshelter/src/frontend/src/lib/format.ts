/** Convert a Motoko nanosecond timestamp to a Date, or null when invalid. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a backend timestamp as a short local date-time. */
export function formatTimestamp(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format a number with fixed decimals and thousands separators. */
export function formatNumber(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format a coordinate pair as a compact decimal-degree readout. */
export function formatCoordinates(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(4)}°${latitude >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(longitude).toFixed(4)}°${longitude >= 0 ? "E" : "W"}`;
  return `${lat} ${lon}`;
}

/** Format an INR amount with the rupee symbol and no decimals. */
export function formatInr(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

/** Format a bigint count as a plain integer string. */
export function formatCount(value: bigint): string {
  return value.toString();
}

/** Format an hour index as a 24-hour clock label. */
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** Format a date as an ISO yyyy-mm-dd string for date inputs. */
export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Clamp a number into an inclusive range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
