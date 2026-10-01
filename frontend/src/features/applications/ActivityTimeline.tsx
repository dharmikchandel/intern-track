import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { NeoCard } from "../../components/ui/NeoCard";
import { NeoAlert } from "../../components/ui/NeoAlert";
import { NeoSkeleton } from "../../components/ui/NeoSkeleton";
import { getApplicationActivity, type ActivityItem } from "../../api/applications";
import { STATUS_LABELS } from "./statusMeta";

const statusLabel = (value?: string | null) =>
    value && value in STATUS_LABELS ? STATUS_LABELS[value as keyof typeof STATUS_LABELS] : (value ?? "unknown");

const day = (value?: string | null) => (value ? format(new Date(value), "MMM d, yyyy") : "");

// The server stores structured facts, not sentences; the wording lives here so
// it can change without touching stored history.
function describeActivity(item: ActivityItem): string {
    const m = item.metadata;
    switch (item.type) {
        case "APPLICATION_CREATED":
            return m?.source === "import" ? "Imported from CSV" : "Application added";
        case "STATUS_CHANGED":
            return `Status changed from ${statusLabel(m?.from)} to ${statusLabel(m?.to)}`;
        case "NOTES_CHANGED":
            return "Notes updated";
        case "FOLLOW_UP_CHANGED":
            if (!m?.to) return "Follow-up date cleared";
            if (!m.from) return `Follow-up set for ${day(m.to)}`;
            return `Follow-up moved from ${day(m.from)} to ${day(m.to)}`;
        case "FOLLOW_UP_REMINDER_SENT":
            return "Follow-up reminder emailed";
    }
}

export function ActivityTimeline({ applicationId }: { applicationId: string }) {
    const { data, isLoading, isError, refetch } = useQuery({
        // Nested under ["application", id] so the invalidation the edit and
        // board-move mutations already do refreshes this feed too.
        queryKey: ["application", applicationId, "activity"],
        queryFn: () => getApplicationActivity(applicationId),
    });

    return (
        <NeoCard className="mb-6">
            <h2 className="text-xl font-black uppercase border-b-2 border-black pb-3 mb-4">Activity</h2>
            {isLoading ? (
                <NeoSkeleton label="Loading activity" className="h-24 shadow-none" />
            ) : isError ? (
                <NeoAlert onRetry={() => refetch()}>Couldn't load activity.</NeoAlert>
            ) : !data || data.length === 0 ? (
                <p className="font-bold text-slate-600">No activity yet.</p>
            ) : (
                <ol className="relative ml-2 border-l-2 border-black">
                    {data.map((item) => (
                        <li key={item.id} className="ml-5 pb-4 last:pb-0 relative">
                            <span className="absolute -left-[27px] top-1.5 w-3 h-3 bg-neo-primary border-2 border-black" aria-hidden />
                            <p className="font-bold leading-snug">{describeActivity(item)}</p>
                            <time className="text-xs font-bold text-slate-500" dateTime={item.createdAt}>
                                {format(new Date(item.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </time>
                        </li>
                    ))}
                </ol>
            )}
        </NeoCard>
    );
}
