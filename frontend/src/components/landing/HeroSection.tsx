import { motion } from "framer-motion";

import { NeoLinkButton } from "../ui/NeoLinkButton";
import { ProductPreview } from "./ProductPreview";

export function HeroSection() {
    return (
        <section className="bg-neo-bg relative overflow-hidden border-b-2 border-black">
            <div className="container mx-auto px-4 py-16 lg:py-24 grid lg:grid-cols-2 gap-14 items-center">
                <motion.div
                    className="text-center lg:text-left"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <span className="inline-block py-1 px-3 rounded-full bg-neo-blue-tint border-2 border-black text-sm font-black mb-6 shadow-neo-sm">
                        JOB APPLICATION TRACKER
                    </span>
                    <h1 className="text-5xl md:text-6xl xl:text-7xl font-black mb-6 tracking-tight leading-none text-slate-900">
                        Master Your <br />
                        <span className="text-neo-primary relative inline-block">
                            Job Hunt
                            <svg className="absolute w-full h-3 -bottom-1 left-0 text-black opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                            </svg>
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-600 font-bold max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                        Know where every application stands, who to follow up with, and how your search is going.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                        <NeoLinkButton to="/register" className="text-lg px-8 py-4 h-auto">
                            Start Tracking Free
                        </NeoLinkButton>
                        <NeoLinkButton to="/login" variant="ghost" className="text-lg px-8 py-4 h-auto">
                            Sign In
                        </NeoLinkButton>
                    </div>
                </motion.div>

                {/* The real product, on an offset colour block. */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
                >
                    <div className="relative pr-4 pb-4 lg:pr-6 lg:pb-6">
                        <div aria-hidden="true" className="absolute top-4 left-4 right-0 bottom-0 lg:top-6 lg:left-6 bg-neo-primary border-2 border-black rounded-lg" />
                        <ProductPreview className="relative" />
                    </div>
                    <p className="mt-3 text-xs font-bold text-slate-600">Sample data</p>
                </motion.div>
            </div>
        </section>
    );
}
