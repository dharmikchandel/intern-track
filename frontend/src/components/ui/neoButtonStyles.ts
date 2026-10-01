import { cn } from "../../lib/utils";

// ghost: white fill, no resting shadow; it only lifts when you point at it. For
// the quieter action next to a primary (Cancel, Import, Sign In).
export type NeoButtonVariant = "primary" | "secondary" | "destructive" | "ghost";

// One source for the button look, shared by <NeoButton> and <NeoLinkButton>
// so a navigation link can look like a button without nesting a <button> in an <a>.
export function neoButtonClass(variant: NeoButtonVariant = "primary", className?: string) {
    return cn(
        "inline-flex items-center justify-center font-bold transition-all px-6 py-3 border-2 border-black rounded-lg shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-hover active:translate-x-0 active:translate-y-0 active:shadow-neo-active disabled:opacity-50 disabled:pointer-events-none",
        {
            "bg-neo-primary text-black": variant === "primary",
            "bg-neo-secondary text-black": variant === "secondary",
            "bg-neo-destructive text-white": variant === "destructive",
            "bg-white text-black shadow-none hover:shadow-neo hover:bg-slate-50": variant === "ghost",
        },
        className
    );
}
