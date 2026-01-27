import { motion } from "framer-motion";
import { UserPlus, PlusCircle, CheckCircle } from "lucide-react";

export function HowItWorksSection() {
    return (
        <section className="py-24 bg-neo-bg border-b-2 border-black overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <span className="inline-block py-1 px-3 rounded-full bg-neo-primary text-black border-2 border-black text-sm font-black mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        WORKFLOW
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black mb-6">How It Works</h2>
                </div>

                <div className="relative">
                    {/* Connection Line (Desktop) */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-black -translate-y-1/2 z-0" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                        <motion.div
                            className="flex flex-col items-center text-center"
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="w-20 h-20 bg-white border-2 border-black rounded-full flex items-center justify-center mb-6 shadow-neo relative">
                                <span className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold border-2 border-white">1</span>
                                <UserPlus className="w-10 h-10" strokeWidth={2} />
                            </div>
                            <h3 className="text-2xl font-black mb-2">Create Account</h3>
                            <p className="text-slate-600 font-bold max-w-xs">
                                Sign up for free and set up your profile in seconds.
                            </p>
                        </motion.div>

                        <motion.div
                            className="flex flex-col items-center text-center"
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="w-20 h-20 bg-white border-2 border-black rounded-full flex items-center justify-center mb-6 shadow-neo relative">
                                <span className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold border-2 border-white">2</span>
                                <PlusCircle className="w-10 h-10" strokeWidth={2} />
                            </div>
                            <h3 className="text-2xl font-black mb-2">Add Applications</h3>
                            <p className="text-slate-600 font-bold max-w-xs">
                                Log jobs you apply for, including URLs and descriptions.
                            </p>
                        </motion.div>

                        <motion.div
                            className="flex flex-col items-center text-center"
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <div className="w-20 h-20 bg-white border-2 border-black rounded-full flex items-center justify-center mb-6 shadow-neo relative">
                                <span className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold border-2 border-white">3</span>
                                <CheckCircle className="w-10 h-10" strokeWidth={2} />
                            </div>
                            <h3 className="text-2xl font-black mb-2">Track & Win</h3>
                            <p className="text-slate-600 font-bold max-w-xs">
                                Move applications through stages until you get the offer.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
