import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NeoAlert } from "../../components/ui/NeoAlert";
import { getDigestPreferences, setDigestPreferences } from "../../api/digest";
import { getErrorMessage } from "../../lib/utils";

// The weekly follow-up email on/off switch (lives on the profile page).
export function ReminderToggle() {
    const queryClient = useQueryClient();
    const { data: prefs, isLoading, isError } = useQuery({ queryKey: ["digest-preferences"], queryFn: getDigestPreferences });

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

    if (isLoading) return <p className="font-bold text-sm text-slate-600">Loading your setting...</p>;
    if (isError || !prefs) return <NeoAlert>Couldn't load your reminder setting.</NeoAlert>;

    return (
        <div>
            <label className="flex items-center gap-3 font-bold cursor-pointer select-none min-h-11">
                <input
                    type="checkbox"
                    className="w-5 h-5 accent-black"
                    checked={prefs.emailDigestEnabled}
                    onChange={(e) => toggle.mutate(e.target.checked)}
                />
                Weekly email reminders
            </label>
            <p className="text-sm font-medium text-slate-600">A weekly email listing the applications that need a follow-up. Every email has a one-click unsubscribe.</p>
            {toggle.isError && (
                <NeoAlert className="mt-3">{getErrorMessage(toggle.error, "Couldn't update your reminder setting. It is back to what it was.")}</NeoAlert>
            )}
        </div>
    );
}
