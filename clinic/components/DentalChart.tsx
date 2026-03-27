import React, { useState } from 'react';
import { TREATMENT_TYPES } from '../types';

// =============================================================================
// PROFESSIONAL DENTAL CHART - With Per-Tooth Treatment Selection
// =============================================================================

// Data structure: { toothId: treatmentType }
export type ToothTreatmentMap = Record<string, string>;

interface DentalChartProps {
    // New: Map of tooth -> treatment type
    toothTreatments: ToothTreatmentMap;
    onToothTreatmentChange: (treatments: ToothTreatmentMap) => void;
    readOnly?: boolean;
}

// FDI Numbering
const PERMANENT = {
    upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
    upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
    lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
    lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
};

const PRIMARY = {
    upperRight: [55, 54, 53, 52, 51],
    upperLeft: [61, 62, 63, 64, 65],
    lowerLeft: [71, 72, 73, 74, 75],
    lowerRight: [85, 84, 83, 82, 81],
};

// Get tooth type
const getType = (n: number): 'M' | 'P' | 'C' | 'I' => {
    const pos = n % 10;
    if (pos >= 6) {
return 'M';
}
    if (pos >= 4) {
return 'P';
}
    if (pos === 3) {
return 'C';
}
    return 'I';
};

// =============================================================================
// TREATMENT SELECTION MODAL
// =============================================================================

