import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown } from 'lucide-react';
import { smartMatch } from '../../lib/search';
import { cn } from '../../lib/utils';

export interface Option {
    value: string;
    label: string;
    subLabel?: string;
    color?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    searchPlaceholder?: string;
    showSearch?: boolean;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'اختر...',
    className,
    searchPlaceholder = 'بحث...',
    showSearch = true
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.value === value);

    useEffect(() => {
        // Only handle click outside if we want it, but for a fixed modal, the backdrop handles it!
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                // setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setFocusedIndex(-1);
            // Auto focus on open
            setTimeout(() => {
                if (showSearch && inputRef.current) {
                    inputRef.current.focus();
                } else if (modalRef.current) {
                    modalRef.current.focus();
                }
            }, 50);
        }
    }, [isOpen, showSearch]);

    useEffect(() => {
        setFocusedIndex(-1);
    }, [query]);

    const filteredOptions = query
        ? options.filter(opt => smartMatch(query, opt.label))
        : options;

    return (
        <div className={cn("relative w-full", className)} ref={wrapperRef}>
            <div
                className="flex items-center justify-between w-full cursor-pointer py-1 h-full"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={cn(
                    "text-[15px] truncate pr-1",
                    selectedOption ? "text-apple-text font-medium" : "text-apple-text-tertiary"
                )}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className="w-4 h-4 text-apple-text-tertiary shrink-0 ml-1" />
            </div>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-[2px] animate-fade-in"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                    />
                    <div
                        ref={modalRef}
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setFocusedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
                            } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setFocusedIndex(prev => Math.max(prev - 1, 0));
                            } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
                                    onChange(filteredOptions[focusedIndex].value);
                                    setIsOpen(false);
                                }
                            } else if (e.key === 'Escape') {
                                setIsOpen(false);
                            }
                        }}
                        className="fixed top-[10vh] left-1/2 -translate-x-1/2 w-[90vw] max-w-[340px] bg-white border-[1.5px] border-[#0071E3] shadow-[0_16px_50px_rgba(0,113,227,0.2)] rounded-2xl z-[10000] overflow-hidden animate-scale-in flex flex-col max-h-[50vh] outline-none"
                    >
                        {showSearch && (
                            <div className="p-3 border-b border-apple-separator/50 flex items-center gap-2.5 bg-[#0071E3]/5 shrink-0">
                                <Search className="w-5 h-5 text-[#0071E3] shrink-0" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="w-full bg-transparent border-none outline-none text-[16px] text-apple-text placeholder:text-[#0071E3]/60 font-medium font-sans"
                                    placeholder={searchPlaceholder}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
                        <div className="overflow-y-auto overscroll-contain flex-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, index) => (
                                    <div
                                        key={opt.value}
                                        className={cn(
                                            "flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors active:bg-apple-fill border-b border-apple-separator/30 last:border-0",
                                            opt.value === value ? 'bg-[#0071E3]/10 text-[#0071E3]' : 'text-apple-text hover:bg-apple-fill/80',
                                            index === focusedIndex && opt.value !== value ? 'bg-apple-fill/60' : ''
                                        )}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-2.5 flex-1">
                                            {opt.color && (
                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                                            )}
                                            <span className={cn("text-[15px]", opt.value === value ? "font-bold" : "font-medium")}>
                                                {opt.label}
                                            </span>
                                        </div>
                                        {opt.subLabel && (
                                            <span className={cn("text-[13px]", opt.value === value ? "text-[#0071E3] font-semibold" : "text-apple-text-secondary")}>
                                                {opt.subLabel}
                                            </span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-[15px] text-apple-text-secondary">
                                    لا توجد نتائج مطابقة
                                </div>
                            )}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}
