import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout, Package, TrendingUp, AlertCircle, CheckCircle, Lightbulb, Users, Brain, Loader2, Sparkles } from 'lucide-react';
import { managerService, ClinicHealthReport } from '../services/managerService';
import { inventoryService } from '../services/inventoryService';
import { grokService, SmartReport } from '../services/grokService';
import { db } from '../services/db';
import { OrderCandidate } from '../types';
// import { SmartPredictiveInsights } from '../components/SmartPredictiveInsights'; // TODO: Enable when ready

const ManagerDashboard: React.FC = () => {
    const [report, setReport] = useState<ClinicHealthReport | null>(null);
    const [restockList, setRestockList] = useState<OrderCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiReport, setAiReport] = useState<SmartReport | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [healthReport, restockCandidates] = await Promise.all([
                    managerService.generateClinicHealthReport(),
                    inventoryService.getRestockCandidates()
                ]);
                setReport(healthReport);
                setRestockList(restockCandidates);
            } catch (error) {
                console.error('Failed to load manager data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const generateAIReport = async () => {
        if (!grokService.isConfigured()) {
            return;
        }
        setAiLoading(true);
        try {
            const [patients, appointments, expenses, inventory] = await Promise.all([
                db.getPatients(),
                db.getAppointments(),
                db.getExpenses(),
                db.getInventory()
            ]);
            const smartReport = await grokService.generateSmartReport('weekly', {
                patients,
                appointments,
                expenses,
                inventory
            });
            setAiReport(smartReport);
        } catch (error) {
            console.error('Failed to generate AI report:', error);
        } finally {
            setAiLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">جاري تحليل بيانات العيادة...</div>;
    }

    return (
        <div className="p-6 pb-24 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">المدير الذكي (Iris Manager)</h1>
                    <p className="text-gray-500">نظرة شاملة وتوصيات لتحسين أداء العيادة</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-full">
                    <Layout className="text-indigo-600" size={24} />
                </div>
            </header>

            {/* Health Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatusCard
                    title="كفاءة الكادر"
                    value={report?.efficiencies.staff || ''}
                    icon={<Users className="text-blue-600" />}
                    color="blue"
                />
                <StatusCard
                    title="حالة المخزون"
                    value={report?.efficiencies.inventory || ''}
                    icon={<Package className="text-orange-600" />}
                    color="orange"
                />
                <StatusCard
                    title="المؤشر المالي"
                    value={report?.efficiencies.finance || ''}
                    icon={<TrendingUp className="text-emerald-600" />}
                    color="emerald"
                />
            </div>

            {/* AI Recommendations & Bottlenecks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bottlenecks */}
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="text-red-500" size={20} />
                        عقبات سير العمل (Bottlenecks)
                    </h2>
                    <div className="space-y-3">
                        {report?.bottlenecks.map((b, i) => (
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                key={i} className="flex gap-3 p-3 bg-red-50 rounded-xl"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2" />
                                <p className="text-red-800 text-sm">{b}</p>
                            </motion.div>
                        ))}
                        {report?.bottlenecks.length === 0 && (
                            <p className="text-gray-400 text-center py-4">لا توجد عقبات حالية. العمل يسير بسلاسة!</p>
                        )}
                    </div>
                </section>

                {/* Recommendations */}
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Lightbulb className="text-amber-500" size={20} />
                        توصيات ذكية
                    </h2>
                    <div className="space-y-3">
                        {report?.recommendations.map((r, i) => (
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                key={i} className="flex gap-3 p-3 bg-amber-50 rounded-xl"
                            >
                                <CheckCircle className="text-amber-600 shrink-0" size={18} />
                                <p className="text-amber-900 text-sm font-medium">{r}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </div>

            {/* AI Smart Reports Section */}
            <section className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-violet-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Brain className="text-violet-600" size={20} />
                        تقرير ذكي (Grok AI)
                    </h2>
                    <button
                        onClick={generateAIReport}
                        disabled={aiLoading || !grokService.isConfigured()}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 text-white rounded-xl text-sm font-bold transition"
                    >
                        {aiLoading ? (
                            <><Loader2 size={16} className="animate-spin" /> جاري التحليل...</>
                        ) : (
                            <><Sparkles size={16} /> إنشاء تقرير</>
                        )}
                    </button>
                </div>

                {!grokService.isConfigured() && (
                    <div className="text-center py-6 text-gray-500">
                        <Brain className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>خدمة Grok AI غير مُهيأة. أضف VITE_GROK_API_KEY إلى ملف .env</p>
                    </div>
                )}

                {grokService.isConfigured() && !aiReport && !aiLoading && (
                    <div className="text-center py-6 text-gray-500">
                        <Sparkles className="w-12 h-12 mx-auto mb-2 text-violet-400" />
                        <p>اضغط إنشاء تقرير للحصول على تحليل ذكي لأداء العيادة</p>
                    </div>
                )}

                {aiReport && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl p-4 border border-violet-100">
                            <h3 className="font-bold text-gray-900 mb-2">{aiReport.title}</h3>
                            <p className="text-gray-600 text-sm">{aiReport.summary}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Highlights */}
                            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                                    <CheckCircle size={16} /> الإنجازات
                                </h4>
                                <ul className="space-y-1">
                                    {aiReport.highlights.map((h, i) => (
                                        <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                                            <span className="text-emerald-500">•</span> {h}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Concerns */}
                            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                                <h4 className="font-bold text-rose-800 mb-2 flex items-center gap-2">
                                    <AlertCircle size={16} /> نقاط الاهتمام
                                </h4>
                                <ul className="space-y-1">
                                    {aiReport.concerns.map((c, i) => (
                                        <li key={i} className="text-sm text-rose-700 flex items-start gap-2">
                                            <span className="text-rose-500">•</span> {c}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Suggestions */}
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                            <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                                <Lightbulb size={16} /> اقتراحات ذكية
                            </h4>
                            <ul className="space-y-1">
                                {aiReport.suggestions.map((s, i) => (
                                    <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                                        <span className="text-amber-500">{i + 1}.</span> {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </section>

            {/* Smart Procurement List */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Package className="text-indigo-600" size={20} />
                        قائمة طلب المواد المقترحة
                    </h2>
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-bold">
                        {restockList.length} مواد مطلوبة
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {restockList.map((item, _i) => (
                        <div key={item.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 space-y-2">
                            <div className="flex justify-between">
                                <span className="font-bold text-gray-900">{item.name}</span>
                                <span className="text-red-500 font-bold">{item.currentQuantity} متبقي</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">الكمية المقترحة للطلب:</span>
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">
                                    {item.suggestedAmount} وحدة
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 italic">السبب: {item.reason}</p>
                        </div>
                    ))}
                    {restockList.length === 0 && (
                        <div className="col-span-full py-8 text-center text-gray-400">جميع المواد متوفرة بكثرة.</div>
                    )}
                </div>
            </section>
        </div>
    );
};

interface StatusCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: 'blue' | 'orange' | 'emerald';
}

const StatusCard: React.FC<StatusCardProps> = ({ title, value, icon, color }) => {
    const activeColors = {
        blue: 'bg-blue-50 border-blue-100',
        orange: 'bg-orange-50 border-orange-100',
        emerald: 'bg-emerald-50 border-emerald-100'
    };

    return (
        <div className={`p-5 rounded-2xl border ${activeColors[color]} flex items-center gap-4`}>
            <div className={`p-3 rounded-xl bg-white shadow-sm`}>
                {icon}
            </div>
            <div>
                <p className="text-gray-500 text-xs mb-0.5">{title}</p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
};

export default ManagerDashboard;
