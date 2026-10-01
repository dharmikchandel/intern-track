import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, Bell, Briefcase, CalendarDays, CalendarRange, Database, Layers, Share2, TrendingUp, Trophy } from "lucide-react";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoSkeleton } from "../components/ui/NeoSkeleton";
import { IconTile } from "../components/ui/IconTile";
import { getActivity, getFunnel, getStatusCounts } from "../api/analytics";
import { listRecapShares } from "../api/recap";
import { useAuth } from "../features/auth/useAuth";
import { ExportCsvButton, ImportCsvButton } from "../features/applications/CsvTools";
import { ReminderToggle } from "../features/digest/ReminderToggle";
import { MomentumCard } from "../features/milestones/MomentumCard";
import { MILESTONE_TITLES } from "../features/milestones/milestoneMeta";
import { useMilestones } from "../features/milestones/useMilestones";
import { AccountCard } from "../features/profile/AccountCard";
import { ActivityHeatmap } from "../features/profile/ActivityHeatmap";
import { DangerZone } from "../features/profile/DangerZone";
import { PipelineBar } from "../features/profile/PipelineBar";
import { ProfileHero } from "../features/profile/ProfileHero";
import { SecurityCard } from "../features/profile/SecurityCard";
import { formatDay, localDay, plural } from "../features/recap/format";
import type { MilestoneId } from "../api/milestones";
import type { LucideIcon } from "lucide-react";

// The moments worth remembering, in the order they usually happen.
const KEY_MOMENTS: MilestoneId[] = ["applications_1", "first_oa", "first_interview", "first_offer"];

function daysSince(day: string): number {
    const [y, m, d] = day.split("-").map(Number);
    const [ty, tm, td] = localDay().split("-").map(Number);
    return Math.max(1, Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86_400_000) + 1);
}

// Journey tiles reuse the pipeline colours (a deeper blue the closer you get,
// green for offers), so the same colour means the same thing everywhere.
function StatTile({ icon: Icon, value, label, tone }: { icon: LucideIcon; value: string; label: string; tone: string }) {
    return (
        <NeoCard className={`p-4 flex flex-col items-center justify-center text-center ${tone}`}>
            <Icon className="w-7 h-7 mb-2" aria-hidden />
            <p className="text-4xl font-black leading-none">{value}</p>
            <p className="text-xs font-bold uppercase tracking-wider mt-2">{label}</p>
        </NeoCard>
    );
}

function Panel({ icon, tone, title, children }: { icon: LucideIcon; tone?: string; title: string; children: React.ReactNode }) {
    return (
        <NeoCard>
            <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-3"><IconTile icon={icon} tone={tone} /> {title}</h3>
            {children}
        </NeoCard>
    );
}

