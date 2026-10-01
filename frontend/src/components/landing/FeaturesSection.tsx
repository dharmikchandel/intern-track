import { motion } from "framer-motion";
import { Bell, FileSpreadsheet, Flame, LayoutGrid, Link2, Share2 } from "lucide-react";

const features = [
    {
        icon: Bell,
        title: "Follow-up Nudges",
        description: "Set a follow-up date and get a weekly email digest, plus a badge on anything that is due.",
        color: "bg-neo-primary"
    },
    {
        icon: LayoutGrid,
        title: "Board or List",
        description: "Drag applications between Applied, Online Assessment, Interview, Offer and Rejected, or search, filter and sort the list.",
        color: "bg-neo-green"
    },
    {
        icon: Link2,
        title: "Paste a Job Link",
        description: "Drop in a posting URL and we fill in what we can read: company, role and link. You review before saving.",
        color: "bg-neo-blue-mid"
    },
    {
        icon: Flame,
        title: "Streaks & Milestones",
        description: "Day streaks and milestones celebrate your momentum. A missed day is never treated as a failure.",
        color: "bg-neo-green"
    },
    {
        icon: Share2,
        title: "Shareable Recap",
        description: "Share a public card of your totals. It shows numbers only, never company names, roles or notes.",
        color: "bg-neo-primary"
    },
    {
        icon: FileSpreadsheet,
        title: "Bring Your Spreadsheet",
        description: "Import a CSV with a preview first, and export your applications whenever you want.",
        color: "bg-neo-blue-mid"
    }
];

export function FeaturesSection() {
    return (
        <section className="py-24 bg-white border-b-2 border-black">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <span className="inline-block py-1 px-3 rounded-full bg-neo-green text-black border-2 border-black text-sm font-black mb-4 shadow-neo-sm">
                        FEATURES
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black mb-6">Know What To Do Next</h2>
                    <p className="text-xl text-slate-600 font-bold max-w-2xl mx-auto">
                        A spreadsheet only stores your applications. TRACKr also tells you who to follow up with and keeps you going.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="p-8 rounded-neo border-2 border-black shadow-neo bg-white"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <div className={`w-14 h-14 ${feature.color} border-2 border-black rounded-lg flex items-center justify-center mb-6 shadow-neo-sm`}>
                                <feature.icon className="w-8 h-8 text-black" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-black mb-3">{feature.title}</h3>
                            <p className="text-slate-600 font-medium leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
