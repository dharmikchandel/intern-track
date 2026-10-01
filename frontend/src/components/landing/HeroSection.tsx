import { motion } from "framer-motion";

import { NeoLinkButton } from "../ui/NeoLinkButton";

export function HeroSection() {
    return (
        <section className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-neo-bg relative overflow-hidden border-b-2 border-black">
            {/* Dot Grid Background */}
            <div className="absolute inset-0 z-0 opacity-30"
                style={{
                    backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                    backgroundSize: "24px 24px"
                }}
            >
                <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-neo-bg to-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                />
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 z-10 text-center flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <span className="inline-block py-1 px-3 rounded-full bg-neo-secondary/10 border-2 border-black text-sm font-black mb-6 shadow-neo-sm">
                        JOB APPLICATION TRACKER
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-none text-slate-900">
                        Master Your <br />
                        <span className="text-neo-primary relative inline-block">
                            Job Hunt
                            <svg className="absolute w-full h-3 -bottom-1 left-0 text-black opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                            </svg>
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-600 font-bold max-w-2xl mx-auto mb-10 leading-relaxed">
                        Know where every application stands, who to follow up with, and how your search is going.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <NeoLinkButton to="/register" className="text-lg px-8 py-4 h-auto">
                            Start Tracking Free
                        </NeoLinkButton>
                        <NeoLinkButton to="/login" variant="ghost" className="text-lg px-8 py-4 h-auto">
                            Sign In
                        </NeoLinkButton>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
