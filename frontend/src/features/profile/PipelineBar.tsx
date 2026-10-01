import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import type { StatusCounts } from "../../api/analytics";
import { STATUS_COLORS, STATUS_LABELS, STATUS_ORDER } from "../applications/statusMeta";

// Where every application stands, as one stacked bar in the status colours
// (the same ramp as the board), with a legend that opens the list filtered to
// that status.
export function PipelineBar({ counts }: { counts: StatusCounts }) {
    const total = STATUS_ORDER.reduce((n, s) => n + counts[s], 0);
    if (total === 0) return <p className="font-bold text-slate-600">Nothing tracked yet. Your pipeline shows up here as soon as you add an application.</p>;

    return (
        <div>
            <div className="flex h-9 border-2 border-black rounded-lg overflow-hidden" role="img" aria-label={`Pipeline: ${STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => `${counts[s]} ${STATUS_LABELS[s]}`).join(", ")}`}>
                {STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => (
                    <div key={s} className={cn("border-r-2 border-black last:border-r-0", STATUS_COLORS[s])} style={{ flexGrow: counts[s], flexBasis: 0 }} />
                ))}
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1 mt-4">
                {STATUS_ORDER.map((s) => (
                    <li key={s}>
                        <Link to={`/applications?status=${s}`} className="flex items-center gap-2 min-h-11 font-bold ui-link-quiet">
                            <span className={cn("w-4 h-4 border-2 border-black rounded-sm shrink-0", STATUS_COLORS[s])} aria-hidden />
                            {STATUS_LABELS[s]}
                            <span className="ml-auto text-slate-600">{counts[s]}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
