import { type SelectHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "../../lib/utils";

interface NeoSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
}

// Same field grammar as NeoInput. With a label or error it renders the full
// stacked field; without either it is a bare <select> (for toolbars and cards,
// which should pass an aria-label and override size via className).
const NeoSelect = forwardRef<HTMLSelectElement, NeoSelectProps>(
    ({ className, label, error, id, children, ...props }, ref) => {
        const generatedId = useId();
        const selectId = id ?? generatedId;
        const select = (
            <select
                ref={ref}
                id={selectId}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${selectId}-error` : undefined}
                className={cn(
                    "w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:ring-4 focus:ring-neo-primary/50 transition-all font-medium",
                    error && "border-neo-destructive focus:ring-neo-destructive/50",
                    className
                )}
                {...props}
            >
                {children}
            </select>
        );
        if (!label && !error) return select;
        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={selectId} className="block font-bold mb-1 text-sm uppercase tracking-wide">
                        {label}
                    </label>
                )}
                {select}
                {error && <p id={`${selectId}-error`} className="text-neo-red-deep font-bold text-sm mt-1">{error}</p>}
            </div>
        );
    }
);
NeoSelect.displayName = "NeoSelect";

export { NeoSelect };
