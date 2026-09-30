import { addDays, dayRuns, DAY_MS, dayToMs } from "../../utils/days.js";

// Pure logic for streaks and milestones. No database and no clock: the caller
// passes `today`, so every rule here is testable with fixed dates.

export interface StreakSummary {
  current: number;
  best: number;
  appliedToday: boolean;
}

// Streaks are built from appliedDate, which users can backdate, edit or import,
// so this is a motivational hint and not a verified metric. Days after `today`
// (a typo, or a clock a day ahead) are ignored.
//
// "Current" stays alive through today: if you applied yesterday but not yet
// today, the streak is still intact (there is still time), so opening the app
// in the morning never shows a streak as already lost.
export function summarizeStreak(days: string[], today: string): StreakSummary {
  const upToToday = days.filter((d) => d <= today);
  const set = new Set(upToToday);
  const appliedToday = set.has(today);

  const anchor = appliedToday ? today : set.has(addDays(today, -1)) ? addDays(today, -1) : null;
  let current = 0;
  if (anchor) {
    for (let d = anchor; set.has(d); d = addDays(d, -1)) current += 1;
  }

  const best = dayRuns(upToToday).reduce((max, run) => Math.max(max, run.length), 0);
  return { current, best, appliedToday };
}

// The day a run of `target` consecutive days was first completed, or null.
export function dayStreakReached(days: string[], today: string, target: number): string | null {
  const run = dayRuns(days.filter((d) => d <= today)).find((r) => r.length >= target);
  return run ? addDays(run.start, target - 1) : null;
}

export const APPLICATION_TIERS = [1, 10, 25, 50, 100] as const;
export const STREAK_TARGET = 5;

// The day the n-th application was sent (by applied date), from per-day counts.
export function nthApplicationDay(perDay: { day: string; count: number }[], n: number): string | null {
  let running = 0;
  for (const { day, count } of [...perDay].sort((a, b) => (a.day < b.day ? -1 : 1))) {
    running += count;
    if (running >= n) return day;
  }
  return null;
}

export type MilestoneId =
  | `applications_${(typeof APPLICATION_TIERS)[number]}`
  | "first_oa"
  | "first_interview"
  | "first_offer"
  | "streak_5";

export interface Milestone {
  id: MilestoneId;
  achieved: boolean;
  /** YYYY-MM-DD (UTC). Null when achieved but the date was never recorded (older or imported data). */
  achievedAt: string | null;
  /** Earned within the last 7 days. */
  isNew: boolean;
  progress: { current: number; target: number } | null;
}

export interface StageEvents {
  /** Earliest recorded move INTO each stage, YYYY-MM-DD. */
  OA?: string | undefined;
  INTERVIEW?: string | undefined;
  OFFER?: string | undefined;
}

export interface MilestoneInput {
  perDay: { day: string; count: number }[];
  today: string;
  stageEvents: StageEvents;
  statusCounts: Record<"APPLIED" | "OA" | "INTERVIEW" | "OFFER" | "REJECTED", number>;
}

const NEW_WINDOW_DAYS = 7;

export function buildMilestones({ perDay, today, stageEvents, statusCounts }: MilestoneInput): {
  streak: StreakSummary;
  totalApplications: number;
  milestones: Milestone[];
} {
  const totalApplications = perDay.reduce((sum, d) => sum + d.count, 0);
  const days = perDay.map((d) => d.day);
  const streak = summarizeStreak(days, today);
  const newSince = addDays(today, -NEW_WINDOW_DAYS);

  const make = (id: MilestoneId, achieved: boolean, achievedAt: string | null, progress: Milestone["progress"] = null): Milestone => ({
    id,
    achieved,
    achievedAt: achieved ? achievedAt : null,
    isNew: achieved && achievedAt !== null && achievedAt >= newSince,
    progress: achieved ? null : progress,
  });

  const milestones: Milestone[] = APPLICATION_TIERS.map((tier) =>
    make(`applications_${tier}`, totalApplications >= tier, nthApplicationDay(perDay, tier), { current: totalApplications, target: tier })
  );

  // A stage counts as reached if it was ever recorded, or an application is in
  // it (or past it) right now. Stage history only exists for changes made since
  // the timeline shipped, so an older application can be "achieved" with no date.
  const interviewReached = Boolean(stageEvents.INTERVIEW || stageEvents.OFFER) || statusCounts.INTERVIEW > 0 || statusCounts.OFFER > 0;
  milestones.push(
    make("first_oa", Boolean(stageEvents.OA) || statusCounts.OA > 0, stageEvents.OA ?? null),
    make("first_interview", interviewReached, stageEvents.INTERVIEW ?? null),
    make("first_offer", Boolean(stageEvents.OFFER) || statusCounts.OFFER > 0, stageEvents.OFFER ?? null),
    make("streak_5", streak.best >= STREAK_TARGET, dayStreakReached(days, today, STREAK_TARGET), {
      current: streak.best,
      target: STREAK_TARGET,
    })
  );

  return { streak, totalApplications, milestones };
}

// `today` comes from the client (its local calendar date) so a streak follows
// the user's own day. It is only accepted within a day of the server's UTC date,
// which is the widest any real timezone can differ.
export function resolveToday(input: string | undefined, now: Date): string | null {
  const serverDay = now.toISOString().slice(0, 10);
  if (input === undefined) return serverDay;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const ms = dayToMs(input);
  if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== input) return null;
  return Math.abs(ms - dayToMs(serverDay)) <= DAY_MS ? input : null;
}
