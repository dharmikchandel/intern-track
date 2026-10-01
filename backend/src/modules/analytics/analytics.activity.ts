// Applications per calendar day for the last N days, oldest first, with zero
// days included so the client can draw a calendar without filling gaps.
// Applied dates are calendar days stored at midnight UTC, so they are bucketed
// by their UTC date. `today` is the viewer's local day (YYYY-MM-DD).

export type ActivityDay = { date: string; count: number };

export function lastDays(today: string, days: number): string[] {
  const [y, m, d] = today.split("-").map(Number) as [number, number, number];
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  return out;
}

export function bucketActivity(appliedDates: Date[], today: string, days: number): ActivityDay[] {
  const range = lastDays(today, days);
  const counts = new Map(range.map((date) => [date, 0]));
  for (const applied of appliedDates) {
    const key = applied.toISOString().slice(0, 10);
    if (counts.has(key)) counts.set(key, counts.get(key)! + 1);
  }
  return range.map((date) => ({ date, count: counts.get(date)! }));
}
