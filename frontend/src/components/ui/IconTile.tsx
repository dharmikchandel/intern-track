import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

// A small coloured square with an icon, for card headings. The fill is passed
// in (a palette token class) so the colour always means something.
export function IconTile({ icon: Icon, tone = "bg-neo-blue-tint", className }: { icon: LucideIcon; tone?: string; className?: string }) {
    return (
        <span className={cn("inline-flex w-9 h-9 shrink-0 items-center justify-center rounded-lg border-2 border-black", tone, className)} aria-hidden>
            <Icon className="w-5 h-5" />
        </span>
    );
}
