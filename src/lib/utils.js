import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Event datetimes are stored/sent as wall-clock (local) times. The backend
// serializes them with a "Z" suffix, so `new Date()` would wrongly shift them
// by the local UTC offset. Parse the Y-M-D H:M:S components directly instead so
// the time shown always matches what the user entered.
export function parseWall(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const m = String(value).match(/(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
}

// "YYYY-MM-DD" from a wall-clock datetime value.
export function wallDateStr(value) {
  const d = parseWall(value);
  if (!d) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
