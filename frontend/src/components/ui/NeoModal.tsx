import { type ReactNode } from "react";
import { X } from "lucide-react";

interface NeoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}

export function NeoModal({ isOpen, onClose, title, children }: NeoModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Content */}
            <div className="relative w-full max-w-lg bg-white border-2 border-black shadow-neo-modal p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    {title && <h2 className="text-xl font-black uppercase">{title}</h2>}
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-red-100 border-2 border-transparent hover:border-black transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div>
                    {children}
                </div>
            </div>
        </div>
    );
}
