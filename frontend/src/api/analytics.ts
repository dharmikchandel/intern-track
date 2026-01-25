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
