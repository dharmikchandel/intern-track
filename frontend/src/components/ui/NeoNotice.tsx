import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

// Good news that belongs to the page and stays on it (an email is on its way, on
// the screen that asked for it). One-off confirmations are toasts; failures use
// NeoAlert. Achieved Mint fill, black text, announced politely (role="status").
const NeoNotice = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                role="status"
                className={cn("bg-neo-mint text-black p-3 font-bold border-2 border-black shadow-neo", className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);
NeoNotice.displayName = "NeoNotice";

export { NeoNotice };
