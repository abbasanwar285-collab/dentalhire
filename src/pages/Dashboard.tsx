import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/ui/Layout';
import { useClinic } from '../context/ClinicContext';
import {
  Users, Calendar as CalendarIcon, Clock, TrendingUp,
  ChevronLeft, Wallet, Activity, Bell, Stethoscope,
  CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight,
  DollarSign, CalendarCheck, UserCheck, FileText, User,
  ChevronRight, FlaskConical, Receipt, Pipette, ClipboardList
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { haptic } from '../lib/haptics';
import { getAppointmentDisplayStatus } from '../lib/appointmentUtils';
import { useAuth } from '../context/AuthContext';

export function Dashboard() {
  const navigate = useNavigate();
  const { patients, appointments, doctors, updateAppointmentStatus, tasks } = useClinic();
  const { currentUser, hasPermission } = useAuth();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

  const todayAppointments = appointments.filter(a => a.date === todayStr);
  const todayScheduled = todayAppointments.filter(a => a.status === 'scheduled');
  const todayCompleted = todayAppointments.filter(a => a.status === 'completed');
  const todayCancelled = todayAppointments.filter(a => a.status === 'cancelled');

  const upcomingAppointments = appointments
    .filter(a => a.status === 'scheduled' && a.date >= todayStr)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    })
    .slice(0, 5);

  const activePlans = patients.reduce((count, p) => {
    return count + (p.treatmentPlans?.filter(plan =>
      plan.status === 'planned' || plan.status === 'in_progress'
    ).length || 0);
  }, 0);

  const totalMonthlyRevenue = patients.reduce((sum, p) => {
    return sum + (p.treatmentPlans?.reduce((planSum, plan) => {
      return planSum + (plan.payments?.reduce((paySum, payment) => {
        const payDate = parseISO(payment.date);
        if (payDate.getMonth() === today.getMonth() && payDate.getFullYear() === today.getFullYear()) {
          return paySum + payment.amount;
        }
        return paySum;
      }, 0) || 0);
    }, 0) || 0);
  }, 0);

  const lastMonthRevenue = patients.reduce((sum, p) => {
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return sum + (p.treatmentPlans?.reduce((planSum, plan) => {
      return planSum + (plan.payments?.reduce((paySum, payment) => {
        const payDate = parseISO(payment.date);
        if (payDate.getMonth() === lastMonth.getMonth() && payDate.getFullYear() === lastMonth.getFullYear()) {
          return paySum + payment.amount;
        }
        return paySum;
      }, 0) || 0);
    }, 0) || 0);
  }, 0);

  const revenueChange = lastMonthRevenue > 0 ? ((totalMonthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  const overduePayments = patients.reduce((count, p) => {
    return count + (p.treatmentPlans?.filter(plan =>
      plan.status !== 'completed' && plan.totalCost > 0 && plan.paidAmount < plan.totalCost
    ).length || 0);
  }, 0);

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekAppointments = weekDays.map(day => ({
    day: format(day, 'EEE', { locale: ar }),
    count: appointments.filter(a => isSameDay(parseISO(a.date), day)).length
  }));

  const getDateLabel = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'اليوم';
    if (isTomorrow(d)) return 'غداً';
    return format(d, 'dd MMM', { locale: ar });
  };

  return (
    <Layout
      title="لوحة التحكم"
      subtitle="نظرة شاملة على عيادتك"
    >
      <div className="space-y-5 pb-6">

        {/* Welcome Banner */}
        <div className="glass-card p-5 gradient-surface overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-slate-800 mb-1">مرحباً!</h2>
            <p className="text-sm text-slate-500">إليك ملخص يوم {format(today, 'EEEE', { locale: ar })}</p>
          </div>
        </div>

        {/* ── Pending Tasks Alert ── */}
        {(() => {
          const canManageTasks = hasPermission('manage_tasks');
          const myPendingTasks = tasks.filter(t => {
            if (canManageTasks) return t.status === 'pending';
            return t.status === 'pending' && t.assignedToUserId === currentUser?.id;
          });
          const urgentCount = myPendingTasks.filter(t => t.priority === 'urgent').length;
          if (myPendingTasks.length === 0) return null;
          return (
            <button
              onClick={() => { haptic.light(); navigate('/tasks'); }}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all active:scale-[0.98] shadow-sm"
              style={{
                backgroundColor: urgentCount > 0 ? '#fef2f2' : '#fffbeb',
                borderColor: urgentCount > 0 ? '#fecaca' : '#fde68a',
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: urgentCount > 0 ? '#fee2e2' : '#fef3c7' }}>
                <ClipboardList className="w-5 h-5" style={{ color: urgentCount > 0 ? '#ef4444' : '#f59e0b' }} />
              </div>
              <div className="flex-1 text-right">
                <p className="text-[13px] font-bold" style={{ color: urgentCount > 0 ? '#dc2626' : '#d97706' }}>
                  {myPendingTasks.length} {canManageTasks ? 'مهمة معلّقة' : 'مهمة بانتظار التنفيذ'}
                </p>
                {urgentCount > 0 && (
                  <p className="text-[11px] text-red-500 font-medium">
                    منها {urgentCount} مهمة عاجلة
                  </p>
                )}
              </div>
              <ChevronLeft className="w-5 h-5 opacity-40" />
            </button>
          );
        })()}

        {/* Stats Grid - Premium Design */}
        <div className="grid grid-cols-2 gap-3">
          {/* Today's Appointments */}
          <button
            onClick={() => { haptic.light(); navigate('/appointments'); }}
            className="stat-card group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className={cn(
                "text-xs font-semibold px-2 py-1 rounded-full",
                todayScheduled.length > 0 ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
              )}>
                {todayScheduled.length} حالياً
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{todayAppointments.length}</p>
            <p className="text-sm font-medium text-slate-500 mt-1">مواعيد اليوم</p>
            <div className="flex items-center gap-3 mt-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {todayCompleted.length} مكتمل
              </span>
              {todayCancelled.length > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {todayCancelled.length} ملغي
                </span>
              )}
            </div>
          </button>

          {/* Active Cases */}
          <button
            onClick={() => { haptic.light(); navigate('/patients'); }}
            className="stat-card group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{activePlans}</p>
            <p className="text-sm font-medium text-slate-500 mt-1">حالة نشطة</p>
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                {patients.length} مريض
              </span>
            </div>
          </button>

          {/* Monthly Revenue */}
          <button
            onClick={() => { haptic.light(); navigate('/indicators'); }}
            className="stat-card group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              {revenueChange !== 0 && (
                <span className={cn(
                  "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                  revenueChange > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                )}>
                  {revenueChange > 0 ? <ArrowUpRight className="w-3 h-3 ml-0.5" /> : <ArrowDownRight className="w-3 h-3 ml-0.5" />}
                  {Math.abs(revenueChange).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-slate-800" dir="ltr">
              {totalMonthlyRevenue.toLocaleString()}
              <span className="text-xs font-medium text-slate-500 mr-1">د.ع</span>
            </p>
            <p className="text-sm font-medium text-slate-500 mt-1">إيرادات الشهر</p>
          </button>

          {/* Total Patients */}
          <button
            onClick={() => { haptic.light(); navigate('/patients'); }}
            className="stat-card group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{patients.length}</p>
            <p className="text-sm font-medium text-slate-500 mt-1">إجمالي المرضى</p>
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" />
                {doctors.length} أطباء
              </span>
            </div>
          </button>
        </div>

        {/* Alerts Section */}
        {(overduePayments > 0 || todayScheduled.length > 0) && (
          <div className="space-y-2">
            {todayScheduled.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-800">
                    {todayScheduled.length} {todayScheduled.length > 1 ? 'مواعيد مجدولة' : 'موعد مجدول'} اليوم
                  </p>
                  <p className="text-xs text-blue-600/80 mt-0.5 truncate">
                    أول موعد: {todayScheduled[0]?.patientName} · الساعة {todayScheduled[0]?.time}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-400 shrink-0" />
              </div>
            )}
            {overduePayments > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-800">
                    {overduePayments} خطة علاجية بمدفوعات متبقية
                  </p>
                  <p className="text-xs text-amber-600/80 mt-0.5">تحقق من المدفوعات المطلوبة</p>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400 shrink-0" />
              </div>
            )}
          </div>
        )}

        {/* Weekly Overview Chart - Premium */}
        <section className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-teal-600" />
              </div>
              نظرة أسبوعية
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
              {format(weekStart, 'dd MMM', { locale: ar })} - {format(weekEnd, 'dd MMM', { locale: ar })}
            </span>
          </div>
          <div className="flex items-end justify-between gap-2 h-[100px]">
            {weekAppointments.map((day, idx) => {
              const maxCount = Math.max(...weekAppointments.map(d => d.count), 1);
              const height = day.count > 0 ? Math.max((day.count / maxCount) * 100, 20) : 8;
              const isTodayDay = idx === today.getDay();
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full flex justify-center h-full items-end group">
                    <div 
                      className={cn(
                        "w-full max-w-[28px] rounded-lg transition-all duration-300 relative overflow-hidden",
                        isTodayDay ? "bg-gradient-to-t from-teal-500 to-teal-400" : day.count > 0 ? "bg-gradient-to-t from-teal-300 to-teal-200" : "bg-slate-100"
                      )}
                      style={{ height: `${height}%`, minHeight: day.count > 0 ? '12px' : '6px' }}
                    >
                      {day.count > 0 && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded-lg shadow-md">
                          {day.count}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    isTodayDay ? "text-teal-600 font-bold" : "text-slate-500"
                  )}>
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Stats Row */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          <div className="glass-card p-4 min-w-[140px] shrink-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{patients.reduce((c, p) => c + (p.treatmentPlans?.length || 0), 0)}</p>
              <p className="text-xs text-slate-500">خطط علاجية</p>
            </div>
          </div>
          <div className="glass-card p-4 min-w-[140px] shrink-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Pipette className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{doctors.length}</p>
              <p className="text-xs text-slate-500">أطباء متاحون</p>
            </div>
          </div>
          <div className="glass-card p-4 min-w-[140px] shrink-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{patients.filter(p => p.lastVisit).length}</p>
              <p className="text-xs text-slate-500">زوار هذا الشهر</p>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              المواعيد القادمة
            </h3>
            <button
              onClick={() => navigate('/appointments')}
              className="text-sm text-teal-600 font-semibold flex items-center gap-1 active:opacity-70"
            >
              عرض الكل
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {upcomingAppointments.length > 0 ? (
            <div className="flex flex-col gap-3">
              {upcomingAppointments.map((apt, idx) => {
                const docColor = doctors.find(d => d.id === apt.doctorId)?.color || '#0d9488';
                const docInitial = apt.doctorName?.charAt(0) || 'د';
                
                const patient = patients.find(p => p.id === apt.patientId);
                const displayStatus = getAppointmentDisplayStatus(apt, patient);

                return (
                  <div key={apt.id} className="rounded-2xl overflow-hidden shadow-sm border border-slate-100" style={{ backgroundColor: `${docColor}22` }}>
                    <div
                      className="flex items-center p-4 gap-3 cursor-pointer hover:bg-white/50 transition-colors"
                      onClick={() => navigate(`/patients/${apt.patientId}`)}
                      style={{ borderRight: `4px solid ${docColor}` }}
                    >

                      {/* Doctor Avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                        style={{ backgroundColor: docColor }}
                      >
                        {docInitial}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-slate-800 truncate">{apt.patientName}</h4>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-teal-50 text-teal-600 shrink-0">
                            {getDateLabel(apt.date)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{apt.treatment}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1" style={{ color: docColor }}>
                            <Stethoscope className="w-3 h-3" />
                            <span className="font-semibold">{apt.doctorName}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {apt.time}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold mr-auto",
                            displayStatus.bgColor,
                            displayStatus.color
                          )}>
                            {displayStatus.label}
                          </span>
                        </div>
                      </div>

                      {displayStatus.status === 'upcoming' && isToday(parseISO(apt.date)) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            haptic.medium();
                            updateAppointmentStatus(apt.id, 'completed');
                          }}
                          className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all active:scale-90 shrink-0"
                          title="إنهاء الموعد"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card py-12 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <CalendarIcon className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">لا توجد مواعيد قادمة</p>
              <p className="text-xs text-slate-500 mt-1">أضف موعداً جديداً من صفحة المواعيد</p>
            </div>
          )}
        </section>

        {/* Doctors Section */}
        <section>
          <h3 className="text-base font-bold text-slate-800 mb-3 px-1 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            الأطباء
          </h3>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {doctors.map(doc => {
              const docAppointments = todayAppointments.filter(a => a.doctorId === doc.id);
              const docCompleted = docAppointments.filter(a => a.status === 'completed').length;
              
              return (
                <div key={doc.id} className="glass-card p-4 min-w-[140px] shrink-0 flex flex-col items-center text-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-3 shadow-md"
                    style={{ backgroundColor: doc.color || '#0d9488' }}
                  >
                    {doc.name.charAt(0)}
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{doc.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{doc.specialization}</p>
                  <div className="mt-3 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-600 flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3" />
                    {docCompleted}/{docAppointments.length} اليوم
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </Layout>
  );
}
