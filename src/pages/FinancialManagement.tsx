import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/ui/Layout';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import {
  ArrowRight, TrendingUp, TrendingDown, Wallet, Plus, Trash2, X, Save,
  Package, Building2, Wrench, MoreHorizontal, Users, ShieldAlert,
  CalendarDays, ChevronDown, DollarSign, Receipt
} from 'lucide-react';
import { ExpenseCategory } from '../types';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { ar } from 'date-fns/locale';

const CATEGORY_META: Record<ExpenseCategory, { label: string; icon: any; color: string; bg: string }> = {
  supply:      { label: 'مستلزمات', icon: Package,        color: 'text-orange-600', bg: 'bg-orange-50' },
  salary:      { label: 'رواتب',    icon: Users,           color: 'text-blue-600',   bg: 'bg-blue-50' },
  rent:        { label: 'إيجار',    icon: Building2,       color: 'text-violet-600', bg: 'bg-violet-50' },
  maintenance: { label: 'صيانة',    icon: Wrench,          color: 'text-amber-600',  bg: 'bg-amber-50' },
  other:       { label: 'أخرى',    icon: MoreHorizontal,  color: 'text-slate-600',  bg: 'bg-slate-50' },
};

export function FinancialManagement() {
  const navigate = useNavigate();
  const { currentUser, users } = useAuth();
  const { patients, clinicExpenses, addExpense, deleteExpense } = useClinic();

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [showExpenseList, setShowExpenseList] = useState(true);

  // Expense form
  const [expAmount, setExpAmount] = useState<number | string>(0);
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('other');
  const [expDescription, setExpDescription] = useState('');

  if (currentUser?.role !== 'admin') {
    return (
      <Layout title="الإدارة المالية">
        <div className="empty-state">
          <ShieldAlert className="w-16 h-16 text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg font-semibold">لا تملك صلاحية الوصول</p>
        </div>
      </Layout>
    );
  }

  // Date range for selected month
  const { monthStart, monthEnd } = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    return { monthStart: startOfMonth(start), monthEnd: endOfMonth(start) };
  }, [selectedMonth]);

  // ── INCOME: sum of all patient payments in the selected month ──
  const totalIncome = useMemo(() => {
    let total = 0;
    patients.forEach(p => {
      p.treatmentPlans?.forEach(plan => {
        plan.payments?.forEach(pay => {
          const payDate = parseISO(pay.date);
          if (isWithinInterval(payDate, { start: monthStart, end: monthEnd })) {
            total += pay.amount;
          }
        });
      });
    });
    return total;
  }, [patients, monthStart, monthEnd]);

  // ── EXPENSES: filtered by month ──
  const monthExpenses = useMemo(() =>
    clinicExpenses.filter(e => {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [clinicExpenses, monthStart, monthEnd]
  );

  // ── SALARY EXPENSES (auto-calculated from users) ──
  const salaryExpenses = useMemo(() => {
    const activeEmployees = users.filter(u => u.isActive && u.salaryType && u.salaryType !== 'none');
    let totalSalaries = 0;

    activeEmployees.forEach(u => {
      if (u.salaryType === 'fixed' || u.salaryType === 'both') {
        totalSalaries += u.fixedSalary || 0;
      }
      if (u.salaryType === 'percentage' || u.salaryType === 'both') {
        // Calculate percentage-based salary for this employee
        let empIncome = 0;
        patients.forEach(p => {
          p.treatmentPlans?.forEach(plan => {
            if (u.role === 'doctor' || u.role === 'admin') {
              plan.payments?.forEach(pay => {
                const payDoctorId = pay.doctorId || plan.doctorId;
                if (payDoctorId === u.id) {
                  const payDate = parseISO(pay.date);
                  if (isWithinInterval(payDate, { start: monthStart, end: monthEnd })) {
                    empIncome += pay.amount;
                  }
                }
              });
            } else {
              plan.payments?.forEach(pay => {
                const payDate = parseISO(pay.date);
                if (isWithinInterval(payDate, { start: monthStart, end: monthEnd })) {
                  empIncome += pay.amount;
                }
              });
            }
          });
        });
        totalSalaries += (empIncome * (u.percentage || 0)) / 100;
      }

      // Add bonuses, subtract deductions for this cycle
      const cycleKey = selectedMonth;
      const bonuses = (u.bonuses || []).filter(b => b.cycleKey === cycleKey);
      const deductions = (u.deductions || []).filter(d => d.cycleKey === cycleKey);
      totalSalaries += bonuses.reduce((s, b) => s + b.amount, 0);
      totalSalaries -= deductions.reduce((s, d) => s + d.amount, 0);
    });

    return Math.max(0, totalSalaries);
  }, [users, patients, monthStart, monthEnd, selectedMonth]);

  // ── TOTALS ──
  const totalManualExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = totalManualExpenses + salaryExpenses;
  const netProfit = totalIncome - totalExpenses;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    monthExpenses.forEach(e => {
      breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
    });
    // Add salary
    if (salaryExpenses > 0) {
      breakdown['salary'] = (breakdown['salary'] || 0) + salaryExpenses;
    }
    return breakdown;
  }, [monthExpenses, salaryExpenses]);

  const handleAddExpense = () => {
    if (!expDescription.trim() || Number(expAmount) <= 0) return;
    addExpense({
      amount: Number(expAmount),
      category: expCategory,
      description: expDescription.trim(),
      date: new Date().toISOString(),
      createdByUserId: currentUser?.id || '',
    });
    setExpAmount(0);
    setExpDescription('');
    setExpCategory('other');
    setShowAddExpense(false);
  };

  // Generate month options (last 12 months)
  const monthOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      opts.push({
        value: format(d, 'yyyy-MM'),
        label: format(d, 'MMMM yyyy', { locale: ar }),
      });
    }
    return opts;
  }, []);

  return (
    <Layout title="الإدارة المالية 💼" subtitle="واردات وصرفيات العيادة">
      <div className="space-y-5 pb-20">
        <button onClick={() => navigate('/settings')} className="flex items-center gap-2 text-sm text-teal-600 font-semibold">
          <ArrowRight className="w-4 h-4" /> رجوع للإعدادات
        </button>

        {/* Month Selector */}
        <div className="glass-card p-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-500" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer"
              title="اختيار الشهر"
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-card p-3 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl border-0 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 opacity-80" />
            <p className="text-[9px] font-medium opacity-80">الواردات</p>
            <p className="font-extrabold text-base leading-tight mt-0.5">{totalIncome.toLocaleString()}</p>
            <p className="text-[8px] opacity-60">د.ع</p>
          </div>
          <div className="glass-card p-3 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-2xl border-0 text-center">
            <TrendingDown className="w-5 h-5 mx-auto mb-1 opacity-80" />
            <p className="text-[9px] font-medium opacity-80">الصرفيات</p>
            <p className="font-extrabold text-base leading-tight mt-0.5">{Math.round(totalExpenses).toLocaleString()}</p>
            <p className="text-[8px] opacity-60">د.ع</p>
          </div>
          <div className={`glass-card p-3 rounded-2xl border-0 text-center text-white ${netProfit >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-700' : 'bg-gradient-to-br from-orange-500 to-red-600'}`}>
            <Wallet className="w-5 h-5 mx-auto mb-1 opacity-80" />
            <p className="text-[9px] font-medium opacity-80">صافي الربح</p>
            <p className="font-extrabold text-base leading-tight mt-0.5">{Math.round(netProfit).toLocaleString()}</p>
            <p className="text-[8px] opacity-60">د.ع</p>
          </div>
        </div>

        {/* ── Category Breakdown ── */}
        {Object.keys(categoryBreakdown).length > 0 && (
          <div className="glass-card p-4">
            <h3 className="text-[12px] font-bold text-slate-600 mb-3">توزيع الصرفيات</h3>
            <div className="space-y-2">
              {Object.entries(categoryBreakdown)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([cat, amount]) => {
                  const meta = CATEGORY_META[cat as ExpenseCategory] || CATEGORY_META.other;
                  const Icon = meta.icon;
                  const numAmount = amount as number;
                  const pct = totalExpenses > 0 ? (numAmount / totalExpenses) * 100 : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-bold text-slate-700">{meta.label}</span>
                          <span className="font-extrabold text-slate-800">{Math.round(numAmount).toLocaleString()} د.ع</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(3, pct)}%` }} />
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">{Math.round(pct)}%</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Auto Salary Summary ── */}
        <div className="glass-card p-4 bg-blue-50/50 border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-blue-800">رواتب الموظفين (تلقائي)</p>
                <p className="text-[10px] text-blue-600">يُحسب تلقائياً من إعدادات الرواتب</p>
              </div>
            </div>
            <span className="font-extrabold text-[14px] text-blue-700">{Math.round(salaryExpenses).toLocaleString()} د.ع</span>
          </div>
        </div>

        {/* ── Expenses List ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowExpenseList(!showExpenseList)}
              className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700"
            >
              <Receipt className="w-4 h-4 text-red-500" />
              الصرفيات المسجلة ({monthExpenses.length})
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExpenseList ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showExpenseList && (
            <div className="space-y-2">
              {monthExpenses.length > 0 ? (
                monthExpenses.map(exp => {
                  const meta = CATEGORY_META[exp.category] || CATEGORY_META.other;
                  const Icon = meta.icon;
                  return (
                    <div key={exp.id} className="glass-card p-3 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-slate-800 truncate">{exp.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>{meta.label}</span>
                          <span className="text-[9px] text-slate-400">{format(parseISO(exp.date), 'dd MMM HH:mm', { locale: ar })}</span>
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <span className="text-[13px] font-extrabold text-red-600">{exp.amount.toLocaleString()}</span>
                        <span className="text-[9px] text-slate-400 block">د.ع</span>
                      </div>
                      <button
                        onClick={() => { if (confirm('حذف هذه الصرفية؟')) deleteExpense(exp.id); }}
                        className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center shrink-0 hover:text-red-600 transition-all"
                        title="حذف"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">لا توجد صرفيات مسجلة هذا الشهر</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Add Expense Modal ── */}
        {showAddExpense && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddExpense(false)} />
            <div className="relative w-full min-w-[320px] max-w-[95vw] sm:max-w-sm bg-white rounded-2xl shadow-2xl animate-scale-in overflow-hidden z-10 flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" /> إضافة صرفية جديدة
                </h3>
                <button title="إغلاق" onClick={() => setShowAddExpense(false)} className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {/* Category */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 mb-2 block">التصنيف</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(Object.keys(CATEGORY_META) as ExpenseCategory[])
                      .filter(c => c !== 'salary')
                      .map(cat => {
                        const meta = CATEGORY_META[cat];
                        const Icon = meta.icon;
                        return (
                          <button
                            key={cat}
                            onClick={() => setExpCategory(cat)}
                            className={`p-2 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 transition-all border-2 ${
                              expCategory === cat
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-inner'
                                : `border-transparent ${meta.bg} ${meta.color}`
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {meta.label}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">المبلغ (د.ع) *</label>
                  <input
                    type="number"
                    min="0"
                    value={expAmount || ''}
                    onChange={e => setExpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    onFocus={() => { if (expAmount === 0) setExpAmount(''); }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none focus:bg-white focus:border-red-400 transition-all"
                    placeholder="مثال: 50000"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">الوصف *</label>
                  <input
                    type="text"
                    value={expDescription}
                    onChange={e => setExpDescription(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 outline-none focus:bg-white focus:border-red-400 transition-all"
                    placeholder="مثال: إيجار العيادة لشهر مارس"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleAddExpense}
                  disabled={Number(expAmount) <= 0 || !expDescription.trim()}
                  className="w-full py-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 bg-red-500 text-white shadow-lg shadow-red-200 disabled:opacity-40 active:scale-[0.98] transition-all"
                >
                  <Save className="w-4 h-4" />
                  تسجيل الصرفية
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Add Button */}
        <button
          onClick={() => setShowAddExpense(true)}
          className="fixed bottom-20 left-5 z-40 w-14 h-14 rounded-full bg-red-500 text-white shadow-xl shadow-red-300/40 flex items-center justify-center active:scale-90 transition-all hover:bg-red-600"
          title="إضافة صرفية"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
    </Layout>
  );
}
