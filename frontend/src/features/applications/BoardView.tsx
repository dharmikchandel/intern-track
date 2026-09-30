import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { AlertCircle, GripVertical, Undo2 } from "lucide-react";
import { NeoAlert } from "../../components/ui/NeoAlert";
import { NeoButton } from "../../components/ui/NeoButton";
import { cn, getErrorMessage } from "../../lib/utils";
import { getBoard, updateApplication, type Application, type ApplicationStatus, type BoardResponse } from "../../api/applications";
import { moveCardInBoard } from "./board";
import { isFollowUpDue, STATUS_COLORS, STATUS_LABELS, STATUS_ORDER } from "./statusMeta";

const PAGE_STEP = 25;
const MAX_PER_COLUMN = 100;
// Moves into these are the ones that are costly to make by accident.
const TERMINAL: ApplicationStatus[] = ["OFFER", "REJECTED"];

interface BoardViewProps {
    q: string;
    needsFollowUp: boolean;
}

interface UndoState {
    id: string;
    company: string;
    from: ApplicationStatus;
    to: ApplicationStatus;
}

export function BoardView({ q, needsFollowUp }: BoardViewProps) {
    const queryClient = useQueryClient();
    const [perColumn, setPerColumn] = useState(PAGE_STEP);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [undo, setUndo] = useState<UndoState | null>(null);

    const boardKey = ["applications", "board", { q, needsFollowUp, perColumn }] as const;

    const { data, isLoading, isError } = useQuery({
        queryKey: boardKey,
        queryFn: () => getBoard({ q: q || undefined, needsFollowUp: needsFollowUp || undefined, perColumn }),
        placeholderData: keepPreviousData,
    });

    const moveMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) => updateApplication(id, { status }),
        // Optimistic: move the card immediately, roll back if the API rejects it.
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: ["applications", "board"] });
            const previous = queryClient.getQueryData<BoardResponse>(boardKey);
            queryClient.setQueryData<BoardResponse>(boardKey, (old) => (old ? moveCardInBoard(old, id, status) : old));
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(boardKey, context.previous);
            setUndo(null);
        },
        onSettled: (_data, _err, { id }) => {
            queryClient.invalidateQueries({ queryKey: ["applications"] });
            queryClient.invalidateQueries({ queryKey: ["application", id] });
            queryClient.invalidateQueries({ queryKey: ["analytics"] });
        },
    });

    const sensors = useSensors(
        // Small distance/delay so clicks and scrolling still work; only a
        // deliberate drag from the handle starts a move.
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
        useSensor(KeyboardSensor)
    );

    const allCards = data?.columns.flatMap((c) => c.items) ?? [];
    const activeCard = allCards.find((a) => a.id === activeId) ?? null;

    function move(card: Application, to: ApplicationStatus) {
        if (card.status === to) return;
        moveMutation.mutate({ id: card.id, status: to });
        setUndo(TERMINAL.includes(to) ? { id: card.id, company: card.companyName, from: card.status, to } : null);
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveId(String(event.active.id));
    }

    function handleDragEnd(event: DragEndEvent) {
        setActiveId(null);
        const card = allCards.find((a) => a.id === event.active.id);
        const to = event.over?.id as ApplicationStatus | undefined;
        if (card && to) move(card, to);
    }

    if (isLoading) {
        return <div className="text-center font-bold p-10 animate-pulse">Loading Board...</div>;
    }
    if (isError || !data) {
        return (
            <div className="bg-neo-destructive text-white p-4 font-bold border-2 border-black">
                Error loading the board.
            </div>
        );
    }

    const total = data.columns.reduce((sum, c) => sum + c.total, 0);
    if (total === 0) {
        return (
            <div className="text-center p-10 border-2 border-dashed border-black bg-white">
                <p className="font-bold text-lg">{q || needsFollowUp ? "No applications match these filters." : "No applications yet."}</p>
            </div>
        );
    }

    const canShowMore = data.perColumn < MAX_PER_COLUMN;

    return (
        <>
            {/* The card has already snapped back (see onError); this says why. It clears on the next move. */}
            {moveMutation.isError && (
                <NeoAlert className="mb-4">
                    {getErrorMessage(moveMutation.error, "Couldn't move that application, so it is back where it was.")}
                </NeoAlert>
            )}

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveId(null)}
            >
                {/* pb/pr leave room for the offset card shadows, which overflow-x would clip. */}
                <div className="flex gap-3 overflow-x-auto pb-4 pr-2 items-start">
                    {STATUS_ORDER.map((status) => {
                        const column = data.columns.find((c) => c.status === status);
                        return (
                            <Column
                                key={status}
                                status={status}
                                total={column?.total ?? 0}
                                cards={column?.items ?? []}
                                canShowMore={canShowMore}
                                onShowMore={() => setPerColumn((p) => Math.min(p + PAGE_STEP, MAX_PER_COLUMN))}
                                onMove={move}
                            />
                        );
                    })}
                </div>
                <DragOverlay>{activeCard ? <CardBody app={activeCard} floating /> : null}</DragOverlay>
            </DndContext>

            {undo && (
                <div
                    role="status"
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-white border-2 border-black shadow-neo rounded-lg px-4 py-3 font-bold"
                >
                    <span>
                        {undo.company} moved to {STATUS_LABELS[undo.to]}
                    </span>
                    <NeoButton
                        variant="secondary"
                        className="px-3 py-1 text-sm h-auto flex items-center gap-1"
                        onClick={() => {
                            moveMutation.mutate({ id: undo.id, status: undo.from });
                            setUndo(null);
                        }}
                    >
                        <Undo2 className="w-4 h-4" /> Undo
                    </NeoButton>
                    <button className="text-sm underline" onClick={() => setUndo(null)}>
                        Dismiss
                    </button>
                </div>
            )}
        </>
    );
}

