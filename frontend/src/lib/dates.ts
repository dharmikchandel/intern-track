import { format } from "date-fns";

// A date the user picks without a time ("applied on 12 Sep") is saved as
// midnight UTC of that calendar day (`new Date("2026-09-12").toISOString()`).
// Formatting that instant in the viewer's own timezone shows the previous day
// anywhere west of UTC. These helpers read the UTC calendar day instead, and
// hand date-fns a local date with the same year, month and day.
//
// Real moments in time (createdAt, "2:30 pm") are different: format those
// with date-fns directly so they show in the viewer's timezone.
export function calendarDay(iso: string): Date {
    const d = new Date(iso);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function formatCalendarDay(iso: string, pattern: string): string {
    return format(calendarDay(iso), pattern);
}

// For tight spaces (a phone-width table): drops the year when it is this year.
export function formatCalendarDayShort(iso: string, now = new Date()): string {
    const day = calendarDay(iso);
    return format(day, day.getFullYear() === now.getFullYear() ? "MMM d" : "MMM d, yyyy");
}

// ---- the viewer's timezone ----------------------------------------------------
// "Today" depends on where you are. Follow-up dates are saved as midnight UTC of
// the day the user picked, so whether one is due is decided by the user's own
// calendar day. This mirrors `startOfTomorrowInZone` in the backend, so the
// badges on screen and the server-side filter agree.

export function browserTimeZone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
        return "UTC";
    }
}

export function startOfTomorrowInZone(now: Date, timeZone?: string | null): Date {
    let y = now.getUTCFullYear();
    let m = now.getUTCMonth() + 1;
    let d = now.getUTCDate();
    if (timeZone) {
        try {
            const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
            const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
            [y, m, d] = [get("year"), get("month"), get("day")];
        } catch {
            /* unknown zone: stay on UTC */
        }
    }
    return new Date(Date.UTC(y, m - 1, d + 1));
}

// Every IANA zone the browser knows, sorted. Falls back to a short list on
// runtimes without Intl.supportedValuesOf.
export function timeZoneOptions(): string[] {
    try {
        const all = Intl.supportedValuesOf("timeZone");
        return all.includes("UTC") ? all : ["UTC", ...all];
    } catch {
        return ["UTC", "America/New_York", "America/Chicago", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];
    }
}
