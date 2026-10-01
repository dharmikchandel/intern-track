
import { NeoLinkButton } from "../ui/NeoLinkButton";
import { motion } from "framer-motion";

export function CTASection() {
    return (
        <section className="py-24 bg-neo-primary text-black border-b-2 border-black relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
                        Ready To Get Organized?
                    </h2>
                    <p className="text-xl md:text-2xl font-bold mb-10 max-w-2xl mx-auto opacity-90">
                        Put your whole job search in one place and always know what to do next.
                    </p>
                    <NeoLinkButton to="/register" variant="ghost" className="text-xl px-10 py-5 shadow-neo">
                        Start Tracking Now
                    </NeoLinkButton>
                    <p className="mt-6 text-sm font-bold">No credit card required.</p>
                </motion.div>
            </div>
        </section>
    );
}
