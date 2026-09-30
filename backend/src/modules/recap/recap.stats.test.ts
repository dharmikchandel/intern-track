import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildStats,
  busiestWeek,
  generateSlug,
  longestStreak,
  parsePeriod,
  percent,
  SLUG_PATTERN,
  toPublicRecap,
  weekStart,
} from "./recap.stats.js";

describe("longestStreak", () => {
  it("is 0 for no days and 1 for a single day", () => {
    assert.equal(longestStreak([]), 0);
    assert.equal(longestStreak(["2026-03-05"]), 1);
  });
  it("counts consecutive days, ignoring order and duplicates", () => {
    assert.equal(longestStreak(["2026-03-07", "2026-03-05", "2026-03-06", "2026-03-06"]), 3);
  });
  it("picks the longest of several runs", () => {
    assert.equal(longestStreak(["2026-03-01", "2026-03-02", "2026-03-10", "2026-03-11", "2026-03-12", "2026-03-20"]), 3);
  });
  it("handles month, year and leap-day boundaries", () => {
    assert.equal(longestStreak(["2026-01-31", "2026-02-01"]), 2);
    assert.equal(longestStreak(["2025-12-31", "2026-01-01"]), 2);
    assert.equal(longestStreak(["2028-02-28", "2028-02-29", "2028-03-01"]), 3);
    assert.equal(longestStreak(["2026-02-28", "2026-03-01"]), 2); // 2026 is not a leap year
  });
  it("does not bridge a one-day gap", () => assert.equal(longestStreak(["2026-03-01", "2026-03-03"]), 1));
});

describe("weeks", () => {
  it("starts weeks on Monday (UTC)", () => {
    assert.equal(weekStart("2026-09-28"), "2026-09-28"); // a Monday
    assert.equal(weekStart("2026-10-04"), "2026-09-28"); // the following Sunday
    assert.equal(weekStart("2026-10-05"), "2026-10-05");
  });
  it("finds the busiest week and breaks ties towards the earlier one", () => {
    assert.deepEqual(
      busiestWeek([
        { day: "2026-09-28", count: 2 },
        { day: "2026-10-02", count: 3 }, // week of 09-28 total 5
        { day: "2026-10-06", count: 5 }, // week of 10-05 total 5 (tie)
      ]),
      { weekStart: "2026-09-28", applications: 5 }
    );
    assert.deepEqual(busiestWeek([{ day: "2026-10-06", count: 9 }, { day: "2026-09-29", count: 1 }]), { weekStart: "2026-10-05", applications: 9 });
  });
  it("is null with no data", () => assert.equal(busiestWeek([]), null));
});

describe("percent and buildStats", () => {
  it("rounds to a whole percent and never divides by zero", () => {
    assert.equal(percent(1, 3), 33);
    assert.equal(percent(2, 3), 67);
    assert.equal(percent(0, 0), 0);
  });
  it("assembles the stats", () => {
    const stats = buildStats({
      applications: 10,
      reachedInterview: 3,
      offers: 1,
      dayCounts: [
        { day: "2026-09-28", count: 4 },
        { day: "2026-09-29", count: 3 },
        { day: "2026-10-05", count: 3 },
      ],
    });
    assert.deepEqual(stats, {
      version: 1,
      applications: 10,
      reachedInterview: 3,
      offers: 1,
      interviewRate: 30,
      offerRate: 10,
      activeDays: 3,
      longestStreakDays: 2,
      busiestWeek: { weekStart: "2026-09-28", applications: 7 },
    });
  });
});

describe("parsePeriod", () => {
  it("makes the end day inclusive", () => {
    const p = parsePeriod("2026-09-01", "2026-09-30");
    assert.equal(p.start.toISOString(), "2026-09-01T00:00:00.000Z");
    assert.equal(p.end.toISOString(), "2026-09-30T00:00:00.000Z");
    assert.equal(p.endExclusive.toISOString(), "2026-10-01T00:00:00.000Z");
  });
  it("allows a single day", () => assert.doesNotThrow(() => parsePeriod("2026-09-01", "2026-09-01")));
  it("rejects reversed, ancient, over-long and malformed periods", () => {
    for (const [a, b] of [
      ["2026-09-30", "2026-09-01"],
      ["1999-01-01", "2026-01-01"],
      ["2015-01-01", "2026-01-01"], // > 5 years
      ["nope", "2026-01-01"],
      ["2026-13-45", "2026-01-01"],
    ] as const) {
      assert.throws(() => parsePeriod(a, b), (err: any) => err.statusCode === 400 && err.code === "INVALID_PERIOD", `${a}..${b}`);
    }
  });
});

describe("share slug", () => {
  it("has 22 URL-safe characters (128 bits) and is unique in practice", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) {
      const slug = generateSlug();
      assert.match(slug, SLUG_PATTERN);
      seen.add(slug);
    }
    assert.equal(seen.size, 5000);
  });
  it("the validator rejects anything else", () => {
    for (const bad of ["", "short", "a".repeat(21), "a".repeat(23), `${"a".repeat(21)}/`, `${"a".repeat(20)}..`, "../../etc/passwd", `${"a".repeat(21)} `]) {
      assert.equal(SLUG_PATTERN.test(bad), false, JSON.stringify(bad));
    }
  });
});

describe("toPublicRecap (what the public page may show)", () => {
  const row = {
    periodStart: new Date("2026-09-01T00:00:00Z"),
    periodEnd: new Date("2026-09-30T00:00:00Z"),
    createdAt: new Date("2026-10-01T12:34:56Z"),
    stats: {
      version: 1,
      applications: 12,
      reachedInterview: 4,
      offers: 1,
      interviewRate: 33,
      offerRate: 8,
      activeDays: 9,
      longestStreakDays: 4,
      busiestWeek: { weekStart: "2026-09-14", applications: 6 },
    },
  };

  it("returns only dates and whole-number aggregates", () => {
    assert.deepEqual(toPublicRecap(row), {
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      createdAt: "2026-10-01",
      stats: row.stats,
    });
  });

  it("drops any extra field that ever ends up in the stored JSON", () => {
    const tainted = {
      ...row,
      userId: "user-123",
      id: "share-1",
      stats: { ...row.stats, companies: ["Stripe"], email: "me@example.com", applicationIds: ["a1"], busiestWeek: { weekStart: "2026-09-14", applications: 6, notes: "secret" } },
    };
    const json = JSON.stringify(toPublicRecap(tainted as any));
    for (const leak of ["Stripe", "me@example.com", "a1", "secret", "user-123", "share-1", "companies", "userId"]) {
      assert.ok(!json.includes(leak), `leaked ${leak}`);
    }
  });

  it("survives missing or corrupt stored data without throwing", () => {
    const empty = toPublicRecap({ ...row, stats: null });
    assert.equal(empty.stats.applications, 0);
    assert.equal(empty.stats.busiestWeek, null);
    const junk = toPublicRecap({ ...row, stats: { applications: "lots", offers: NaN, busiestWeek: "x" } });
    assert.equal(junk.stats.applications, 0);
    assert.equal(junk.stats.offers, 0);
    assert.equal(junk.stats.busiestWeek, null);
  });
});
