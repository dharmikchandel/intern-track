import { motion } from "framer-motion";
import { UserPlus, PlusCircle, CheckCircle } from "lucide-react";

// Each step sits one stair higher than the last, and the line climbs with it:
// the same "closer to an offer" progression the statuses use. Circle centres are
// at y = 136, 88 and 40 (the pt-* offsets plus half the 80px circle), which is
// what the SVG path below traces.
const steps = [
    { icon: UserPlus, title: "Create Account", text: "Sign up with your email. There is no profile to fill out.", fill: "bg-neo-blue-tint", offset: "md:pt-24" },
    { icon: PlusCircle, title: "Add Applications", text: "Fill in a short form, paste a job link, or import your spreadsheet.", fill: "bg-neo-blue-mid", offset: "md:pt-12" },
    { icon: CheckCircle, title: "Track Progress", text: "Move applications through each stage and get a nudge when a follow-up is due.", fill: "bg-neo-primary", offset: "md:pt-0" },
];

export function HowItWorksSection() {
    return (
        <section className="py-24 bg-neo-bg border-b-2 border-black overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <span className="inline-block py-1 px-3 rounded-full bg-neo-primary text-black border-2 border-black text-sm font-black mb-4 shadow-neo-sm">
                        WORKFLOW
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black mb-6">How It Works</h2>
                </div>

                <div className="relative">
                    {/* The climbing line (desktop): x in % of the width, y in px. */}
                    <svg aria-hidden="true" className="hidden md:block absolute left-0 top-0 w-full h-44 text-black z-0" viewBox="0 0 100 176" preserveAspectRatio="none">
                        <polyline
                            points="16.67,136 33.33,136 33.33,88 66.67,88 66.67,40 100,40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={5}
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                    <span className="hidden md:inline-flex absolute right-0 top-10 -translate-y-1/2 z-10 px-3 py-1 border-2 border-black bg-neo-green rounded-full text-xs font-black shadow-neo-sm">
                        OFFER
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 relative z-10">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.title}
                                className={`flex flex-col items-center text-center px-4 ${step.offset}`}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.15 }}
                            >
                                <div className={`w-20 h-20 ${step.fill} border-2 border-black rounded-full flex items-center justify-center mb-6 shadow-neo relative`}>
                                    <span className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold border-2 border-white">{index + 1}</span>
                                    <step.icon className="w-10 h-10" strokeWidth={2} aria-hidden />
                                </div>
                                <h3 className="text-2xl font-black mb-2">{step.title}</h3>
                                <p className="text-slate-700 font-bold max-w-xs">{step.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
