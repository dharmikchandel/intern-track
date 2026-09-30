import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDays, dayRuns, longestStreak } from "../../utils/days.js";
import { buildMilestones, dayStreakReached, nthApplicationDay, resolveToday, summarizeStreak } from "./milestones.stats.js";

const counts = { APPLIED: 0, OA: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0 };
const perDay = (days: string[]) => days.map((day) => ({ day, count: 1 }));
const byId = <T extends { id: string }>(list: T[], id: string): T => list.find((m) => m.id === id)!;

describe("day helpers", () => {
  it("adds days across month, year and leap-day boundaries", () => {
    assert.equal(addDays("2026-01-31", 1), "2026-02-01");
    assert.equal(addDays("2026-01-01", -1), "2025-12-31");
    assert.equal(addDays("2024-02-28", 1), "2024-02-29");
    assert.equal(addDays("2025-02-28", 1), "2025-03-01");
  });

  it("finds runs regardless of order and duplicates", () => {
    const runs = dayRuns(["2026-09-03", "2026-09-01", "2026-09-02", "2026-09-02", "2026-09-10"]);
    assert.deepEqual(runs, [{ start: "2026-09-01", length: 3 }, { start: "2026-09-10", length: 1 }]);
    assert.equal(longestStreak(["2025-12-31", "2026-01-01", "2026-01-02"]), 3);
    assert.equal(longestStreak([]), 0);
  });
});

describe("summarizeStreak", () => {
  const today = "2026-09-20";

  it("counts back from today when applied today", () => {
    assert.deepEqual(summarizeStreak(["2026-09-18", "2026-09-19", "2026-09-20"], today), { current: 3, best: 3, appliedToday: true });
  });

  it("keeps the streak alive through today if yesterday was the last day", () => {
    assert.deepEqual(summarizeStreak(["2026-09-18", "2026-09-19"], today), { current: 2, best: 2, appliedToday: false });
  });

  it("is 0 once a full day has been missed, but remembers the best", () => {
    const days = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-17"];
    assert.deepEqual(summarizeStreak(days, today), { current: 0, best: 4, appliedToday: false });
  });

  it("ignores gaps older than the current run", () => {
    assert.equal(summarizeStreak(["2026-09-10", "2026-09-11", "2026-09-19", "2026-09-20"], today).current, 2);
  });

  it("ignores days after today (typos, a clock ahead)", () => {
    const s = summarizeStreak(["2026-09-20", "2026-09-21", "2026-09-22", "2026-12-01"], today);
    assert.deepEqual(s, { current: 1, best: 1, appliedToday: true });
  });

  it("handles no data", () => {
    assert.deepEqual(summarizeStreak([], today), { current: 0, best: 0, appliedToday: false });
  });

  it("runs across a year boundary", () => {
    assert.equal(summarizeStreak(["2025-12-30", "2025-12-31", "2026-01-01"], "2026-01-01").current, 3);
  });

  it("several applications on one day count as one day", () => {
    assert.equal(summarizeStreak(["2026-09-20", "2026-09-20", "2026-09-19"], today).current, 2);
  });
});

describe("milestone dates", () => {
  it("finds the day the nth application was sent, by applied date", () => {
    const days = [{ day: "2026-09-03", count: 2 }, { day: "2026-09-01", count: 1 }, { day: "2026-09-02", count: 4 }];
    assert.equal(nthApplicationDay(days, 1), "2026-09-01");
    assert.equal(nthApplicationDay(days, 2), "2026-09-02");
    assert.equal(nthApplicationDay(days, 5), "2026-09-02");
    assert.equal(nthApplicationDay(days, 6), "2026-09-03");
    assert.equal(nthApplicationDay(days, 8), null);
  });

  it("finds the day a streak first reached its target", () => {
    const days = ["2026-09-01", "2026-09-02", "2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13", "2026-09-14", "2026-09-15"];
    assert.equal(dayStreakReached(days, "2026-09-20", 5), "2026-09-14");
    assert.equal(dayStreakReached(days, "2026-09-12", 5), null); // not yet, as of that day
    assert.equal(dayStreakReached(["2026-09-01"], "2026-09-20", 5), null);
  });
});

