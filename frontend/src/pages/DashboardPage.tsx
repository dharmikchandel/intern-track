import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoButton } from "../components/ui/NeoButton";
import { getStatusCounts, getFunnel } from "../api/analytics";
import { Plus, Briefcase, FileCheck, Award, XCircle, TrendingUp } from "lucide-react";

export function DashboardPage() {
    const { data: statusCounts, isLoading: isLoadingStatus } = useQuery({
        queryKey: ["analytics", "status"],
        queryFn: getStatusCounts,
    });

    const { data: funnel, isLoading: isLoadingFunnel } = useQuery({
        queryKey: ["analytics", "funnel"],
        queryFn: getFunnel,
    });

    const isLoading = isLoadingStatus || isLoadingFunnel;

    if (isLoading) {
        return <div className="p-10 text-center font-bold animate-pulse">Loading Analytics...</div>;
    }

    // Handle case where data might be undefined if error occurs
    const counts = statusCounts || { APPLIED: 0, OA: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0 };
    const funnelData = funnel || { totalApplied: 0, interviewCount: 0, offerCount: 0, interviewRate: 0, offerRate: 0 };

    const stats = [
        { label: "Applied", value: counts.APPLIED, icon: Briefcase, color: "bg-sky-100 text-sky-900" },
        { label: "Online Assessment", value: counts.OA, icon: FileCheck, color: "bg-amber-100 text-amber-900" },
        { label: "Interview", value: counts.INTERVIEW, icon: TrendingUp, color: "bg-indigo-100 text-indigo-900" },
        { label: "Offer", value: counts.OFFER, icon: Award, color: "bg-emerald-100 text-emerald-900" },
        { label: "Rejected", value: counts.REJECTED, icon: XCircle, color: "bg-rose-100 text-rose-900" },
    ];

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
                        Dashboard
                    </h1>
                    <p className="text-slate-600 font-bold">Your progress at a glance</p>
                </div>
                <Link to="/applications/new">
                    <NeoButton className="flex items-center gap-2 bg-neo-primary text-black hover:bg-neo-primary/90">
                        <Plus className="w-5 h-5" />
                        Track New Job
                    </NeoButton>
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <NeoCard key={stat.label} className={`p-4 flex flex-col items-center justify-center text-center ${stat.color} hover:translate-y-[-4px] transition-transform`}>
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
                                    className="h-full bg-indigo-500 transition-all duration-1000 border-r-2 border-black"
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
                                    className="h-full bg-neo-primary transition-all duration-1000 border-r-2 border-black"
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
        </div>
    );
}
