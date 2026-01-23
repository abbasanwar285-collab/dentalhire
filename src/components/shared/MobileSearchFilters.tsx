'use client';

import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/shared';

interface MobileSearchFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    onReset: () => void;
    t: any; // Translation object
}

export default function MobileSearchFilters({ isOpen, onClose, children, onReset, t }: MobileSearchFiltersProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-white dark:bg-gray-900 animate-in slide-in-from-bottom-full duration-300">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal size={20} className="text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.filters}</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 pb-24 custom-scrollbar">
                {children}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-3 pb-safe">
                <Button variant="outline" className="flex-1" onClick={onReset}>
                    {t.clearAll}
                </Button>
                <Button variant="primary" className="flex-1" onClick={onClose}>
                    {t.save} / {t.apply || 'Apply'}
                </Button>
            </div>
        </div>
    );
}
