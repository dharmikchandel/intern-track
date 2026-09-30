import { cn } from "../../lib/utils";

interface NeoSkeletonProps {
    // Announced to screen readers. Omit for decorative pieces inside a
    // skeleton that already has a labelled parent.
    label?: string;
    className?: string;
}

// The loading state: a pulsing paper block with the same border, radius and
// shadow as the real thing, so the page does not jump when content arrives.
export function NeoSkeleton({ label, className }: NeoSkeletonProps) {
    return (
        <div
            role={label ? "status" : undefined}
            aria-busy={label ? true : undefined}
            aria-hidden={label ? undefined : true}
            className={cn("bg-white border-2 border-black rounded-lg shadow-neo animate-pulse", className)}
        >
            {label && <span className="sr-only">{label}</span>}
        </div>
    );
}
