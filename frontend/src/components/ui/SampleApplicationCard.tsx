import { cn } from "../../lib/utils";
import type { ApplicationStatus } from "../../api/applications";
import { STATUS_COLORS, STATUS_LABELS } from "../../features/applications/statusMeta";

interface SampleApplicationCardProps {
    company: string;
    role: string;
    status: ApplicationStatus;
    meta: string;
    due?: boolean;
    compact?: boolean;
    className?: string;
}

// A static, decorative application card for previews and empty states. It
// mirrors the real board card (company, role, status, a date line) and reads
// its colours from statusMeta, so it can never drift from the product.
export function SampleApplicationCard({ company, role, status, meta, due, compact, className }: SampleApplicationCardProps) {
    return (
        <div className={cn("bg-white border-2 border-black rounded-lg shadow-neo", compact ? "p-2 shadow-neo-sm" : "p-3", className)}>
            <p className={cn("font-black leading-tight truncate", compact && "text-sm")}>{company}</p>
            <p className={cn("font-medium text-slate-700 truncate", compact ? "text-xs" : "text-sm")}>{role}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className={cn("border-2 border-black rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider", STATUS_COLORS[status])}>
                    {STATUS_LABELS[status]}
                </span>
                <span className={cn("text-xs font-bold text-slate-600", due && "text-neo-red-deep")}>{meta}</span>
            </div>
        </div>
    );
}
