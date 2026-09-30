// Calendar-day helpers. A "day" is a YYYY-MM-DD string in UTC: the app stores an
// applied date as midnight UTC of the day the user picked, so a day string is
// the exact calendar date they chose, independent of any timezone.

export const DAY_MS = 24 * 60 * 60 * 1000;

export function dayToMs(day: string): number {
  return Date.parse(`${day}T00:00:00.000Z`);
}

export function toUtcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
  return toUtcDay(new Date(dayToMs(day) + n * DAY_MS));
}

export type Run = { start: string; length: number };

// Maximal runs of consecutive calendar days, in date order (duplicates and
// input order don't matter).
export function dayRuns(days: string[]): Run[] {
  const sorted = [...new Set(days)].map(dayToMs).sort((a, b) => a - b);
  const runs: Run[] = [];
  let previous = Number.NaN;
  for (const ms of sorted) {
    const last = runs[runs.length - 1];
    if (last && ms - previous === DAY_MS) last.length += 1;
    else runs.push({ start: toUtcDay(new Date(ms)), length: 1 });
    previous = ms;
  }
  return runs;
}

export function longestStreak(days: string[]): number {
  return dayRuns(days).reduce((best, run) => Math.max(best, run.length), 0);
}
