import crypto from "node:crypto";
import { AppError } from "../../utils/AppError.js";
import { DAY_MS, dayToMs, longestStreak, toUtcDay } from "../../utils/days.js";

// Kept exported from here so existing imports keep working; the day maths now
// lives in utils/days.ts because milestones use it too.
export { longestStreak, toUtcDay };

// Pure logic for the recap: day/week maths, period validation, the slug, and
// the whitelist that decides what a public page may ever show. No database here.

const MAX_PERIOD_DAYS = 5 * 366;

export interface RecapStats {
  version: 1;
  applications: number;
  // Applications sent in the period that reached the interview stage or
  // beyond: currently Interview/Offer, or ever moved there (per activity history).
  reachedInterview: number;
  offers: number;
  // Whole percentages of `applications`.
  interviewRate: number;
  offerRate: number;
  activeDays: number;
  longestStreakDays: number;
  busiestWeek: { weekStart: string; applications: number } | null;
}

export interface Period {
  /** Inclusive, UTC midnight. */
  start: Date;
  /** Inclusive last day, UTC midnight. */
  end: Date;
  /** Exclusive: UTC midnight of the day AFTER the last day (for range queries). */
  endExclusive: Date;
  /** YYYY-MM-DD, as the user chose them. */
  startDay: string;
  endDay: string;
}

export function parsePeriod(startDay: string, endDay: string): Period {
  const start = dayToMs(startDay);
  const end = dayToMs(endDay);
  const bad = (message: string) => new AppError(message, 400, "INVALID_PERIOD");

  if (Number.isNaN(start) || Number.isNaN(end)) throw bad("Choose a valid start and end date");
  if (start > end) throw bad("The start date must be on or before the end date");
  if (start < Date.parse("2000-01-01T00:00:00.000Z")) throw bad("Choose a more recent start date");
  if ((end - start) / DAY_MS > MAX_PERIOD_DAYS) throw bad("Choose a period of at most 5 years");

  return { start: new Date(start), end: new Date(end), endExclusive: new Date(end + DAY_MS), startDay, endDay };
}

// Monday (UTC) of the week containing the day, as YYYY-MM-DD.
export function weekStart(day: string): string {
  const ms = dayToMs(day);
  const sinceMonday = (new Date(ms).getUTCDay() + 6) % 7;
  return toUtcDay(new Date(ms - sinceMonday * DAY_MS));
}

export type DayCount = { day: string; count: number };

// The week with the most applications; the earliest one wins a tie.
export function busiestWeek(dayCounts: DayCount[]): { weekStart: string; applications: number } | null {
  const perWeek = new Map<string, number>();
  for (const { day, count } of dayCounts) {
    const key = weekStart(day);
    perWeek.set(key, (perWeek.get(key) ?? 0) + count);
  }
  let best: { weekStart: string; applications: number } | null = null;
  for (const [week, applications] of [...perWeek.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (!best || applications > best.applications) best = { weekStart: week, applications };
  }
  return best;
}

export function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

export function buildStats(input: { applications: number; reachedInterview: number; offers: number; dayCounts: DayCount[] }): RecapStats {
  const { applications, reachedInterview, offers, dayCounts } = input;
  return {
    version: 1,
    applications,
    reachedInterview,
    offers,
    interviewRate: percent(reachedInterview, applications),
    offerRate: percent(offers, applications),
    activeDays: new Set(dayCounts.map((d) => d.day)).size,
    longestStreakDays: longestStreak(dayCounts.map((d) => d.day)),
    busiestWeek: busiestWeek(dayCounts),
  };
}

// 128 bits of randomness (22 URL-safe characters). Not derived from any id, so
// knowing one link reveals nothing about another and links can't be enumerated.
export function generateSlug(): string {
  return crypto.randomBytes(16).toString("base64url");
}

export const SLUG_PATTERN = /^[A-Za-z0-9_-]{22}$/;

export interface PublicRecap {
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  stats: RecapStats;
}

// What the public endpoint returns. Built by COPYING known fields, never by
// spreading the stored row or JSON, so nothing extra can ever leak through
// (no ids, user references or per-application data).
export function toPublicRecap(row: { periodStart: Date; periodEnd: Date; createdAt: Date; stats: unknown }): PublicRecap {
  const s = (row.stats ?? {}) as Partial<RecapStats>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const week = s.busiestWeek && typeof s.busiestWeek.weekStart === "string" ? { weekStart: s.busiestWeek.weekStart, applications: num(s.busiestWeek.applications) } : null;

  return {
    periodStart: toUtcDay(row.periodStart),
    periodEnd: toUtcDay(row.periodEnd),
    createdAt: toUtcDay(row.createdAt),
    stats: {
      version: 1,
      applications: num(s.applications),
      reachedInterview: num(s.reachedInterview),
      offers: num(s.offers),
      interviewRate: num(s.interviewRate),
      offerRate: num(s.offerRate),
      activeDays: num(s.activeDays),
      longestStreakDays: num(s.longestStreakDays),
      busiestWeek: week,
    },
  };
}
