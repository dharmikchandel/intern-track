import { cn } from "../../lib/utils";
import { SampleApplicationCard } from "./SampleApplicationCard";

// Three sample application cards fanned out like papers on a desk, each
// stamped with a different stage. Decorative: it shows what an application
// looks like before the user has one.
export function PaperStack({ className }: { className?: string }) {
    return (
        <div aria-hidden="true" className={cn("relative mx-auto h-40 w-full max-w-sm", className)}>
            <SampleApplicationCard
                compact
                company="Acme Labs"
                role="Software Intern"
                status="APPLIED"
                meta="Sample"
                className="absolute left-0 top-6 w-48 -rotate-6"
            />
            <SampleApplicationCard
                compact
                company="Pixel & Pine"
                role="Design Intern"
                status="INTERVIEW"
                meta="Sample"
                className="absolute left-[calc(50%-6rem)] top-0 w-48 rotate-2"
            />
            <SampleApplicationCard
                compact
                company="Harbor Bank"
                role="Analyst Intern"
                status="OFFER"
                meta="Sample"
                className="absolute right-0 top-10 w-48 -rotate-3"
            />
        </div>
    );
}
