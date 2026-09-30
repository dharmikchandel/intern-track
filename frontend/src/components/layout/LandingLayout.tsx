import type { ReactNode } from "react";
import { NeoLinkButton } from "../ui/NeoLinkButton";
import { DotGrid } from "../ui/DotGrid";
import { Footer } from "./Footer";

interface LandingLayoutProps {
    children: ReactNode;
}

export function LandingLayout({ children }: LandingLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col bg-neo-bg font-sans text-slate-900 overflow-x-hidden relative">
            <DotGrid />
            {/* Header */}
            <header className="bg-white border-b-2 border-black h-20 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="text-2xl md:text-3xl font-black tracking-tighter text-black flex items-center gap-2">
                        TRACKr. <span className="text-neo-primary text-xs bg-black text-white px-2 py-0.5 rounded-full">BETA</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <NeoLinkButton to="/login" variant="secondary" className="hidden md:inline-flex">
                        Login
                    </NeoLinkButton>
                    <NeoLinkButton to="/register" variant="primary">
                        Get Started
                    </NeoLinkButton>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative z-10">
                {children}
            </main>

            <Footer className="relative z-10" />
        </div>
    );
}
