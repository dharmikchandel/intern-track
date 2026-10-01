import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "../../lib/utils";

interface NeoInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    // Quiet help under the field (what it is for). Linked with aria-describedby.
    hint?: string;
}

const NeoInput = forwardRef<HTMLInputElement, NeoInputProps>(
    ({ className, label, error, hint, id, ...props }, ref) => {
        // Tie the label to its input so screen readers announce it and
        // clicking the label focuses the field.
        const generatedId = useId();
        const inputId = id ?? generatedId;
        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="block font-bold mb-1 text-sm uppercase tracking-wide">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                    className={cn(
                        "w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:ring-4 focus:ring-neo-primary/50 transition-all font-medium placeholder:text-slate-500",
                        error && "border-neo-destructive focus:ring-neo-destructive/50",
                        className
                    )}
                    {...props}
                />
                {hint && !error && (
                    <p id={`${inputId}-hint`} className="text-slate-600 font-bold text-xs mt-1">{hint}</p>
                )}
                {error && (
                    <p id={`${inputId}-error`} className="text-neo-red-deep font-bold text-sm mt-1">{error}</p>
                )}
            </div>
        );
    }
);
NeoInput.displayName = "NeoInput";

export { NeoInput };