export function ProfilePage() {
    const { user } = useAuth();
    const today = localDay();
    const milestones = useMilestones();
    const funnel = useQuery({ queryKey: ["analytics", "funnel"], queryFn: getFunnel });
    const counts = useQuery({ queryKey: ["analytics", "status"], queryFn: getStatusCounts });
    const activity = useQuery({ queryKey: ["analytics", "activity", today], queryFn: () => getActivity(today) });
    const shares = useQuery({ queryKey: ["recap", "shares"], queryFn: listRecapShares });

    if (!user) return null;

    const name = user.displayName || user.email.split("@")[0] || user.email;
    const first = milestones.data?.milestones.find((m) => m.id === "applications_1")?.achievedAt ?? null;
    const moments = (milestones.data?.milestones ?? [])
        .filter((m) => KEY_MOMENTS.includes(m.id) && m.achieved && m.achievedAt)
        .sort((a, b) => a.achievedAt!.localeCompare(b.achievedAt!));
    const activeLinks = shares.data?.length ?? 0;

    return (
        <div>
            <ProfileHero name={name} email={user.email} verified={user.emailVerified} {...(user.createdAt ? { memberSince: user.createdAt } : {})} {...(milestones.data ? { streak: milestones.data.streak.current } : {})} />

            {/* Journey */}
            <section aria-labelledby="journey-heading" className="mb-10">
                <h2 id="journey-heading" className="text-2xl font-black uppercase mb-4">Your journey</h2>
                {milestones.data && funnel.data ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatTile icon={CalendarDays} value={first ? String(daysSince(first)) : "0"} label="Days searching" tone="bg-neo-blue-tint" />
                        <StatTile icon={Briefcase} value={String(milestones.data.totalApplications)} label="Applications" tone="bg-neo-blue-mid" />
                        <StatTile icon={TrendingUp} value={String(funnel.data.interviewCount)} label="Interviews" tone="bg-neo-primary" />
                        <StatTile icon={Award} value={String(funnel.data.offerCount)} label="Offers" tone="bg-neo-green" />
                    </div>
                ) : (
                    <NeoSkeleton label="Loading your journey" className="h-36 mb-8" />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
                    <Panel icon={CalendarRange} tone="bg-neo-blue-mid" title="Last 12 weeks">
                        {activity.data ? <ActivityHeatmap days={activity.data} /> : <NeoSkeleton label="Loading your activity" className="h-40 shadow-none" />}
                    </Panel>
                    <Panel icon={Layers} tone="bg-neo-primary" title="Where you stand">
                        {counts.data ? <PipelineBar counts={counts.data} /> : <NeoSkeleton label="Loading your pipeline" className="h-40 shadow-none" />}
                    </Panel>
                </div>

                <MomentumCard variant="full" />

                <Panel icon={Trophy} tone="bg-neo-green" title="Key moments">
                    {moments.length === 0 ? (
                        <p className="font-bold text-slate-600">Your first application, assessment, interview and offer will show up here as they happen.</p>
                    ) : (
                        // The bullet column is as wide as the heading's icon tile (w-9), so the
                        // bullets sit on the icon's centre line, and a rule joins them.
                        <ol className="relative space-y-4">
                            {moments.length > 1 && <span className="absolute left-[17px] top-3 bottom-3 w-0.5 bg-black" aria-hidden />}
                            {moments.map((m) => (
                                <li key={m.id} className="relative flex items-center gap-3">
                                    <span className="w-9 shrink-0 flex justify-center" aria-hidden>
                                        <span className="w-3.5 h-3.5 bg-neo-primary border-2 border-black" />
                                    </span>
                                    <span className="flex flex-wrap items-baseline gap-x-3">
                                        <span className="font-black">{MILESTONE_TITLES[m.id]}</span>
                                        <span className="font-bold text-slate-600">{formatDay(m.achievedAt!)}</span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    )}
                </Panel>
            </section>

            {/* Settings */}
            <section aria-labelledby="settings-heading">
                <h2 id="settings-heading" className="text-2xl font-black uppercase mb-4">Settings</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <AccountCard />
                    <SecurityCard />
                    <Panel icon={Bell} tone="bg-neo-blue-tint" title="Notifications">
                        <ReminderToggle />
                    </Panel>
                    <Panel icon={Database} tone="bg-neo-blue-mid" title="Your data">
                        <p className="text-sm font-medium text-slate-600 mb-4">Export every application as a CSV, or bring in a spreadsheet you already keep.</p>
                        <div className="flex flex-wrap items-start gap-3">
                            <ExportCsvButton filters={{}} filtered={false} />
                            <ImportCsvButton />
                        </div>
                        <p className="text-sm font-medium text-slate-600 mt-5 flex items-center gap-2">
                            <Share2 className="w-4 h-4 shrink-0" aria-hidden />
                            <span>
                                {activeLinks === 0 ? "You have no public recap links." : `You have ${plural(activeLinks, "public recap link")}.`}{" "}
                                <Link to="/recap" className="font-bold underline hover:bg-neo-primary">Manage sharing</Link>
                            </span>
                        </p>
                    </Panel>
                </div>
            </section>

            <DangerZone {...(milestones.data ? { applicationCount: milestones.data.totalApplications } : {})} />
        </div>
    );
}
