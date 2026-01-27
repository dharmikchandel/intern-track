import { motion } from "framer-motion";

const techs = ["React", "TypeScript", "TailwindCSS", "Vite", "Golang", "PostgreSQL", "Framer Motion"];

export function TechStackSection() {
    return (
        <section className="py-16 bg-neo-bg border-b-2 border-black overflow-hidden relative">
            <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="md:w-1/3">
                    <h2 className="text-3xl font-black mb-4">Built With Modern Tech</h2>
                    <p className="text-slate-600 font-bold">
                        Engineered for speed, reliability, and security using the latest standards.
                    </p>
                </div>

                <div className="md:w-2/3 flex flex-wrap gap-4 justify-start md:justify-end">
                    {techs.map((tech, index) => (
                        <motion.span
                            key={tech}
                            className="px-4 py-2 bg-white border-2 border-black rounded-lg font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                        >
                            {tech}
                        </motion.span>
                    ))}
                </div>
            </div>
        </section>
    );
}
