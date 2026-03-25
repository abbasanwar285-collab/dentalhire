import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/ui/Layout';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import { ArrowRight, Banknote, Calendar, TrendingUp, AlertCircle, Percent, CheckCircle2, Gift, Minus, StickyNote } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { ar } from 'date-fns/locale';

export function MySalary() {
  const navigate = useNavigate();
  const { currentUser, users } = useAuth();
  const { patients, addTask } = useClinic();

  const salaryType = currentUser?.salaryType || 'none';
  const fixedSalary = currentUser?.fixedSalary || 0;
  const percentage = currentUser?.percentage || 0;

  const today = useMemo(() => new Date(), []);
  
  // Custom Cycle Logic
  const startDay = currentUser?.salaryStartDate || 1;
  const { cycleStart, cycleEnd } = useMemo(() => {
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const todayDate = today.getDate();

    let start: Date;
    let end: Date;

    if (todayDate < startDay) {
      start = new Date(currentYear, currentMonth - 1, startDay);
      end = new Date(currentYear, currentMonth, startDay - 1);
    } else {
      start = new Date(currentYear, currentMonth, startDay);
      end = new Date(currentYear, currentMonth + 1, startDay - 1);
    }
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { cycleStart: start, cycleEnd: end };
  }, [today, startDay]);

  const totalDaysInMonth = differenceInDays(cycleEnd, cycleStart) + 1;
  const currentDayOfMonth = Math.max(1, differenceInDays(today, cycleStart) + 1);

  // --- Fixed Salary Calculations ---
  const earnedFixedSalary = useMemo(() => {
    if (salaryType !== 'fixed' && salaryType !== 'both') return 0;
    if (totalDaysInMonth === 0) return 0;
    return (fixedSalary / totalDaysInMonth) * currentDayOfMonth;
  }, [salaryType, fixedSalary, totalDaysInMonth, currentDayOfMonth]);

  const fixedProgress = Math.min((currentDayOfMonth / totalDaysInMonth) * 100, 100);
  const isSalaryComplete = fixedProgress >= 100;

  // --- Percentage Earnings Calculations ---
  const percentageEarningsInfo = useMemo(() => {
    if (salaryType !== 'percentage' && salaryType !== 'both') return { totalIncome: 0, earned: 0 };
    
    let totalIncome = 0;
    patients.forEach(patient => {
      patient.treatmentPlans?.forEach(plan => {
        if (currentUser?.role === 'doctor' || currentUser?.role === 'admin') {
          plan.payments?.forEach(payment => {
            const payDoctorId = payment.doctorId || plan.doctorId;
            if (payDoctorId === currentUser.id) {
              const payDate = new Date(payment.date);
              if (payDate >= cycleStart && payDate <= cycleEnd) totalIncome += payment.amount;
            }
          });
        } else {
          plan.payments?.forEach(payment => {
            const payDate = new Date(payment.date);
            if (payDate >= cycleStart && payDate <= cycleEnd) totalIncome += payment.amount;
          });
        }
      });
    });

    const earned = (totalIncome * percentage) / 100;
    return { totalIncome, earned };
  }, [salaryType, percentage, patients, currentUser, cycleStart, cycleEnd]);

  const totalEarnedSoFar = earnedFixedSalary + percentageEarningsInfo.earned;

  // --- Bonuses & Deductions ---
  const cycleKey = useMemo(() => format(cycleStart, 'yyyy-MM'), [cycleStart]);
  
  const adjustmentsInfo = useMemo(() => {
    const bonuses = (currentUser?.bonuses || []).filter(b => b.cycleKey === cycleKey);
    const deductions = (currentUser?.deductions || []).filter(d => d.cycleKey === cycleKey);
    const totalBonuses = bonuses.reduce((s, b) => s + b.amount, 0);
    const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
    return { bonuses, deductions, totalBonuses, totalDeductions };
  }, [currentUser, cycleKey]);

  const netSalary = totalEarnedSoFar + adjustmentsInfo.totalBonuses - adjustmentsInfo.totalDeductions;

  // Progress bar target
  const percentageTarget = useMemo(() => {
    const minTarget = 1000000;
    return Math.max(minTarget, Math.ceil((percentageEarningsInfo.earned * 1.5) / 100000) * 100000);
  }, [percentageEarningsInfo.earned]);
  const percentageProgress = Math.min((percentageEarningsInfo.earned / percentageTarget) * 100, 100);

  // --- Notifications Logic ---
  useEffect(() => {
    if (isSalaryComplete && currentUser && (salaryType === 'fixed' || salaryType === 'both')) {
      const monthKey = format(today, 'yyyy-MM');
      const storageKey = `salary_notified_${currentUser.id}_${monthKey}`;

      if (!localStorage.getItem(storageKey)) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('راتبك جاهز! 💰', {
            body: `تهانينا ${currentUser.displayName}، اكتمل الشهر وأصبح راتبك متاحاً.`,
          });
        }
        const adminUser = users.find(u => u.role === 'admin');
        if (adminUser) {
          addTask({
            title: `تسليم راتب الموظف: ${currentUser.displayName}`,
            description: `أكمل الموظف ${currentUser.displayName} دورته. الراتب المستحق: ${Math.round(netSalary).toLocaleString()} د.ع`,
            priority: 'urgent',
            assignedToUserId: adminUser.id,
            createdByUserId: currentUser.id,
            dueDate: format(today, 'yyyy-MM-dd')
          });
        }
        localStorage.setItem(storageKey, 'true');
      }
    }
  }, [isSalaryComplete, currentUser, today, users, addTask, salaryType, netSalary]);

  if (salaryType === 'none') {
    return (
      <Layout title="الراتب المستحق">
        <div className="space-y-4 pb-8">
          <button onClick={() => navigate('/settings')} className="flex items-center gap-2 text-sm text-teal-600 font-semibold mb-2">
            <ArrowRight className="w-4 h-4" /> رجوع للإعدادات
          </button>
          <div className="glass-card p-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">النظام المالي غير مفعل</h3>
            <p className="text-sm text-slate-500 max-w-xs">لم يتم تعيين تفاصيل راتب لحسابك. راجع مسؤولي العيادة.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const hasAdjustments = adjustmentsInfo.bonuses.length > 0 || adjustmentsInfo.deductions.length > 0;

  return (
    <Layout title="كم راتبي هذا الشهر 💰">
      <div className="space-y-5 pb-20">
        <button onClick={() => navigate('/settings')} className="flex items-center gap-2 text-sm text-teal-600 font-semibold mt-[-8px]">
          <ArrowRight className="w-4 h-4" /> رجوع للرئيسية
        </button>

        {/* ── Net Salary Hero Card ── */}
        <div className="glass-card p-6 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-12 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-400/20 rounded-full translate-y-8 -translate-x-8 blur-xl" />
          <div className="relative z-10 text-center">
            <h2 className="text-sm font-medium text-indigo-100 mb-1">
              {hasAdjustments ? 'صافي المستحق حتى اليوم' : 'إجمالي المستحق حتى اليوم'}
            </h2>
            <div className="flex items-center justify-center gap-1.5 font-black text-4xl mt-2 tracking-tight">
              <span>{Math.round(netSalary).toLocaleString()}</span>
              <span className="text-lg font-bold text-indigo-200 mt-2">د.ع</span>
            </div>
            <p className="text-xs text-indigo-200 mt-3 font-medium bg-white/10 inline-block px-3 py-1 rounded-full">
              دورة الراتب: {format(cycleStart, 'dd MMMM', { locale: ar })} → {format(cycleEnd, 'dd MMMM', { locale: ar })}
              <br/>({currentDayOfMonth} من {totalDaysInMonth} يوماً)
            </p>
          </div>
        </div>

        {isSalaryComplete && (salaryType === 'fixed' || salaryType === 'both') && (
          <div className="animate-fade-in bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex flex-shrink-0 items-center justify-center text-emerald-600 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-800 mb-1">حان وقت استلام الراتب! 🎉</h3>
              <p className="text-xs text-emerald-700 font-medium">تم إشعار الإدارة لاكتمال دورتك الشهرية.</p>
            </div>
          </div>
        )}

        {/* ── Admin Notes ── */}
        {currentUser?.salaryNotes && (
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 flex items-start gap-2.5">
            <StickyNote className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-violet-700 mb-0.5">ملاحظة من الإدارة</p>
              <p className="text-[12px] text-violet-800 leading-relaxed">{currentUser.salaryNotes}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 px-1">التفاصيل</h3>

          {/* Fixed Salary Card */}
          {(salaryType === 'fixed' || salaryType === 'both') && (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">الراتب الثابت</h4>
                    <p className="text-xs text-slate-500">إجمالي الشهر: {fixedSalary.toLocaleString()} د.ع</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className={`block text-sm font-bold ${isSalaryComplete ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {Math.round(earnedFixedSalary).toLocaleString()} د.ع
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">مكتسب</span>
                </div>
              </div>
              <div>
                <div className={`flex items-center justify-between text-[11px] font-medium mb-1.5 ${isSalaryComplete ? 'text-emerald-600' : 'text-slate-500'}`}>
                  <span>التقدم الزمني للراتب</span>
                  <span>{Math.round(fixedProgress)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-in-out ${isSalaryComplete ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.max(5, fixedProgress)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Percentage Card */}
          {(salaryType === 'percentage' || salaryType === 'both') && (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">نسبة من الوارد</h4>
                    <p className="text-xs text-slate-500">النسبة المحددة: %{percentage}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800">
                    {Math.round(percentageEarningsInfo.earned).toLocaleString()} د.ع
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">مكتسب</span>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
                  <span>نمو الراتب</span>
                  <span className="text-emerald-600 font-bold max-w-[120px] truncate text-left" dir="ltr">
                    / {percentageTarget.toLocaleString()} د.ع
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-in-out relative overflow-hidden"
                    style={{ width: `${Math.max(3, percentageProgress)}%` }}
                  >
                     <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span>إجمالي المبالغ المحصلة:</span>
                  </div>
                  <span className="font-bold text-slate-800">
                    {percentageEarningsInfo.totalIncome.toLocaleString()} د.ع
                  </span>
                </div>
                {currentUser?.role === 'doctor' || currentUser?.role === 'admin' ? (
                  <p className="text-[10px] text-slate-400 mt-2">* تحسب من المبالغ المدفوعة عن جلساتك.</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-2">* تحسب من إجمالي الدفعات المسجلة هذا الشهر.</p>
                )}
              </div>
            </div>
          )}

          {/* ── Bonuses & Deductions Section ── */}
          {hasAdjustments && (
            <>
              <h3 className="text-sm font-bold text-slate-800 px-1">المكافآت والخصومات</h3>

              {adjustmentsInfo.bonuses.map(b => (
                <div key={b.id} className="glass-card p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-green-700">مكافأة</p>
                    <p className="text-[11px] text-slate-500 truncate">{b.reason}</p>
                  </div>
                  <span className="text-[13px] font-extrabold text-green-600 shrink-0">+{b.amount.toLocaleString()}</span>
                </div>
              ))}

              {adjustmentsInfo.deductions.map(d => (
                <div key={d.id} className="glass-card p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Minus className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-red-700">خصم</p>
                    <p className="text-[11px] text-slate-500 truncate">{d.reason}</p>
                  </div>
                  <span className="text-[13px] font-extrabold text-red-600 shrink-0">-{d.amount.toLocaleString()}</span>
                </div>
              ))}

              {/* Net adjustment summary */}
              <div className="glass-card p-4 bg-indigo-50 border-indigo-100">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-indigo-800">صافي التعديلات</span>
                  <span className={`text-[14px] font-extrabold ${(adjustmentsInfo.totalBonuses - adjustmentsInfo.totalDeductions) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {(adjustmentsInfo.totalBonuses - adjustmentsInfo.totalDeductions) >= 0 ? '+' : ''}
                    {(adjustmentsInfo.totalBonuses - adjustmentsInfo.totalDeductions).toLocaleString()} د.ع
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
