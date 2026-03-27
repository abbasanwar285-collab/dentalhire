/**
 * Smart Predictive Insights - تحليلات تنبؤية ذكية
 * 
 * مكون يعرض تنبؤات ذكية للمستقبل باستخدام Gemini + Grok
 */

import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Users, Zap, Brain, Loader2, AlertCircle, Target } from 'lucide-react';
import { smartAIService, PredictiveInsight } from '../services/smartAIService';
import { motion } from 'framer-motion';

export const SmartPredictiveInsights: React.FC = () => {
    const [insights, setInsights] = useState<PredictiveInsight[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            const predictions = await smartAIService.generatePredictiveInsights();
            setInsights(predictions);
        } catch (err) {
            console.error('Predictive insights error:', err);
            setError('فشل في تحميل التنبؤات');
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'revenue': return <DollarSign className="w-5 h-5" />;
            case 'patient_flow': return <Users className="w-5 h-5" />;
            case 'inventory': return <Target className="w-5 h-5" />;
            case 'appointment': return <Calendar className="w-5 h-5" />;
            default: return <Brain className="w-5 h-5" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'revenue': return 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400';
            case 'patient_flow': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400';
            case 'inventory': return 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400';
            case 'appointment': return 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400';
            default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/30 text-gray-400';
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) {
            return 'text-emerald-400';
        }
        if (confidence >= 60) {
            return 'text-amber-400';
        }
        return 'text-rose-400';
    };

    if (loading) {
        return (
            <div className="bg-gray-900/80 backdrop-blur-xl border border-violet-500/20 rounded-3xl p-8 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-violet-400 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">جاري تحليل المستقبل...</h3>
                <p className="text-gray-400 text-sm">يقوم الذكاء الاصطناعي بتحليل البيانات وتوليد التنبؤات</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-900/80 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">خطأ في التحميل</h3>
                <p className="text-gray-400 text-sm mb-4">{error}</p>
                <button
                    onClick={loadInsights}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition"
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    if (insights.length === 0) {
        return (
            <div className="bg-gray-900/80 backdrop-blur-xl border border-violet-500/20 rounded-3xl p-8 text-center">
                <Brain className="w-12 h-12 text-violet-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-white font-bold text-lg mb-2">لا توجد تنبؤات متاحة</h3>
                <p className="text-gray-400 text-sm">أضف المزيد من البيانات لرؤية التنبؤات</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-2xl border border-violet-500/30">
                        <Zap className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">التنبؤات الذكية</h3>
                        <p className="text-sm text-gray-400">تحليلات مستقبلية باستخدام AI</p>
                    </div>
                </div>
                <button
                    onClick={loadInsights}
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition"
                    title="تحديث"
                >
                    <Loader2 className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`bg-gradient-to-br ${getTypeColor(insight.type)} border rounded-3xl p-6 backdrop-blur-sm`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-xl">
                                    {getTypeIcon(insight.type)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm mb-1">
                                        {insight.type === 'revenue' ? 'تنبؤ الإيرادات' :
                                         insight.type === 'patient_flow' ? 'تدفق المرضى' :
                                         insight.type === 'inventory' ? 'المخزون' :
                                         insight.type === 'appointment' ? 'المواعيد' : 'تنبؤ عام'}
                                    </h4>
                                    <p className="text-xs opacity-70">{insight.timeframe}</p>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded-lg bg-white/10 ${getConfidenceColor(insight.confidence)} text-xs font-bold`}>
                                {insight.confidence}%
                            </div>
                        </div>

                        <p className="text-white text-sm mb-4 leading-relaxed">{insight.prediction}</p>

                        {insight.actionItems && insight.actionItems.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-xs font-bold mb-2 opacity-70">إجراءات مقترحة:</p>
                                <ul className="space-y-1">
                                    {insight.actionItems.map((action, actionIdx) => (
                                        <li key={actionIdx} className="text-xs text-white/90 flex items-start gap-2">
                                            <span className="text-violet-400 mt-1">•</span>
                                            <span>{action}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default SmartPredictiveInsights;

