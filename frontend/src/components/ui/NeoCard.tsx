import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

const NeoCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "bg-white border-2 border-black rounded-lg shadow-neo p-6",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
NeoCard.displayName = "NeoCard";

export { NeoCard };
