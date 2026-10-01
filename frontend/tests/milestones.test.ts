import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Milestone, MilestoneId } from "../src/api/milestones.ts";
import { newlyAchieved } from "../src/features/milestones/milestoneMeta.ts";

const ms = (achieved: MilestoneId[]): Milestone[] =>
    (["applications_1", "applications_10", "first_interview", "first_offer"] as MilestoneId[]).map((id) => ({
        id, achieved: achieved.includes(id), achievedAt: null, isNew: false, progress: null,
    }));
const set = (...ids: MilestoneId[]) => new Set<MilestoneId>(ids);

describe("newlyAchieved", () => {
    it("the first look is a baseline, never a celebration", () => {
        assert.deepEqual(newlyAchieved(null, ms(["applications_1", "first_offer"]), set()), []);
    });

    it("reports what is achieved now but was not before", () => {
        assert.deepEqual(newlyAchieved(set("applications_1"), ms(["applications_1", "applications_10"]), set()), ["applications_10"]);
    });

    it("reports several at once, in list order", () => {
        assert.deepEqual(newlyAchieved(set(), ms(["first_offer", "applications_1"]), set()), ["applications_1", "first_offer"]);
    });

    it("says nothing when nothing changed or something was lost", () => {
        assert.deepEqual(newlyAchieved(set("applications_1", "applications_10"), ms(["applications_1", "applications_10"]), set()), []);
        assert.deepEqual(newlyAchieved(set("applications_1", "applications_10"), ms(["applications_1"]), set()), []);
    });

    it("never celebrates the same milestone twice (delete then re-add re-achieves it)", () => {
        assert.deepEqual(newlyAchieved(set("applications_1"), ms(["applications_1", "applications_10"]), set("applications_10")), []);
    });
});
