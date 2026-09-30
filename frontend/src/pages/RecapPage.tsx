import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Link2, Trash2 } from "lucide-react";
import { NeoAlert } from "../components/ui/NeoAlert";
import { NeoButton } from "../components/ui/NeoButton";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoInput } from "../components/ui/NeoInput";
import { cn, getErrorMessage } from "../lib/utils";
import { createRecapShare, getRecapPreview, listRecapShares, revokeRecapShare } from "../api/recap";
import { RecapCard } from "../features/recap/RecapCard";
import { formatPeriod, localDay } from "../features/recap/format";

const PRESETS = [
    { key: "30d", label: "Last 30 days", range: () => [localDay(-29), localDay()] as const },
    { key: "90d", label: "Last 90 days", range: () => [localDay(-89), localDay()] as const },
    { key: "year", label: "This year", range: () => [`${new Date().getFullYear()}-01-01`, localDay()] as const },
    { key: "12m", label: "Last 12 months", range: () => [localDay(-364), localDay()] as const },
];

const shareUrl = (slug: string) => `${window.location.origin}/r/${slug}`;

export function RecapPage() {
    const queryClient = useQueryClient();
    const [start, setStart] = useState(() => localDay(-89));
    const [end, setEnd] = useState(() => localDay());
    const [copied, setCopied] = useState<string | null>(null);

    const validRange = start !== "" && end !== "" && start <= end;

    const preview = useQuery({
        queryKey: ["recap", "preview", start, end],
        queryFn: () => getRecapPreview(start, end),
        enabled: validRange,
        placeholderData: keepPreviousData,
    });

    const shares = useQuery({ queryKey: ["recap", "shares"], queryFn: listRecapShares });

    const create = useMutation({
        mutationFn: () => createRecapShare(start, end),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recap", "shares"] }),
    });

    const revoke = useMutation({
        mutationFn: revokeRecapShare,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recap", "shares"] }),
    });

    async function copy(slug: string) {
        try {
            await navigator.clipboard.writeText(shareUrl(slug));
            setCopied(slug);
            setTimeout(() => setCopied((c) => (c === slug ? null : c)), 2000);
        } catch {
            // Clipboard can be blocked (insecure context, permissions); the link is shown in full to copy by hand.
            setCopied(null);
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-4xl font-black uppercase tracking-tighter">Recap</h1>
                <p className="text-slate-600 font-bold">Turn your job search into something you can share</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <NeoCard className="lg:col-start-1">
                    <h2 className="text-xl font-black uppercase mb-3">Period</h2>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {PRESETS.map((p) => {
                            const [s, e] = p.range();
                            const active = s === start && e === end;
                            return (
                                <button
                                    key={p.key}
                                    aria-pressed={active}
                                    onClick={() => {
                                        setStart(s);
                                        setEnd(e);
                                    }}
                                    className={cn(
                                        "px-3 py-2 border-2 border-black font-bold text-sm rounded-md",
                                        active ? "bg-neo-primary" : "bg-white hover:bg-slate-100"
                                    )}
                                >
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NeoInput label="From" type="date" value={start} max={end || undefined} onChange={(e) => setStart(e.target.value)} />
                        <NeoInput label="To" type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} />
                    </div>
                    {!validRange && <p className="mt-3 font-bold text-neo-destructive">Choose a start date on or before the end date.</p>}
                </NeoCard>

                <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
                    {preview.isLoading && validRange ? (
                        <p className="font-black animate-pulse">Building your recap...</p>
                    ) : preview.isError ? (
                        <p className="font-bold text-neo-destructive">Couldn't build the recap.</p>
                    ) : preview.data && validRange ? (
                        <RecapCard stats={preview.data.stats} periodStart={start} periodEnd={end} />
                    ) : null}
                </div>

                <NeoCard className="lg:col-start-1">
                    <h2 className="text-xl font-black uppercase mb-2 flex items-center gap-2">
                        <Link2 className="w-5 h-5" /> Share this recap
                    </h2>
                    <p className="text-sm font-medium mb-4">
                        Anyone with the link sees only the numbers on the card: no company names, roles, links or notes. The numbers are saved
                        when you create the link, so later changes don't alter what's been shared. You can turn a link off at any time.
                    </p>
                    <NeoButton
                        onClick={() => create.mutate()}
                        disabled={!validRange || !preview.data?.canShare || create.isPending}
                    >
                        {create.isPending ? "Creating..." : "Create share link"}
                    </NeoButton>
                    {preview.data && !preview.data.canShare && (
                        <p className="mt-3 text-sm font-bold">
                            Add at least {preview.data.minApplications} applications in this period to share a recap.
                        </p>
                    )}
                    {create.isError && <p role="alert" className="mt-3 font-bold text-neo-destructive">{getErrorMessage(create.error, "Couldn't create the link.")}</p>}

                    {revoke.isError && (
                        <NeoAlert className="mt-6">{getErrorMessage(revoke.error, "Couldn't turn that link off. It is still active; please try again.")}</NeoAlert>
                    )}

                    {shares.data && shares.data.length > 0 && (
                        <ul className="mt-6 space-y-3">
                            {shares.data.map((s) => (
                                <li key={s.id} className="border-2 border-black p-3 bg-slate-50">
                                    <p className="font-black text-sm">{formatPeriod(s.periodStart.slice(0, 10), s.periodEnd.slice(0, 10))}</p>
                                    <p className="text-xs font-mono break-all my-1">{shareUrl(s.slug)}</p>
                                    <div className="flex gap-2 mt-2">
                                        <NeoButton variant="secondary" className="px-3 py-1 text-sm h-auto flex items-center gap-1" onClick={() => copy(s.slug)}>
                                            {copied === s.slug ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            {copied === s.slug ? "Copied" : "Copy link"}
                                        </NeoButton>
                                        <NeoButton
                                            variant="destructive"
                                            className="px-3 py-1 text-sm h-auto flex items-center gap-1"
                                            disabled={revoke.isPending}
                                            onClick={() => revoke.mutate(s.id)}
                                        >
                                            <Trash2 className="w-4 h-4" /> Turn off
                                        </NeoButton>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </NeoCard>
            </div>
        </div>
    );
}
