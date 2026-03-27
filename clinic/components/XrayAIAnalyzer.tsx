import React, { useState } from 'react';
import {
    Scan,
    Loader2,
    AlertTriangle,
    CheckCircle,
    Info,
    X,
    Sparkles,
    Brain,
    ZoomIn
} from 'lucide-react';
import { geminiService, XrayAIAnalysis } from '../services/geminiService';

interface XrayAIAnalyzerProps {
    imageBase64: string;
    onClose: () => void;
}

export const XrayAIAnalyzer: React.FC<XrayAIAnalyzerProps> = ({ imageBase64, onClose }) => {
    const [analysis, setAnalysis] = useState<XrayAIAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isConfigured = geminiService.isConfigured();

    const handleAnalyze = async () => {
        if (!isConfigured) {
            setError('خدمة Gemini غير مُهيأة. يرجى إضافة VITE_GEMINI_API_KEY إلى ملف .env');
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const result = await geminiService.analyzeXray(imageBase64);
            setAnalysis(result);
        } catch (err) {
            console.error('X-ray analysis error:', err);
            setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التحليل');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
            case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
            case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
            default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
        }
    };

    const getSeverityLabel = (severity: string) => {
        switch (severity) {
            case 'high': return 'عالية';
            case 'medium': return 'متوسطة';
            case 'low': return 'منخفضة';
            default: return 'غير محدد';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-blue-900/30 to-violet-900/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">تحليل الأشعة بالذكاء الاصطناعي</h2>
                            <p className="text-sm text-gray-400">Powered by Google Gemini Vision</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="إغلاق"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Image Preview */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-400">صورة الأشعة</h3>
                            <div className="relative bg-gray-800 rounded-xl overflow-hidden">
                                <img
                                    src={imageBase64}
                                    alt="X-ray"
                                    className="w-full h-auto max-h-[400px] object-contain"
                                />
                                {!analysis && !isAnalyzing && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={!isConfigured}
                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium rounded-xl transition-all"
                                        >
                                            <Brain className="w-5 h-5" />
                                            تحليل بالذكاء الاصطناعي
                                        </button>
                                    </div>
                                )}
                                {isAnalyzing && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
                                        <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                                        <p className="text-white font-medium">جاري التحليل...</p>
                                        <p className="text-gray-400 text-sm">قد يستغرق هذا بضع ثوانٍ</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Analysis Results */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-400">نتائج التحليل</h3>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                        <div>
                                            <p className="text-red-400 font-medium">خطأ في التحليل</p>
                                            <p className="text-sm text-red-300 mt-1">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!analysis && !error && !isAnalyzing && (
                                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
                                    <Scan className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400">اضغط على تحليل بالذكاء الاصطناعي لبدء التحليل</p>
                                </div>
                            )}

                            {analysis && (
                                <div className="space-y-4">
                                    {/* Confidence & Severity */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-center">
                                            <p className="text-xs text-gray-500 mb-1">نسبة الثقة</p>
                                            <p className="text-2xl font-bold text-blue-400">{analysis.confidence}%</p>
                                        </div>
                                        <div className={`rounded-xl p-3 text-center border ${getSeverityColor(analysis.severity)}`}>
                                            <p className="text-xs opacity-70 mb-1">الشدة</p>
                                            <p className="text-2xl font-bold">{getSeverityLabel(analysis.severity)}</p>
                                        </div>
                                    </div>

                                    {/* Findings */}
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                                        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                            <ZoomIn className="w-4 h-4 text-blue-400" />
                                            النتائج المكتشفة
                                        </h4>
                                        <ul className="space-y-2">
                                            {analysis.findings.map((finding, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                                    <span className="w-5 h-5 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    {finding}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Recommendations */}
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                                        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            التوصيات
                                        </h4>
                                        <ul className="space-y-2">
                                            {analysis.recommendations.map((rec, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                                    <span className="text-green-400">•</span>
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Raw Analysis */}
                                    {analysis.rawAnalysis && (
                                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                                            <h4 className="text-sm font-medium text-white mb-2">التحليل التفصيلي</h4>
                                            <p className="text-sm text-gray-400 whitespace-pre-wrap">{analysis.rawAnalysis}</p>
                                        </div>
                                    )}

                                    {/* Disclaimer */}
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                                        <div className="flex items-start gap-2">
                                            <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-yellow-200">
                                                ⚠️ هذا التحليل للمساعدة فقط وليس بديلاً عن التشخيص الطبي المتخصص.
                                                يرجى استشارة طبيب الأسنان للتشخيص الدقيق.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            {isConfigured ? '✓ Gemini Vision متصل' : '✗ Gemini غير مُهيأ'}
                        </p>
                        <div className="flex items-center gap-3">
                            {analysis && (
                                <button
                                    onClick={handleAnalyze}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                                >
                                    إعادة التحليل
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm transition-colors"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default XrayAIAnalyzer;
