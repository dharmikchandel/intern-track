import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ACTIVE_STATUSES, buildApplicationWhere, followUpDueWhere } from "./application.filters.js";

// 22:00 UTC on 30 Sep: 1 Oct in India already, still 30 Sep in Los Angeles.
const now = new Date("2026-09-30T22:00:00Z");
const lt = (w: ReturnType<typeof followUpDueWhere>) => (w.followUpDate as { lt: Date }).lt.toISOString();

describe("followUpDueWhere", () => {
  it("defaults to UTC, as before", () => {
    assert.equal(lt(followUpDueWhere(now)), "2026-10-01T00:00:00.000Z");
    assert.equal(lt(followUpDueWhere(now, null)), "2026-10-01T00:00:00.000Z");
  });
  it("uses the user's own calendar day", () => {
    // A follow-up for 1 Oct (stored 2026-10-01T00:00Z) is due today in India, not yet in Los Angeles.
    const oct1 = new Date("2026-10-01T00:00:00Z").getTime();
    assert.ok(oct1 < new Date(lt(followUpDueWhere(now, "Asia/Kolkata"))).getTime(), "due in Kolkata");
    assert.ok(!(oct1 < new Date(lt(followUpDueWhere(now, "America/Los_Angeles"))).getTime()), "not due in Los Angeles");
  });
  it("only chases active statuses", () => {
    assert.deepEqual((followUpDueWhere(now).status as { in: string[] }).in, ACTIVE_STATUSES);
  });
});

describe("buildApplicationWhere", () => {
  it("threads the zone into the follow-up filter and leaves other filters alone", () => {
    const where = buildApplicationWhere("u1", { needsFollowUp: true, status: "OA" }, "Asia/Kolkata");
    assert.equal(where.userId, "u1");
    const and = where.AND as Array<Record<string, unknown>>;
    assert.equal(and.length, 2);
    assert.deepEqual(and[0], { status: "OA" });
    assert.ok("followUpDate" in and[1]!);
  });
  it("adds no follow-up condition when not asked", () => {
    assert.equal(buildApplicationWhere("u1", {}, "Asia/Kolkata").AND, undefined);
  });
});
