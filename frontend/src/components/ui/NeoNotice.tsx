import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

interface NeoNoticeProps extends HTMLAttributes<HTMLDivElement> {
    // Adds a Dismiss action, for notices that should not linger.
    onDismiss?: () => void;
}

// Good news: a save worked, an email is on its way. Achieved Mint fill, black
// text, announced politely (role="status"). Failures use NeoAlert instead.
const NeoNotice = forwardRef<HTMLDivElement, NeoNoticeProps>(
    ({ className, children, onDismiss, ...props }, ref) => {
        return (
            <div
                ref={ref}
                role="status"
                className={cn(
                    "bg-neo-mint text-black p-3 font-bold border-2 border-black shadow-neo",
                    onDismiss && "flex flex-wrap items-center justify-between gap-3",
                    className
                )}
                {...props}
            >
                {onDismiss ? <span>{children}</span> : children}
                {onDismiss && (
                    <button type="button" onClick={onDismiss} className="text-sm underline px-2 min-h-11 hover:bg-neo-primary">
                        Dismiss
                    </button>
                )}
            </div>
        );
    }
);
NeoNotice.displayName = "NeoNotice";

export { NeoNotice };