const TreatmentModal: React.FC<{
    toothId: string;
    currentTreatment?: string;
    onSelect: (treatment: string) => void;
    onRemove: () => void;
    onClose: () => void;
}> = ({ toothId, currentTreatment, onSelect, onRemove, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-xs overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-blue-600 px-4 py-3 text-center">
                    <div className="text-white font-bold text-lg">سن رقم {toothId}</div>
                    <div className="text-blue-200 text-xs">اختر نوع العلاج</div>
                </div>

                {/* Treatment Options */}
                <div className="p-3 max-h-[50vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                        {TREATMENT_TYPES.map(treatment => (
                            <button
                                key={treatment}
                                onClick={() => onSelect(treatment)}
                                className={`p-3 rounded-xl text-sm font-medium transition-all border ${currentTreatment === treatment
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                                        : 'bg-slate-700 text-slate-200 border-slate-600 hover:border-blue-400 hover:bg-slate-600'
                                    }`}
                            >
                                {treatment}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-700 p-3 flex gap-2">
                    {currentTreatment && (
                        <button
                            onClick={onRemove}
                            className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium border border-red-500/30 hover:bg-red-500/30"
                        >
                            إزالة السن
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium border border-slate-600 hover:bg-slate-600"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// REALISTIC TOOTH SVG COMPONENT
// =============================================================================

const RealisticTooth: React.FC<{
    id: number;
    isSelected: boolean;
    treatment?: string;
    isUpper: boolean;
    onClick: () => void;
}> = ({ id, isSelected, treatment, isUpper, onClick }) => {
    const type = getType(id);

    // Colors based on selection and treatment
    const crownColor = isSelected ? '#3B82F6' : '#F1F5F9';
    const rootColor = isSelected ? '#93C5FD' : '#CBD5E1';
    const strokeColor = isSelected ? '#1E40AF' : '#64748B';

    // Anatomically accurate SVG paths
    const renderTooth = () => {
        switch (type) {
            case 'M': // Molar
                return (
                    <svg viewBox="0 0 40 60" className="w-full h-full">
                        {isUpper ? (
                            <>
                                <path d="M8,22 Q6,8 10,2" stroke={rootColor} strokeWidth="4" fill="none" strokeLinecap="round" />
                                <path d="M20,22 L20,4" stroke={rootColor} strokeWidth="4" fill="none" strokeLinecap="round" />
                                <path d="M32,22 Q34,8 30,2" stroke={rootColor} strokeWidth="4" fill="none" strokeLinecap="round" />
                                <path d="M4,22 L4,38 Q4,48 10,50 Q15,52 20,50 Q25,52 30,50 Q36,48 36,38 L36,22 Q36,18 30,16 Q25,14 20,16 Q15,14 10,16 Q4,18 4,22 Z"
                                    fill={crownColor} stroke={strokeColor} strokeWidth="1.5" />
                                <path d="M10,28 Q20,35 30,28" stroke={strokeColor} strokeWidth="0.5" fill="none" opacity="0.4" />
                            </>
                        ) : (
                            <>
                                <path d="M12,38 Q10,52 14,58" stroke={rootColor} strokeWidth="4" fill="none" strokeLinecap="round" />
                                <path d="M28,38 Q30,52 26,58" stroke={rootColor} strokeWidth="4" fill="none" strokeLinecap="round" />
                                <path d="M4,38 L4,22 Q4,12 10,10 Q15,8 20,10 Q25,8 30,10 Q36,12 36,22 L36,38 Q36,42 30,44 Q25,46 20,44 Q15,46 10,44 Q4,42 4,38 Z"
                                    fill={crownColor} stroke={strokeColor} strokeWidth="1.5" />
                                <path d="M10,32 Q20,25 30,32" stroke={strokeColor} strokeWidth="0.5" fill="none" opacity="0.4" />
                            </>
                        )}
                    </svg>
                );

            case 'P': // Premolar
                return (
                    <svg viewBox="0 0 32 55" className="w-full h-full">
                        {isUpper ? (
                            <>
                                <path d="M16,20 Q14,8 16,2" stroke={rootColor} strokeWidth="4" fill="none" strokeLinecap="round" />
                                <path d="M6,20 L6,34 Q6,44 12,46 Q16,48 20,46 Q26,44 26,34 L26,20 Q26,14 20,12 Q16,10 12,12 Q6,14 6,20 Z"
                                    fill={crownColor} stroke={strokeColor} strokeWidth="1.5" />
                            </>
                        ) : (
                            <>
                                <path d="M16,35 Q14,47 16,53" stroke={rootColor} strokeWidth="4" fill="none" strokeLinecap="round" />
                                <path d="M6,35 L6,21 Q6,11 12,9 Q16,7 20,9 Q26,11 26,21 L26,35 Q26,41 20,43 Q16,45 12,43 Q6,41 6,35 Z"
                                    fill={crownColor} stroke={strokeColor} strokeWidth="1.5" />
                            </>
                        )}
                    </svg>
                );

            case 'C': // Canine
                return (
                    <svg viewBox="0 0 28 58" className="w-full h-full">
                        {isUpper ? (
                            <>
                                <path d="M14,22 Q12,10 14,2" stroke={rootColor} strokeWidth="4" fill="none" strokeLinecap="round" />
                                <path d="M6,22 L6,34 Q6,42 10,46 L14,50 L18,46 Q22,42 22,34 L22,22 Q22,16 18,14 Q14,12 10,14 Q6,16 6,22 Z"
                                    fill={crownColor} stroke={strokeColor} strokeWidth="1.5" />
                            </>
                        ) : (
                            <>
                                <path d="M14,36 Q12,48 14,56" stroke={rootColor} strokeWidth="4" fill="none" strokeLinecap="round" />
                                <path d="M6,36 L6,24 Q6,16 10,12 L14,8 L18,12 Q22,16 22,24 L22,36 Q22,42 18,44 Q14,46 10,44 Q6,42 6,36 Z"
                                    fill={crownColor} stroke={strokeColor} strokeWidth="1.5" />
                            </>
                        )}
                    </svg>
                );

            case 'I': // Incisor
            default:
                return (
                    <svg viewBox="0 0 24 52" className="w-full h-full">
                        {isUpper ? (
                            <>
                                <path d="M12,18 Q10,8 12,2" stroke={rootColor} strokeWidth="3" fill="none" strokeLinecap="round" />
                                <path d="M5,18 L5,32 Q5,40 9,42 L15,42 Q19,40 19,32 L19,18 Q19,12 15,10 L9,10 Q5,12 5,18 Z"
                                    fill={crownColor} stroke={strokeColor} strokeWidth="1.5" />
                                <path d="M7,38 L17,38" stroke={strokeColor} strokeWidth="0.5" opacity="0.4" />
                            </>
                        ) : (
                            <>
                                <path d="M12,34 Q10,44 12,50" stroke={rootColor} strokeWidth="3" fill="none" strokeLinecap="round" />
                                <path d="M5,34 L5,20 Q5,12 9,10 L15,10 Q19,12 19,20 L19,34 Q19,40 15,42 L9,42 Q5,40 5,34 Z"
                                    fill={crownColor} stroke={strokeColor} strokeWidth="1.5" />
                                <path d="M7,14 L17,14" stroke={strokeColor} strokeWidth="0.5" opacity="0.4" />
                            </>
                        )}
                    </svg>
                );
        }
    };

    // Compact widths for mobile
    const widths: Record<string, string> = {
        M: 'w-[22px]',
        P: 'w-[17px]',
        C: 'w-[15px]',
        I: 'w-[13px]'
    };

    return (
        <div
            id={`tooth-${id}`}
            onClick={onClick}
            className={`flex flex-col items-center cursor-pointer transition-all duration-150 hover:scale-110 ${widths[type]}`}
            style={{
                filter: isSelected ? 'drop-shadow(0 0 6px rgba(59,130,246,0.6))' : 'none'
            }}
        >
            {isUpper && (
                <span className={`text-[7px] font-bold leading-none ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}>
                    {id}
                </span>
            )}

            <div className="h-[38px] relative">
                {renderTooth()}
                {/* Treatment indicator */}
                {treatment && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-green-500 border border-green-300"></div>
                )}
            </div>

            {!isUpper && (
                <span className={`text-[7px] font-bold leading-none ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}>
                    {id}
                </span>
            )}
        </div>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const DentalChart: React.FC<DentalChartProps> = ({
    toothTreatments = {},
    onToothTreatmentChange,
    readOnly = false
}) => {
    const [isPermanent, setIsPermanent] = useState(true);
    const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
    const teeth = isPermanent ? PERMANENT : PRIMARY;

    const handleToothClick = (id: string) => {
        if (readOnly) {
return;
}
        setSelectedTooth(id);
    };

    const handleSelectTreatment = (treatment: string) => {
        if (selectedTooth) {
            onToothTreatmentChange({
                ...toothTreatments,
                [selectedTooth]: treatment
            });
            setSelectedTooth(null);
        }
    };

    const handleRemoveTooth = () => {
        if (selectedTooth) {
            const newTreatments = { ...toothTreatments };
            delete newTreatments[selectedTooth];
            onToothTreatmentChange(newTreatments);
            setSelectedTooth(null);
        }
    };

    const selectedTeethCount = Object.keys(toothTreatments).length;

    const renderQuadrant = (ids: number[], isUpper: boolean) => (
        <div className="flex justify-center items-end gap-[1px]">
            {ids.map(id => (
                <RealisticTooth
                    key={id}
                    id={id}
                    isSelected={!!toothTreatments[String(id)]}
                    treatment={toothTreatments[String(id)]}
                    isUpper={isUpper}
                    onClick={() => handleToothClick(String(id))}
                />
            ))}
        </div>
    );

    return (
        <>
            <div className="w-full bg-slate-800/60 backdrop-blur rounded-xl border border-slate-700/50 p-3 max-w-[360px] mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex bg-slate-900/80 rounded-lg p-0.5 text-[10px]">
                        <button
                            onClick={() => setIsPermanent(true)}
                            className={`px-2 py-1 rounded ${isPermanent ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                        >
                            دائمة
                        </button>
                        <button
                            onClick={() => setIsPermanent(false)}
                            className={`px-2 py-1 rounded ${!isPermanent ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                        >
                            لبنية
                        </button>
                    </div>

                    {selectedTeethCount > 0 ? (
                        <button onClick={() => onToothTreatmentChange({})} className="text-[10px] text-red-400">
                            مسح الكل ({selectedTeethCount})
                        </button>
                    ) : (
                        <span className="text-[10px] text-slate-500">انقر على سن لتحديد العلاج</span>
                    )}
                </div>

                {/* Chart Area */}
                <div className="bg-slate-900/40 rounded-lg p-2">

                    <div className="text-center text-[8px] text-slate-500 font-bold tracking-wider mb-1">
                        الفك العلوي
                    </div>

                    <div className="flex justify-center items-end">
                        {renderQuadrant(teeth.upperRight, true)}
                        <div className="w-[2px] h-[35px] bg-slate-600/50 mx-1"></div>
                        {renderQuadrant(teeth.upperLeft, true)}
                    </div>

                    <div className="h-px bg-slate-700/50 my-2"></div>

                    <div className="flex justify-center items-start">
                        {renderQuadrant(teeth.lowerRight, false)}
                        <div className="w-[2px] h-[35px] bg-slate-600/50 mx-1"></div>
                        {renderQuadrant(teeth.lowerLeft, false)}
                    </div>

                    <div className="text-center text-[8px] text-slate-500 font-bold tracking-wider mt-1">
                        الفك السفلي
                    </div>
                </div>

                {/* Selected Teeth with Treatments */}
                {selectedTeethCount > 0 && (
                    <div className="mt-3 space-y-1">
                        <div className="text-[9px] text-slate-400 font-medium">الأسنان المحددة:</div>
                        <div className="flex flex-wrap gap-1">
                            {Object.entries(toothTreatments)
                                .sort(([a], [b]) => Number(a) - Number(b))
                                .map(([tooth, treatment]) => (
                                    <div
                                        key={tooth}
                                        className="bg-slate-700/80 text-slate-200 px-2 py-1 rounded text-[9px] border border-slate-600 flex items-center gap-1"
                                    >
                                        <span className="font-bold text-blue-400">#{tooth}</span>
                                        <span className="text-slate-400">•</span>
                                        <span>{treatment}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Treatment Selection Modal */}
            {selectedTooth && (
                <TreatmentModal
                    toothId={selectedTooth}
                    currentTreatment={toothTreatments[selectedTooth]}
                    onSelect={handleSelectTreatment}
                    onRemove={handleRemoveTooth}
                    onClose={() => setSelectedTooth(null)}
                />
            )}
        </>
    );
};
