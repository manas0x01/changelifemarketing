/**
 * IST (Indian Standard Time) Utility Functions
 * 
 * All server-side date/session logic MUST use these functions instead of
 * raw Date methods like toDateString() which use the server's timezone (UTC on Vercel).
 * 
 * IST = UTC + 5 hours 30 minutes
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Convert a Date to IST Date object.
 * The returned Date's UTC methods (getUTCHours, etc.) will give IST values.
 */
export function toIST(date: Date): Date {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

/**
 * Get IST date string (e.g., "Sat Jun 21 2026") for a given Date.
 * Use this instead of date.toDateString() for day comparisons.
 */
export function istDateString(date: Date): string {
  const ist = toIST(date);
  return ist.toUTCString().split(' ').slice(0, 4).join(' '); // "Sat, 21 Jun 2026"
}

/**
 * Get IST "YYYY-MM-DD" string for a given Date.
 */
export function istDateISO(date: Date): string {
  const ist = toIST(date);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get IST hour (0-23) for a given Date.
 */
export function istHour(date: Date): number {
  return toIST(date).getUTCHours();
}

/**
 * Get IST minute (0-59) for a given Date.
 */
export function istMinute(date: Date): number {
  return toIST(date).getUTCMinutes();
}

/**
 * Get current session type based on IST.
 * Morning: 00:00 - 11:59 IST
 * Evening: 12:00 - 23:59 IST
 */
export function currentSessionType(date?: Date): "morning" | "evening" {
  const hour = istHour(date || new Date());
  return hour < 12 ? "morning" : "evening";
}

/**
 * Check if two dates are on the same IST calendar day.
 */
export function isSameISTDay(date1: Date, date2: Date): boolean {
  return istDateISO(date1) === istDateISO(date2);
}
