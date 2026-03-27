
import React, { useState } from 'react';
import { Brain, ThumbsUp, ThumbsDown, X, CornerDownLeft } from 'lucide-react';
import { aiLearning } from '../services/aiLearning';
import { useDoctorContext } from '../hooks/useDoctorContext';

interface DifficultyPromptProps {
    isOpen: boolean;
    context: string; // e.g. "Root Canal"
    onClose: () => void;
    onSubmit: () => void;
}

export const DifficultyPrompt: React.FC<DifficultyPromptProps> = ({
    isOpen,
    context,
    onClose,
    onSubmit
}) => {
    const { currentDoctorId } = useDoctorContext();
    const [step, setStep] = useState<'initial' | 'reason'>('initial');
    const [reason, setReason] = useState('');

    if (!isOpen) {
        return null;
    }

    const handleEasy = () => {
        // Record as Easy immediately
        aiLearning.recordDecision({
            userId: currentDoctorId || 'unknown',
            doctorId: currentDoctorId || 'unknown',
            actionType: 'complete_procedure',
            context,
            difficulty: 'easy',
            reason: ''
        });
        onSubmit();
    };

    const handleHardClick = () => {
        setStep('reason');
    };

    const submitHardReason = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            return;
        }

        aiLearning.recordDecision({
            userId: currentDoctorId || 'unknown',
            doctorId: currentDoctorId || 'unknown',
            actionType: 'complete_procedure',
            context,
            difficulty: 'hard',
            reason: reason.trim()
        });
        onSubmit();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-gray-900 w-full max-w-sm rounded-3xl border border-violet-500/30 shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-violet-600/10 p-4 border-b border-violet-500/20 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Brain className="text-violet-400" size={20} />
                        <span className="text-white font-bold text-sm">تقييم الحالة (Difficulty Tracker)</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" title="إغلاق">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'initial' ? (
                        <>
                            <h3 className="text-lg font-bold text-white mb-6 text-center">
                                كيف كانت هذه الحالة ({context})؟
                            </h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleEasy}
                                    className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all font-bold"
                                >
                                    <ThumbsUp size={32} />
                                    سهلة / طبيعية
                                </button>
                                <button
                                    onClick={handleHardClick}
                                    className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500 text-rose-400 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all font-bold"
                                >
                                    <ThumbsDown size={32} />
                                    صعبة / مرهقة
                                </button>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={submitHardReason}>
                            <h3 className="text-lg font-bold text-white mb-2 text-center">
                                لماذا كانت صعبة؟
                            </h3>
                            <p className="text-xs text-gray-400 text-center mb-4">
                                ساعدني لأعرف الحالات التي ترهقك مستقبلاً
                            </p>

                            <div className="relative">
                                <input
                                    autoFocus
                                    type="text"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder="مثلاً: قنوات متكلسة، مريض قلق..."
                                    className="w-full bg-black/30 border border-gray-700 rounded-xl p-4 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-rose-500 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!reason.trim()}
                                    className="absolute left-2 top-2 bottom-2 bg-rose-600 hover:bg-rose-500 text-white w-10 h-10 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:bg-gray-700 transition-all"
                                    title="إرسال"
                                >
                                    <CornerDownLeft size={18} />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStep('initial')}
                                className="w-full mt-4 text-gray-500 hover:text-gray-300 text-xs"
                            >
                                عودة
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
