import { cn } from "../../lib/utils";
import type { ApplicationStatus } from "../../api/applications";
import { STATUS_COLORS, STATUS_LABELS } from "../../features/applications/statusMeta";

interface StatusChipProps {
    status: ApplicationStatus;
    // Table columns pass a fixed width (for example "w-24") so every chip is the
    // same size and the column lines up; the text is centred inside it.
    className?: string;
}

// The status stamp: a bordered chip in the status colour. One definition, used
// by the list and the detail page, so the stamp can never drift between screens.
export function StatusChip({ status, className }: StatusChipProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center justify-center px-2 py-1 border-2 border-black rounded-md text-xs font-bold whitespace-nowrap",
                STATUS_COLORS[status],
                className
            )}
        >
            {STATUS_LABELS[status]}
        </span>
    );
}
