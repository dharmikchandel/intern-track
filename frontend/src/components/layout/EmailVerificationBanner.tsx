import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MailWarning } from "lucide-react";
import { resendVerificationEmail } from "../../api/auth";
import { getErrorMessage } from "../../lib/utils";

export function EmailVerificationBanner() {
    const [dismissed, setDismissed] = useState(false);
    const mutation = useMutation({ mutationFn: resendVerificationEmail });

    if (dismissed) return null;

    return (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-black bg-yellow-100 p-4 font-bold text-slate-800 shadow-neo rounded-md">
            <div className="flex items-center gap-2">
                <MailWarning className="w-5 h-5 shrink-0" aria-hidden />
                {/* Live region: the result of "Resend" is announced, not just shown. */}
                <span role="status">
                    {mutation.isSuccess
                        ? "Verification email sent — check your inbox."
                        : mutation.isError
                            ? getErrorMessage(mutation.error, "Couldn't send that — try again in a bit.")
                            : "Please verify your email address."}
                </span>
            </div>
            <div className="flex items-center gap-4 shrink-0">
                <button
                    type="button"
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending || mutation.isSuccess}
                    className="text-sm underline px-1 hover:bg-neo-primary hover:text-black disabled:opacity-50 disabled:no-underline"
                >
                    {mutation.isPending ? "Sending..." : mutation.isSuccess ? "Sent" : "Resend email"}
                </button>
                <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    className="text-sm underline px-1 hover:bg-neo-destructive hover:text-white"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
}
