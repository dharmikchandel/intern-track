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
