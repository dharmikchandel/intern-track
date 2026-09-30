import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { NeoAlert } from "../../components/ui/NeoAlert";
import { NeoCard } from "../../components/ui/NeoCard";
import { listApplications } from "../../api/applications";
import { getDigestPreferences, setDigestPreferences } from "../../api/digest";
import { getErrorMessage } from "../../lib/utils";

// Overdue count comes from the existing list endpoint (limit 1, we only want
// meta.total), so there is no dedicated endpoint to keep in sync with the
// "needs follow-up" rule.
export function FollowUpCard() {
    const queryClient = useQueryClient();

    const { data: overdue } = useQuery({
        queryKey: ["applications", "follow-up-count"],
        queryFn: () => listApplications({ needsFollowUp: true, limit: 1 }),
        select: (res) => res.meta.total,
    });

    const { data: prefs } = useQuery({ queryKey: ["digest-preferences"], queryFn: getDigestPreferences });

    // Optimistic: the checkbox flips immediately and rolls back if the save fails.
    const toggle = useMutation({
        mutationFn: setDigestPreferences,
        onMutate: async (emailDigestEnabled) => {
            await queryClient.cancelQueries({ queryKey: ["digest-preferences"] });
            const previous = queryClient.getQueryData(["digest-preferences"]);
            queryClient.setQueryData(["digest-preferences"], { emailDigestEnabled });
            return { previous };
        },
        onError: (_err, _value, context) => queryClient.setQueryData(["digest-preferences"], context?.previous),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["digest-preferences"] }),
    });

    if (overdue === undefined) return null;

    return (
        <NeoCard className={`mb-8 flex flex-col md:flex-row md:flex-wrap md:items-center justify-between gap-4 ${overdue > 0 ? "bg-red-50" : "bg-white"}`}>
            <div className="flex items-center gap-4">
                <BellRing className={`w-8 h-8 ${overdue > 0 ? "text-neo-destructive" : "text-slate-500"}`} />
                <div>
                    <p className="text-xl font-black">
                        {overdue === 0 ? "No follow-ups due" : `${overdue} ${overdue === 1 ? "application needs" : "applications need"} a follow-up`}
                    </p>
                    {overdue > 0 && (
                        <Link to="/applications?followUp=1" className="font-bold underline">
                            Review them
                        </Link>
                    )}
                </div>
            </div>

            {prefs && (
                <label className="flex items-center gap-2 font-bold text-sm cursor-pointer select-none">
                    <input
                        type="checkbox"
                        className="w-5 h-5 accent-black"
                        checked={prefs.emailDigestEnabled}
                        onChange={(e) => toggle.mutate(e.target.checked)}
                    />
                    Weekly email reminders
                </label>
            )}

            {toggle.isError && (
                <NeoAlert className="md:basis-full">
                    {getErrorMessage(toggle.error, "Couldn't update your reminder setting. It is back to what it was.")}
                </NeoAlert>
            )}
        </NeoCard>
    );
}
