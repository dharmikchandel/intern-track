import { client } from "./client";

export interface RecapStats {
    version: 1;
    applications: number;
    reachedInterview: number;
    offers: number;
    interviewRate: number;
    offerRate: number;
    activeDays: number;
    longestStreakDays: number;
    busiestWeek: { weekStart: string; applications: number } | null;
}

export interface RecapPreview {
    stats: RecapStats;
    canShare: boolean;
    minApplications: number;
}

export interface RecapShare {
    id: string;
    slug: string;
    periodStart: string;
    periodEnd: string;
    createdAt: string;
}

export interface PublicRecap {
    periodStart: string; // YYYY-MM-DD
    periodEnd: string;
    createdAt: string;
    stats: RecapStats;
}

export async function getRecapPreview(periodStart: string, periodEnd: string) {
    const res = await client.get<RecapPreview>("/recap/preview", { params: { periodStart, periodEnd } });
    return res.data;
}

export async function createRecapShare(periodStart: string, periodEnd: string) {
    const res = await client.post<RecapShare & { stats: RecapStats }>("/recap/shares", { periodStart, periodEnd });
    return res.data;
}

export async function listRecapShares() {
    const res = await client.get<{ items: RecapShare[] }>("/recap/shares");
    return res.data.items;
}

export async function revokeRecapShare(id: string) {
    await client.delete(`/recap/shares/${id}`);
}

export async function getPublicRecap(slug: string) {
    const res = await client.get<PublicRecap>(`/public/recap/${encodeURIComponent(slug)}`);
    return res.data;
}
