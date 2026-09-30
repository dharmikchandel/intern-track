import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

// A failed action. Announced to screen readers (role="alert") and styled like
// the auth-page error banners: Stop Red fill, white text, hard black edge.
const NeoAlert = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                role="alert"
                className={cn("bg-neo-destructive text-white p-3 font-bold border-2 border-black shadow-neo", className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);
NeoAlert.displayName = "NeoAlert";

export { NeoAlert };
