import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { NeoAlert } from "../../components/ui/NeoAlert";
import { NeoButton } from "../../components/ui/NeoButton";
import { NeoCard } from "../../components/ui/NeoCard";
import { NeoInput } from "../../components/ui/NeoInput";
import { NeoModal } from "../../components/ui/NeoModal";
import { NeoNotice } from "../../components/ui/NeoNotice";
import { IconTile } from "../../components/ui/IconTile";
import { changePassword } from "../../api/profile";
import { logoutEverywhere, requestPasswordReset } from "../../api/auth";
import { changePasswordSchema, type ChangePasswordFormData } from "../../lib/schemas";
import { getErrorMessage } from "../../lib/utils";
import { useAuth } from "../auth/useAuth";

// Two quiet rows instead of a form that is always open: the password form
// lives in a dialog that opens on demand.
export function SecurityCard() {
    const { user, login, logout } = useAuth();
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [signOutOpen, setSignOutOpen] = useState(false);
    const [justChanged, setJustChanged] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordFormData>({ resolver: zodResolver(changePasswordSchema) });

    const change = useMutation({
        mutationFn: (data: ChangePasswordFormData) => changePassword(data.currentPassword, data.newPassword),
        // The server ended every other session and gave this device a fresh one.
        onSuccess: ({ accessToken }) => {
            if (user) login(accessToken, user);
            closePassword();
            setJustChanged(true);
        },
    });
    const resetLink = useMutation({ mutationFn: () => requestPasswordReset(user!.email) });
    const signOutEverywhere = useMutation({ mutationFn: logoutEverywhere, onSuccess: () => logout() });

    if (!user) return null;

    function closePassword() {
        setPasswordOpen(false);
        change.reset();
        resetLink.reset();
        reset();
    }

    return (
        <NeoCard>
            <h3 className="text-xl font-black uppercase mb-2 flex items-center gap-3"><IconTile icon={ShieldCheck} tone="bg-neo-green" /> Security</h3>

            <ul className="divide-y-2 divide-black">
                <li className="py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-black">Password</p>
                        <p className="text-sm font-medium text-slate-600">Choose a new one. Your other devices are signed out.</p>
                    </div>
                    <NeoButton variant="ghost" className="min-h-11 shrink-0" onClick={() => { setJustChanged(false); setPasswordOpen(true); }}>Change password</NeoButton>
                </li>
                <li className="pt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-black">Devices</p>
                        <p className="text-sm font-medium text-slate-600">End your session on every device, including this one.</p>
                    </div>
                    <NeoButton variant="ghost" className="min-h-11 shrink-0" onClick={() => setSignOutOpen(true)}>Sign out everywhere</NeoButton>
                </li>
            </ul>
            {justChanged && <NeoNotice className="mt-4">Password updated. Your other devices were signed out.</NeoNotice>}

            <NeoModal isOpen={passwordOpen} onClose={closePassword} title="Change password">
                <form className="space-y-4" onSubmit={handleSubmit((data) => change.mutate(data))} noValidate>
                    <NeoInput label="Current password" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
                    <NeoInput label="New password" type="password" autoComplete="new-password" hint="At least 8 characters." error={errors.newPassword?.message} {...register("newPassword")} />
                    <NeoInput label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
                    {change.isError && <NeoAlert>{getErrorMessage(change.error, "Couldn't update your password. Try again.")}</NeoAlert>}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <button
                            type="button"
                            className="inline-flex items-center min-h-11 text-sm font-bold underline hover:bg-neo-primary disabled:opacity-50 disabled:no-underline"
                            disabled={resetLink.isPending || resetLink.isSuccess}
                            onClick={() => resetLink.mutate()}
                        >
                            {resetLink.isPending ? "Sending..." : resetLink.isSuccess ? "Link sent" : "Forgot it? Email me a reset link"}
                        </button>
                        <div className="flex gap-3">
                            <NeoButton type="button" variant="ghost" onClick={closePassword}>Cancel</NeoButton>
                            <NeoButton type="submit" disabled={change.isPending}>{change.isPending ? "Updating..." : "Update password"}</NeoButton>
                        </div>
                    </div>
                    {resetLink.isSuccess && <NeoNotice>If that email is registered, a reset link is on its way.</NeoNotice>}
                    {resetLink.isError && <NeoAlert>{getErrorMessage(resetLink.error, "Couldn't send the link. Try again.")}</NeoAlert>}
                </form>
            </NeoModal>

            <NeoModal isOpen={signOutOpen} onClose={() => setSignOutOpen(false)} title="Sign out everywhere?">
                <p className="font-bold mb-6">You'll be signed out on all your devices, including this one, and will need to sign in again.</p>
                {signOutEverywhere.isError && <NeoAlert className="mb-6">{getErrorMessage(signOutEverywhere.error, "Couldn't sign you out everywhere. Try again.")}</NeoAlert>}
                <div className="flex justify-end gap-4">
                    <NeoButton variant="ghost" onClick={() => setSignOutOpen(false)}>Cancel</NeoButton>
                    <NeoButton variant="destructive" disabled={signOutEverywhere.isPending} onClick={() => signOutEverywhere.mutate()}>
                        {signOutEverywhere.isPending ? "Signing out..." : "Sign out everywhere"}
                    </NeoButton>
                </div>
            </NeoModal>
        </NeoCard>
    );
}
