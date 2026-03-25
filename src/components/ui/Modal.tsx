import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <ModalContent onClose={onClose} title={title}>{children}</ModalContent>
    );
}

function ModalContent({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 animate-fade-in" />

            <div
                className="relative w-full sm:w-[500px] min-w-[320px] max-w-[95%] sm:max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-2.5 pb-0 sm:hidden">
                    <div className="w-9 h-[5px] rounded-full bg-[rgba(60,60,67,0.18)]" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                    <h2 className="text-[17px] font-bold text-slate-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-[30px] h-[30px] rounded-full bg-apple-fill-secondary flex items-center justify-center text-apple-text-secondary hover:bg-[rgba(120,120,128,0.18)] transition-colors active:scale-90"
                        title="إغلاق"
                    >
                        <X className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-5 pb-24 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {children}
                </div>
            </div>
        </div>
    );
}
