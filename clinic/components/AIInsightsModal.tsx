import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, TrendingUp, AlertTriangle, CheckCircle2, Star, Users, History, Bell } from 'lucide-react';
import { managerService, ClinicHealthReport } from '../services/managerService';
import { inventoryService } from '../services/inventoryService';
import { useDoctorContext } from '../hooks/useDoctorContext';
import { aiLearning } from '../services/aiLearning';
import { auditService } from '../services/auditService';
import { db } from '../services/db';
import { SystemReport } from '../types';

interface AIInsightsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AIInsightsModal: React.FC<AIInsightsModalProps> = ({ isOpen, onClose }) => {
    const { currentDoctorId } = useDoctorContext();
    const [report, setReport] = useState<ClinicHealthReport | null>(null);
    const [aiStats, setAiStats] = useState<any>(null);
    const [systemReports, setSystemReports] = useState<SystemReport[]>([]);
    const [allUsersStats, setAllUsersStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'manager' | 'staff' | 'notifications'>('manager');
    const [learningProgress, setLearningProgress] = useState<{ active: boolean; text: string }>({ active: false, text: '' });

    const loadData = async () => {
        setLoading(true);
        try {
            const currentStats = await aiLearning.getStats(currentDoctorId);
            if (currentStats.learningScore < 5) {
                setLearningProgress({ active: true, text: 'أيريس تقوم بقراءة كامل سجل العيادة...' });
                const history = await auditService.getFullHistory(currentDoctorId);
                if (history.length > 0) {
                    await aiLearning.bulkLearn(currentDoctorId, history);
                }
            }

            await managerService.triggerDailyInternalReport();

            const [healthReport, , stats, , reports, userIds] = await Promise.all([
                managerService.generateClinicHealthReport(currentDoctorId),
                inventoryService.getRestockCandidates(),
                aiLearning.getStats(currentDoctorId),
                aiLearning.getUserPattern(currentDoctorId),
                (db as any).getReports(),
                (aiLearning as any).getAllUsers()
            ]);

            const userStats = await Promise.all(userIds.map(async (id: string) => {
                const s = await aiLearning.getStats(id);
                return { id, ...s };
            }));

            setReport(healthReport);
            setAiStats(stats);
            setSystemReports(reports);
            setAllUsersStats(userStats);
        } catch (error) {
            console.error('Failed to load insights:', error);
        } finally {
            setLoading(false);
            setLearningProgress({ active: false, text: '' });
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, currentDoctorId]);

    const handleMarkAsRead = async (id: string) => {
        await (db as any).markReportAsRead(id);
        setSystemReports(prev => prev.map(r => r.id === id ? { ...r, isRead: true } : r));
    };

    if (!isOpen) {
        return null;
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-gray-900 border border-violet-500/30 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.3)] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-violet-900/20 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="bg-violet-600/20 p-3 rounded-2xl border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                                <Brain className="text-violet-400" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-violet-400">IRIS AI Manager</h2>
                                <p className="text-gray-400 text-xs mt-0.5">مركز الذكاء الاصطناعي والتحليل الرقمي</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-6 border-b border-gray-800">
                        <button
                            onClick={() => setActiveTab('manager')}
                            className={`px-4 py-4 text-sm font-medium transition-all relative ${activeTab === 'manager' ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} />
                                تقرير العيادة
                            </div>
                            {activeTab === 'manager' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('staff')}
                            className={`px-4 py-4 text-sm font-medium transition-all relative ${activeTab === 'staff' ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <div className="flex items-center gap-2">
                                <Users size={16} />
                                ذكاء الكادر
                            </div>
                            {activeTab === 'staff' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`px-4 py-4 text-sm font-medium transition-all relative ${activeTab === 'notifications' ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <div className="flex items-center gap-2">
                                <Bell size={16} />
                                تنبيهات أيريس
                                {systemReports.filter(r => !r.isRead).length > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                        {systemReports.filter(r => !r.isRead).length}
                                    </span>
                                )}
                            </div>
                            {activeTab === 'notifications' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        {loading ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                    className="relative"
                                >
                                    <div className="absolute inset-0 blur-xl bg-violet-500 opacity-20 animate-pulse" />
                                    <Brain size={48} className="text-violet-500 relative" />
                                </motion.div>
                                <p className="text-gray-500 text-sm animate-pulse font-medium">جاري تحليل البيانات وتحميل ملفات النوع الذكي...</p>
                                {learningProgress.active && (
                                    <div className="w-full max-w-xs px-6">
                                        <div className="text-[10px] text-violet-400 mb-2 text-center font-bold tracking-wider">{learningProgress.text}</div>
                                        <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                                className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full shadow-[0_0_10px_rgba(139,92,246,0.6)]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {activeTab === 'manager' && (
                                    <>
                                        {/* Quick Stats Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <HighlightCard
                                                icon={<Brain size={20} />}
                                                title="Iris IQ"
                                                value={`${aiStats?.learningScore || 0}%`}
                                                color="violet"
                                                subtitle="مستوى تعلم النظام"
                                            />
                                            <HighlightCard
                                                icon={<CheckCircle2 size={20} />}
                                                title="أداء الكادر"
                                                value={report?.efficiencies.staff || '-'}
                                                color="emerald"
                                                subtitle="اليوم مقارنة بالمعدل"
                                            />
                                            <HighlightCard
                                                icon={<TrendingUp size={20} />}
                                                title="الوضع المالي"
                                                value={report?.efficiencies.finance || '-'}
                                                color="blue"
                                                subtitle="كفاءة الدخل اليومي"
                                            />
                                        </div>

                                        {/* Recommendations & Bottlenecks */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <SectionContainer title="نصائح واقتراحات أيريس" icon={<Star className="text-amber-400" size={18} />}>
                                                <div className="space-y-3">
                                                    {report?.recommendations.map((rec, i) => (
                                                        <motion.div
                                                            initial={{ x: -20, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            transition={{ delay: i * 0.1 }}
                                                            key={i}
                                                            className="flex gap-3 p-3 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:bg-gray-800/60 transition-colors"
                                                        >
                                                            <div className="bg-emerald-500/10 p-1.5 rounded-lg h-fit">
                                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                                            </div>
                                                            <p className="text-gray-300 text-sm leading-relaxed">{rec}</p>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </SectionContainer>

                                            <SectionContainer title="تنبيهات ومعوقات العمل" icon={<AlertTriangle className="text-rose-400" size={18} />}>
                                                <div className="space-y-3">
                                                    {report?.bottlenecks.map((bot, i) => (
                                                        <motion.div
                                                            initial={{ x: 20, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            transition={{ delay: i * 0.1 }}
                                                            key={i}
                                                            className="flex gap-3 p-3 bg-rose-500/5 rounded-xl border border-rose-500/10"
                                                        >
                                                            <div className="bg-rose-500/10 p-1.5 rounded-lg h-fit">
                                                                <AlertTriangle size={14} className="text-rose-400" />
                                                            </div>
                                                            <p className="text-gray-300 text-sm leading-relaxed">{bot}</p>
                                                        </motion.div>
                                                    ))}
                                                    {report?.bottlenecks.length === 0 && (
                                                        <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">لا توجد معوقات مسجلة حالياً ✨</div>
                                                    )}
                                                </div>
                                            </SectionContainer>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'staff' && (
                                    <div className="space-y-4">
                                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                            <Users size={18} className="text-violet-400" />
                                            متابعة ذكاء الموظفين
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {allUsersStats.map((user) => (
                                                <motion.div
                                                    key={user.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-gray-800/40 border border-gray-700 p-4 rounded-2xl flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold">
                                                            {user.id.includes('dr_') ? 'DR' : 'ST'}
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-medium">{user.id.replace('dr_', 'د. ').replace('_', ' ')}</div>
                                                            <div className="text-xs text-gray-500">{user.totalActions} عملية مسجلة</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-8">
                                                        <div className="text-right">
                                                            <div className="text-xs text-gray-400 mb-1">نسبة التعلم (IQ)</div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-violet-500"
                                                                        style={{ width: `${user.learningScore}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-violet-400 font-bold text-sm">{user.learningScore}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right min-w-[100px]">
                                                            <div className="text-xs text-gray-400 mb-1">أهم نشاط</div>
                                                            <div className="text-white text-sm truncate">{user.topActions[0] || 'غير محدد'}</div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-white font-bold flex items-center gap-2">
                                                <Bell size={18} className="text-violet-400" />
                                                تنبيهات أيريس الاستباقية
                                            </h3>
                                        </div>
                                        <div className="space-y-3">
                                            {systemReports.length === 0 ? (
                                                <div className="text-center py-10 text-gray-500 italic">لا توجد تنبيهات جديدة من أيريس</div>
                                            ) : (
                                                systemReports.map((r) => (
                                                    <motion.div
                                                        key={r.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className={`p-4 rounded-2xl border ${r.isRead ? 'bg-gray-800/20 border-gray-800 opacity-60' : 'bg-gray-800/60 border-violet-500/20 shadow-lg shadow-violet-500/5'}`}
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex gap-4">
                                                                <div className={`mt-1 p-2 rounded-xl ${r.impact === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                    r.impact === 'negative' ? 'bg-rose-500/10 text-rose-400' :
                                                                        'bg-blue-500/10 text-blue-400'
                                                                    }`}>
                                                                    {r.type === 'staff_performance' ? <Users size={20} /> : <AlertTriangle size={20} />}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-white flex items-center gap-2">
                                                                        {r.title}
                                                                        {!r.isRead && <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-ping" />}
                                                                    </div>
                                                                    <p className="text-gray-300 text-sm mt-1 leading-relaxed">{r.content}</p>
                                                                    <div className="text-[10px] text-gray-500 mt-2 flex items-center gap-2 text-left" dir="ltr">
                                                                        <History size={10} />
                                                                        {new Date(r.timestamp).toLocaleString('ar-EG')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {!r.isRead && (
                                                                <button
                                                                    onClick={() => handleMarkAsRead(r.id)}
                                                                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors whitespace-nowrap"
                                                                >
                                                                    تمييز كمقروء
                                                                </button>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-800 bg-gray-950/50 flex justify-center">
                        <p className="text-[10px] text-gray-600 font-mono tracking-widest uppercase">Autonomous Intelligence Engine • V2.0 Enterprise</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const HighlightCard = ({ icon, title, value, color, subtitle }: any) => {
    const colors: any = {
        violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    };

    return (
        <div className={`p-4 rounded-ex-2xl border ${colors[color]} flex flex-col gap-2`}>
            <div className="flex items-center gap-2 opacity-80">
                {icon}
                <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
            </div>
            <div className="text-2xl font-black">{value}</div>
            <p className="text-[10px] text-gray-500">{subtitle}</p>
        </div>
    );
};

const SectionContainer = ({ title, icon, children }: any) => (
    <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2 px-1">
            {icon}
            {title}
        </h3>
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 min-h-[200px]">
            {children}
        </div>
    </div>
);

