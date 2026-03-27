import React, { useState } from 'react';
import { geminiService, PatientSummary } from '../services/geminiService';
import { Patient } from '../types';
import { Brain, Sparkles, Activity, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface SmartPatientSummaryProps {
    patient: Patient;
}

export const SmartPatientSummary: React.FC<SmartPatientSummaryProps> = ({ patient }) => {
    const [summary, setSummary] = useState<PatientSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const generateSummary = async () => {
        if (!geminiService.isConfigured()) {
            setError('مفتاح Gemini API غير مُهيأ');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await geminiService.generatePatientSummary(patient);
            setSummary(result);
            setIsExpanded(true);
        } catch (err) {
            console.error(err);
            setError('فشل في إنشاء الملخص. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) {
            return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        }
        if (score >= 5) {
            return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        }
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    };

    return (
        <div className="mb-6">
            {!isExpanded && !loading && !summary ? (
                <button
                    onClick={generateSummary}
                    className="w-full bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600/30 hover:to-indigo-600/30 border border-violet-500/30 p-4 rounded-3xl flex items-center justify-between group transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-600/20 group-hover:scale-110 transition-transform duration-300">
                            <Brain size={20} />
                        </div>
                        <div className="text-right">
                            <h3 className="font-bold text-white text-lg">تحليل الملف الذكي</h3>
                            <p className="text-violet-300 text-xs">اضغط للحصول على ملخص شامل وتقييم للحالة</p>
                        </div>
                    </div>
                    <div className="bg-violet-600/20 p-2 rounded-full text-violet-300 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300">
                        <Sparkles size={20} />
                    </div>
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/60 backdrop-blur-md border border-violet-500/30 rounded-3xl overflow-hidden shadow-xl"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-700/50 flex justify-between items-center bg-gray-900/30">
                        <div className="flex items-center gap-2">
                            <Brain className="text-violet-400" size={20} />
                            <h3 className="font-bold text-white">تحليل Gemini الطبي</h3>
                        </div>
                        {loading && <Loader2 className="animate-spin text-violet-400" size={20} />}
                        {!loading && summary && (
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-xs text-gray-400 hover:text-white transition"
                            >
                                إخفاء
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block relative">
                                <Brain size={48} className="text-gray-700 animate-pulse" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles size={24} className="text-violet-500 animate-bounce" />
                                </div>
                            </div>
                            <p className="mt-4 text-violet-300 font-medium animate-pulse">جاري تحليل بيانات المريض...</p>
                            <p className="text-xs text-gray-500 mt-2">قراءة التاريخ المرضي، المواعيد، والمدفوعات</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center text-rose-300">
                            <AlertCircle className="mx-auto mb-2" size={32} />
                            <p>{error}</p>
                            <button
                                onClick={generateSummary}
                                className="mt-4 text-xs font-bold underline hover:text-rose-200"
                            >
                                إعادة المحاولة
                            </button>
                        </div>
                    ) : summary ? (
                        <div className="p-5 space-y-5">
                            {/* Top Stats Row */}
                            <div className="flex gap-4 items-stretch">
                                {/* Clinical Score */}
                                <div className={`flex-[1] p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${getScoreColor(summary.clinicalScore || 5)}`}>
                                    <div className="text-3xl font-black mb-1">{summary.clinicalScore || 5}/10</div>
                                    <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider">التقييم الصحي</div>
                                </div>

                                {/* Next Best Action */}
                                <div className="flex-[3] bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 rounded-2xl p-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2 text-violet-300">
                                            <Activity size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">الإجراء المقترح القادم</span>
                                        </div>
                                        <p className="text-white font-bold text-sm leading-relaxed">
                                            {summary.nextBestAction || 'لا يوجد إجراء محدد، يرجى مراجعة الطبيب.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary & Analysis */}
                            <div className="space-y-3">
                                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                                    <h4 className="text-gray-400 text-xs font-bold mb-2">ملخص الحالة</h4>
                                    <p className="text-gray-200 text-sm leading-relaxed">{summary.overview}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                                        <h4 className="text-emerald-400 text-xs font-bold mb-2">تقدم العلاج</h4>
                                        <p className="text-gray-300 text-xs leading-relaxed">{summary.treatmentProgress}</p>
                                    </div>
                                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                                        <h4 className="text-amber-400 text-xs font-bold mb-2">الوضع المالي</h4>
                                        <p className="text-gray-300 text-xs leading-relaxed">{summary.financialStatus}</p>
                                    </div>
                                </div>

                                {/* Recommendations List */}
                                {summary.recommendations && summary.recommendations.length > 0 && (
                                    <div className="bg-violet-500/5 rounded-xl p-4 border border-violet-500/10">
                                        <h4 className="text-violet-400 text-xs font-bold mb-3 flex items-center gap-2">
                                            <Sparkles size={14} />
                                            توصيات ذكية
                                        </h4>
                                        <ul className="space-y-2">
                                            {summary.recommendations.map((rec, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                                                    <CheckCircle2 size={14} className="text-violet-500 shrink-0 mt-0.5" />
                                                    <span>{rec}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </motion.div>
            )}
        </div>
    );
};
