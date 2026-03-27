import React from 'react';
import { ChevronDown, Lock, Trash2 } from 'lucide-react';
import { OrthoVisit } from '../../types';

export interface OrthoVisitItemProps {
    visit: OrthoVisit;
    index: number;
    totalVisits: number;
    isExpanded: boolean;
    onToggleExpand: (id: string) => void;
    onDelete: (id: string) => void;
    isOrthoUnlocked: boolean;
}

export const OrthoVisitItem = React.memo(({
    visit,
    index,
    totalVisits,
    isExpanded,
    onToggleExpand,
    onDelete,
    isOrthoUnlocked
}: OrthoVisitItemProps) => {
    return (
        <div
            onClick={() => onToggleExpand(visit.id)}
            className={`bg-gray-800/60 backdrop-blur-md rounded-2xl border transition-all cursor-pointer overflow-hidden ${isExpanded ? 'border-violet-500/50 shadow-md' : 'border-gray-700 shadow-sm hover:border-violet-500/30'}`}
        >
            <div className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="bg-gray-700 text-violet-400 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
                        #{totalVisits - index}
                    </div>
                    <div>
                        <div className="font-bold text-white">{visit.visitDate}</div>
                        <div className="text-xs text-gray-400 mt-0.5 max-w-[150px] truncate">{visit.procedure || 'زيارة دورية'}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isOrthoUnlocked ? (
                        visit.paymentReceived > 0 ? (
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg text-xs dir-ltr">
                                +{visit.paymentReceived.toLocaleString()}
                            </span>
                        ) : (
                            <span className="text-gray-500 text-xs">-</span>
                        )
                    ) : (
                        <Lock size={14} className="text-gray-600" />
                    )}
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="bg-gray-900/30 p-4 border-t border-gray-700 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 gap-3">
                        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">الإجراء / التفاصيل</label>
                            <p className="text-sm text-white font-medium">{visit.procedure || 'لا يوجد تفاصيل'}</p>
                        </div>
                        {visit.notes && (
                            <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                                <label className="text-[10px] font-bold text-yellow-500 block mb-1">ملاحظات</label>
                                <p className="text-sm text-gray-300">{visit.notes}</p>
                            </div>
                        )}
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">ID: {visit.id.slice(-4)}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); onDelete(visit.id);
                                }}
                                className="flex items-center gap-1 text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded-md transition"
                            >
                                <Trash2 size={12} /> حذف الزيارة
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

OrthoVisitItem.displayName = 'OrthoVisitItem';
