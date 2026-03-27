import React, { useState } from 'react';
import {
    Key,
    Check,
    X,
    Loader2,
    Brain,
    AlertCircle,
    RefreshCw,
    ExternalLink,
    Sparkles
} from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import { grokService } from '../../services/grokService';

interface ConnectionStatus {
    gemini: { checked: boolean; connected: boolean; message: string };
    grok: { checked: boolean; connected: boolean; message: string };
}

const AISettings: React.FC = () => {
    const [status, setStatus] = useState<ConnectionStatus>({
        gemini: { checked: false, connected: false, message: '' },
        grok: { checked: false, connected: false, message: '' }
    });
    const [testing, setTesting] = useState<{ gemini: boolean; grok: boolean }>({
        gemini: false,
        grok: false
    });

    const geminiConfigured = geminiService.isConfigured();
    const grokConfigured = grokService.isConfigured();

    const testGemini = async () => {
        setTesting(prev => ({ ...prev, gemini: true }));
        try {
            const result = await geminiService.testConnection();
            setStatus(prev => ({
                ...prev,
                gemini: { checked: true, connected: result.success, message: result.message }
            }));
        } catch (error) {
            setStatus(prev => ({
                ...prev,
                gemini: { checked: true, connected: false, message: 'فشل الاتصال' }
            }));
        } finally {
            setTesting(prev => ({ ...prev, gemini: false }));
        }
    };

    const testGrok = async () => {
        setTesting(prev => ({ ...prev, grok: true }));
        try {
            const result = await grokService.testConnection();
            setStatus(prev => ({
                ...prev,
                grok: { checked: true, connected: result.success, message: result.message }
            }));
        } catch (error) {
            setStatus(prev => ({
                ...prev,
                grok: { checked: true, connected: false, message: 'فشل الاتصال' }
            }));
        } finally {
            setTesting(prev => ({ ...prev, grok: false }));
        }
    };

    const testAll = () => {
        if (geminiConfigured) {
            testGemini();
        }
        if (grokConfigured) {
            testGrok();
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                        <Brain className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">إعدادات الذكاء الاصطناعي (Dual AI)</h1>
                        <p className="text-gray-400">إدارة خدمات Gemini و Grok المتكاملة</p>
                    </div>
                </div>

                {/* Status Overview */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">حالة الخدمات</h2>
                        <button
                            onClick={testAll}
                            disabled={testing.gemini || testing.grok}
                            className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 rounded-lg text-sm transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${(testing.gemini || testing.grok) ? 'animate-spin' : ''}`} />
                            اختبار الكل
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {/* Gemini Status */}
                        <div className="bg-gray-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${geminiConfigured ? 'bg-blue-500/20' : 'bg-gray-700'}`}>
                                        <Sparkles className={`w-5 h-5 ${geminiConfigured ? 'text-blue-400' : 'text-gray-500'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Google Gemini (الطبيب)</h3>
                                        <p className="text-sm text-gray-400">
                                            {geminiConfigured ? 'مُفعّل' : 'غير مُهيأ'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {status.gemini.checked && (
                                        <span className={`flex items-center gap-1 text-sm ${status.gemini.connected ? 'text-green-400' : 'text-red-400'}`}>
                                            {status.gemini.connected ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                            {status.gemini.connected ? 'متصل' : 'غير متصل'}
                                        </span>
                                    )}
                                    <button
                                        onClick={testGemini}
                                        disabled={!geminiConfigured || testing.gemini}
                                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg text-sm transition-colors"
                                    >
                                        {testing.gemini ? <Loader2 className="w-4 h-4 animate-spin" /> : 'اختبار'}
                                    </button>
                                </div>
                            </div>

                            {status.gemini.checked && status.gemini.message && (
                                <div className={`mt-3 p-2 rounded-lg text-sm ${status.gemini.connected ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
                                    {status.gemini.message.substring(0, 100)}
                                </div>
                            )}
                        </div>

                        {/* Grok Status */}
                        <div className="bg-gray-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${grokConfigured ? 'bg-orange-500/20' : 'bg-gray-700'}`}>
                                        <Brain className={`w-5 h-5 ${grokConfigured ? 'text-orange-400' : 'text-gray-500'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">xAI Grok (المدير)</h3>
                                        <p className="text-sm text-gray-400">
                                            {grokConfigured ? 'مُفعّل' : 'غير مُهيأ'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {status.grok.checked && (
                                        <span className={`flex items-center gap-1 text-sm ${status.grok.connected ? 'text-green-400' : 'text-red-400'}`}>
                                            {status.grok.connected ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                            {status.grok.connected ? 'متصل' : 'غير متصل'}
                                        </span>
                                    )}
                                    <button
                                        onClick={testGrok}
                                        disabled={!grokConfigured || testing.grok}
                                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg text-sm transition-colors"
                                    >
                                        {testing.grok ? <Loader2 className="w-4 h-4 animate-spin" /> : 'اختبار'}
                                    </button>
                                </div>
                            </div>

                            {status.grok.checked && status.grok.message && (
                                <div className={`mt-3 p-2 rounded-lg text-sm ${status.grok.connected ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
                                    {status.grok.message.substring(0, 100)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Features Overview */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">الميزات المتاحة</h2>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Gemini Features */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-blue-400 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Dr. Gemini (الطبي)
                                </h3>
                                <ul className="text-sm text-gray-400 space-y-1">
                                    <li className={geminiConfigured ? 'text-gray-300' : 'opacity-50'}>
                                        ✦ تحليل صور الأشعة والتشخيص
                                    </li>
                                    <li className={geminiConfigured ? 'text-gray-300' : 'opacity-50'}>
                                        ✦ اقتراح خطط العلاج
                                    </li>
                                    <li className={geminiConfigured ? 'text-gray-300' : 'opacity-50'}>
                                        ✦ ملخص حالة المريض (Smart Summary)
                                    </li>
                                </ul>
                            </div>

                            {/* Grok Features */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-orange-400 flex items-center gap-2">
                                    <Brain className="w-4 h-4" />
                                    Mr. Grok (الإداري)
                                </h3>
                                <ul className="text-sm text-gray-400 space-y-1">
                                    <li className={grokConfigured ? 'text-gray-300' : 'opacity-50'}>
                                        ✦ المستشار المالي والتحليل الاقتصادي
                                    </li>
                                    <li className={grokConfigured ? 'text-gray-300' : 'opacity-50'}>
                                        ✦ إدارة المخزون واقتراحات الشراء
                                    </li>
                                    <li className={grokConfigured ? 'text-gray-300' : 'opacity-50'}>
                                        ✦ التقارير الإدارية الذكية
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Getting API Keys */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Key className="w-5 h-5 text-yellow-400" />
                        الحصول على مفاتيح API
                    </h2>

                    <div className="space-y-4">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                            <h3 className="font-medium text-blue-400 mb-2">Google Gemini</h3>
                            <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                            >
                                <ExternalLink className="w-4 h-4" />
                                aistudio.google.com/apikey
                            </a>
                        </div>

                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                            <h3 className="font-medium text-orange-400 mb-2">xAI Grok</h3>
                            <a
                                href="https://console.x.ai/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300"
                            >
                                <ExternalLink className="w-4 h-4" />
                                console.x.ai
                            </a>
                        </div>

                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                            <div className="flex gap-2">
                                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                                <p className="text-sm text-yellow-200">
                                    أضف المفاتيح <code className="bg-gray-800 px-1 rounded">VITE_GEMINI_API_KEY</code> و <code className="bg-gray-800 px-1 rounded">VITE_GROK_API_KEY</code> إلى ملف <code className="bg-gray-800 px-1 rounded">.env</code> ثم أعد تشغيل التطبيق.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AISettings;
