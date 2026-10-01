import { useSyncExternalStore } from "react";

// A tiny toast store with no dependencies. Anything can call `notify.*` (a
// mutation callback, an event handler, outside React); <Toaster /> renders the
// list. Messages are plain strings and are only ever rendered as text, so a
// server message or a stored value can never inject markup.

export type ToastKind = "success" | "info" | "error";

// What the button does: run `onClick`, or go to `to` (kept as data, not a closure over
// a page that may be gone by the time it is pressed).
export interface ToastAction {
    label: string;
    onClick?: () => void;
    to?: string;
    state?: unknown;
    // An undo gets the Ctrl/Cmd+Z shortcut and a countdown bar.
    undo?: boolean;
}

export interface ToastOptions {
    // Reusing an id replaces that toast in place and restarts its timer, so a
    // burst of the same event (moving cards one after another) shows one toast.
    id?: string;
    description?: string;
    action?: ToastAction;
    // Milliseconds on screen. 0 keeps it until it is dismissed.
    duration?: number;
}

export interface ToastItem {
    id: string;
    version: number;
    kind: ToastKind;
    message: string;
    description?: string;
    action?: ToastAction;
    duration: number;
}

const MAX_VISIBLE = 3;
const MAX_MESSAGE = 200;
const MAX_DESCRIPTION = 300;
const FLASH_KEY = "interntrack:flash-toast";

// Long enough to read; an undo gets longer because it is a decision, and a
// failure stays until dismissed because the next step is the reader's.
function defaultDuration(kind: ToastKind, action?: ToastAction) {
    if (kind === "error") return 0;
    if (action) return 8000;
    return kind === "success" ? 4000 : 5000;
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

let items: ToastItem[] = [];
let counter = 0;
const listeners = new Set<() => void>();

function emit() {
    for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export const getToasts = () => items;

export function useToasts() {
    return useSyncExternalStore(subscribe, getToasts, getToasts);
}

function push(kind: ToastKind, message: string, options: ToastOptions = {}) {
    const id = options.id ?? `toast-${++counter}`;
    const previous = items.find((t) => t.id === id);
    const item: ToastItem = {
        id,
        version: (previous?.version ?? 0) + 1,
        kind,
        message: clip(message, MAX_MESSAGE),
        description: options.description ? clip(options.description, MAX_DESCRIPTION) : undefined,
        action: options.action,
        duration: options.duration ?? defaultDuration(kind, options.action),
    };
    items = previous ? items.map((t) => (t.id === id ? item : t)) : [...items, item].slice(-MAX_VISIBLE);
    emit();
    return id;
}

export function dismissToast(id: string) {
    if (!items.some((t) => t.id === id)) return;
    items = items.filter((t) => t.id !== id);
    emit();
}

const KINDS: ToastKind[] = ["success", "info", "error"];

// For the few moments the page is about to reload (account deleted, session
// expired): the toast is parked in sessionStorage and shown by the next load.
// It is treated as untrusted data: a known kind, a string, clipped.
function park(kind: ToastKind, message: string) {
    try {
        sessionStorage.setItem(FLASH_KEY, JSON.stringify({ kind, message: clip(message, MAX_MESSAGE) }));
    } catch {
        /* storage blocked: the page just reloads without the message */
    }
}

export function showParkedToast() {
    try {
        const raw = sessionStorage.getItem(FLASH_KEY);
        if (!raw) return;
        sessionStorage.removeItem(FLASH_KEY);
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return;
        const { kind, message } = parsed as { kind?: unknown; message?: unknown };
        if (typeof message !== "string" || !KINDS.includes(kind as ToastKind)) return;
        push(kind as ToastKind, message);
    } catch {
        /* unreadable: ignore */
    }
}

export const notify = {
    success: (message: string, options?: ToastOptions) => push("success", message, options),
    info: (message: string, options?: ToastOptions) => push("info", message, options),
    error: (message: string, options?: ToastOptions) => push("error", message, options),
    dismiss: dismissToast,
    // Show this after the next full page load.
    afterReload: park,
};
