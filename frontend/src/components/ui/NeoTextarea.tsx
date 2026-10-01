import { type TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "../../lib/utils";

interface NeoTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const NeoTextarea = forwardRef<HTMLTextAreaElement, NeoTextareaProps>(
    ({ className, label, error, id, ...props }, ref) => {
        const generatedId = useId();
        const textareaId = id ?? generatedId;
        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={textareaId} className="block font-bold mb-1 text-sm uppercase tracking-wide">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${textareaId}-error` : undefined}
                    className={cn(
                        "w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:ring-4 focus:ring-neo-primary/50 transition-all font-medium min-h-[100px]",
                        error && "border-neo-destructive focus:ring-neo-destructive/50",
                        className
                    )}
                    {...props}
                />
                {error && <p id={`${textareaId}-error`} className="text-neo-red-deep font-bold text-sm mt-1">{error}</p>}
            </div>
        );
    }
);
NeoTextarea.displayName = "NeoTextarea";

export { NeoTextarea };
