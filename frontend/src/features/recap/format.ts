// Recap dates are plain calendar days (YYYY-MM-DD) computed in UTC on the
// server. Formatting them in the viewer's timezone would shift a day for
// anyone west of UTC, so everything here is pinned to UTC.
export function formatDay(day: string, withYear = true): string {
    return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        ...(withYear && { year: "numeric" }),
        timeZone: "UTC",
    });
}

export function formatPeriod(start: string, end: string): string {
    return start === end ? formatDay(start) : `${formatDay(start, false)} - ${formatDay(end)}`;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// Today as YYYY-MM-DD, and a day offset from it, using the viewer's local
// calendar date (what "last 30 days" means to a person).
export function localDay(offsetDays = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
