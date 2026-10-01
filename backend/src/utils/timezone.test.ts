import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidTimeZone, startOfTomorrowInZone, todayInZone } from "./timezone.js";

describe("isValidTimeZone", () => {
  it("accepts real IANA names", () => {
    for (const tz of ["UTC", "Asia/Kolkata", "America/Los_Angeles", "Pacific/Auckland", "Europe/London"]) assert.equal(isValidTimeZone(tz), true, tz);
  });
  it("rejects junk, empty and oversized values", () => {
    for (const tz of ["", "Mars/Olympus", "Asia/Kolkata; DROP TABLE", "x".repeat(65), "+05:30"]) assert.equal(isValidTimeZone(tz), false, tz);
  });
});

describe("todayInZone", () => {
  // 2026-09-30 22:00 UTC is already Oct 1 in India (+5:30) and Sep 30 in Los Angeles (-7).
  const instant = new Date("2026-09-30T22:00:00Z");
  it("is the local calendar day in each zone", () => {
    assert.deepEqual(todayInZone(instant, "Asia/Kolkata"), { year: 2026, month: 10, day: 1 });
    assert.deepEqual(todayInZone(instant, "America/Los_Angeles"), { year: 2026, month: 9, day: 30 });
    assert.deepEqual(todayInZone(instant, "UTC"), { year: 2026, month: 9, day: 30 });
  });
  it("falls back to UTC for null, undefined or an invalid zone", () => {
    for (const tz of [null, undefined, "Nope/Zone"]) assert.deepEqual(todayInZone(instant, tz), { year: 2026, month: 9, day: 30 });
  });
  it("handles a year boundary", () => {
    assert.deepEqual(todayInZone(new Date("2026-12-31T20:00:00Z"), "Pacific/Auckland"), { year: 2027, month: 1, day: 1 });
  });
});

describe("startOfTomorrowInZone", () => {
  it("is midnight UTC of the day after the user's today", () => {
    const instant = new Date("2026-09-30T22:00:00Z");
    assert.equal(startOfTomorrowInZone(instant, "America/Los_Angeles").toISOString(), "2026-10-01T00:00:00.000Z");
    assert.equal(startOfTomorrowInZone(instant, "Asia/Kolkata").toISOString(), "2026-10-02T00:00:00.000Z");
    assert.equal(startOfTomorrowInZone(instant, null).toISOString(), "2026-10-01T00:00:00.000Z");
  });
  it("rolls over month ends", () => {
    assert.equal(startOfTomorrowInZone(new Date("2026-01-31T12:00:00Z"), "UTC").toISOString(), "2026-02-01T00:00:00.000Z");
  });
});
