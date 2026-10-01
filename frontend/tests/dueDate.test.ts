// Run from /frontend:
//   ../backend/node_modules/.bin/tsx --test tests/dueDate.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { startOfTomorrowInZone } from "../src/lib/dates.ts";
import { isFollowUpDue } from "../src/features/applications/statusMeta.ts";

// 22:00 UTC on 30 Sep: already 1 Oct in India, still 30 Sep in Los Angeles.
const now = new Date("2026-09-30T22:00:00Z");
const app = (followUpDate: string, status: "APPLIED" | "OFFER" = "APPLIED") => ({ status, followUpDate });

describe("startOfTomorrowInZone (mirrors the backend)", () => {
    it("is midnight UTC of the day after the user's today", () => {
        assert.equal(startOfTomorrowInZone(now, "America/Los_Angeles").toISOString(), "2026-10-01T00:00:00.000Z");
        assert.equal(startOfTomorrowInZone(now, "Asia/Kolkata").toISOString(), "2026-10-02T00:00:00.000Z");
        assert.equal(startOfTomorrowInZone(now, null).toISOString(), "2026-10-01T00:00:00.000Z");
        assert.equal(startOfTomorrowInZone(now, "Nope/Zone").toISOString(), "2026-10-01T00:00:00.000Z");
    });
});

describe("isFollowUpDue", () => {
    it("a follow-up for 1 Oct is due in India but not yet in Los Angeles (same instant)", () => {
        assert.equal(isFollowUpDue(app("2026-10-01T00:00:00.000Z"), "Asia/Kolkata", now), true);
        assert.equal(isFollowUpDue(app("2026-10-01T00:00:00.000Z"), "America/Los_Angeles", now), false);
    });
    it("today and past dates are due everywhere", () => {
        assert.equal(isFollowUpDue(app("2026-09-30T00:00:00.000Z"), "America/Los_Angeles", now), true);
        assert.equal(isFollowUpDue(app("2026-09-01T00:00:00.000Z"), "Pacific/Auckland", now), true);
    });
    it("terminal statuses and missing dates are never due", () => {
        assert.equal(isFollowUpDue(app("2026-09-01T00:00:00.000Z", "OFFER"), "UTC", now), false);
        assert.equal(isFollowUpDue({ status: "APPLIED" }, "UTC", now), false);
    });
});
