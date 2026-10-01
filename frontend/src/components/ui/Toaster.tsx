import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Award, Check, Info, TriangleAlert, Undo2, X } from "lucide-react";
import { dismissToast, getToasts, showParkedToast, useToasts, type ToastItem, type ToastKind } from "../../lib/toast";
import { cn } from "../../lib/utils";
import { IconTile } from "./IconTile";
import { neoButtonClass } from "./neoButtonStyles";

const ICON = { success: Check, info: Info, error: TriangleAlert, milestone: Award } as const;
// The three signals again: green = it worked, blue = for your information, red = it failed.
const TONE: Record<ToastKind, string> = { success: "bg-neo-green", info: "bg-neo-blue-tint", error: "bg-neo-destructive", milestone: "bg-white" };

// A first, not a confirmation: the achieved-Mint card of a milestone tile, a spring in, and a
// single burst of small squares in the blue and green signals (never red, which means
// rejection here). Same corner, same rules as every other toast; the celebration is the
// content and the motion, not a second place to look.
const BURST = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2 + 0.3;
    const reach = 64 + (i % 3) * 22;
    return { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach, turn: i % 2 ? 160 : -160, tone: ["bg-neo-primary", "bg-neo-green", "bg-neo-blue-mid", "bg-white"][i % 4] };
});

function Burst({ version }: { version: number }) {
    return (
        <span aria-hidden className="pointer-events-none absolute left-7 top-1/2">
            {BURST.map((p, i) => (
                <motion.span
                    key={`${version}-${i}`}
                    className={`absolute -ml-1 -mt-1 block h-2 w-2 border border-black ${p.tone}`}
                    initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
                    animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.turn, scale: 1.1 }}
                    transition={{ duration: 0.85, ease: "easeOut" }}
                />
            ))}
        </span>
    );
}

// Text being typed into keeps its own Ctrl+Z.
function isTextEntry(el: EventTarget | null) {
    if (!(el instanceof HTMLElement)) return false;
    if (el.isContentEditable || el instanceof HTMLTextAreaElement) return true;
    return el instanceof HTMLInputElement && !["checkbox", "radio", "button", "submit", "range", "file"].includes(el.type);
}

// Ctrl/Cmd+Z runs the newest undo, from anywhere on the page. This is also how
// keyboard users reach an undo without tabbing to the end of the document.
function useUndoShortcut() {
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key.toLowerCase() !== "z" || !(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
            if (isTextEntry(e.target) || document.querySelector('[aria-modal="true"]')) return;
            const toast = [...getToasts()].reverse().find((t) => t.action?.undo);
            if (!toast?.action) return;
            e.preventDefault();
            toast.action.onClick?.();
            dismissToast(toast.id);
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);
}

function usePageHidden() {
    const [hidden, setHidden] = useState(() => document.visibilityState === "hidden");
    useEffect(() => {
        const update = () => setHidden(document.visibilityState === "hidden");
        document.addEventListener("visibilitychange", update);
        return () => document.removeEventListener("visibilitychange", update);
    }, []);
    return hidden;
}

