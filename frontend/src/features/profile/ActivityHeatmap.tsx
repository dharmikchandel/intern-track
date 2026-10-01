import { format } from "date-fns";
import { cn } from "../../lib/utils";
import type { ActivityDay } from "../../api/analytics";
import { plural } from "../recap/format";

// Applications per day for the last 12 weeks, as a calendar: one column per
// week, one row per weekday (Monday at the top, labelled Mon / Wed / Fri), one
// square per day filled from white to Signal Blue by how many you sent. The grid
// stretches to the card's width so it is centred in it, and the squares stay
// square. Decorative to screen readers (one summary).
const LEVELS = ["bg-white border-black/25", "bg-neo-blue-tint border-black", "bg-neo-blue-mid border-black", "bg-neo-primary border-black"];
const level = (count: number) => (count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3);
const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

export function ActivityHeatmap({ days }: { days: ActivityDay[] }) {
    const first = days[0] ? new Date(`${days[0].date}T00:00:00Z`) : null;
    const lead = first ? (first.getUTCDay() + 6) % 7 : 0; // Monday = 0
    const cells: Array<ActivityDay | null> = [...Array<null>(lead).fill(null), ...days];
    const weeks = Math.ceil(cells.length / 7);
    const total = days.reduce((n, d) => n + d.count, 0);
    const best = days.reduce<ActivityDay | null>((b, d) => (d.count > (b?.count ?? 0) ? d : b), null);
    const label = (d: ActivityDay) => `${format(new Date(`${d.date}T00:00:00Z`), "MMM d")}: ${plural(d.count, "application")}`;

    return (
        <div>
            <div
                role="img"
                aria-label={`${plural(total, "application")} in the last 12 weeks${best ? `, most on ${format(new Date(`${best.date}T00:00:00Z`), "MMM d")} (${best.count})` : ""}`}
            >
                {/* First column: weekday labels. Then one column per week; the cells set the row height, so labels line up with their row. */}
                <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ gridTemplateColumns: `auto repeat(${weeks}, minmax(0, 1fr))` }} aria-hidden>
                    {WEEKDAY_LABELS.map((text, i) => (
                        <span key={`label-${i}`} className="flex items-center pr-1.5 text-[10px] font-bold uppercase text-slate-600 leading-none">{text}</span>
                    ))}
                    {cells.map((d, i) =>
                        d ? (
                            <span key={d.date} title={label(d)} className={cn("aspect-square w-full border rounded", LEVELS[level(d.count)])} />
                        ) : (
                            <span key={`pad-${i}`} className="aspect-square w-full" />
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
