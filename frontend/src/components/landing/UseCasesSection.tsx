import { motion } from "framer-motion";

const useCases = [
    {
        title: "For Students",
        description: "Keep track of hundreds of internships and new grad roles without losing your mind.",
        tags: ["Internships", "New Grad", "Co-ops"]
    },
    {
        title: "For Career Switchers",
        description: "Manage applications across different industries and tailor your resume for each.",
        tags: ["Bootcamp Grads", "Pivoting", "Upskilling"]
    },
    {
        title: "For Experienced Pros",
        description: "Target specific high-level roles and track networking conversations.",
        tags: ["Senior Roles", "Networking", "Referrals"]
    }
];

export function UseCasesSection() {
    return (
        <section className="py-24 bg-white border-b-2 border-black">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <span className="inline-block py-1 px-3 rounded-full bg-neo-accent text-white border-2 border-black text-sm font-black mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        USE CASES
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black mb-6">Who Is This For?</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {useCases.map((useCase, index) => (
                        <motion.div
                            key={index}
                            className="bg-neo-bg p-8 border-2 border-black rounded-neo shadow-neo relative overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <h3 className="text-2xl font-black mb-4">{useCase.title}</h3>
                            <p className="text-slate-700 font-bold mb-8">
                                {useCase.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {useCase.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-white border-2 border-black rounded-full text-xs font-black">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