function ToastCard({ toast }: { toast: ToastItem }) {
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const navigate = useNavigate();
    const hidden = usePageHidden();
    const reduceMotion = useReducedMotion();
    // The clock stops while it is being read (pointer or focus on it) or while the
    // tab is in the background, and carries on with whatever time was left.
    const frozen = hovered || focused || hidden;
    const { id, version, duration, action } = toast;
    const left = useRef(duration);
    const seenVersion = useRef(version);

    useEffect(() => {
        if (duration === 0 || frozen) return;
        // A replaced toast (same id) starts a fresh clock.
        if (seenVersion.current !== version) {
            seenVersion.current = version;
            left.current = duration;
        }
        const startedAt = Date.now();
        const timer = setTimeout(() => dismissToast(id), left.current);
        return () => {
            clearTimeout(timer);
            left.current -= Date.now() - startedAt;
        };
    }, [frozen, id, version, duration]);

    const Icon = toast.icon ?? ICON[toast.kind];
    const celebrate = toast.kind === "milestone";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16, scale: celebrate ? 0.9 : 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.12 } }}
            transition={celebrate ? { type: "spring", stiffness: 420, damping: 22 } : { duration: 0.18, ease: "easeOut" }}
            // A swipe to the right sends it away (touch); the X is the same thing for everyone else.
            drag="x"
            dragSnapToOrigin
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.6 }}
            onDragEnd={(_, info) => {
                if (info.offset.x > 80 || info.velocity.x > 500) dismissToast(id);
            }}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
            }}
            className={cn("pointer-events-auto relative mt-3 rounded-lg border-2 border-black shadow-neo", celebrate ? "bg-neo-mint" : "overflow-hidden bg-white")}
        >
            {celebrate && !reduceMotion && <Burst version={version} />}
            <div className={cn("flex items-center gap-3 pl-3 pr-2", celebrate ? "py-2.5" : "py-2")}>
                <IconTile icon={Icon} tone={TONE[toast.kind]} className="h-8 w-8" />
                <div className="min-w-0 flex-1">
                    {toast.kicker && <p className="text-[11px] font-black uppercase tracking-wide text-black">{toast.kicker}</p>}
                    <p className={cn("break-words text-black", celebrate ? "text-base font-black leading-tight" : "text-sm font-bold")}>{toast.message}</p>
                    {toast.description && <p className="mt-0.5 break-words text-xs font-medium text-slate-700">{toast.description}</p>}
                </div>
                {action && (
                    <button
                        type="button"
                        aria-keyshortcuts={action.undo ? "Control+Z Meta+Z" : undefined}
                        className={neoButtonClass("ghost", "min-h-11 shrink-0 gap-1 px-3 py-2 text-sm")}
                        onClick={() => {
                            action.onClick?.();
                            if (action.to) navigate(action.to, { state: action.state });
                            dismissToast(id);
                        }}
                    >
                        {action.undo && <Undo2 className="h-4 w-4" aria-hidden />}
                        {action.label}
                    </button>
                )}
                <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() => dismissToast(id)}
                    className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border-2 border-transparent transition-all hover:border-black hover:bg-slate-100"
                >
                    <X className="h-5 w-5" aria-hidden />
                </button>
            </div>
            {action?.undo && duration > 0 && (
                // How long the undo lasts. Still when reduced motion is asked for.
                <div aria-hidden className="h-1.5 border-t-2 border-black bg-slate-100 motion-reduce:hidden">
                    <div
                        key={version}
                        className="h-full origin-left animate-toast-timer bg-neo-primary"
                        style={{ animationDuration: `${duration}ms`, animationPlayState: frozen ? "paused" : "running" }}
                    />
                </div>
            )}
        </motion.div>
    );
}

// One stack, bottom-right on a desktop and full width along the bottom on a
// phone. Failures live in their own assertive region so they interrupt;
// everything else is announced politely. Both regions are always mounted, which
// is what makes a screen reader announce what is added to them.
export function Toaster() {
    const toasts = useToasts();
    useUndoShortcut();
    useEffect(showParkedToast, []);

    return createPortal(
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] pb-[env(safe-area-inset-bottom)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-96">
            <div role="status" aria-live="polite">
                <AnimatePresence initial={false}>
                    {toasts.filter((t) => t.kind !== "error").map((t) => (
                        <ToastCard key={t.id} toast={t} />
                    ))}
                </AnimatePresence>
            </div>
            <div role="alert">
                <AnimatePresence initial={false}>
                    {toasts.filter((t) => t.kind === "error").map((t) => (
                        <ToastCard key={t.id} toast={t} />
                    ))}
                </AnimatePresence>
            </div>
        </div>,
        document.body
    );
}
