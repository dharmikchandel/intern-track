import { cn } from "../../lib/utils";
import type { RecapStats } from "../../api/recap";
import { formatDay, formatPeriod, plural } from "./format";

interface RecapCardProps {
    stats: RecapStats;
    periodStart: string;
    periodEnd: string;
}

// The same card is the private preview and the public share page, so what you
// see before sharing is exactly what others will see.
export function RecapCard({ stats, periodStart, periodEnd }: RecapCardProps) {
    return (
        <div className="bg-white border-4 border-black rounded-xl shadow-neo overflow-hidden">
            <div className="px-5 py-4 border-b-4 border-black bg-black text-white">
                <p className="text-xs font-black uppercase tracking-widest text-neo-primary">Job search recap</p>
                <p className="text-lg font-black">{formatPeriod(periodStart, periodEnd)}</p>
            </div>

            <div className="p-5 bg-neo-primary border-b-4 border-black">
                <p className="text-7xl sm:text-8xl font-black leading-none">{stats.applications}</p>
                <p className="text-xl font-black uppercase mt-1">{stats.applications === 1 ? "application sent" : "applications sent"}</p>
            </div>

            <div className="grid grid-cols-2 border-b-4 border-black">
                <Block className="bg-purple-200 border-r-4" value={`${stats.interviewRate}%`} label="interview rate" detail={`${plural(stats.reachedInterview, "application")} reached an interview`} />
                <Block className="bg-green-300" value={`${stats.offerRate}%`} label="offer rate" detail={plural(stats.offers, "offer")} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3">
                <Block className="bg-yellow-200 sm:border-r-4 border-b-4 sm:border-b-0" value={String(stats.longestStreakDays)} label="day streak" detail="longest run of days applying" small />
                <Block
                    className="bg-sky-200 sm:border-r-4 border-b-4 sm:border-b-0"
                    value={stats.busiestWeek ? String(stats.busiestWeek.applications) : "0"}
                    label="in one week"
                    detail={stats.busiestWeek ? `busiest week: ${formatDay(stats.busiestWeek.weekStart, false)}` : "no applications yet"}
                    small
                />
                <Block className="bg-rose-200" value={String(stats.activeDays)} label={stats.activeDays === 1 ? "active day" : "active days"} detail="days with an application" small />
            </div>

            <div className="px-5 py-3 border-t-4 border-black bg-white text-sm font-black flex justify-between">
                <span>TRACKr.</span>
                <span className="text-slate-500">job search, tracked</span>
            </div>
        </div>
    );
}

function Block({ value, label, detail, className, small }: { value: string; label: string; detail: string; className?: string; small?: boolean }) {
    return (
        <div className={cn("p-4 border-black", className)}>
            <p className={cn("font-black leading-none", small ? "text-4xl" : "text-5xl")}>{value}</p>
            <p className="font-black uppercase text-sm mt-1">{label}</p>
            <p className="text-xs font-bold text-slate-700 mt-1">{detail}</p>
        </div>
    );
}
