import React from 'react';
import { cn } from '../../lib/utils';
import { ToothTreatment } from '../../types';
import { toothTreatmentsList } from '../../lib/data';

interface DentalChartProps {
    treatments: ToothTreatment[];
    onToothClick: (toothNumber: number) => void;
    selectedTooth?: number | null;
    readOnly?: boolean;
}

const TOP_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const BOTTOM_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

type ToothType = 'molar' | 'premolar' | 'canine' | 'incisor';

const getToothType = (num: number): ToothType => {
    const n = num % 10;
    if (n >= 6) return 'molar';
    if (n >= 4) return 'premolar';
    if (n === 3) return 'canine';
    return 'incisor';
};

const toothPaths: Record<ToothType, string> = {
    molar: "M4,18 C4,6 7,2 9,2 C11,2 11,9 12,14 C13,9 13,2 15,2 C17,2 20,6 20,18 C22,23 22,33 18,36 C15,38 13,34 12,34 C11,34 9,38 6,36 C2,33 2,23 4,18Z",
    premolar: "M6,18 C6,6 10,2 12,2 C14,2 18,6 18,18 C20,23 19,33 15,35 C14,36 12,33 12,33 C12,33 10,36 9,35 C5,33 4,23 6,18Z",
    canine: "M8,18 C8,6 10,2 12,2 C14,2 16,6 16,18 C18,23 17,31 12,36 C7,31 6,23 8,18Z",
    incisor: "M8,18 C8,6 10,2 12,2 C14,2 16,6 16,18 C18,22 17,34 16,36 C15,37 9,37 8,36 C7,34 6,22 8,18Z"
};

const ToothSVG = ({ type, isTop, color, treated, isSelected, hasMultipleTreatments }: {
    type: ToothType; isTop: boolean; color?: string; treated: boolean; isSelected: boolean; hasMultipleTreatments?: boolean;
}) => (
    <svg
        viewBox="0 0 24 38"
        className="w-full h-full pointer-events-none drop-shadow-sm"
        style={{ transform: isTop ? 'none' : 'scaleY(-1)' }}
    >
        {isSelected && (
            <path
                d={toothPaths[type]}
                fill="none"
                stroke="#0d9488"
                strokeWidth={5}
                strokeLinejoin="round"
                opacity={0.4}
                className="animate-pulse"
            />
        )}
        <path
            d={toothPaths[type]}
            fill={isSelected ? '#ccfbf1' : (color || '#FFFFFF')}
            stroke={isSelected ? '#0f766e' : (treated ? '#334155' : '#cbd5e1')}
            strokeWidth={isSelected ? 2.5 : (treated ? 1.8 : 1.2)}
            strokeLinejoin="round"
            className="transition-all duration-200"
        />
        {hasMultipleTreatments && !isSelected && (
            <circle cx="17" cy="8" r="3" fill={color || '#0d9488'} stroke="white" strokeWidth="1" />
        )}
    </svg>
);

