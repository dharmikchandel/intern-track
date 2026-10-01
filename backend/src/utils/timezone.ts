// Which calendar day it is, in a given IANA timezone. Follow-up dates are saved
// as midnight UTC of the day the user picked, so "due" has to be decided by the
// user's own calendar day, not the server's.

// IANA names look like "Asia/Kolkata" or "UTC". Newer runtimes also accept raw
// offsets such as "+05:30"; those have no daylight-saving rules, so they are not
// accepted here.
const IANA_SHAPE = /^[A-Za-z][A-Za-z0-9_+-]*(\/[A-Za-z0-9_+-]+)*$/;

export function isValidTimeZone(tz: string): boolean {
  if (!tz || tz.length > 64 || !IANA_SHAPE.test(tz)) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function todayInZone(now: Date, timeZone?: string | null): { year: number; month: number; day: number } {
  if (!timeZone || !isValidTimeZone(timeZone)) {
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, day: now.getUTCDate() };
  }
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

// Midnight UTC at the start of the day after "today" in the zone: a follow-up
// date strictly before this instant is due today or earlier.
export function startOfTomorrowInZone(now: Date, timeZone?: string | null): Date {
  const { year, month, day } = todayInZone(now, timeZone);
  return new Date(Date.UTC(year, month - 1, day + 1));
}
