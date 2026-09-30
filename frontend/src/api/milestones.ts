import { client } from "./client";

export type MilestoneId =
    | "applications_1"
    | "applications_10"
    | "applications_25"
    | "applications_50"
    | "applications_100"
    | "first_oa"
    | "first_interview"
    | "first_offer"
    | "streak_5";

export interface Milestone {
    id: MilestoneId;
    achieved: boolean;
    // YYYY-MM-DD (UTC); null when achieved but the date was never recorded.
    achievedAt: string | null;
    // Earned in the last 7 days.
    isNew: boolean;
    progress: { current: number; target: number } | null;
}

export interface MilestonesResponse {
    streak: { current: number; best: number; appliedToday: boolean };
    totalApplications: number;
    milestones: Milestone[];
}

// `today` is the viewer's local calendar date, so a streak follows their own day.
export async function getMilestones(today: string) {
    const res = await client.get<MilestonesResponse>("/milestones", { params: { today } });
    return res.data;
}
