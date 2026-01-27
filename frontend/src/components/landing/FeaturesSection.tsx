import { motion } from "framer-motion";
import { LayoutDashboard, FileText, Calendar, Bell, PieChart, Shield } from "lucide-react";

const features = [
    {
        icon: LayoutDashboard,
        title: "Centralized Dashboard",
        description: "See all your job applications in one place. No more messy spreadsheets.",
        color: "bg-neo-primary"
    },
    {
        icon: FileText,
        title: "Smart Resume Parsing",
        description: "Automatically extract details from your resume to fill applications faster.",
        color: "bg-neo-secondary"
    },
    {
        icon: Calendar,
        title: "Interview Scheduler",
        description: "Never miss an interview. Sync with your calendar and get reminders.",
        color: "bg-neo-tertiary"
    },
    {
        icon: Bell,
        title: "Status Updates",
        description: "Track the status of every application: Applied, Interviewing, Offer, or Rejected.",
        color: "bg-neo-accent"
    },
    {
        icon: PieChart,
        title: "Analytics & Insights",
        description: "Understand your success rate and identify areas for improvement.",
        color: "bg-neo-destructive"
    },
    {
        icon: Shield,
        title: "Secure & Private",
        description: "Your data is yours. We don't share your applications with anyone.",
        color: "bg-slate-300"
    }
];

export function FeaturesSection() {
    return (
        <section className="py-24 bg-white border-b-2 border-black">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <span className="inline-block py-1 px-3 rounded-full bg-neo-tertiary text-white border-2 border-black text-sm font-black mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        FEATURES
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black mb-6">Everything You Need To Win</h2>
                    <p className="text-xl text-slate-600 font-bold max-w-2xl mx-auto">
                        Stop juggling tabs and losing track. We provide the toolkit to manage your entire job search lifecycle.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className={`p-8 rounded-neo border-2 border-black shadow-neo hover:shadow-neo-hover hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-white`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <div className={`w-14 h-14 ${feature.color} border-2 border-black rounded-lg flex items-center justify-center mb-6 shadow-[2px_2px_0 0_#000]`}>
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
