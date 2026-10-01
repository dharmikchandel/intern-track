import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { NeoAlert } from "../../components/ui/NeoAlert";
import { NeoButton } from "../../components/ui/NeoButton";
import { NeoCard } from "../../components/ui/NeoCard";
import { NeoInput } from "../../components/ui/NeoInput";
import { NeoModal } from "../../components/ui/NeoModal";
import { IconTile } from "../../components/ui/IconTile";
import { deleteAccount } from "../../api/profile";
import { getErrorMessage } from "../../lib/utils";
import { plural } from "../recap/format";
import { useAuth } from "../auth/useAuth";

// Deleting the account removes everything with it, so it needs your email typed
// out and your password, and says exactly what will go.
export function DangerZone({ applicationCount }: { applicationCount?: number }) {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const remove = useMutation({
        mutationFn: () => deleteAccount(password, email.trim()),
        onSuccess: () => {
            // A full page load to the landing page: it clears every cached piece of
            // the deleted account's data and cannot be pre-empted by the route
            // guard sending a signed-out user to /login.
            logout();
            window.location.replace("/");
        },
    });

    if (!user) return null;
    const matches = email.trim().toLowerCase() === user.email.toLowerCase();
    const close = () => {
        remove.reset();
        setEmail("");
        setPassword("");
        setOpen(false);
    };

    return (
        <section aria-labelledby="danger-heading" className="mt-10">
            <h2 id="danger-heading" className="text-2xl font-black uppercase mb-4 text-neo-red-deep">Danger zone</h2>
            <NeoCard className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <IconTile icon={TriangleAlert} tone="bg-neo-destructive" />
                    <div>
                        <p className="font-black">Delete your account</p>
                        <p className="text-sm font-medium text-slate-600">Permanently removes your account and everything in it. This cannot be undone. Consider exporting your data first.</p>
                    </div>
                </div>
                <NeoButton variant="destructive" className="shrink-0 min-h-11" onClick={() => setOpen(true)}>Delete account...</NeoButton>
            </NeoCard>

            <NeoModal isOpen={open} onClose={close} title="Delete your account?">
                <p className="font-bold mb-2">This permanently deletes:</p>
                <ul className="list-disc pl-5 font-medium text-slate-700 mb-5 space-y-1">
                    <li>{applicationCount === undefined ? "all of your applications" : `your ${plural(applicationCount, "application")}`} and their activity</li>
                    <li>your recap share links (they stop working)</li>
                    <li>your account and every signed-in device</li>
                </ul>
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (matches && password) remove.mutate();
                    }}
                >
                    <NeoInput label={`Type ${user.email} to confirm`} value={email} autoComplete="off" onChange={(e) => setEmail(e.target.value)} />
                    <NeoInput label="Your password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    {remove.isError && <NeoAlert>{getErrorMessage(remove.error, "Couldn't delete your account. Check your password and try again.")}</NeoAlert>}
                    <div className="flex justify-end gap-4 pt-2">
                        <NeoButton type="button" variant="ghost" onClick={close}>Cancel</NeoButton>
                        <NeoButton type="submit" variant="destructive" disabled={!matches || !password || remove.isPending}>
                            {remove.isPending ? "Deleting..." : "Delete everything"}
                        </NeoButton>
                    </div>
                </form>
            </NeoModal>
        </section>
    );
}
