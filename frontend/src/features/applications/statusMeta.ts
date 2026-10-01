import type { Application, ApplicationStatus } from "../../api/applications";
import { startOfTomorrowInZone } from "../../lib/dates";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
    APPLIED: "Applied",
    OA: "Assessment",
    INTERVIEW: "Interview",
    OFFER: "Offer",
    REJECTED: "Rejected",
};

export const STATUS_ORDER: ApplicationStatus[] = ["APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"];

// A blue ramp that deepens as an application gets closer, then green for an
// offer and red for a rejection. Black text on every fill.
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
    APPLIED: "bg-neo-blue-tint text-black",
    OA: "bg-neo-blue-mid text-black",
    INTERVIEW: "bg-neo-primary text-black",
    OFFER: "bg-neo-green text-black",
    REJECTED: "bg-neo-destructive text-black",
};

const ACTIVE: ApplicationStatus[] = ["APPLIED", "OA", "INTERVIEW"];

// Mirrors the backend's followUpDueWhere (backend/src/modules/applications/
// application.filters.ts): active status and a follow-up date of today or
// earlier on the user's own calendar (their saved timezone). Only used to badge
// cards; the server does the actual filtering.
export function isFollowUpDue(app: Pick<Application, "status" | "followUpDate">, timeZone?: string | null, now = new Date()): boolean {
    if (!app.followUpDate || !ACTIVE.includes(app.status)) return false;
    return new Date(app.followUpDate).getTime() < startOfTomorrowInZone(now, timeZone).getTime();
}
