import { cn } from "../../lib/utils";

interface FooterProps {
    className?: string;
}

export function Footer({ className }: FooterProps) {
    return (
        <footer className={cn("w-full py-8 border-2 rounded-lg border-black bg-white shadow-neo", className)}>
            <div className="container mx-auto px-6 flex flex-col justify-center items-center gap-6 text-center">
                <div className="max-w-xl">
                    <p className="text-xl font-black text-slate-800 tracking-tight">
                        "Every rejection is a redirection. Your offer is waiting."
                    </p>
                    <div className="h-3" aria-hidden />
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Keep pushing forward</p>
                </div>

                <p className="text-sm font-bold text-slate-500">© {new Date().getFullYear()} TRACKr.</p>
            </div>
        </footer>
    );
}
