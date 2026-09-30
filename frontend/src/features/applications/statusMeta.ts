import type { Application, ApplicationStatus } from "../../api/applications";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
    APPLIED: "Applied",
    OA: "Online Assessment",
    INTERVIEW: "Interview",
    OFFER: "Offer",
    REJECTED: "Rejected",
};

export const STATUS_ORDER: ApplicationStatus[] = ["APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"];

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
    APPLIED: "bg-blue-100 text-blue-800",
    OA: "bg-yellow-100 text-yellow-800",
    INTERVIEW: "bg-purple-100 text-purple-800",
    OFFER: "bg-green-300 text-black",
    REJECTED: "bg-neo-destructive text-white",
};

const ACTIVE: ApplicationStatus[] = ["APPLIED", "OA", "INTERVIEW"];

// Mirrors the backend's followUpDueWhere (backend/src/modules/applications/
// application.filters.ts): active status and a follow-up date of today or
// earlier, compared in UTC. Only used to badge cards; the server does the
// actual filtering.
export function isFollowUpDue(app: Pick<Application, "status" | "followUpDate">, now = new Date()): boolean {
    if (!app.followUpDate || !ACTIVE.includes(app.status)) return false;
    const startOfTomorrowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    return new Date(app.followUpDate).getTime() < startOfTomorrowUtc;
}
