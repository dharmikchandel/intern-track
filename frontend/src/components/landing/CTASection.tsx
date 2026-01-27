import { Link } from "react-router-dom";
import { NeoButton } from "../ui/NeoButton";
import { motion } from "framer-motion";

export function CTASection() {
    return (
        <section className="py-24 bg-neo-primary text-black border-b-2 border-black relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'20\\' height=\\'20\\' viewBox=\\'0 0 20 20\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'%23000000\\' fill-opacity=\\'1\\' fill-rule=\\'evenodd\\'%3E%3Ccircle cx=\\'3\\' cy=\\'3\\' r=\\'3\\'/%3E%3Ccircle cx=\\'13\\' cy=\\'13\\' r=\\'3\\'/%3E%3C/g%3E%3C/svg%3E')" }} />

            <div className="container mx-auto px-4 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
                        Ready To Get Hired?
                    </h2>
                    <p className="text-xl md:text-2xl font-bold mb-10 max-w-2xl mx-auto opacity-90">
                        Join other students who are organizing their job hunt and landing offers.
                    </p>
                    <Link to="/register">
                        <NeoButton className="text-xl px-10 py-5 h-auto bg-white text-black hover:bg-slate-100 border-2 border-black">
                            Start Tracking Now
                        </NeoButton>
                    </Link>
                    <p className="mt-6 text-sm font-bold opacity-75">No credit card required. Free for students.</p>
                </motion.div>
            </div>
        </section>
    );
}
