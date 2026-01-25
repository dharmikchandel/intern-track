import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

interface NeoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "destructive";
}

const NeoButton = forwardRef<HTMLButtonElement, NeoButtonProps>(
    ({ className, variant = "primary", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center font-bold transition-all px-6 py-3 border-2 border-black rounded-lg shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-hover active:translate-x-0 active:translate-y-0 active:shadow-neo-active disabled:opacity-50 disabled:pointer-events-none",
                    {
                        "bg-neo-primary text-black": variant === "primary",
                        "bg-neo-secondary text-black": variant === "secondary",
                        "bg-neo-destructive text-white": variant === "destructive",
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
NeoButton.displayName = "NeoButton";

export { NeoButton };
