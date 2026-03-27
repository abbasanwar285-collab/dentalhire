import React from 'react';
import {
    Calendar as CalendarIcon,
    Edit, DollarSign,
    XCircle, Check,
    History, CheckCircle2, Trash2, Image
} from 'lucide-react';
import { Procedure } from '../../types';

export interface DoctorDisplay {
    name: string;
    badgeBg: string;
    badgeText: string;
}

export interface PaymentInputState {
    procId: string;
    amount: string;
}

export interface ProcedureItemProps {
    proc: Procedure;
    doctor: DoctorDisplay;
    onDelete: (id: string) => void;
    onAddPayment: (id: string) => void;
    onToggleHistory: (id: string) => void;
    showHistory: boolean;
    paymentInput: PaymentInputState | null;
    setPaymentInput: (val: PaymentInputState | null) => void;
    onViewXray: (images: string[]) => void;
    onOpenPaymentModal: (procId: string) => void;
    onComplete: (id: string) => void;
    onEdit: (proc: Procedure) => void;
    isSaving?: boolean;
    readOnly?: boolean;
}

export const ProcedureItem = React.memo(({
    proc,
    doctor,
    onDelete,
    onAddPayment,
    onToggleHistory,
    showHistory,
    paymentInput,
    setPaymentInput,
    onViewXray,
    onOpenPaymentModal,
    onComplete,
    onEdit,
    isSaving,
    readOnly
}: ProcedureItemProps) => {
    const isRootCanal = proc.type === 'حشوة جذر';
    const isPlanned = proc.status === 'planned';
    const procPaid = (proc.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const procRemaining = proc.price - procPaid;
    const percent = Math.min(100, Math.max(0, (procPaid / (proc.price || 1)) * 100));

    return (
        <div className={`backdrop-blur-md rounded-3xl p-5 shadow-sm border relative overflow-hidden group transition-all ${isPlanned ? 'bg-gray-800/40 border-dashed border-violet-500/30' : 'bg-gray-800/60 border-gray-700 hover:border-violet-500/30'}`}>
            <div className={`absolute top-0 right-0 w-1.5 h-full ${isPlanned ? 'bg-violet-500' : (procRemaining > 0 ? 'bg-orange-500' : 'bg-emerald-500')}`}></div>

            {/* Header */}
            <div className="flex justify-between items-start mb-3 pl-2">
                <div>
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                        {proc.type}
                        {proc.tooth && <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-md font-mono">{proc.tooth}</span>}
                    </h3>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                        <CalendarIcon size={12} /> {proc.date}
                        <span className={`px-2 py-0.5 rounded-md ${doctor.badgeBg} ${doctor.badgeText} font-bold`}>{doctor.name}</span>
                    </div>
                </div>
                {!readOnly && (
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); onEdit(proc);
                            }}
                            className="p-1.5 rounded-full text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition opacity-0 group-hover:opacity-100"
                            title="تعديل الإجراء"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); onDelete(proc.id);
                            }}
                            className="p-1.5 rounded-full text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
                            title="حذف الإجراء"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Financial Progress */}
            <div className="bg-gray-700/30 rounded-2xl p-4 mb-3 border border-gray-700/50">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                    <span>المبلغ: {proc.price.toLocaleString()}</span>
                    <span className={procRemaining > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                        {procRemaining > 0 ? `باقي: ${procRemaining.toLocaleString()}` : 'خالص'}
                    </span>
                </div>
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${procRemaining > 0 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                </div>
            </div>

            {/* Payment Actions */}
            {!readOnly && (
                <div className="flex flex-wrap gap-2 items-center">
                    {paymentInput && paymentInput.procId === proc.id ? (
                        <div className="flex-1 min-w-[200px] flex gap-2 animate-in fade-in slide-in-from-right-2 mt-1">
                            <input
                                type="number"
                                placeholder="المبلغ"
                                autoFocus
                                title="مبلغ الدفعة"
                                className="w-full p-2.5 rounded-xl bg-gray-700 text-white border border-violet-500/30 outline-none focus:ring-2 focus:ring-violet-500/20 text-sm"
                                value={paymentInput.amount}
                                onChange={e => setPaymentInput({ ...paymentInput, amount: e.target.value })}
                            />
                            <button
                                onClick={() => onAddPayment(proc.id)}
                                disabled={isSaving}
                                className="bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed shrink-0"
                                title="تأكيد الدفع"
                            >
                                <Check size={20} />
                            </button>
                            <button
                                onClick={() => setPaymentInput(null)}
                                className="bg-gray-700 text-gray-400 p-2.5 rounded-xl hover:bg-gray-600 transition shrink-0"
                                title="إلغاء"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => isRootCanal ? onOpenPaymentModal(proc.id) : setPaymentInput({ procId: proc.id, amount: '' })}
                            disabled={procRemaining <= 0}
                            className={`flex-1 min-w-[120px] py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${procRemaining <= 0 ? 'bg-gray-700/50 text-gray-600 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'}`}
                        >
                            <DollarSign size={16} />
                            إضافة دفعة
                        </button>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Complete Button (For Planned) */}
                        {isPlanned && (
                            <button
                                onClick={() => onComplete(proc.id)}
                                className="px-4 py-3.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition flex items-center gap-2 font-bold text-sm shadow-lg shadow-violet-600/20"
                            >
                                <CheckCircle2 size={18} />
                                إكمال
                            </button>
                        )}

                        {/* X-ray View Button */}
                        {proc.xrayImages && proc.xrayImages.length > 0 && (
                            <button
                                onClick={() => onViewXray(proc.xrayImages!)}
                                className="p-3 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition flex items-center gap-1.5"
                                title="عرض الأشعة"
                            >
                                <Image size={20} />
                                <span className="text-xs font-bold">{proc.xrayImages.length}</span>
                            </button>
                        )}

                        {(proc.payments && proc.payments.length > 0) && (
                            <button
                                onClick={() => onToggleHistory(proc.id)}
                                className={`p-3 rounded-xl border border-gray-700 transition ${showHistory ? 'bg-violet-600 text-white' : 'bg-gray-700/50 text-gray-400 hover:text-violet-400'}`}
                                title="سجل الدفعات"
                            >
                                <History size={20} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Payment History List */}
            {showHistory && (
                <div className="mt-3 bg-gray-700/30 rounded-xl p-3 space-y-2 animate-in slide-in-from-top-2 border border-gray-700/50">
                    <div className="text-xs font-bold text-gray-400 mb-1">سجل الدفعات:</div>
                    {proc.payments?.map(pay => (
                        <div key={pay.id} className="flex justify-between items-center text-sm bg-gray-800 p-2 rounded-lg border border-gray-700">
                            <span className="text-gray-400">{pay.date}</span>
                            <span className="font-bold text-emerald-400 dir-ltr">{pay.amount.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Notes Display */}
            {proc.notes && (
                <div className="mt-3 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                    <label className="text-[10px] font-bold text-yellow-500 block mb-1">ملاحظات</label>
                    <p className="text-sm text-gray-300">{proc.notes}</p>
                </div>
            )}
        </div>
    );
});

ProcedureItem.displayName = 'ProcedureItem';
