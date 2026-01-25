import { Link } from "react-router-dom";

export function Footer() {
    return (
        <footer className="w-full py-8 mt-8 border-2 rounded-lg border-black bg-white shadow-neo">
            <div className="container mx-auto px-6 flex flex-col justify-center items-center gap-6 text-center">
                <div className="max-w-xl">
                    <p className="text-xl font-black text-slate-800 italic tracking-tight">
                        "Every rejection is a redirection. Your offer is waiting."
                    </p>
                    <div className="w-16 h-1 bg-neo-primary mx-auto my-3 rounded-full"></div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Keep pushing forward</p>
                </div>

                <div className="flex items-center gap-6 text-sm font-bold text-slate-500 mt-2">
                    <Link to="/about" className="hover:text-neo-primary hover:underline underline-offset-4 transition-all">About</Link>
                    <Link to="/privacy" className="hover:text-neo-primary hover:underline underline-offset-4 transition-all">Privacy</Link>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400">© 2024 TRACKr.</span>
                </div>
            </div>
        </footer>
    );
}
