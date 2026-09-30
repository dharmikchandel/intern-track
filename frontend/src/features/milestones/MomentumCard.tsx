import { useQuery } from "@tanstack/react-query";
import { Award, Check, Flame } from "lucide-react";
import { NeoCard } from "../../components/ui/NeoCard";
import { getMilestones, type Milestone, type MilestoneId } from "../../api/milestones";
import { formatDay, localDay, plural } from "../recap/format";

// Wording lives here (the server sends ids and numbers), so copy can change
// without touching stored data.
const TITLES: Record<MilestoneId, string> = {
    applications_1: "First application",
    applications_10: "10 applications",
    applications_25: "25 applications",
    applications_50: "50 applications",
    applications_100: "100 applications",
    first_oa: "First online assessment",
    first_interview: "First interview",
    first_offer: "First offer",
    streak_5: "5-day streak",
};

// Tone is deliberately about momentum, not guilt: a missed day is never shown
// as a loss, only the best run and an invitation to start another.
function streakMessage(streak: { current: number; best: number; appliedToday: boolean }): string {
    if (streak.current > 0 && streak.appliedToday) return "You've applied today. Nice work.";
    if (streak.current > 0) return "Apply today to keep it going.";
    if (streak.best > 0) return `Your best run was ${plural(streak.best, "day")}. Applying today starts a new one.`;
    return "Apply to a job to start a streak.";
}

function MilestoneTile({ milestone }: { milestone: Milestone }) {
    const { achieved, achievedAt, isNew, progress } = milestone;
    const pct = progress ? Math.min(100, Math.round((progress.current / progress.target) * 100)) : 0;

    return (
        <li
            className={`relative border-2 p-3 ${achieved ? "border-black bg-emerald-100" : "border-dashed border-slate-400 bg-white"}`}
            aria-label={`${TITLES[milestone.id]}: ${achieved ? "achieved" : "not yet"}`}
        >
            {isNew && (
                <span className="absolute -top-2 -right-2 bg-neo-primary border-2 border-black text-[10px] font-black uppercase px-1.5 rotate-3">New</span>
            )}
            <div className="flex items-start gap-2">
                {achieved ? (
                    <Check className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                ) : (
                    <span className="w-4 h-4 mt-0.5 shrink-0 border-2 border-slate-400 rounded-full" aria-hidden />
                )}
                <div className="min-w-0">
                    <p className={`text-sm font-black leading-tight ${achieved ? "" : "text-slate-500"}`}>{TITLES[milestone.id]}</p>
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

export function MomentumCard() {
    const today = localDay();
    const { data } = useQuery({
        // Under ["analytics"] so the invalidation every application write
        // already does refreshes this too.
        queryKey: ["analytics", "milestones", today],
        queryFn: () => getMilestones(today),
    });

    // A failure here shouldn't break the dashboard: the card just doesn't show.
    if (!data) return null;
    const { streak, milestones } = data;
    const earned = milestones.filter((m) => m.achieved).length;

    return (
        <NeoCard className="mb-8 bg-white">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-64 shrink-0">
                    <h2 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                        <Flame className="w-6 h-6 text-neo-primary" /> Momentum
                    </h2>
                    <p className="text-5xl font-black leading-none">
                        {streak.current}
                        <span className="text-lg font-bold ml-2">day streak</span>
                    </p>
                    <p className="text-sm font-bold text-slate-600 mt-2">{streakMessage(streak)}</p>
                    {streak.current > 0 && streak.best > streak.current && <p className="text-xs font-bold text-slate-500 mt-1">Best streak: {plural(streak.best, "day")}</p>}
                </div>

                <div className="flex-1">
                    <h3 className="text-sm font-black uppercase mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4" /> Milestones ({earned} of {milestones.length})
                    </h3>
                    <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {milestones.map((m) => (
                            <MilestoneTile key={m.id} milestone={m} />
                        ))}
                    </ul>
                </div>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-4">Streaks use the applied dates you enter, so they are a motivation aid, not a record.</p>
        </NeoCard>
    );
}
