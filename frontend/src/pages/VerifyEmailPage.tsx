import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoLinkButton } from "../components/ui/NeoLinkButton";
import { DotGrid } from "../components/ui/DotGrid";
import { verifyEmail } from "../api/auth";
import { getErrorMessage } from "../lib/utils";

type Status = "verifying" | "success" | "error";

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
    const [error, setError] = useState<string | null>(null);
    // StrictMode double-invokes effects in dev — a one-time-use token would
    // otherwise get consumed by the first call and fail on the second.
    const hasRun = useRef(false);

    useEffect(() => {
        if (!token || hasRun.current) return;
        hasRun.current = true;

        verifyEmail(token)
            .then(() => setStatus("success"))
            .catch((err) => {
                setError(getErrorMessage(err, "This verification link is invalid or has expired."));
                setStatus("error");
            });
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-neo-bg p-4 relative overflow-hidden">
            <DotGrid />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black tracking-tighter text-neo-primary drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        TRACKr.
                    </h1>
                </div>

                <NeoCard className="text-center">
                    {status === "verifying" && (
                        <>
                            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-slate-700" />
                            <h2 className="text-xl font-black uppercase">Verifying your email...</h2>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-600" />
                            <h2 className="text-xl font-black uppercase mb-2">Email Verified</h2>
                            <p className="font-bold text-slate-600 mb-6">Your email is confirmed. You're all set.</p>
                            <NeoLinkButton to="/dashboard" className="w-full">Go to Dashboard</NeoLinkButton>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <XCircle className="w-12 h-12 mx-auto mb-4 text-neo-destructive" />
                            <h2 className="text-xl font-black uppercase mb-2">Verification Failed</h2>
                            <p className="font-bold text-slate-600 mb-6">
                                {error ?? "This verification link is missing its token."}
                            </p>
                            <NeoLinkButton to="/dashboard" variant="ghost" className="w-full">Go to Dashboard</NeoLinkButton>
                        </>
                    )}
                </NeoCard>
            </motion.div>
        </div>
    );
}