describe("buildMilestones", () => {
  const today = "2026-09-20";

  it("starts empty with progress toward the first ones", () => {
    const { milestones, totalApplications, streak } = buildMilestones({ perDay: [], today, stageEvents: {}, statusCounts: counts });
    assert.equal(totalApplications, 0);
    assert.equal(streak.best, 0);
    assert.ok(milestones.every((m) => !m.achieved && m.achievedAt === null && !m.isNew));
    assert.deepEqual(byId(milestones, "applications_10").progress, { current: 0, target: 10 });
    assert.equal(byId(milestones, "first_offer").progress, null);
  });

  it("achieves count tiers with the day they were reached", () => {
    const days = Array.from({ length: 12 }, (_, i) => addDays("2026-08-01", i * 2)); // 12 apps, every other day
    const { milestones } = buildMilestones({ perDay: perDay(days), today, stageEvents: {}, statusCounts: counts });
    assert.deepEqual([byId(milestones, "applications_1").achieved, byId(milestones, "applications_10").achieved, byId(milestones, "applications_25").achieved], [true, true, false]);
    assert.equal(byId(milestones, "applications_10").achievedAt, days[9]);
    assert.deepEqual(byId(milestones, "applications_25").progress, { current: 12, target: 25 });
    assert.equal(byId(milestones, "applications_1").progress, null); // achieved: no progress bar
  });

  it("marks recently earned milestones as new (within 7 days), older ones not", () => {
    const { milestones } = buildMilestones({
      perDay: perDay(["2026-09-01", "2026-09-19"]),
      today,
      stageEvents: { INTERVIEW: "2026-09-18", OA: "2026-09-05" },
      statusCounts: counts,
    });
    assert.equal(byId(milestones, "first_interview").isNew, true);
    assert.equal(byId(milestones, "first_oa").isNew, false);
    assert.equal(byId(milestones, "applications_1").isNew, false); // 1st application was Sep 1
  });

  it("achieves stage milestones from current status when no history exists, with no date", () => {
    const { milestones } = buildMilestones({ perDay: perDay(["2026-09-01"]), today, stageEvents: {}, statusCounts: { ...counts, INTERVIEW: 1 } });
    assert.deepEqual(
      { achieved: byId(milestones, "first_interview").achieved, at: byId(milestones, "first_interview").achievedAt, isNew: byId(milestones, "first_interview").isNew },
      { achieved: true, at: null, isNew: false }
    );
    assert.equal(byId(milestones, "first_oa").achieved, false);
    assert.equal(byId(milestones, "first_offer").achieved, false);
  });

  it("an offer (current or recorded) implies the interview was reached", () => {
    for (const input of [{ stageEvents: { OFFER: "2026-09-10" }, statusCounts: counts }, { stageEvents: {}, statusCounts: { ...counts, OFFER: 1 } }]) {
      const { milestones } = buildMilestones({ perDay: perDay(["2026-09-01"]), today, ...input });
      assert.equal(byId(milestones, "first_interview").achieved, true);
      assert.equal(byId(milestones, "first_offer").achieved, true);
    }
    // ...but an interview does not imply an OA (many pipelines skip it)
    const { milestones } = buildMilestones({ perDay: perDay(["2026-09-01"]), today, stageEvents: { INTERVIEW: "2026-09-10" }, statusCounts: counts });
    assert.equal(byId(milestones, "first_oa").achieved, false);
  });

  it("the 5-day streak milestone uses the BEST streak, so a broken current streak doesn't un-earn it", () => {
    const days = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05", "2026-09-19"];
    const { milestones, streak } = buildMilestones({ perDay: perDay(days), today, stageEvents: {}, statusCounts: counts });
    assert.equal(streak.current, 1);
    assert.equal(byId(milestones, "streak_5").achieved, true);
    assert.equal(byId(milestones, "streak_5").achievedAt, "2026-09-05");
  });

  it("shows streak progress while short of 5", () => {
    const { milestones } = buildMilestones({ perDay: perDay(["2026-09-18", "2026-09-19", "2026-09-20"]), today, stageEvents: {}, statusCounts: counts });
    assert.deepEqual(byId(milestones, "streak_5").progress, { current: 3, target: 5 });
  });

  it("returns every milestone in a stable order", () => {
    const { milestones } = buildMilestones({ perDay: [], today, stageEvents: {}, statusCounts: counts });
    assert.deepEqual(
      milestones.map((m) => m.id),
      ["applications_1", "applications_10", "applications_25", "applications_50", "applications_100", "first_oa", "first_interview", "first_offer", "streak_5"]
    );
  });
});

describe("resolveToday", () => {
  const now = new Date("2026-09-30T20:30:00Z"); // 02:00 on Oct 1 in India
  it("defaults to the server's UTC date", () => assert.equal(resolveToday(undefined, now), "2026-09-30"));
  it("accepts the client's local date within a day of it", () => {
    assert.equal(resolveToday("2026-10-01", now), "2026-10-01");
    assert.equal(resolveToday("2026-09-29", now), "2026-09-29");
  });
  it("rejects far-off, malformed and impossible dates", () => {
    for (const bad of ["2026-10-02", "2026-09-28", "2026-9-30", "nope", "2026-02-30", "", "2026-09-30T00:00"]) assert.equal(resolveToday(bad, now), null, bad);
  });
});
