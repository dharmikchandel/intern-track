import { useQuery } from "@tanstack/react-query";

import { NeoAlert } from "../components/ui/NeoAlert";
import { NeoButton } from "../components/ui/NeoButton";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoLinkButton } from "../components/ui/NeoLinkButton";
import { getStatusCounts, getFunnel, type FunnelMetrics, type StatusCounts } from "../api/analytics";
import { FollowUpCard } from "../features/digest/FollowUpCard";
import { MomentumCard } from "../features/milestones/MomentumCard";
import { Plus, Briefcase, FileCheck, Award, XCircle, TrendingUp, type LucideIcon } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS, STATUS_ORDER } from "../features/applications/statusMeta";
import type { ApplicationStatus } from "../api/applications";

const STATUS_ICONS: Record<ApplicationStatus, LucideIcon> = {
    APPLIED: Briefcase,
    OA: FileCheck,
    INTERVIEW: TrendingUp,
    OFFER: Award,
    REJECTED: XCircle,
};

function DashboardSkeleton() {
    return (
        <div role="status" aria-busy="true">
            <span className="sr-only">Loading your numbers</span>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {STATUS_ORDER.map((status) => (
                    <div key={status} className="h-32 bg-white border-2 border-black rounded-lg shadow-neo animate-pulse" />
                ))}
            </div>
            <div className="h-56 bg-white border-2 border-black rounded-lg shadow-neo animate-pulse" />
        </div>
    );
}

function DashboardNumbers({ counts, funnelData }: { counts: StatusCounts; funnelData: FunnelMetrics }) {
    const stats = STATUS_ORDER.map((status) => ({
        label: STATUS_LABELS[status],
        value: counts[status],
        icon: STATUS_ICONS[status],
        color: STATUS_COLORS[status],
    }));

    return (
        <>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <NeoCard key={stat.label} className={`p-4 flex flex-col items-center justify-center text-center ${stat.color}`}>
                        <Icon className="w-8 h-8 mb-2 opacity-100" />
                        <span className="text-3xl font-black">{stat.value}</span>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">{stat.label}</span>
                    </NeoCard>
                )
            })}
        </div>

        <div className="grid grid-cols-1 gap-8">
            <NeoCard className="bg-white">
                <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2 text-black">
                    <TrendingUp className="w-6 h-6 text-neo-primary" /> Funnel Metrics
                </h2>

                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between font-bold mb-2 text-black">
                            <span>Interview Rate</span>
                            <span>{funnelData.interviewRate.toFixed(1)}%</span>
                        </div>
                        <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden border-2 border-black">
                            <div
                                className="h-full bg-neo-secondary transition-all duration-1000 motion-reduce:transition-none border-r-2 border-black"
                                style={{ width: `${Math.min(100, funnelData.interviewRate)}%` }}
                            />
                        </div>
                        <p className="text-xs font-bold text-slate-500 mt-2">
                            {funnelData.interviewCount} interviews from {funnelData.totalApplied} applications
                        </p>
                    </div>

                    <div>
                        <div className="flex justify-between font-bold mb-2 text-black">
                            <span>Offer Rate</span>
                            <span>{funnelData.offerRate.toFixed(1)}%</span>
                        </div>
                        <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden border-2 border-black">
                            <div
                                className="h-full bg-neo-primary transition-all duration-1000 motion-reduce:transition-none border-r-2 border-black"
                                style={{ width: `${Math.min(100, funnelData.offerRate)}%` }}
                            />
                        </div>
                        <p className="text-xs font-bold text-slate-500 mt-2">
                            {funnelData.offerCount} offers from {funnelData.totalApplied} applications
                        </p>
                    </div>
                </div>
            </NeoCard>
        </div>
        </>
    );
}

export function DashboardPage() {
    const status = useQuery({ queryKey: ["analytics", "status"], queryFn: getStatusCounts });
    const funnel = useQuery({ queryKey: ["analytics", "funnel"], queryFn: getFunnel });

    const isLoading = status.isLoading || funnel.isLoading;
    const retry = () => {
        if (status.isError) void status.refetch();
        if (funnel.isError) void funnel.refetch();
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">
                        Dashboard
                    </h1>
                    <p className="text-slate-600 font-bold">Your progress at a glance</p>
                </div>
                <NeoLinkButton to="/applications/new" className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    New Application
                </NeoLinkButton>
            </div>

            <FollowUpCard />

            <MomentumCard />

            {isLoading ? (
                <DashboardSkeleton />
            ) : status.data && funnel.data ? (
                <DashboardNumbers counts={status.data} funnelData={funnel.data} />
            ) : (
                // Never show zeros for numbers we failed to load: they would read as real.
                <NeoAlert className="flex flex-wrap items-center justify-between gap-3">
                    <span>Couldn't load your numbers.</span>
                    <NeoButton variant="secondary" className="px-4 py-2 text-sm" onClick={retry}>
                        Try again
                    </NeoButton>
                </NeoAlert>
            )}
        </div>
    );
}
