import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { NeoAlert } from "../../components/ui/NeoAlert";
import { NeoButton } from "../../components/ui/NeoButton";
import { NeoCard } from "../../components/ui/NeoCard";
import { NeoInput } from "../../components/ui/NeoInput";
import { NeoNotice } from "../../components/ui/NeoNotice";
import { NeoSelect } from "../../components/ui/NeoSelect";
import { IconTile } from "../../components/ui/IconTile";
import { updateProfile } from "../../api/profile";
import { resendVerificationEmail } from "../../api/auth";
import { browserTimeZone, timeZoneOptions } from "../../lib/dates";
import { getErrorMessage } from "../../lib/utils";
import { useAuth } from "../auth/useAuth";

// Name and timezone. The timezone decides which calendar day "today" is, so
// follow-ups become due (and the weekly email goes out) on your own day.
export function AccountCard() {
    const { user, updateUser } = useAuth();
    const savedName = user?.displayName ?? "";
    const savedZone = user?.timezone ?? browserTimeZone();
    const [name, setName] = useState(savedName);
    const [zone, setZone] = useState(savedZone);
    const detected = browserTimeZone();

    const save = useMutation({
        mutationFn: () => updateProfile({ displayName: name.trim() === "" ? null : name.trim(), timezone: zone }),
        onSuccess: (fresh) => updateUser(fresh),
    });
    const resend = useMutation({ mutationFn: resendVerificationEmail });

    if (!user) return null;
    const dirty = name.trim() !== savedName || zone !== savedZone;
    const zones = timeZoneOptions();

    return (
        <NeoCard>
            <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-3"><IconTile icon={UserRound} /> Account</h3>
            <form
                className="space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    save.mutate();
                }}
            >
                <NeoInput label="Display name (optional)" hint="Shown instead of your email address." value={name} maxLength={50} onChange={(e) => setName(e.target.value)} />
                <div>
                    <NeoSelect label="Timezone" value={zone} onChange={(e) => setZone(e.target.value)}>
                        {!zones.includes(zone) && <option value={zone}>{zone}</option>}
                        {zones.map((z) => (
                            <option key={z} value={z}>{z.replace(/_/g, " ")}</option>
                        ))}
                    </NeoSelect>
                    <p className="text-xs font-bold text-slate-600 mt-1">Decides what "today" means for follow-up dates and your weekly email.</p>
                    {zone !== detected && (
                        <button type="button" className="mt-1 inline-flex items-center min-h-11 text-sm font-bold ui-link" onClick={() => setZone(detected)}>
                            Use this browser's zone ({detected.replace(/_/g, " ")})
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <NeoButton type="submit" className="min-h-11" disabled={!dirty || save.isPending}>
                        {save.isPending ? "Saving..." : "Save changes"}
                    </NeoButton>
                    {save.isSuccess && !dirty && <span role="status" className="font-bold text-neo-green-deep">Saved.</span>}
                </div>
                {save.isError && <NeoAlert>{getErrorMessage(save.error, "Couldn't save your changes. Try again.")}</NeoAlert>}
            </form>

            {!user.emailVerified && (
                <div className="mt-6 pt-5 border-t-2 border-black">
                    <p className="font-bold mb-2">Your email isn't verified yet.</p>
                    <NeoButton variant="ghost" className="px-4 py-2 text-sm min-h-11" disabled={resend.isPending || resend.isSuccess} onClick={() => resend.mutate()}>
                        {resend.isPending ? "Sending..." : resend.isSuccess ? "Sent" : "Resend verification email"}
                    </NeoButton>
                    {resend.isSuccess && <NeoNotice className="mt-3">Verification email sent. Check your inbox.</NeoNotice>}
                    {resend.isError && <NeoAlert className="mt-3">{getErrorMessage(resend.error, "Couldn't send that. Try again in a bit.")}</NeoAlert>}
                </div>
            )}
        </NeoCard>
    );
}
