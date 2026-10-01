import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bucketActivity, lastDays } from "./analytics.activity.js";

describe("lastDays", () => {
  it("lists N days ending today, oldest first", () => {
    assert.deepEqual(lastDays("2026-10-02", 4), ["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"]);
  });
  it("crosses a year boundary", () => {
    assert.deepEqual(lastDays("2027-01-01", 3), ["2026-12-30", "2026-12-31", "2027-01-01"]);
  });
});

describe("bucketActivity", () => {
  const d = (s: string) => new Date(`${s}T00:00:00.000Z`);
  it("counts per day and includes the empty days", () => {
    const out = bucketActivity([d("2026-10-01"), d("2026-10-01"), d("2026-09-30")], "2026-10-02", 4);
    assert.deepEqual(out, [
      { date: "2026-09-29", count: 0 },
      { date: "2026-09-30", count: 1 },
      { date: "2026-10-01", count: 2 },
      { date: "2026-10-02", count: 0 },
    ]);
  });
  it("ignores dates outside the window", () => {
    const out = bucketActivity([d("2026-01-01"), d("2027-01-01")], "2026-10-02", 3);
    assert.equal(out.reduce((n, x) => n + x.count, 0), 0);
    assert.equal(out.length, 3);
  });
  it("returns the full window for no applications", () => {
    assert.equal(bucketActivity([], "2026-10-02", 84).length, 84);
  });
});
