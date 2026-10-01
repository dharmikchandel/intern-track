import { cn } from "../../lib/utils";
import type { ApplicationStatus } from "../../api/applications";
import { STATUS_COLORS, STATUS_LABELS } from "../../features/applications/statusMeta";
import { SampleApplicationCard } from "../ui/SampleApplicationCard";

interface PreviewCard {
    company: string;
    role: string;
    meta: string;
    due?: boolean;
}

// Sample data only (fictional companies), shown as a small board. The lane,
// header strip and card styling match the real kanban board.
const LANES: Array<{ status: ApplicationStatus; cards: PreviewCard[] }> = [
    {
        status: "APPLIED",
        cards: [
            { company: "Acme Labs", role: "Software Intern", meta: "Applied Sep 12" },
            { company: "Orbit Co.", role: "Data Intern", meta: "Applied Sep 9" },
        ],
    },
    { status: "INTERVIEW", cards: [{ company: "Pixel & Pine", role: "Design Intern", meta: "Follow up Sep 30", due: true }] },
    { status: "OFFER", cards: [{ company: "Harbor Bank", role: "Analyst Intern", meta: "Applied Aug 28" }] },
];

export function ProductPreview({ className }: { className?: string }) {
    return (
        <div role="img" aria-label="Preview of the TRACKr board with sample applications" className={className}>
            <div className="bg-neo-bg border-2 border-black rounded-lg shadow-neo overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-black text-white text-xs font-black uppercase tracking-wider">
                    <span>Applications</span>
                    <span>Board</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
                    {LANES.map((lane, i) => (
                        <div
                            key={lane.status}
                            className={cn("border-2 border-dashed border-black/40 rounded-lg overflow-hidden", i === 2 && "hidden sm:block")}
                        >
                            <div className={cn("flex items-center justify-between px-2 py-1.5 border-b-2 border-black text-[11px] font-black uppercase", STATUS_COLORS[lane.status])}>
                                <span>{STATUS_LABELS[lane.status]}</span>
                                <span className="bg-white text-black border-2 border-black rounded-full px-1.5 text-[10px]">{lane.cards.length}</span>
                            </div>
                            <div className="p-2 space-y-2">
                                {lane.cards.map((card) => (
                                    <SampleApplicationCard key={card.company} compact status={lane.status} {...card} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
