import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, ChevronRight, Printer, TrendingDown,
    Users, Activity, DollarSign, Package, AlertTriangle
} from 'lucide-react';
import { db } from '../services/db';
import { auditService } from '../services/auditService';
import { Expense, InventoryItem, AuditLog } from '../types';

type ReportPeriod = 'today' | 'month' | 'all';

interface ReportData {
    income: number;
    expenses: number;
    netProfit: number;
    totalDebt: number;
    patientCount: number;
    newPatients: number;
    treatmentCounts: Record<string, number>;
    patientsVisited: PatientVisit[];
    expenseList: Expense[];
    inventoryLowStock: InventoryItem[];
    activities: AuditLog[];
}

interface PatientVisit {
    id: string;
    name: string;
    procedures: string[];
    paid: number;
    debt: number;
    date: string;
}

export const Reports: React.FC = () => {
    const navigate = useNavigate();
    const [period, setPeriod] = useState<ReportPeriod>('today');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ReportData | null>(null);
    const [customDate, _setCustomDate] = useState(new Date().toISOString().split('T')[0]);
    const [showInventoryModal, setShowInventoryModal] = useState(false);

    useEffect(() => {
        generateReport();
    }, [period, customDate]);

    const generateReport = async () => {
        setLoading(true);
        try {
            // Fetch all required data
            const [patients, _appointments, expenses, inventory] = await Promise.all([
                db.getPatients(),
                db.getAppointments(),
                db.getExpenses(),
                db.getInventory()
            ]);

            // Determine Date Range
            const now = new Date();
            let startDate = new Date();
            let endDate = new Date();

            if (period === 'today') {
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
            } else if (period === 'month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            } else {
                // Custom/All - simplified to "All Time" for now or single day specific
                // For 'all', we just set really wide bounds
                startDate = new Date(0);
                endDate = new Date(4000, 0, 1);
            }

            // -- Aggregation Logic --

            const report: ReportData = {
                income: 0,
                expenses: 0,
                netProfit: 0,
                totalDebt: 0,
                patientCount: 0,
                newPatients: 0,
                treatmentCounts: {},
                patientsVisited: [],
                expenseList: [],
                inventoryLowStock: [],
                activities: []
            };

            // 1. Financials & Patients (Iterate Patients)
            patients.forEach(p => {
                let visitedInPeriod = false;
                let pIncome = 0;
                const pProcedures: string[] = [];

                // Procedures Payments
                p.procedures.forEach(proc => {
                    // Count Treatments (Approximation by procedure date if available, else creation date)
                    // If procedure has no date, we assume it happened at patient creation or 'today' is tricky.
                    // Better: Check payments date for Income, and 'date' field for Procedure Count.

                    // Check Procedure Date
                    const procDate = new Date(proc.date || p.createdAt);
                    if (procDate >= startDate && procDate <= endDate) {
                        report.treatmentCounts[proc.type] = (report.treatmentCounts[proc.type] || 0) + 1;
                        visitedInPeriod = true;
                        pProcedures.push(proc.type);
                    }

                    // Check Payments
                    if (proc.payments) {
                        proc.payments.forEach(pay => {
                            const payDate = new Date(pay.date);
                            if (payDate >= startDate && payDate <= endDate) {
                                pIncome += Number(pay.amount);
                            }
                        });
                    }
                });

                // Ortho Payments
                if (p.orthoVisits) {
                    p.orthoVisits.forEach(v => {
                        const vDate = new Date(v.visitDate);
                        if (vDate >= startDate && vDate <= endDate) {
                            pIncome += Number(v.paymentReceived);
                            report.treatmentCounts['Ortho Visit'] = (report.treatmentCounts['Ortho Visit'] || 0) + 1;
                            visitedInPeriod = true;
                        }
                    });
                }

                // Legacy/Direct Payments
                if (p.payments) {
                    p.payments.forEach(pay => {
                        const payDate = new Date(pay.date);
                        if (payDate >= startDate && payDate <= endDate) {
                            pIncome += Number(pay.amount);
                        }
                    });
                }

                // Consultation Fees
                // If patient created in range and fee paid, assume paid then.
                // Or check a specific fee date if we had one. (Legacy: assumes paid at creation)
                if (p.consultationFeePaid) {
                    const pCreated = new Date(p.createdAt);
                    if (pCreated >= startDate && pCreated <= endDate) {
                        pIncome += 5; // 5 IQD
                        report.treatmentCounts['Consultation'] = (report.treatmentCounts['Consultation'] || 0) + 1;
                        visitedInPeriod = true;
                    }
                }

                report.income += pIncome;

                // Debt (Total outstanding debt, not period specific usually, but let's show Total Debt for context)
                // Or debt incurred in this period? Usually "Total Current Debt" is more useful.
                report.totalDebt += (p.totalCost + (p.orthoTotalCost || 0)) - p.paidAmount;

                // Patient Count Logic
                if (visitedInPeriod || pIncome > 0) {
                    report.patientsVisited.push({
                        id: p.id,
                        name: p.name,
                        procedures: [...new Set(pProcedures)], // Unique props
                        paid: pIncome,
                        debt: (p.totalCost + (p.orthoTotalCost || 0)) - p.paidAmount,
                        date: new Date(p.createdAt).toLocaleDateString('ar-IQ') // Just for ref
                    });
                    report.patientCount++;
                }

                // New Patients
                const createdTimestamp = typeof p.createdAt === 'string' ? new Date(p.createdAt).getTime() : p.createdAt;
                if (createdTimestamp >= startDate.getTime() && createdTimestamp <= endDate.getTime()) {
                    report.newPatients++;
                }
            });

            // 2. Expenses
            expenses.forEach(e => {
                const _eDate = new Date(e.date); // YYYY-MM-DD
                // Fix: parseLocalDate logic might be needed if timezone issues arise, but basic string comparison works for YYYY-MM-DD usually if locally consistent
                // Let's use string comparison for safety with the 'date' field
                const startStr = getLocalDateStr(startDate);
                const endStr = getLocalDateStr(endDate);

                if (e.date >= startStr && e.date <= endStr) {
                    report.expenses += Number(e.amount);
                    report.expenseList.push(e);
                }
            });

            // 3. Inventory (Snapshot - Low Stock)
            report.inventoryLowStock = inventory.filter(i => i.quantity < (i.minStock || 5));

            // 4. Activities
            const logs = await auditService.getRecent(500); // Fetch enough
            report.activities = logs.filter(l => {
                const lDate = new Date(l.timestamp);
                return lDate >= startDate && lDate <= endDate;
            });

            report.netProfit = report.income - report.expenses;
            setData(report);

        } catch (e) {
            console.error('Report generation failed', e);
        } finally {
            setLoading(false);
        }
    };

    const getLocalDateStr = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <Activity className="animate-spin mr-2" /> جاري إعداد التقرير...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white pb-20 print:bg-white print:text-black print:p-0">

            {/* Navbar (Hidden in Print) */}
            <div className="print:hidden p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 backdrop-blur sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-800 rounded-full transition"
                        aria-label="Back"
                    >
                        <ChevronRight />
                    </button>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="text-violet-500" />
                        التقارير
                    </h1>
                </div>
                <button
                    onClick={handlePrint}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition"
                >
                    <Printer size={18} />
                    طباعة
                </button>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-8">

                {/* Report Header (Print Only) */}
                <div className="hidden print:block text-center mb-8 border-b-2 border-gray-800 pb-4">
                    <h1 className="text-3xl font-bold text-black mb-2">عيادتي للأسنان</h1>
                    <p className="text-gray-600">تقرير {period === 'today' ? 'يومي' : period === 'month' ? 'شهري' : 'شامل'}</p>
                    <p className="text-sm text-gray-500 mt-1">تاريخ الاستخراج: {new Date().toLocaleString('ar-IQ')}</p>
                </div>

                {/* Filters (Hidden in Print) */}
                <div className="print:hidden mb-8">
                    <div className="flex bg-gray-800 p-1 rounded-2xl w-fit mx-auto sm:mx-0">
                        <button
                            onClick={() => setPeriod('today')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition ${period === 'today' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            اليوم
                        </button>
                        <button
                            onClick={() => setPeriod('month')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition ${period === 'month' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            هذا الشهر
                        </button>
                        <button
                            onClick={() => setPeriod('all')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition ${period === 'all' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            الكل
                        </button>
                    </div>
                </div>

                {/* 1. Financial Summary */}
                <section className="mb-8">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-violet-400 print:text-black">
                        <DollarSign size={20} />
                        الملخص المالي
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-800 print:bg-gray-100 print:border print:border-gray-300 p-4 rounded-2xl border border-gray-700">
                            <span className="text-gray-400 text-xs block mb-1 print:text-gray-600">الإيرادات (الداخل)</span>
                            <span className="text-2xl font-bold text-emerald-400 print:text-black">{data?.income.toLocaleString()}</span>
                        </div>
                        <div className="bg-gray-800 print:bg-gray-100 print:border print:border-gray-300 p-4 rounded-2xl border border-gray-700">
                            <span className="text-gray-400 text-xs block mb-1 print:text-gray-600">المصروفات (الخارج)</span>
                            <span className="text-2xl font-bold text-rose-400 print:text-black">{data?.expenses.toLocaleString()}</span>
                        </div>
                        <div className="bg-gray-800 print:bg-gray-100 print:border print:border-gray-300 p-4 rounded-2xl border border-gray-700">
                            <span className="text-gray-400 text-xs block mb-1 print:text-gray-600">صافي الربح</span>
                            <span className={`text-2xl font-bold ${data!.netProfit >= 0 ? 'text-violet-400' : 'text-orange-400'} print:text-black`}>
                                {data?.netProfit.toLocaleString()}
                            </span>
                        </div>
                        <div className="bg-gray-800 print:bg-gray-100 print:border print:border-gray-300 p-4 rounded-2xl border border-gray-700">
                            <span className="text-gray-400 text-xs block mb-1 print:text-gray-600">الديون (الكلية)</span>
                            <span className="text-2xl font-bold text-yellow-500 print:text-black">{data?.totalDebt.toLocaleString()}</span>
                        </div>
                    </div>
                </section>

                {/* 2. Patient & Treatment Stats */}
                <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800/50 print:bg-white print:border print:border-gray-200 p-6 rounded-3xl border border-gray-700">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white print:text-black">
                            <Users size={18} className="text-blue-400" />
                            حركة المرضى
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-gray-700 print:border-gray-200 pb-2">
                                <span className="text-gray-400 print:text-gray-700">مرضى مراجعين</span>
                                <span className="font-bold text-white print:text-black">{data?.patientCount}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700 print:border-gray-200 pb-2">
                                <span className="text-gray-400 print:text-gray-700">مرضى جدد</span>
                                <span className="font-bold text-white print:text-black">{data?.newPatients}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 print:bg-white print:border print:border-gray-200 p-6 rounded-3xl border border-gray-700">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white print:text-black">
                            <Activity size={18} className="text-blue-400" />
                            احصائيات العلاجات
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(data?.treatmentCounts || {}).length > 0 ? (
                                Object.entries(data!.treatmentCounts).map(([key, count]) => (
                                    <span key={key} className="px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg text-sm border border-blue-500/20 print:border-black print:text-black print:bg-transparent">
                                        {key}: {count}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500 text-sm">لا توجد علاجات مسجلة</span>
                            )}
                        </div>
                    </div>
                </section>

                {/* 3. Detailed Lists */}
                <div className="grid grid-cols-1 gap-8">
                    {/* Expense List */}
                    <section>
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-rose-400 print:text-black">
                            <TrendingDown size={18} />
                            قائمة المصروفات
                        </h3>
                        <div className="bg-gray-800/50 print:bg-white rounded-2xl overflow-hidden border border-gray-700 print:border-gray-200">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-gray-700/50 print:bg-gray-100 text-gray-300 print:text-black">
                                    <tr>
                                        <th className="p-3">التفاصيل</th>
                                        <th className="p-3">المبلغ</th>
                                        <th className="p-3">التاريخ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700 print:divide-gray-200 text-gray-300 print:text-black">
                                    {data?.expenseList.length === 0 ? (
                                        <tr><td colSpan={3} className="p-4 text-center text-gray-500">لا توجد مصروفات</td></tr>
                                    ) : (
                                        data?.expenseList.map(item => (
                                            <tr key={item.id}>
                                                <td className="p-3">{item.description}</td>
                                                <td className="p-3 font-bold dir-ltr text-right">{item.amount.toLocaleString()}</td>
                                                <td className="p-3 text-gray-500">{item.date}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Patients Visited List */}
                    <section>
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-emerald-400 print:text-black">
                            <Users size={18} />
                            تفاصيل المراجعين
                        </h3>
                        <div className="bg-gray-800/50 print:bg-white rounded-2xl overflow-hidden border border-gray-700 print:border-gray-200">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-gray-700/50 print:bg-gray-100 text-gray-300 print:text-black">
                                    <tr>
                                        <th className="p-3">المريض</th>
                                        <th className="p-3">الإجراء</th>
                                        <th className="p-3">المدفوع</th>
                                        <th className="p-3">الديون المتبقية</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700 print:divide-gray-200 text-gray-300 print:text-black">
                                    {data?.patientsVisited.length === 0 ? (
                                        <tr><td colSpan={4} className="p-4 text-center text-gray-500">لا يوجد مراجعين</td></tr>
                                    ) : (
                                        data?.patientsVisited.map(p => (
                                            <tr key={p.id}>
                                                <td className="p-3 font-bold">{p.name}</td>
                                                <td className="p-3 text-xs">{p.procedures.join(', ') || '-'}</td>
                                                <td className="p-3 text-emerald-400 print:text-black font-bold">{p.paid.toLocaleString()}</td>
                                                <td className="p-3 text-rose-400 print:text-black">{p.debt.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* 4. Inventory Alert (Snapshot) */}
                <section className="mt-8 page-break-inside-avoid">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-orange-400 print:text-black">
                        <AlertTriangle size={18} />
                        تنبيهات المخزون
                    </h3>

                    {data?.inventoryLowStock.length === 0 ? (
                        <div className="bg-gray-800/50 print:bg-white print:border print:border-gray-200 p-4 rounded-2xl border border-gray-700 text-center">
                            <span className="text-gray-400 print:text-black">جميع المواد متوفرة بكميات جيدة</span>
                        </div>
                    ) : (
                        <>
                            {/* Summary Card (Clickable) */}
                            <button
                                onClick={() => setShowInventoryModal(true)}
                                className="w-full bg-orange-500/10 hover:bg-orange-500/20 active:scale-[0.98] transition p-6 rounded-3xl border border-orange-500/30 flex items-center justify-between group print:hidden"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-500 rounded-full text-white shadow-lg shadow-orange-500/40 group-hover:scale-110 transition">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div className="text-right">
                                        <h4 className="text-white font-bold text-lg">مواد منخفضة الكمية</h4>
                                        <p className="text-gray-400 text-sm">اضغط لعرض القائمة الكاملة</p>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-orange-500">
                                    {data?.inventoryLowStock.length}
                                </div>
                            </button>

                            {/* Print View (Always Visible in Print) */}
                            <div className="hidden print:grid grid-cols-3 gap-2 mt-4">
                                {data?.inventoryLowStock.map(item => (
                                    <div key={item.id} className="border border-gray-300 p-2 rounded-lg flex justify-between items-center">
                                        <span className="font-bold text-black text-xs">{item.name}</span>
                                        <span className="text-red-600 font-bold text-xs">{item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </section>

                {/* Inventory Modal */}
                {showInventoryModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in print:hidden">
                        <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <AlertTriangle className="text-orange-500" />
                                    المواد المنخفضة ({data?.inventoryLowStock.length})
                                </h3>
                                <button
                                    onClick={() => setShowInventoryModal(false)}
                                    className="p-2 hover:bg-gray-800 rounded-full text-gray-400 transition"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3">
                                {data?.inventoryLowStock.map(item => (
                                    <div key={item.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col items-center text-center hover:border-orange-500/50 transition">
                                        <Package size={24} className="text-gray-500 mb-2" />
                                        <span className="font-bold text-white mb-1">{item.name}</span>
                                        <span className="text-sm text-orange-400 font-bold bg-orange-400/10 px-3 py-1 rounded-full">
                                            متبقي: {item.quantity}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                                <button
                                    onClick={() => setShowInventoryModal(false)}
                                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition"
                                >
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
