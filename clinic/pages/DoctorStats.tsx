import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, TrendingUp, Activity, ChevronLeft, Stethoscope, Calendar, Clock, Trophy, Target, Sparkles, Lock, Filter } from 'lucide-react';
import { db } from '../services/db';
import { DOCTORS } from '../types';
import { aiLearning } from '../services/aiLearning';

interface DoctorStats {
    doctorId: string;
    doctorName: string;
    totalPatients: number;
    totalProcedures: number;
    completedProcedures: number;
    totalRevenue: number; // Value of work done
    collectedRevenue: number; // Actual cash collected
    avgRevenuePerPatient: number;
    appointmentsToday: number;
    appointmentsThisWeek: number;
    topTreatments: { type: string; count: number }[];
    peakHours: number[];
    learningScore: number;
}

export const DoctorStatsPage: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DoctorStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

    // Date Filters
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });

    const loadStats = useCallback(async () => {
        setIsLoading(true);

        const patients = await db.getPatients();
        const appointments = await db.getAppointments();

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Calculate week range for appointments display (separate from statistics filter)
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const doctorStats: DoctorStats[] = [];

        for (const doctor of DOCTORS) {
            // Base filters for counts
            const doctorPatients = patients.filter(p =>
                p.procedures?.some(proc => proc.doctorId === doctor.id) ||
                p.orthoDoctorId === doctor.id
            );

            // Appointment Stats (kept separate from date filter for usefulness)
            const doctorAppointments = appointments.filter(a => a.doctorId === doctor.id);
            const todayApps = doctorAppointments.filter(a => a.date === todayStr);
            const weekApps = doctorAppointments.filter(a => {
                const appDate = new Date(a.date);
                return appDate >= weekStart && appDate <= weekEnd;
            });

            // --- Calculation Logic ---
            let totalProcedures = 0;       // Total procedures assigned in range
            let completedProcedures = 0;   // Completed procedures in range
            let totalRevenue = 0;          // Value of work done in range
            let collectedRevenue = 0;      // Cash collected in range
            const treatmentCounts: Record<string, number> = {};

            // 1. Process Procedures & Payments
            /* 
                We iterate through ALL patients and their data to find:
                a) Work Done: Procedures with date in [startDate, endDate]
                b) Income: Payments with date in [startDate, endDate]
            */
            for (const patient of patients) {
                // -- Procedures (Work Done & Value) --
                const docProcedures = patient.procedures?.filter(p => p.doctorId === doctor.id) || [];

                for (const proc of docProcedures) {
                    // Check if procedure date is within range
                    if (proc.date >= startDate && proc.date <= endDate) {
                        totalProcedures++;
                        if (proc.status === 'completed') {
                            completedProcedures++;
                            totalRevenue += proc.price || 0;
                            treatmentCounts[proc.type] = (treatmentCounts[proc.type] || 0) + 1;
                        }
                    }

                    // -- Payments (Cash Flow) --
                    // Check direct procedure payments
                    if (proc.payments) {
                        for (const payment of proc.payments) {
                            if (payment.date >= startDate && payment.date <= endDate) {
                                collectedRevenue += payment.amount;
                            }
                        }
                    }
                }

                // -- Ortho Logic --
                // If patient is assigned to this doctor for Ortho
                if (patient.orthoDoctorId === doctor.id) {
                    // Work Done for Ortho - Count active payments/visits as "work" or just one "Active Case" if active in this period?
                    // Let's count visits in this period as "Ortho Adjustments"
                    if (patient.orthoVisits) {
                        for (const visit of patient.orthoVisits) {
                            if (visit.visitDate >= startDate && visit.visitDate <= endDate) {
                                // Count as a "completed procedure" of type Ortho
                                completedProcedures++;
                                treatmentCounts['تقويم (جلسة)'] = (treatmentCounts['تقويم (جلسة)'] || 0) + 1;

                                // Income from visits
                                collectedRevenue += visit.paymentReceived || 0;
                            }
                        }
                    }
                }
            }

            // Top treatments
            const topTreatments = Object.entries(treatmentCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5) // Increased to 5
                .map(([type, count]) => ({ type, count }));

            // Get AI learning stats
            const aiStats = await aiLearning.getStats(doctor.id);

            doctorStats.push({
                doctorId: doctor.id,
                doctorName: doctor.name,
                totalPatients: doctorPatients.length, // Total lifetime patients
                totalProcedures,
                completedProcedures,
                totalRevenue,
                collectedRevenue,
                avgRevenuePerPatient: doctorPatients.length > 0
                    ? Math.round(totalRevenue / (doctorPatients.length || 1))
                    : 0, // This metric is a bit ambiguous with date filters, keeping as simple ratio
                appointmentsToday: todayApps.length,
                appointmentsThisWeek: weekApps.length,
                topTreatments,
                peakHours: aiStats.peakHours,
                learningScore: aiStats.learningScore
            });
        }

        setStats(doctorStats);
        setIsLoading(false);
    }, [startDate, endDate]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString() + ' IQD';
    };

    const getDoctorStyle = (doctorId: string) => {
        const doctor = DOCTORS.find(d => d.id === doctorId);
        return doctor || DOCTORS[0];
    };

    const selectedStats = selectedDoctor
        ? stats.find(s => s.doctorId === selectedDoctor)
        : null;

    const [isUnlocked, setIsUnlocked] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === '0005') {
            setIsUnlocked(true);
        } else {
            setPasswordError(true);
            setPasswordInput('');
        }
    };

    if (!isUnlocked) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900">
                <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xs border border-gray-700 p-8 text-center animate-in fade-in zoom-in duration-300">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-4 left-4 p-2 text-gray-500 hover:text-white transition"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className="w-20 h-20 bg-violet-600/10 text-violet-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-violet-600/5">
                        <Lock size={40} />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">المؤشرات والإحصائيات</h2>
                    <p className="text-gray-400 mb-6 text-sm">هذه الصفحة محمية، يرجى إدخال رمز الوصول للمتابعة</p>

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <div className="relative">
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={4}
                                autoFocus
                                value={passwordInput}
                                onChange={(e) => {
                                    setPasswordInput(e.target.value);
                                    setPasswordError(false);
                                }}
                                className={`w-full text-center text-3xl font-bold tracking-[0.5em] p-4 rounded-xl border outline-none bg-gray-900/50 text-white placeholder-gray-700 transition-all
                                    ${passwordError ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-gray-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'}
                                `}
                                placeholder="••••"
                            />
                        </div>

                        {passwordError && (
                            <p className="text-rose-400 text-sm animate-pulse font-medium">رمز الوصول غير صحيح</p>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-violet-600/20 active:scale-[0.98]"
                        >
                            دخول
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-2 px-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-800 rounded-xl transition"
                            aria-label="رجوع"
                            title="رجوع"
                        >
                            <ChevronLeft size={24} className="text-gray-400" />
                        </button>
                        <div className="p-2.5 bg-violet-600/20 text-violet-400 rounded-2xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">إحصائيات الأطباء</h2>
                            <p className="text-gray-400 text-xs mt-0.5">الدخل والأداء حسب الفترة</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-violet-500/20 text-violet-300 rounded-full text-xs">
                        <Sparkles size={12} />
                        AI Analysis
                    </div>
                </div>

                {/* Date Filters */}
                <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[140px]">
                        <label className="text-xs text-gray-400 mb-1.5 block">من تاريخ</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500 outline-none"
                        />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="text-xs text-gray-400 mb-1.5 block">إلى تاريخ</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500 outline-none"
                        />
                    </div>
                    <div className="pb-1 text-gray-400 text-xs flex items-center gap-1">
                        <Filter size={12} />
                        <span>يتم تصفية النتائج حسب الفترة المحددة</span>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-gray-400">جاري التحميل...</div>
            ) : (
                <>
                    {/* Doctor Cards Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {stats.map(docStats => {
                            const style = getDoctorStyle(docStats.doctorId);
                            const isSelected = selectedDoctor === docStats.doctorId;

                            return (
                                <div
                                    key={docStats.doctorId}
                                    onClick={() => setSelectedDoctor(isSelected ? null : docStats.doctorId)}
                                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${isSelected
                                        ? 'bg-violet-600/20 border-violet-500 shadow-lg shadow-violet-500/20'
                                        : 'bg-gray-800/60 border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.badgeBg}`}>
                                            <Stethoscope size={24} className={style.iconColor} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold">{docStats.doctorName}</h3>
                                            <p className="text-gray-400 text-xs">{docStats.appointmentsToday} موعد اليوم</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-700/30">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-1 text-gray-400 text-xs">
                                                    <DollarSign size={12} className="text-emerald-500" />
                                                    الدخل المستحصل
                                                </div>
                                            </div>
                                            <span className="text-emerald-400 font-bold text-lg block text-left" dir="ltr">
                                                {formatCurrency(docStats.collectedRevenue)}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <div className="bg-gray-900/50 p-2.5 rounded-xl border border-gray-700/30 flex-1">
                                                <div className="text-gray-400 text-[10px] mb-1">قيمة العمل المنجز</div>
                                                <span className="text-blue-300 font-bold text-sm block text-left" dir="ltr">
                                                    {formatCurrency(docStats.totalRevenue)}
                                                </span>
                                            </div>
                                            <div className="bg-gray-900/50 p-2.5 rounded-xl border border-gray-700/30 flex-1">
                                                <div className="text-gray-400 text-[10px] mb-1">حالات مكتملة</div>
                                                <span className="text-white font-bold text-sm">
                                                    {docStats.completedProcedures}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detailed Stats for Selected Doctor */}
                    {selectedStats && (
                        <div className="bg-gray-800/60 rounded-2xl border border-violet-500/30 p-6 space-y-6 animate-in slide-in-from-top">
                            <div className="flex items-center justify-between border-b border-gray-700 pb-4">
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    <Target size={20} className="text-violet-400" />
                                    تفاصيل دخل {selectedStats.doctorName}
                                    <span className="text-xs font-normal text-gray-400 bg-gray-800 px-2 py-1 rounded-lg">
                                        {startDate} إلى {endDate}
                                    </span>
                                </h3>
                            </div>

                            {/* Detailed Revenue Table */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-gray-400 text-sm font-bold mb-3 flex items-center gap-2">
                                        <Activity size={16} className="text-blue-400" />
                                        تفاصيل العمل المنجز
                                    </h4>
                                    <div className="bg-gray-900/50 rounded-xl overflow-hidden border border-gray-700/50">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-800">
                                                <tr>
                                                    <th className="px-4 py-2 text-right text-gray-400 font-normal">نوع العلاج</th>
                                                    <th className="px-4 py-2 text-center text-gray-400 font-normal">العدد</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700/50">
                                                {selectedStats.topTreatments.length > 0 ? (
                                                    selectedStats.topTreatments.map((t, i) => (
                                                        <tr key={i} className="hover:bg-gray-800/30">
                                                            <td className="px-4 py-2 text-white">{t.type}</td>
                                                            <td className="px-4 py-2 text-center text-violet-300 font-bold">{t.count}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={2} className="px-4 py-8 text-center text-gray-500">لا توجد علاجات مكتملة في هذه الفترة</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign size={20} className="text-emerald-400" />
                                            <span className="text-emerald-100 font-bold">صافي الدخل المستلم</span>
                                        </div>
                                        <p className="text-emerald-200/60 text-sm mb-4">
                                            مجموع المبالغ المالية التي تم استلامها من المرضى نقداً خلال الفترة المحددة ({startDate} - {endDate}).
                                        </p>
                                        <div className="text-4xl font-bold text-emerald-400" dir="ltr">
                                            {formatCurrency(selectedStats.collectedRevenue)}
                                        </div>
                                    </div>

                                    <div className="bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Activity size={20} className="text-blue-400" />
                                            <span className="text-blue-100 font-bold">قيمة العمل المنجز</span>
                                        </div>
                                        <p className="text-blue-200/60 text-sm mb-2">
                                            القيمة الكلية للإجراءات الطبية التي اكتملت خلال هذه الفترة.
                                        </p>
                                        <div className="text-2xl font-bold text-blue-300" dir="ltr">
                                            {formatCurrency(selectedStats.totalRevenue)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