interface ColumnProps {
    status: ApplicationStatus;
    total: number;
    cards: Application[];
    canShowMore: boolean;
    onShowMore: () => void;
    onMove: (card: Application, to: ApplicationStatus) => void;
}

function Column({ status, total, cards, canShowMore, onShowMore, onMove }: ColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: status });
    const hidden = total - cards.length;

    return (
        <section
            ref={setNodeRef}
            aria-label={`${STATUS_LABELS[status]} column`}
            className={cn(
                "min-w-[200px] flex-1 border-2 border-black rounded-lg bg-white/60 transition-colors",
                isOver && "bg-neo-primary/20"
            )}
        >
            <header className={cn("flex items-center justify-between px-3 py-2 border-b-2 border-black font-black uppercase text-sm", STATUS_COLORS[status])}>
                <span>{STATUS_LABELS[status]}</span>
                <span className="bg-white text-black border-2 border-black rounded-full px-2 text-xs">{total}</span>
            </header>
            <div className="p-2 flex flex-col gap-3 min-h-[80px]">
                {cards.map((app) => (
                    <DraggableCard key={app.id} app={app} onMove={onMove} />
                ))}
                {hidden > 0 && (
                    <div className="text-center text-xs font-bold text-slate-600">
                        Showing {cards.length} of {total}
                        {canShowMore ? (
                            <button className="block mx-auto mt-1 underline" onClick={onShowMore}>
                                Show more
                            </button>
                        ) : (
                            <span className="block">Use search to narrow the rest down</span>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

function DraggableCard({ app, onMove }: { app: Application; onMove: (card: Application, to: ApplicationStatus) => void }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: app.id });

    return (
        <div ref={setNodeRef} className={cn(isDragging && "opacity-40")}>
            <CardBody
                app={app}
                handle={
                    <button
                        {...listeners}
                        {...attributes}
                        aria-label={`Drag ${app.companyName} to another column`}
                        className="touch-none cursor-grab active:cursor-grabbing p-1 -m-1"
                    >
                        <GripVertical className="w-4 h-4" />
                    </button>
                }
                onMove={(to) => onMove(app, to)}
            />
        </div>
    );
}

interface CardBodyProps {
    app: Application;
    handle?: ReactNode;
    onMove?: (to: ApplicationStatus) => void;
    floating?: boolean;
}

function CardBody({ app, handle, onMove, floating }: CardBodyProps) {
    const due = isFollowUpDue(app);

    return (
        <div className={cn("bg-white border-2 border-black rounded-lg p-3 shadow-neo", floating && "rotate-2 shadow-neo-hover")}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <Link to={`/applications/${app.id}`} className="font-black leading-tight hover:underline block truncate">
                        {app.companyName}
                    </Link>
                    <p className="text-sm font-medium text-slate-700 truncate">{app.role}</p>
                </div>
                {handle}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-600">
                <span>Applied {format(new Date(app.appliedDate), "MMM d")}</span>
                {app.followUpDate && (
                    <span className={cn("inline-flex items-center gap-1", due && "text-neo-destructive")}>
                        {due && <AlertCircle className="w-3 h-3" />}
                        Follow up {format(new Date(app.followUpDate), "MMM d")}
                    </span>
                )}
            </div>
            {onMove && (
                // Tap/keyboard alternative to dragging, so moving a card never
                // depends on a precise gesture (mobile) or a pointer (a11y).
                <select
                    aria-label={`Move ${app.companyName} to`}
                    value={app.status}
                    onChange={(e) => onMove(e.target.value as ApplicationStatus)}
                    className="mt-2 w-full border-2 border-black bg-white text-xs font-bold p-1"
                >
                    {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                            {s === app.status ? STATUS_LABELS[s] : `Move to ${STATUS_LABELS[s]}`}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
}
