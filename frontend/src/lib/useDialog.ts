import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Keyboard behaviour every overlay needs: Escape closes, Tab stays inside,
// focus moves in when it opens and returns to whatever opened it. The container
// needs tabIndex={-1} so it can take focus when it has nothing focusable.
export function useDialog(ref: RefObject<HTMLElement | null>, active: boolean, onClose: () => void) {
    // Kept in a ref so a new onClose each render doesn't re-run the effect
    // (which would steal focus back to the first control on every keystroke).
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        const node = ref.current;
        if (!active || !node) return;

        const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
        (focusables()[0] ?? node).focus();

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                e.stopPropagation();
                onCloseRef.current();
                return;
            }
            if (e.key !== "Tab") return;

            const items = focusables();
            if (items.length === 0) {
                e.preventDefault();
                node!.focus();
                return;
            }
            const first = items[0];
            const last = items[items.length - 1];
            const current = document.activeElement;
            if (e.shiftKey && (current === first || current === node)) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && current === last) {
                e.preventDefault();
                first.focus();
            }
        }

        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            opener?.focus();
        };
    }, [active, ref]);
}
