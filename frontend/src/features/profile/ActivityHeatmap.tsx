import { format } from "date-fns";
import { cn } from "../../lib/utils";
import type { ActivityDay } from "../../api/analytics";
import { plural } from "../recap/format";

// Applications per day for the last 12 weeks, as a calendar: one column per
// week (Monday at the top), one square per day, filled from white to Signal
// Blue by how many you sent. It is decorative to screen readers (one summary).
const LEVELS = ["bg-white border-black/25", "bg-neo-blue-tint border-black", "bg-neo-blue-mid border-black", "bg-neo-primary border-black"];
const level = (count: number) => (count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3);

export function ActivityHeatmap({ days }: { days: ActivityDay[] }) {
    const first = days[0] ? new Date(`${days[0].date}T00:00:00Z`) : null;
    const lead = first ? (first.getUTCDay() + 6) % 7 : 0; // Monday = 0
    const cells: Array<ActivityDay | null> = [...Array<null>(lead).fill(null), ...days];
    const total = days.reduce((n, d) => n + d.count, 0);
    const best = days.reduce<ActivityDay | null>((b, d) => (d.count > (b?.count ?? 0) ? d : b), null);
    const label = (d: ActivityDay) => `${format(new Date(`${d.date}T00:00:00Z`), "MMM d")}: ${plural(d.count, "application")}`;

    return (
        <div>
            <div
                role="img"
                aria-label={`${plural(total, "application")} in the last 12 weeks${best ? `, most on ${format(new Date(`${best.date}T00:00:00Z`), "MMM d")} (${best.count})` : ""}`}
                className="overflow-x-auto pb-1"
            >
                <div className="grid grid-flow-col grid-rows-7 gap-1 w-max" aria-hidden>
                    {cells.map((d, i) =>
                        d ? (
                            <span key={d.date} title={label(d)} className={cn("w-4 h-4 sm:w-6 sm:h-6 border rounded-sm", LEVELS[level(d.count)])} />
                        ) : (
                            <span key={`pad-${i}`} className="w-4 h-4 sm:w-6 sm:h-6" />
                        )
                    )}
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-sm font-bold text-slate-600">
                <span>
                    {plural(total, "application")} in 12 weeks
                    {best && best.count > 0 && <> · busiest day {format(new Date(`${best.date}T00:00:00Z`), "MMM d")}</>}
                </span>
                <span className="inline-flex items-center gap-1.5" aria-hidden>
                    Less
                    {LEVELS.map((tone) => (
                        <span key={tone} className={cn("w-3.5 h-3.5 border rounded-sm", tone)} />
                    ))}
                    More
                </span>
            </div>
        </div>
    );
}
