import { type ReactNode, useId, useRef } from "react";
import { X } from "lucide-react";
import { useDialog } from "../../lib/useDialog";

interface NeoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    // Tailwind max-width class; the default suits short forms.
    widthClass?: string;
}

export function NeoModal({ isOpen, onClose, title, children, widthClass = "max-w-lg" }: NeoModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    useDialog(dialogRef, isOpen, onClose);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Content */}
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                tabIndex={-1}
                className={`relative w-full ${widthClass} max-h-[90vh] overflow-y-auto bg-white border-2 border-black shadow-neo-modal p-6 z-10 focus:outline-none`}
            >
                <div className="flex items-center justify-between mb-4">
                    {title && <h2 id={titleId} className="text-xl font-black uppercase">{title}</h2>}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="p-1 hover:bg-red-100 border-2 border-transparent hover:border-black transition-all"
                    >
                        <X className="w-6 h-6" aria-hidden />
                    </button>
                </div>
                <div>
                    {children}
                </div>
            </div>
        </div>
    );
}