export function DentalChart({ treatments, onToothClick, selectedTooth, readOnly = false }: DentalChartProps) {

    const getToothData = (num: number) => {
        const trs = treatments.filter(t => t.toothNumber === num);
        if (!trs.length) return { color: undefined, treatments: [], lastStatus: null };
        
        const lastTreatment = trs[trs.length - 1] as any;
        let color: string | undefined;
        
        if (!readOnly) {
            const listColor = toothTreatmentsList.find(x => x.name === lastTreatment.treatmentType)?.color;
            color = listColor || '#0d9488';
        } else {
            if (lastTreatment.planStatus === 'completed') {
                color = '#10b981';
            } else if (lastTreatment.planPaidAmount > 0) {
                color = '#f59e0b';
            } else {
                color = '#fcd34d';
            }
        }
        
        return {
            color,
            treatments: trs,
            lastStatus: lastTreatment.planStatus
        };
    };

    const getToothTreatments = (num: number) => {
        return treatments.filter(t => t.toothNumber === num);
    };

    const renderTooth = (num: number, isTop: boolean) => {
        const { color, treatments: toothTreatments } = getToothData(num);
        const treated = !!color;
        const type = getToothType(num);
        const isSelected = selectedTooth === num;
        const hasMultipleTreatments = toothTreatments.length > 1;

        return (
            <button
                key={num}
                onClick={() => { if (!readOnly) onToothClick(num); }}
                className={cn(
                    "flex flex-col items-center min-w-0 outline-none transition-all duration-200 group relative",
                    !readOnly && "cursor-pointer",
                    readOnly && "cursor-default",
                    isSelected && "scale-110 z-10",
                    !isSelected && !readOnly && "hover:scale-105 active:scale-95"
                )}
                style={{ width: '5.5%' }}
                aria-label={`سن ${num}${treated ? ' - ' + toothTreatments.map((t: any) => t.treatmentType).join(', ') : ''}`}
            >
                {isTop && (
                    <span className={cn(
                        "text-[9px] sm:text-[11px] font-bold leading-none mb-1.5 transition-colors duration-200",
                        isSelected ? "text-teal-600" : treated ? "text-slate-700" : "text-slate-400"
                    )}>
                        {num}
                    </span>
                )}
                <div className="w-full max-w-[20px] sm:max-w-[30px] aspect-[24/38] relative">
                    <ToothSVG 
                        type={type} 
                        isTop={isTop} 
                        color={color} 
                        treated={treated} 
                        isSelected={isSelected}
                        hasMultipleTreatments={hasMultipleTreatments}
                    />
                    {treated && !isSelected && (
                        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: color }} />
                    )}
                </div>
                {!isTop && (
                    <span className={cn(
                        "text-[9px] sm:text-[11px] font-bold leading-none mt-1.5 transition-colors duration-200",
                        isSelected ? "text-teal-600" : treated ? "text-slate-700" : "text-slate-400"
                    )}>
                        {num}
                    </span>
                )}
                
                {treated && !isSelected && (
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity -bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 z-50 text-white text-[10px] px-2 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl">
                        {toothTreatments.map((t: any) => t.treatmentType).slice(0, 2).join(', ')}
                        {toothTreatments.length > 2 && ` +${toothTreatments.length - 2}`}
                    </div>
                )}
            </button>
        );
    };

    return (
        <div className="w-full select-none py-4 sm:py-6">
            {/* Upper Jaw */}
            <div className="text-center mb-4">
                <span className="text-xs sm:text-sm font-semibold text-teal-700 tracking-wider bg-teal-50 px-4 py-2 rounded-full border border-teal-100">الفك العلوي</span>
            </div>

            <div className="relative w-full max-w-[800px] mx-auto px-2 sm:px-6">
                <div className="absolute top-1/2 -translate-y-1/2 right-0 sm:right-2 text-[10px] sm:text-[12px] font-bold text-slate-400">L</div>
                <div className="absolute top-1/2 -translate-y-1/2 left-0 sm:left-2 text-[10px] sm:text-[12px] font-bold text-slate-400">R</div>
                
                <div className="flex justify-between w-full">
                    {TOP_TEETH.map(num => renderTooth(num, true))}
                </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center my-5 sm:my-7">
                <div className="h-px w-[85%] bg-gradient-to-r from-transparent via-teal-200 to-transparent" />
                <div className="absolute bg-white px-2">
                    <div className="w-2 h-2 rounded-full bg-teal-400" />
                </div>
            </div>

            {/* Lower Jaw */}
            <div className="relative w-full max-w-[800px] mx-auto px-2 sm:px-6">
                <div className="absolute top-1/2 -translate-y-1/2 right-0 sm:right-2 text-[10px] sm:text-[12px] font-bold text-slate-400">L</div>
                <div className="absolute top-1/2 -translate-y-1/2 left-0 sm:left-2 text-[10px] sm:text-[12px] font-bold text-slate-400">R</div>
                
                <div className="flex justify-between w-full">
                    {BOTTOM_TEETH.map(num => renderTooth(num, false))}
                </div>
            </div>

            <div className="text-center mt-4">
                <span className="text-xs sm:text-sm font-semibold text-teal-700 tracking-wider bg-teal-50 px-4 py-2 rounded-full border border-teal-100">الفك السفلي</span>
            </div>

        </div>
    );
}
