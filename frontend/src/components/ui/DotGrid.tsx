import { cn } from "../../lib/utils";

interface DotGridProps {
    className?: string;
}

export function DotGrid({ className }: DotGridProps) {
    return (
        <div className={cn("absolute inset-0 z-0 pointer-events-none overflow-hidden", className)}>
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    opacity: 0.75
                }}
            />
        </div>
    );
}
