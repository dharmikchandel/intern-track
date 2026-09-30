import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { NeoLinkButton } from "../components/ui/NeoLinkButton";
import { DotGrid } from "../components/ui/DotGrid";
import { getPublicRecap } from "../api/recap";
import { RecapCard } from "../features/recap/RecapCard";

// Public, read-only page behind a share link. No login, and it only ever
// receives aggregate numbers from the API.
export function PublicRecapPage() {
    const { slug = "" } = useParams<{ slug: string }>();
    const { data, isLoading, isError } = useQuery({
        queryKey: ["public-recap", slug],
        queryFn: () => getPublicRecap(slug),
        retry: false,
    });

    return (
        <div className="min-h-screen bg-neo-bg relative overflow-hidden flex items-center justify-center p-4">
            <DotGrid />
            <div className="relative z-10 w-full max-w-xl py-8">
                {isLoading ? (
                    <p className="text-center font-black animate-pulse">Loading recap...</p>
                ) : isError || !data ? (
                    <div className="bg-white border-4 border-black rounded-xl shadow-neo p-8 text-center">
                        <h1 className="text-2xl font-black mb-2">This recap isn't available</h1>
                        <p className="font-medium mb-6">The link may be wrong, or the owner has turned sharing off.</p>
                        <NeoLinkButton to="/">Go to TRACKr</NeoLinkButton>
                    </div>
                ) : (
                    <>
                        <RecapCard stats={data.stats} periodStart={data.periodStart} periodEnd={data.periodEnd} />
                        <div className="text-center mt-8">
                            <p className="font-black mb-3">Tracking your own job search?</p>
                            <NeoLinkButton to="/register">Start with TRACKr</NeoLinkButton>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
