import React, { useState } from 'react';
import { grokService } from '../services/grokService';
import { geminiService } from '../services/geminiService';
import { TrendingUp, AlertTriangle, Wallet, Zap, Brain, Loader2, Target, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIFinancialInsightsProps {
    revenue: number;
    expenses: number;
    profit: number;
    topProcedures: { name: string; revenue: number }[];
    doctorPerformance: { name: string; revenue: number }[];
}

export const AIFinancialInsights: React.FC<AIFinancialInsightsProps> = ({
    revenue,
    expenses,
    profit,
    topProcedures,
    doctorPerformance
}) => {
    const [analysis, setAnalysis] = useState<{
        healthScore: number;
        profitabilityAnalysis: string;
        growthOpportunity: string;
        riskAlert: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const provider = 'grok'; // Default to Grok, no state needed if no toggle exposed

    const generateAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            let result;
            if (provider === 'grok' && grokService.isConfigured()) {
                result = await grokService.analyzeFinancialHealth({
                    revenue,
                    expenses,
                    profit,
                    topTreatments: topProcedures.map(p => p.name),
                    doctorPerformance
                });
            } else {
                // Fallback to Gemini if Grok not configured or selected
                result = await geminiService.analyzeFinancialHealth({
                    revenue,
                    expenses,
                    profit,
                    topTreatments: topProcedures.map(p => p.name),
                    doctorPerformance
                });
            }

            setAnalysis({
                ...result,
                healthScore: result.healthScore
            });
            setIsExpanded(true);
        } catch (err) {
            console.error(err);
            setError('فشل في تحليل البيانات. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) {
            return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
        }
        if (score >= 60) {
            return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
        }
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    };

    return (
        <div className="mb-8">
            {!isExpanded && !loading && !analysis ? (
                <button
                    onClick={generateAnalysis}
                    className="w-full bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 hover:border-violet-500/50 p-6 rounded-3xl flex items-center justify-between group transition-all duration-300 shadow-lg hover:shadow-violet-900/20"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-violet-600/20 text-violet-400 rounded-2xl group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300">
                            <Brain size={24} />
                        </div>
                        <div className="text-right">
                            <h3 className="font-bold text-white text-xl">المستشار المالي الذكي (Grok)</h3>
                            <p className="text-gray-400 text-sm mt-1">اضغط للكشف عن فرص النمو وتحليل المخاطر</p>
                        </div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-full text-violet-400 group-hover:translate-x-[-5px] transition-transform duration-300">
                        <ArrowUpRight size={24} />
                    </div>
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-900/80 backdrop-blur-xl border border-violet-500/20 rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                        <div className="flex items-center gap-2">
                            <Brain className="text-violet-400" size={20} />
                            <h3 className="font-bold text-white">تقرير الذكاء الاصطناعي المالي</h3>
                        </div>
                        {loading && <Loader2 className="animate-spin text-violet-400" size={20} />}
                        {!loading && analysis && (
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-xs text-gray-500 hover:text-white transition"
                            >
                                تصغير
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="p-10 text-center">
                            <div className="inline-block relative mb-4">
                                <Wallet size={48} className="text-gray-700 animate-pulse" />
                                <div className="absolute -top-2 -right-2">
                                    <Zap size={24} className="text-yellow-400 animate-bounce" />
                                </div>
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2">جاري تحليل الأرقام...</h4>
                            <p className="text-sm text-gray-400">يقوم الذكاء الاصطناعي بمراجعة الإيرادات وتحديد فرص النمو</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-rose-400 bg-rose-500/5">
                            <AlertTriangle className="mx-auto mb-3" size={32} />
                            <p className="mb-4">{error}</p>
                            <button
                                onClick={generateAnalysis}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-bold transition"
                            >
                                إعادة المحاولة
                            </button>
                        </div>
                    ) : analysis ? (
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Score Column */}
                            <div className="lg:col-span-1 space-y-4">
                                <div className={`aspect-square rounded-3xl flex flex-col items-center justify-center border-2 ${getScoreColor(analysis.healthScore)} relative overflow-hidden group`}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <span className="text-5xl font-black mb-2">{analysis.healthScore}</span>
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">الصحة المالية</span>
                                </div>
                                <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
                                    <div className="flex items-center gap-2 mb-2 text-blue-400">
                                        <Wallet size={18} />
                                        <span className="text-xs font-bold">صافي الربح</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white dir-ltr">
                                        {profit.toLocaleString()} <span className="text-sm font-normal text-gray-500">IQD</span>
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Column */}
                            <div className="lg:col-span-2 space-y-4 flex flex-col justify-center">
                                {/* Profit Analysis */}
                                <div className="bg-gray-800/30 rounded-2xl p-4 border-r-4 border-blue-500">
                                    <h4 className="text-blue-400 text-sm font-bold mb-2 flex items-center gap-2">
                                        <TrendingUp size={16} />
                                        تحليل الربحية
                                    </h4>
                                    <p className="text-gray-300 text-sm leading-relaxed">{analysis.profitabilityAnalysis}</p>
                                </div>

                                {/* Growth Opportunity */}
                                <div className="bg-gradient-to-r from-emerald-900/20 to-gray-800/30 rounded-2xl p-4 border border-emerald-500/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Target size={64} className="text-emerald-500" />
                                    </div>
                                    <h4 className="text-emerald-400 text-sm font-bold mb-2 flex items-center gap-2 relative z-10">
                                        <Zap size={16} />
                                        فرصة النمو 🚀
                                    </h4>
                                    <p className="text-white font-medium text-sm leading-relaxed relative z-10">{analysis.growthOpportunity}</p>
                                </div>

                                {/* Risk Alert */}
                                <div className="bg-rose-500/10 rounded-2xl p-4 border border-rose-500/20">
                                    <h4 className="text-rose-400 text-sm font-bold mb-2 flex items-center gap-2">
                                        <AlertTriangle size={16} />
                                        تنبيه المخاطر
                                    </h4>
                                    <p className="text-rose-200 text-sm leading-relaxed">{analysis.riskAlert}</p>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </motion.div>
            )}
        </div>
    );
};
