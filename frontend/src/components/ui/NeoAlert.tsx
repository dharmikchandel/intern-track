import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";
import { NeoButton } from "./NeoButton";

interface NeoAlertProps extends HTMLAttributes<HTMLDivElement> {
    // Adds a "Try again" action for failures a retry can fix (a failed load).
    onRetry?: () => void;
}

// A failed action. Announced to screen readers (role="alert") and styled like
// the auth-page error banners: Stop Red fill, white text, hard black edge.
const NeoAlert = forwardRef<HTMLDivElement, NeoAlertProps>(
    ({ className, children, onRetry, ...props }, ref) => {
        return (
            <div
                ref={ref}
                role="alert"
                className={cn(
                    "bg-neo-destructive text-white p-3 font-bold border-2 border-black shadow-neo",
                    onRetry && "flex flex-wrap items-center justify-between gap-3",
                    className
                )}
                {...props}
            >
                {onRetry ? <span>{children}</span> : children}
                {onRetry && (
                    <NeoButton variant="ghost" className="px-4 py-2 text-sm min-h-11" onClick={onRetry}>
                        Try again
                    </NeoButton>
                )}
            </div>
        );
    }
);
NeoAlert.displayName = "NeoAlert";

export { NeoAlert };
