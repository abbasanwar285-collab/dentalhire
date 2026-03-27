/**
 * Smart Treatment Suggestions - اقتراحات علاجية ذكية
 * 
 * مكون يعرض اقتراحات علاجية ذكية بناءً على بيانات المريض باستخدام Gemini
 */

import React, { useState } from 'react';
import { Stethoscope, Sparkles, AlertCircle, DollarSign, Loader2, Zap } from 'lucide-react';
import { smartAIService } from '../services/smartAIService';
import { Patient } from '../types';
import { motion } from 'framer-motion';

interface SmartTreatmentSuggestionsProps {
    patientId: string;
    _patient?: Patient;
}

export const SmartTreatmentSuggestions: React.FC<SmartTreatmentSuggestionsProps> = ({
    patientId,
    _patient
}) => {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    const loadSuggestions = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await smartAIService.suggestSmartTreatments(patientId);
            setSuggestions(result.suggestions);
            setExpanded(true);
        } catch (err) {
            console.error('Treatment suggestions error:', err);
            setError('فشل في تحميل الاقتراحات');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'recommended': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'optional': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'عاجل';
            case 'recommended': return 'موصى به';
            case 'optional': return 'اختياري';
            default: return priority;
        }
    };

    if (!expanded && !loading && suggestions.length === 0) {
        return (
            <button
                onClick={loadSuggestions}
                className="w-full bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 hover:border-violet-500/50 p-6 rounded-3xl flex items-center justify-between group transition-all duration-300 shadow-lg hover:shadow-violet-900/20"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-600/20 text-violet-400 rounded-2xl group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300">
                        <Sparkles size={24} />
                    </div>
                    <div className="text-right">
                        <h3 className="font-bold text-white text-xl">اقتراحات علاجية ذكية</h3>
                        <p className="text-gray-400 text-sm mt-1">اضغط للحصول على اقتراحات مخصصة من AI</p>
                    </div>
                </div>
                <div className="bg-gray-800 p-3 rounded-full text-violet-400 group-hover:translate-x-[-5px] transition-transform duration-300">
                    <Zap size={24} />
                </div>
            </button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900/80 backdrop-blur-xl border border-violet-500/20 rounded-3xl overflow-hidden shadow-2xl"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                <div className="flex items-center gap-2">
                    <Stethoscope className="text-violet-400" size={20} />
                    <h3 className="font-bold text-white">اقتراحات علاجية ذكية</h3>
                </div>
                {loading && <Loader2 className="animate-spin text-violet-400" size={20} />}
                {!loading && suggestions.length > 0 && (
                    <button
                        onClick={() => setExpanded(false)}
                        className="text-xs text-gray-500 hover:text-white transition"
                    >
                        تصغير
                    </button>
                )}
            </div>

            {loading ? (
                <div className="p-10 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-violet-400 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-white mb-2">جاري التحليل...</h4>
                    <p className="text-sm text-gray-400">يقوم Gemini بتحليل حالة المريض وتوليد الاقتراحات</p>
                </div>
            ) : error ? (
                <div className="p-8 text-center text-rose-400 bg-rose-500/5">
                    <AlertCircle className="mx-auto mb-3" size={32} />
                    <p className="mb-4">{error}</p>
                    <button
                        onClick={loadSuggestions}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-bold transition"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            ) : suggestions.length > 0 ? (
                <div className="p-6 space-y-4">
                    {suggestions.map((suggestion, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`bg-gradient-to-r ${getPriorityColor(suggestion.priority)} border rounded-2xl p-5`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-lg">
                                        <Stethoscope className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">{suggestion.procedure}</h4>
                                        <span className={`text-xs px-2 py-1 rounded-md ${getPriorityColor(suggestion.priority)} inline-block mt-1`}>
                                            {getPriorityLabel(suggestion.priority)}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs bg-white/10 px-2 py-1 rounded-lg">
                                    {suggestion.aiConfidence}% ثقة
                                </div>
                            </div>

                            <p className="text-white/90 text-sm mb-3 leading-relaxed">{suggestion.reasoning}</p>

                            {suggestion.estimatedCost && (
                                <div className="flex items-center gap-2 text-sm">
                                    <DollarSign className="w-4 h-4 text-emerald-400" />
                                    <span className="text-emerald-400 font-bold">{suggestion.estimatedCost}</span>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            ) : null}
        </motion.div>
    );
};

export default SmartTreatmentSuggestions;

