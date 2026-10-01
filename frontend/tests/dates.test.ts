// Run from /frontend, once per timezone that matters:
//   TZ=America/Los_Angeles ../backend/node_modules/.bin/tsx --test tests/dates.test.ts
//   TZ=UTC ../backend/node_modules/.bin/tsx --test tests/dates.test.ts
//   TZ=Pacific/Auckland ../backend/node_modules/.bin/tsx --test tests/dates.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calendarDay, formatCalendarDay } from "../src/lib/dates.ts";

// What the forms save for a date picked as 2026-09-12: midnight UTC.
const SAVED = new Date("2026-09-12").toISOString();

describe("calendar days (stored as midnight UTC)", () => {
    it("is the instant the forms really save", () => {
        assert.equal(SAVED, "2026-09-12T00:00:00.000Z");
    });

    it("formats the same day in every timezone, not the previous one west of UTC", () => {
        assert.equal(formatCalendarDay(SAVED, "MMM d, yyyy"), "Sep 12, 2026");
        assert.equal(formatCalendarDay(SAVED, "MMM d"), "Sep 12");
        assert.equal(formatCalendarDay(SAVED, "PPP"), "September 12th, 2026");
    });

    it("hands back a local date with the same year, month and day", () => {
        const d = calendarDay(SAVED);
        assert.deepEqual([d.getFullYear(), d.getMonth(), d.getDate()], [2026, 8, 12]);
    });

    it("handles month and year boundaries", () => {
        assert.equal(formatCalendarDay("2026-01-01T00:00:00.000Z", "MMM d, yyyy"), "Jan 1, 2026");
        assert.equal(formatCalendarDay("2026-12-31T00:00:00.000Z", "MMM d, yyyy"), "Dec 31, 2026");
    });

    it("a plain local format of the same instant is what used to go wrong (documents the bug)", () => {
        const local = new Date(SAVED).getDate();
        // 12 in UTC and east of it, 11 west of it. The helper above must not depend on this.
        assert.ok(local === 12 || local === 11);
    });
});
