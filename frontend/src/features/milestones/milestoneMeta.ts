import type { Milestone, MilestoneId } from "../../api/milestones";
import { plural } from "../recap/format";

// Wording lives here (the server sends ids and numbers), so copy can change
// without touching stored data.
export const MILESTONE_TITLES: Record<MilestoneId, string> = {
    applications_1: "First application",
    applications_10: "10 applications",
    applications_25: "25 applications",
    applications_50: "50 applications",
    applications_100: "100 applications",
    first_oa: "First assessment",
    first_interview: "First interview",
    first_offer: "First offer",
    streak_5: "5-day streak",
};

// Which milestones this write unlocked. `seen` is what was achieved the last time we looked
// (null before the first look: that is a baseline, never a celebration) and `celebrated` is
// what has already been toasted on this device. Milestones are derived from current data, so
// deleting applications can un-achieve one and re-adding re-achieves it; celebrating each
// once is what keeps that from repeating.
export function newlyAchieved(seen: ReadonlySet<MilestoneId> | null, milestones: Milestone[], celebrated: ReadonlySet<MilestoneId>): MilestoneId[] {
    if (!seen) return [];
    return milestones.filter((m) => m.achieved && !seen.has(m.id) && !celebrated.has(m.id)).map((m) => m.id);
}

// Tone is deliberately about momentum, not guilt: a missed day is never shown
// as a loss, only the best run and an invitation to start another.
export function streakMessage(streak: { current: number; best: number; appliedToday: boolean }): string {
    if (streak.current > 0 && streak.appliedToday) return "You've applied today. Nice work.";
    if (streak.current > 0) return "Apply today to keep it going.";
    if (streak.best > 0) return `Your best run was ${plural(streak.best, "day")}. Applying today starts a new one.`;
    return "Apply to a job to start a streak.";
}

// The compact dashboard card shows three tiles: the newest achievement (a
// freshly earned one first), then the two milestones you are closest to.
export function featuredMilestones(milestones: Milestone[]): Milestone[] {
    const achieved = milestones
        .filter((m) => m.achieved)
        .sort((a, b) => Number(b.isNew) - Number(a.isNew) || (b.achievedAt ?? "").localeCompare(a.achievedAt ?? ""));
    const upNext = milestones
        .filter((m) => !m.achieved && m.progress)
        .sort((a, b) => b.progress!.current / b.progress!.target - a.progress!.current / a.progress!.target);
    const picked = [...achieved.slice(0, 1), ...upNext.slice(0, 2)];
    for (const m of achieved.slice(1)) if (picked.length < 3) picked.push(m);
    return picked.slice(0, 3);
}
