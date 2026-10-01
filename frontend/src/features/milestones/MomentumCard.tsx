import { Link } from "react-router-dom";
import { ArrowRight, Award, Check, Flame } from "lucide-react";
import { NeoCard } from "../../components/ui/NeoCard";
import { NeoSkeleton } from "../../components/ui/NeoSkeleton";
import type { Milestone } from "../../api/milestones";
import { formatDay, plural } from "../recap/format";
import { featuredMilestones, MILESTONE_TITLES, streakMessage } from "./milestoneMeta";
import { useMilestones } from "./useMilestones";

export function MilestoneTile({ milestone }: { milestone: Milestone }) {
    const { achieved, achievedAt, isNew, progress } = milestone;
    const pct = progress ? Math.min(100, Math.round((progress.current / progress.target) * 100)) : 0;

    return (
        <li
            className={`relative border-2 p-3 ${achieved ? "border-black bg-neo-mint" : "border-dashed border-slate-500 bg-white"}`}
            aria-label={`${MILESTONE_TITLES[milestone.id]}: ${achieved ? "achieved" : "not yet"}`}
        >
            {isNew && (
                <span className="absolute -top-2 -right-2 bg-neo-primary border-2 border-black text-[10px] font-black uppercase px-1.5 rotate-3">New</span>
            )}
            <div className="flex items-start gap-2">
                {achieved ? (
                    <Check className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                ) : (
                    <span className="w-4 h-4 mt-0.5 shrink-0 border-2 border-slate-500 rounded-full" aria-hidden />
                )}
                <div className="min-w-0">
                    <p className={`text-sm font-black leading-tight ${achieved ? "" : "text-slate-500"}`}>{MILESTONE_TITLES[milestone.id]}</p>
                    {achieved && achievedAt && <p className="text-xs font-bold text-slate-600">{formatDay(achievedAt)}</p>}
                    {!achieved && progress && (
                        <>
                            <div className="h-2 mt-1.5 bg-slate-100 border border-black overflow-hidden">
                                <div className="h-full bg-neo-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">
                                {progress.current} of {progress.target}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </li>
    );
}

// "full" shows every milestone (the profile page); "compact" is the dashboard's
// version: the streak, three milestones that matter right now, and a way in.
export function MomentumCard({ variant = "full" }: { variant?: "full" | "compact" }) {
    const { data, isLoading } = useMilestones();

    if (isLoading) {
        return <NeoSkeleton label="Loading your streak and milestones" className="mb-8 h-56" />;
    }
    // A failure here shouldn't break the page: the card just doesn't show.
    if (!data) return null;
    const { streak, milestones } = data;
    const earned = milestones.filter((m) => m.achieved).length;
    const compact = variant === "compact";
    const shown = compact ? featuredMilestones(milestones) : milestones;

    return (
        <NeoCard className="mb-8 bg-white">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-64 shrink-0">
                    <h2 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                        <Flame className="w-6 h-6 text-neo-primary" aria-hidden /> Momentum
                    </h2>
                    <p className="text-5xl font-black leading-none">
                        {streak.current}
                        <span className="text-lg font-bold ml-2">day streak</span>
                    </p>
                    <p className="text-sm font-bold text-slate-600 mt-2">{streakMessage(streak)}</p>
                    {streak.current > 0 && streak.best > streak.current && <p className="text-xs font-bold text-slate-500 mt-1">Best streak: {plural(streak.best, "day")}</p>}
                </div>

                <div className="flex-1">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <h3 className="text-sm font-black uppercase flex items-center gap-2">
                            <Award className="w-4 h-4" aria-hidden /> Milestones ({earned} of {milestones.length})
                        </h3>
                        {compact && (
                            <Link to="/profile" className="inline-flex items-center gap-1 min-h-11 text-sm font-bold underline hover:bg-neo-primary">
                                See all <ArrowRight className="w-4 h-4" aria-hidden />
                            </Link>
                        )}
                    </div>
                    <ul className={compact ? "grid grid-cols-1 sm:grid-cols-3 gap-3" : "grid grid-cols-2 lg:grid-cols-3 gap-3"}>
                        {shown.map((m) => (
                            <MilestoneTile key={m.id} milestone={m} />
                        ))}
                    </ul>
                </div>
            </div>
            {!compact && <p className="text-xs font-bold text-slate-500 mt-4">Streaks use the applied dates you enter, so they are a motivation aid, not a record.</p>}
        </NeoCard>
    );
}
