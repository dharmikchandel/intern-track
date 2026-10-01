import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { NeoTableHead } from "../../components/ui/NeoTable";
import type { SortColumn, SortOrder } from "./listParams";

interface SortableHeadProps {
    label: string;
    column: SortColumn;
    sort: SortColumn;
    order: SortOrder;
    onSort: (column: SortColumn) => void;
}

// A column header you can click to sort by. The current column shows its
// direction; the others show a neutral up/down mark so it is clear they are
// sortable. `aria-sort` tells screen readers the same thing.
export function SortableHead({ label, column, sort, order, onSort }: SortableHeadProps) {
    const active = sort === column;
    const Icon = !active ? ArrowUpDown : order === "asc" ? ArrowUp : ArrowDown;

    return (
        <NeoTableHead aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"} className="p-0 sm:p-0">
            <button
                type="button"
                onClick={() => onSort(column)}
                // The header is black, so the focus outline is white here.
                className="flex items-center gap-1 sm:gap-1.5 w-full min-h-11 px-2 sm:px-4 text-xs sm:text-base uppercase font-bold tracking-wide sm:tracking-wider text-left hover:underline focus-visible:outline-white focus-visible:outline-offset-[-4px]"
            >
                {label}
                <Icon className={active ? "w-4 h-4" : "w-4 h-4 opacity-60"} aria-hidden />
            </button>
        </NeoTableHead>
    );
}
