import { Search } from "lucide-react";
import { NeoInput } from "../../components/ui/NeoInput";
import { NeoSelect } from "../../components/ui/NeoSelect";
import { STATUS_LABELS, STATUS_ORDER } from "./statusMeta";

// Toolbar size: the NeoSelect default is the tall form-field size.
const selectClass = "w-auto p-2 font-bold";

interface ApplicationFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    needsFollowUp: boolean;
    onNeedsFollowUpChange: (value: boolean) => void;
    // List-only controls: the board always shows every status column and has
    // its own fixed card ordering.
    listControls?: {
        status: string;
        onStatusChange: (value: string) => void;
    };
}

export function ApplicationFilters({
    search,
    onSearchChange,
    needsFollowUp,
    onNeedsFollowUpChange,
    listControls,
}: ApplicationFiltersProps) {
    return (
        <div className="flex flex-wrap items-end gap-4 mb-6">
            <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <NeoInput
                    aria-label="Search company or role"
                    placeholder="Search company or role"
                    value={search}
                    maxLength={100}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 py-2"
                />
            </div>

            <label className="flex items-center gap-2 font-bold cursor-pointer select-none min-h-11">
                <input
                    type="checkbox"
                    className="w-5 h-5 accent-black"
                    checked={needsFollowUp}
                    onChange={(e) => onNeedsFollowUpChange(e.target.checked)}
                />
                Needs follow-up
            </label>

            {listControls && (
                <>
                    <NeoSelect
                        aria-label="Filter by status"
                        className={selectClass}
                        value={listControls.status}
                        onChange={(e) => listControls.onStatusChange(e.target.value)}
                    >
                        <option value="">All statuses</option>
                        {STATUS_ORDER.map((s) => (
                            <option key={s} value={s}>
                                {STATUS_LABELS[s]}
                            </option>
                        ))}
                    </NeoSelect>
                </>
            )}
        </div>
    );
}
