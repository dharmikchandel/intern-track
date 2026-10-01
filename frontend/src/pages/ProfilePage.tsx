import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BadgeCheck, Mail } from "lucide-react";
import { NeoAlert } from "../components/ui/NeoAlert";
import { NeoButton } from "../components/ui/NeoButton";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoModal } from "../components/ui/NeoModal";
import { NeoNotice } from "../components/ui/NeoNotice";
import { NeoSkeleton } from "../components/ui/NeoSkeleton";
import { getFunnel } from "../api/analytics";
import { logoutEverywhere, requestPasswordReset, resendVerificationEmail } from "../api/auth";
import { listRecapShares } from "../api/recap";
import { useAuth } from "../features/auth/useAuth";
import { ExportCsvButton, ImportCsvButton } from "../features/applications/CsvTools";
import { ReminderToggle } from "../features/digest/ReminderToggle";
import { MomentumCard } from "../features/milestones/MomentumCard";
import { MILESTONE_TITLES } from "../features/milestones/milestoneMeta";
import { useMilestones } from "../features/milestones/useMilestones";
import { formatDay, localDay, plural } from "../features/recap/format";
import { getErrorMessage } from "../lib/utils";
import type { MilestoneId } from "../api/milestones";

// The moments worth remembering, in the order they usually happen.
const KEY_MOMENTS: MilestoneId[] = ["applications_1", "first_oa", "first_interview", "first_offer"];

function daysSince(day: string): number {
    const [y, m, d] = day.split("-").map(Number);
    const [ty, tm, td] = localDay().split("-").map(Number);
    return Math.max(1, Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86_400_000) + 1);
}

function StatTile({ value, label }: { value: string; label: string }) {
    return (
        <NeoCard className="p-4 text-center">
            <p className="text-4xl font-black leading-none">{value}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-2">{label}</p>
        </NeoCard>
    );
}

