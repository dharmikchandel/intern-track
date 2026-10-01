import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoButton } from "../components/ui/NeoButton";
import { unsubscribeFromDigest } from "../api/digest";
import { getErrorMessage } from "../lib/utils";

type Status = "idle" | "working" | "done" | "error";

// Requires a click instead of unsubscribing on page load, so link scanners
// and prefetchers that open every URL in an email can't unsubscribe someone.
export function UnsubscribePage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<Status>(token ? "idle" : "error");
    const [error, setError] = useState<string | null>(token ? null : "This unsubscribe link is invalid.");

    async function confirm() {
        if (!token) return;
        setStatus("working");
        try {
            await unsubscribeFromDigest(token);
            setStatus("done");
        } catch (err) {
            setError(getErrorMessage(err, "This unsubscribe link is invalid."));
            setStatus("error");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-neo-bg p-4 relative overflow-hidden">
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="text-4xl font-black tracking-tighter text-neo-primary drop-shadow-neo-sm">
                        TRACKr.
                    </div>
                </div>
                <NeoCard className="text-center space-y-4" aria-live="polite">
                    {status === "done" ? (
                        <>
                            <h1 className="text-2xl font-black">You're unsubscribed</h1>
                            <p className="font-medium">You won't get follow-up reminder emails anymore. You can turn them back on in your <Link to="/profile" className="ui-link">profile</Link>.</p>
                        </>
                    ) : status === "error" ? (
                        <>
                            <h1 className="text-2xl font-black">Link not valid</h1>
                            <p className="font-medium">{error}</p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-2xl font-black">Stop follow-up reminders?</h1>
                            <p className="font-medium">You'll no longer get the weekly email listing applications that need a follow-up.</p>
                            <NeoButton onClick={confirm} disabled={status === "working"} className="w-full">
                                {status === "working" ? "Unsubscribing..." : "Unsubscribe"}
                            </NeoButton>
                        </>
                    )}
                    <Link to="/" className="block font-bold ui-link">
                        Back to TRACKr
                    </Link>
                </NeoCard>
            </div>
        </div>
    );
}
