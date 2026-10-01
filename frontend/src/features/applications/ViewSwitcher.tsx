import { useRef } from "react";
import { Columns3, List } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ListView } from "./listParams";

const OPTIONS = [
    { value: "list", label: "List", hint: "Every application as a sortable table", icon: List },
    { value: "board", label: "Board", hint: "Applications in lanes by status", icon: Columns3 },
] as const satisfies ReadonlyArray<{ value: ListView; label: string; hint: string; icon: typeof List }>;

// The switch between the two ways of seeing your applications. A segmented
// control: a bordered track with an ink thumb that slides to the chosen side.
// It is a choice of one of two (a radio group), so arrow keys move between the
// options and only the chosen one is in the tab order.
export function ViewSwitcher({ value, onChange }: { value: ListView; onChange: (next: ListView) => void }) {
    const buttons = useRef<Array<HTMLButtonElement | null>>([]);
    const selected = OPTIONS.findIndex((o) => o.value === value);

    function onKeyDown(e: React.KeyboardEvent, index: number) {
        const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        const target = e.key === "Home" ? 0 : e.key === "End" ? OPTIONS.length - 1 : step ? (index + step + OPTIONS.length) % OPTIONS.length : -1;
        if (target < 0) return;
        e.preventDefault();
        onChange(OPTIONS[target]!.value);
        buttons.current[target]?.focus();
    }

    return (
        <div
            role="radiogroup"
            aria-label="View"
            className="relative grid grid-cols-2 gap-1 p-1 w-full sm:w-64 shrink-0 bg-white border-2 border-black rounded-lg shadow-neo"
        >
            {/* The thumb: one column wide, slides one column + the gap. */}
            <span
                aria-hidden
                className={cn(
                    "absolute inset-y-1 left-1 w-[calc(50%-6px)] rounded-md bg-black transition-transform duration-200 ease-out motion-reduce:transition-none",
                    selected === 1 && "translate-x-[calc(100%+4px)]"
                )}
            />
            {OPTIONS.map((option, index) => {
                const active = option.value === value;
                const Icon = option.icon;
                return (
                    <button
                        key={option.value}
                        ref={(el) => {
                            buttons.current[index] = el;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        tabIndex={active ? 0 : -1}
                        title={option.hint}
                        onClick={() => onChange(option.value)}
                        onKeyDown={(e) => onKeyDown(e, index)}
                        className={cn(
                            "relative z-10 flex items-center justify-center gap-2 min-h-11 rounded-md font-black text-sm uppercase tracking-wide transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-offset-[-4px]",
                            // The thumb is black, so the focus outline turns white on the chosen side.
                            active ? "text-white focus-visible:outline-white" : "text-slate-700 hover:bg-slate-100"
                        )}
                    >
                        <Icon className="w-4 h-4" aria-hidden />
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
