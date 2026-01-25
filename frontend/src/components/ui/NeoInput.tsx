import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

interface NeoInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const NeoInput = forwardRef<HTMLInputElement, NeoInputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block font-bold mb-1 text-sm uppercase tracking-wide">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={cn(
                        "w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:ring-4 focus:ring-neo-primary/50 transition-all font-medium placeholder:text-gray-400",
                        error && "border-neo-destructive focus:ring-neo-destructive/50",
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="text-neo-destructive font-bold text-sm mt-1">{error}</p>
                )}
            </div>
        );
    }
);
NeoInput.displayName = "NeoInput";

export { NeoInput };
