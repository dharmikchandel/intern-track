import { client } from "./client";

export interface StatusCounts {
    APPLIED: number;
    OA: number;
    INTERVIEW: number;
    OFFER: number;
    REJECTED: number;
}

export interface FunnelMetrics {
    totalApplied: number;
    interviewCount: number;
    offerCount: number;
    interviewRate: number;
    offerRate: number;
}

export async function getStatusCounts() {
    const res = await client.get<StatusCounts>("/analytics/status-counts");
    return res.data;
}

export async function getFunnel() {
    const res = await client.get<FunnelMetrics>("/analytics/funnel");
    return res.data;
}

export interface ActivityDay {
    date: string; // YYYY-MM-DD
    count: number;
}

// Applications per day for the last 12 weeks, oldest first, zero days included.
export async function getActivity(today: string) {
    const res = await client.get<ActivityDay[]>("/analytics/activity", { params: { today } });
    return res.data;
}