export function ProfilePage() {
    const { user, logout } = useAuth();
    const milestones = useMilestones();
    const funnel = useQuery({ queryKey: ["analytics", "funnel"], queryFn: getFunnel });
    const shares = useQuery({ queryKey: ["recap", "shares"], queryFn: listRecapShares });
    const [confirmSignOut, setConfirmSignOut] = useState(false);

    const resend = useMutation({ mutationFn: resendVerificationEmail });
    const resetLink = useMutation({ mutationFn: () => requestPasswordReset(user!.email) });
    const signOutEverywhere = useMutation({
        mutationFn: logoutEverywhere,
        // Every refresh token is revoked server-side; clearing local state sends
        // this tab to the login page too.
        onSuccess: () => logout(),
    });

    if (!user) return null;

    const first = milestones.data?.milestones.find((m) => m.id === "applications_1")?.achievedAt ?? null;
    const moments = (milestones.data?.milestones ?? [])
        .filter((m) => KEY_MOMENTS.includes(m.id) && m.achieved && m.achievedAt)
        .sort((a, b) => a.achievedAt!.localeCompare(b.achievedAt!));
    const activeLinks = shares.data?.length ?? 0;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-4xl font-black uppercase tracking-tighter">Profile</h1>
                <p className="text-slate-600 font-bold break-all">{user.email}</p>
            </div>

            {/* Journey */}
            <section aria-labelledby="journey-heading" className="mb-8">
                <h2 id="journey-heading" className="text-2xl font-black uppercase mb-4">Your journey</h2>
                {milestones.data && funnel.data ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatTile value={first ? String(daysSince(first)) : "0"} label="Days searching" />
                        <StatTile value={String(milestones.data.totalApplications)} label="Applications" />
                        <StatTile value={String(funnel.data.interviewCount)} label="Interviews" />
                        <StatTile value={String(funnel.data.offerCount)} label="Offers" />
                    </div>
                ) : (
                    <NeoSkeleton label="Loading your journey" className="h-28 mb-8" />
                )}

                <MomentumCard variant="full" />

                <NeoCard>
                    <h3 className="text-xl font-black uppercase mb-4">Key moments</h3>
                    {moments.length === 0 ? (
                        <p className="font-bold text-slate-600">Your first application, assessment, interview and offer will show up here as they happen.</p>
                    ) : (
                        <ol className="space-y-3">
                            {moments.map((m) => (
                                <li key={m.id} className="flex items-center gap-3">
                                    <span className="w-3 h-3 bg-neo-primary border-2 border-black shrink-0" aria-hidden />
                                    <span className="font-black">{MILESTONE_TITLES[m.id]}</span>
                                    <span className="font-bold text-slate-600">{formatDay(m.achievedAt!)}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </NeoCard>
            </section>

            {/* Settings */}
            <section aria-labelledby="settings-heading">
                <h2 id="settings-heading" className="text-2xl font-black uppercase mb-4">Settings</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <NeoCard>
                        <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2"><Mail className="w-5 h-5" aria-hidden /> Account</h3>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm font-bold uppercase text-slate-500">Email</dt>
                                <dd className="font-black break-all">{user.email}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-bold uppercase text-slate-500">Status</dt>
                                <dd className="flex flex-wrap items-center gap-3 mt-1">
                                    {user.emailVerified ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 border-2 border-black rounded-md bg-neo-mint text-sm font-bold">
                                            <BadgeCheck className="w-4 h-4" aria-hidden /> Verified
                                        </span>
                                    ) : (
                                        <>
                                            <span className="px-2 py-1 border-2 border-black rounded-md bg-neo-blue-tint text-sm font-bold">Not verified</span>
                                            <NeoButton variant="ghost" className="px-4 py-2 text-sm min-h-11" disabled={resend.isPending || resend.isSuccess} onClick={() => resend.mutate()}>
                                                {resend.isPending ? "Sending..." : resend.isSuccess ? "Sent" : "Resend verification email"}
                                            </NeoButton>
                                        </>
                                    )}
                                </dd>
                            </div>
                            {user.createdAt && (
                                <div>
                                    <dt className="text-sm font-bold uppercase text-slate-500">Member since</dt>
                                    <dd className="font-bold">{format(new Date(user.createdAt), "MMM d, yyyy")}</dd>
                                </div>
                            )}
                        </dl>
                        {resend.isSuccess && <NeoNotice className="mt-4">Verification email sent. Check your inbox.</NeoNotice>}
                        {resend.isError && <NeoAlert className="mt-4">{getErrorMessage(resend.error, "Couldn't send that. Try again in a bit.")}</NeoAlert>}
                    </NeoCard>

                    <NeoCard>
                        <h3 className="text-xl font-black uppercase mb-4">Notifications</h3>
                        <ReminderToggle />
                    </NeoCard>

                    <NeoCard>
                        <h3 className="text-xl font-black uppercase mb-4">Security</h3>
                        <div className="space-y-5">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-2">We'll email a link to {user.email} so you can choose a new password.</p>
                                <NeoButton variant="ghost" className="min-h-11" disabled={resetLink.isPending} onClick={() => resetLink.mutate()}>
                                    {resetLink.isPending ? "Sending..." : "Email me a reset link"}
                                </NeoButton>
                                {resetLink.isSuccess && <NeoNotice className="mt-3">If that email is registered, a reset link is on its way.</NeoNotice>}
                                {resetLink.isError && <NeoAlert className="mt-3">{getErrorMessage(resetLink.error, "Couldn't send the link. Try again.")}</NeoAlert>}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-2">Ends your session on every device, including this one.</p>
                                <NeoButton variant="ghost" className="min-h-11" onClick={() => setConfirmSignOut(true)}>
                                    Sign out everywhere
                                </NeoButton>
                            </div>
                        </div>
                    </NeoCard>

                    <NeoCard>
                        <h3 className="text-xl font-black uppercase mb-4">Your data</h3>
                        <p className="text-sm font-medium text-slate-600 mb-4">Export every application as a CSV, or bring in a spreadsheet you already keep.</p>
                        <div className="flex flex-wrap items-start gap-3">
                            <ExportCsvButton filters={{}} filtered={false} />
                            <ImportCsvButton />
                        </div>
                        <p className="text-sm font-medium text-slate-600 mt-5">
                            {activeLinks === 0 ? "You have no public recap links." : `You have ${plural(activeLinks, "public recap link")}.`}{" "}
                            <Link to="/recap" className="font-bold underline hover:bg-neo-primary">Manage sharing</Link>
                        </p>
                    </NeoCard>
                </div>
            </section>

            <NeoModal isOpen={confirmSignOut} onClose={() => setConfirmSignOut(false)} title="Sign out everywhere?">
                <p className="font-bold mb-6">You'll be signed out on all your devices, including this one, and will need to sign in again.</p>
                {signOutEverywhere.isError && (
                    <NeoAlert className="mb-6">{getErrorMessage(signOutEverywhere.error, "Couldn't sign you out everywhere. Try again.")}</NeoAlert>
                )}
                <div className="flex justify-end gap-4">
                    <NeoButton variant="ghost" onClick={() => setConfirmSignOut(false)}>Cancel</NeoButton>
                    <NeoButton variant="destructive" disabled={signOutEverywhere.isPending} onClick={() => signOutEverywhere.mutate()}>
                        {signOutEverywhere.isPending ? "Signing out..." : "Sign out everywhere"}
                    </NeoButton>
                </div>
            </NeoModal>
        </div>
    );
}
