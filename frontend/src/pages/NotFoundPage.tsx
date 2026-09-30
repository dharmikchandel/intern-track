import { LandingLayout } from "../components/layout/LandingLayout";
import { NeoCard } from "../components/ui/NeoCard";
import { NeoLinkButton } from "../components/ui/NeoLinkButton";

export function NotFoundPage() {
    return (
        <LandingLayout>
            <div className="flex-1 flex items-center justify-center p-4">
                <NeoCard className="max-w-md w-full text-center">
                    <p className="text-7xl font-black leading-none mb-2">404</p>
                    <h1 className="text-2xl font-black uppercase mb-2">Page not found</h1>
                    <p className="font-bold text-slate-600 mb-6">That link doesn't lead anywhere. It may have moved, or the address has a typo.</p>
                    <NeoLinkButton to="/">Back to TRACKr</NeoLinkButton>
                </NeoCard>
            </div>
        </LandingLayout>
    );
}
