import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/ui/Layout';
import { useClinic } from '../context/ClinicContext';
import { 
  parseISO, 
  isWithinInterval, 
  startOfDay, 
  endOfDay, 
  startOfMonth, 
  endOfMonth, 
  isSameDay, 
  subDays,
  differenceInDays,
  differenceInMinutes,
  format,
  startOfYear,
  endOfYear,
  isAfter,
  isBefore
} from 'date-fns';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Activity, 
  Wallet, 
  Calendar as CalendarIcon, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Zap,
  Star,
  Target,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  Briefcase,
  Smartphone,
  CreditCard,
  Banknote,
  Send,
  Gift,
  PhoneCall
} from 'lucide-react';
import { cn } from '../lib/utils';
import { haptic } from '../lib/haptics';
import { Modal } from '../components/ui/Modal';
import { ReminderSystem } from '../components/ui/ReminderSystem';
import { useAuth } from '../context/AuthContext';

type DateFilter = 'today' | 'month' | 'year' | 'custom';

type ActionType = 'activate_reminders' | 'send_promotion' | 'review_plans' | 'call_patients';

export function Indicators() {
  const navigate = useNavigate();
  const { patients, appointments, treatments, doctors, arrivalRecords, waitingRoom } = useClinic();
  const { hasPermission } = useAuth();
  const [filter, setFilter] = useState<DateFilter>('month');
  const [customStart, setCustomStart] = useState(new Date().toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);

  // Modal states
  const [activeModal, setActiveModal] = useState<ActionType | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const COLORS = ['#0071E3', '#34C759', '#FF9F0A', '#AF52DE', '#FF3B30', '#5AC8FA', '#FFCC00'];

  // --- Filtering Logic ---
  const { startDate, endDate, prevStartDate, prevEndDate } = useMemo(() => {
    const now = new Date();
    let start = startOfMonth(now);
    let end = endOfMonth(now);
    let pStart = startOfMonth(subDays(start, 1));
    let pEnd = endOfMonth(subDays(start, 1));

    if (filter === 'today') {
      start = startOfDay(now);
      end = endOfDay(now);
      pStart = startOfDay(subDays(now, 1));
      pEnd = endOfDay(subDays(now, 1));
    } else if (filter === 'month') {
      start = startOfMonth(now);
      end = endOfMonth(now);
      pStart = startOfMonth(subDays(start, 1));
      pEnd = endOfMonth(subDays(start, 1));
    } else if (filter === 'year') {
      start = startOfYear(now);
      end = endOfYear(now);
      pStart = startOfYear(subDays(start, 1));
      pEnd = endOfYear(subDays(start, 1));
    } else if (filter === 'custom') {
      start = startOfDay(parseISO(customStart));
      end = endOfDay(parseISO(customEnd));
      const diff = differenceInDays(end, start);
      pStart = subDays(start, diff + 1);
      pEnd = subDays(start, 1);
    }

    return { startDate: start, endDate: end, prevStartDate: pStart, prevEndDate: pEnd };
  }, [filter, customStart, customEnd]);

  // --- Data Calculations ---
  const getTreatmentPrice = (treatmentName: string) => {
    const tPrice = treatments.find(t => t.name === treatmentName)?.price || 0;
    return tPrice > 0 ? tPrice : 50000; // Fallback so revenue isn't totally 0 if not set
  };

  const getFilteredData = (sDate: Date, eDate: Date) => {
    const filteredApts = appointments.filter(apt => {
      const aptDate = parseISO(apt.date);
      return isWithinInterval(aptDate, { start: sDate, end: eDate });
    });

    const completed = filteredApts.filter(a => a.status === 'completed');
    const cancelled = filteredApts.filter(a => a.status === 'cancelled');
    const scheduled = filteredApts.filter(a => a.status === 'scheduled');

    let receivedRevenue = 0;
    let expectedRevenue = 0;
    let totalDebts = 0;
    const activePatientIds = new Set<string>();

    patients.forEach(p => {
      p.treatmentPlans?.forEach(plan => {
        // 1. Received (actual payments in date range)
        plan.payments?.forEach(pay => {
          if (!pay.date) return;
          const payDate = parseISO(pay.date);
          if (isWithinInterval(payDate, { start: sDate, end: eDate })) {
            receivedRevenue += Number(pay.amount || 0);
            activePatientIds.add(p.id);
          }
        });

        // 2. Expected (worth of plans created in date range)
        if (plan.createdAt) {
          const createdDate = parseISO(plan.createdAt);
          if (isWithinInterval(createdDate, { start: sDate, end: eDate })) {
            expectedRevenue += Number(plan.totalCost || 0);
          }
        }

        // 3. Global Debts (all active debts, not bound by date filter)
        // Ensure paidAmount is updated correctly, otherwise fallback to sum of payments
        const actualPaid = plan.paidAmount || (plan.payments ? plan.payments.reduce((s, pay) => s + (pay.amount || 0), 0) : 0);
        const debt = (plan.totalCost || 0) - actualPaid;
        if (debt > 0) {
          totalDebts += debt;
        }
      });
    });

    filteredApts.forEach(a => activePatientIds.add(a.patientId));

    // Fallbacks
    if (receivedRevenue === 0) {
      receivedRevenue = completed.reduce((sum, apt) => sum + getTreatmentPrice(apt.treatment), 0);
    }
    
    // Fallback for expected if 0 (e.g. they only use appointments without plans)
    if (expectedRevenue === 0 && receivedRevenue > 0) {
      expectedRevenue = appointments.filter(a => a.status !== 'cancelled' && isWithinInterval(parseISO(a.date), { start: sDate, end: eDate })).reduce((sum, apt) => sum + getTreatmentPrice(apt.treatment), 0);
    }

    const patientCount = activePatientIds.size;
    
    return { 
      appointments: filteredApts, 
      completed, 
      cancelled, 
      scheduled,
      revenue: receivedRevenue, 
      expectedRevenue,
      totalDebts,
      patientCount 
    };
  };

  const currentData = useMemo(() => getFilteredData(startDate, endDate), [startDate, endDate, appointments, treatments, patients]);
  const prevData = useMemo(() => getFilteredData(prevStartDate, prevEndDate), [prevStartDate, prevEndDate, appointments, treatments, patients]);

  // --- KPI Calculations ---
  const revenueGrowth = prevData.revenue > 0 ? ((currentData.revenue - prevData.revenue) / prevData.revenue) * 100 : 0;
  const patientGrowth = prevData.patientCount > 0 ? ((currentData.patientCount - prevData.patientCount) / prevData.patientCount) * 100 : 0;
  
  const noShowRate = currentData.appointments.length > 0 
    ? (currentData.cancelled.length / currentData.appointments.length) * 100 
    : 0;
  
  const prevNoShowRate = prevData.appointments.length > 0 
    ? (prevData.cancelled.length / prevData.appointments.length) * 100 
    : 0;
  
  const noShowChange = noShowRate - prevNoShowRate;

  // Smart Chair Utilization: Real-time calculation based on actual session data
  const calculateChairUtilization = useMemo(() => {
    const now = new Date();
    const totalDays = Math.max(1, differenceInDays(endDate, startDate) + 1);
    const totalAvailableMinutes = totalDays * 8 * 60; // 8 hours/day

    // 1. Calculate REAL chair occupancy from arrivalRecords
    let actualOccupiedMinutes = 0;
    let activeSessionsCount = 0;

    arrivalRecords.forEach(record => {
      const recordDate = parseISO(record.scheduledDate);
      if (!isWithinInterval(recordDate, { start: startDate, end: endDate })) return;

      // Completed sessions: use sessionStartTime and sessionEndTime
      if (record.sessionStartTime && record.sessionEndTime) {
        const start = parseISO(record.sessionStartTime);
        const end = parseISO(record.sessionEndTime);
        const durationMinutes = differenceInMinutes(end, start);
        if (durationMinutes > 0) {
          actualOccupiedMinutes += durationMinutes;
        }
      }
      // In-progress sessions: use sessionStartTime to now
      else if (record.sessionStartTime && !record.sessionEndTime) {
        const start = parseISO(record.sessionStartTime);
        const durationMinutes = differenceInMinutes(now, start);
        if (durationMinutes > 0) {
          actualOccupiedMinutes += durationMinutes;
          activeSessionsCount++;
        }
      }
    });

    // 2. Add projected time for future appointments (scheduled but not yet in session)
    let projectedMinutes = 0;
    currentData.scheduled.forEach(apt => {
      const aptDate = parseISO(apt.date);
      // Only add future appointments for today
      if (isSameDay(aptDate, now) && isAfter(aptDate, now)) {
        const t = treatments.find(tr => tr.name === apt.treatment);
        projectedMinutes += (t?.duration || 30);
      }
    });

    // 3. Calculate utilization rate
    const totalOccupiedMinutes = actualOccupiedMinutes + projectedMinutes;
    const utilizationRate = Math.min(100, (totalOccupiedMinutes / totalAvailableMinutes) * 100);

    return {
      rate: utilizationRate,
      actualMinutes: actualOccupiedMinutes,
      projectedMinutes,
      activeSessionsCount,
      totalAvailableMinutes
    };
  }, [arrivalRecords, waitingRoom, startDate, endDate, currentData, treatments]);

  const { rate: utilizationRate, actualMinutes, projectedMinutes, activeSessionsCount } = calculateChairUtilization;

  // --- Doctor Performance ---
  const doctorPerformance = useMemo(() => {
    return doctors.map(doc => {
      let actualRevenue = 0;
      let docExpectedRevenue = 0;
      const docActivePatientIds = new Set<string>();

      // 1. Calculate REAL revenue from recorded payments on plans assigned to this doctor or specifically paid to this doctor
      patients.forEach(p => {
        p.treatmentPlans?.forEach(plan => {
          const planDoctorId = plan.doctorId || plan.treatments?.[0]?.doctorId;
          
          // Received: Check each payment's specific doctorId, fallback to planDoctorId
          plan.payments?.forEach(pay => {
            const payDoctorId = pay.doctorId || planDoctorId;
            if (payDoctorId === doc.id) {
              if (!pay.date) return;
              const payDate = parseISO(pay.date);
              if (isWithinInterval(payDate, { start: startDate, end: endDate })) {
                actualRevenue += Number(pay.amount || 0);
                docActivePatientIds.add(p.id);
              }
            }
          });

          // Expected: Still attributed to the primary doctor of the plan
          if (planDoctorId === doc.id) {
            if (plan.createdAt) {
              const createdDate = parseISO(plan.createdAt);
              if (isWithinInterval(createdDate, { start: startDate, end: endDate })) {
                docExpectedRevenue += Number(plan.totalCost || 0);
              }
            }
          }
        });
      });

      // 2. Also check appointments for this doctor
      const docApts = currentData.appointments.filter(a => a.doctorId === doc.id);
      docApts.forEach(a => docActivePatientIds.add(a.patientId));
      
      const docCompleted = docApts.filter(a => a.status === 'completed');
      
      // 3. Fallback to appointment price if ZERO actual payments found
      if (actualRevenue === 0) {
        actualRevenue = docCompleted.reduce((sum, apt) => sum + getTreatmentPrice(apt.treatment), 0);
      }
      if (docExpectedRevenue === 0 && actualRevenue > 0) {
        docExpectedRevenue = docApts.filter(a => a.status !== 'cancelled' && isWithinInterval(parseISO(a.date), { start: startDate, end: endDate })).reduce((sum, apt) => sum + getTreatmentPrice(apt.treatment), 0);
      }
      
      const uniquePatients = docActivePatientIds.size;

      return {
        ...doc,
        revenue: actualRevenue,
        expectedRevenue: docExpectedRevenue,
        patientCount: uniquePatients,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [doctors, currentData, treatments, patients, startDate, endDate]);

  // --- Alerts & Actions ---
  const alerts = useMemo(() => {
    const list = [];
    if (noShowRate > 15) {
      list.push({
        type: 'error',
        title: 'معدل إلغاء مرتفع',
        message: `نسبة الإلغاء وصلت إلى ${noShowRate.toFixed(1)}% اليوم.`,
        action: 'تفعيل التذكيرات الذكية',
        actionType: 'activate_reminders' as ActionType,
        icon: AlertCircle
      });
    }
    if (utilizationRate < 40) {
      list.push({
        type: 'warning',
        title: 'إشغال منخفض للكرسي',
        message: `معدل الإشغال ${utilizationRate.toFixed(0)}% - وقت الإشغال الفعلي ${actualMinutes} دقيقة.`,
        action: 'إرسال حملة عروض للمرضى',
        actionType: 'send_promotion' as ActionType,
        icon: Clock
      });
    }
    
    // Low conversion alert
    const lowConvDoc = doctorPerformance.find(d => d.conversionRate < 20 && d.patientCount > 5);
    if (lowConvDoc) {
      list.push({
        type: 'info',
        title: 'تحسين معدل التحويل',
        message: `الدكتور ${lowConvDoc.name} لديه معدل تحويل منخفض.`,
        action: 'مراجعة خطط العلاج المقترحة',
        actionType: 'review_plans' as ActionType,
        icon: TrendingDown
      });
    }

    return list;
  }, [noShowRate, utilizationRate, actualMinutes, doctorPerformance]);

  const handleAction = (type: ActionType) => {
    haptic.medium();
    switch (type) {
      case 'activate_reminders':
        setActiveModal('activate_reminders');
        break;
      case 'send_promotion':
        setActiveModal('send_promotion');
        break;
      case 'review_plans':
        navigate('/patients');
        break;
      case 'call_patients':
        setActiveModal('call_patients');
        break;
    }
  };

  // --- Smart Insights ---
  const smartInsights = useMemo(() => {
    const insights = [];
    
    // Revenue insight
    if (revenueGrowth > 10) {
      insights.push(`الإيرادات ارتفعت بنسبة ${revenueGrowth.toFixed(0)}% مقارنة بالفترة السابقة. ✨`);
    } else if (revenueGrowth < -10) {
      insights.push(`انخفاض في الإيرادات بنسبة ${Math.abs(revenueGrowth).toFixed(0)}%. نحتاج لتحليل السبب. 📉`);
    }

    // Chair Utilization Real Data Insight
    if (actualMinutes > 0) {
      const avgSessionMinutes = activeSessionsCount > 0 
        ? Math.round(actualMinutes / (arrivalRecords.filter(r => r.sessionEndTime).length + activeSessionsCount))
        : Math.round(actualMinutes / Math.max(1, arrivalRecords.filter(r => r.sessionEndTime).length));
      insights.push(`متوسط وقت الجلسة الفعلي: ${avgSessionMinutes} دقيقة. إشغال الكرسي: ${utilizationRate.toFixed(0)}%`);
    }

    // Top treatment insight
    const treatmentCounts = currentData.completed.reduce((acc, apt) => {
      acc[apt.treatment] = (acc[apt.treatment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topTreatment = Object.entries(treatmentCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
    if (topTreatment) {
      insights.push(`علاج "${topTreatment[0]}" هو الأكثر طلباً حالياً (${topTreatment[1]} حالة).`);
    }

    // No-show impact
    const lostRevenue = currentData.cancelled.reduce((sum, apt) => sum + getTreatmentPrice(apt.treatment), 0);
    if (lostRevenue > 0) {
      insights.push(`تخسر العيادة حوالي ${lostRevenue.toLocaleString()} د.ع بسبب المواعيد الملغاة.`);
    }

    return insights;
  }, [revenueGrowth, currentData, treatments, actualMinutes, activeSessionsCount, utilizationRate, arrivalRecords]);

  // --- Chart Data ---
  const revenueChartData = useMemo(() => {
    // Group by day for the last 7 days or current period
    const data = [];
    const days = differenceInDays(endDate, startDate);
    const step = days > 30 ? 5 : 1;
    
    for (let i = 0; i <= days; i += step) {
      const d = subDays(endDate, days - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      let dayRev = 0;
      patients.forEach(p => {
        p.treatmentPlans?.forEach(plan => {
          plan.payments?.forEach(pay => {
            if (pay.date === dateStr) {
              dayRev += Number(pay.amount || 0);
            }
          });
        });
      });

      if (dayRev === 0) {
        dayRev = currentData.completed
          .filter(a => a.date === dateStr)
          .reduce((sum, a) => sum + getTreatmentPrice(a.treatment), 0);
      }
      
      data.push({
        name: format(d, 'dd/MM'),
        revenue: dayRev
      });
    }
    return data;
  }, [startDate, endDate, currentData, treatments, patients]);

  const treatmentData = useMemo(() => {
    const counts = currentData.completed.reduce((acc, apt) => {
      acc[apt.treatment] = (acc[apt.treatment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 5);
  }, [currentData]);

  return (
    <Layout title="المؤشرات والتحليلات">
      <div className="space-y-6 pb-32">
        
        {/* ── Date Range Selector ── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { key: 'today', label: 'اليوم' },
            { key: 'month', label: 'شهر' },
            { key: 'year', label: 'سنة' },
            { key: 'custom', label: 'مخصص' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => { haptic.light(); setFilter(item.key as DateFilter); }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all",
                filter === item.key
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {filter === 'custom' && (
          <div className="grid grid-cols-2 gap-3 animate-slide-up">
            <div className="glass-card p-3">
              <label className="block text-[10px] text-slate-500 mb-1">من تاريخ</label>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="w-full bg-transparent text-sm outline-none text-right"
              />
            </div>
            <div className="glass-card p-3">
              <label className="block text-[10px] text-slate-500 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="w-full bg-transparent text-sm outline-none text-right"
              />
            </div>
          </div>
        )}

        {/* ── TOP SUMMARY (Smart KPIs) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Financial Overview Card */}
          <div className="glass-card p-5 relative overflow-hidden group col-span-1 md:col-span-2 lg:col-span-1 border-t-4 border-t-blue-500 shadow-md">
            <div className="flex justify-between items-start mb-1">
              <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5 opacity-90">
                <Wallet className="w-4 h-4 text-emerald-500" />
                الإيرادات المستلمة (الكلية)
              </span>
              <div className={cn(
                "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                revenueGrowth >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {revenueGrowth >= 0 ? <ArrowUpRight className="w-3 h-3 ml-1" /> : <ArrowDownRight className="w-3 h-3 ml-1" />}
                {Math.abs(revenueGrowth).toFixed(0)}%
              </div>
            </div>
            
            <div className="flex items-baseline gap-1 mt-1 mb-5">
              <span className="text-3xl font-black text-slate-800 tracking-tight" dir="ltr">
                {currentData.revenue.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-bold ml-1">د.ع</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 bg-slate-50/50 rounded-xl p-3">
              <div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <Target className="w-3.5 h-3.5 text-blue-400" /> المتوقعة للفترة
                </span>
                <span className="text-[13px] font-bold text-blue-600 truncate block" dir="ltr">
                  {currentData.expectedRevenue.toLocaleString()} <span className="text-[10px] text-blue-300">د.ع</span>
                </span>
              </div>
              <div className="border-r border-slate-200 pr-3">
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" /> ديون العيادة (تراكمي)
                </span>
                <span className="text-[13px] font-bold text-red-500 truncate block" dir="ltr">
                  {currentData.totalDebts.toLocaleString()} <span className="text-[10px] text-red-300">د.ع</span>
                </span>
              </div>
            </div>
          </div>

          {/* Utilization Card */}
          <div className="glass-card p-5 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-slate-500">معدل إشغال الكرسي</span>
              <div className={cn(
                "px-2 py-1 rounded-full text-[10px] font-bold",
                utilizationRate > 70 ? "bg-emerald-50 text-emerald-600" : utilizationRate > 40 ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
              )}>
                {utilizationRate > 70 ? 'مرتفع' : utilizationRate > 40 ? 'متوسط' : 'منخفض'}
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-800" dir="ltr">
                {utilizationRate.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-500", 
                  utilizationRate > 70 ? "bg-emerald-500" : utilizationRate > 40 ? "bg-blue-500" : "bg-orange-500"
                )}
                style={{ width: `${utilizationRate}%` }}
              />
            </div>
          </div>

          {/* Patients Card */}
          <div className="glass-card p-5 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-slate-500">المرضى النشطين</span>
              <div className={cn(
                "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                patientGrowth >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {patientGrowth >= 0 ? <ArrowUpRight className="w-3 h-3 ml-1" /> : <ArrowDownRight className="w-3 h-3 ml-1" />}
                {Math.abs(patientGrowth).toFixed(0)}%
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-800">
                {currentData.patientCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {currentData.completed.length} علاج مكتمل في هذه الفترة
            </p>
          </div>

          {/* No-show Card */}
          <div className="glass-card p-5 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-slate-500">معدل التغيب (No-show)</span>
              <div className={cn(
                "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                noShowChange <= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {noShowChange <= 0 ? <ArrowDownRight className="w-3 h-3 ml-1" /> : <ArrowUpRight className="w-3 h-3 ml-1" />}
                {Math.abs(noShowChange).toFixed(1)}%
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-800" dir="ltr">
                {noShowRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {noShowRate < 10 ? "معدل ممتاز، المرضى ملتزمون" : "معدل مرتفع، يتطلب إجراءات وقائية"}
            </p>
          </div>
        </div>

        {/* ── ALERTS & ACTION CENTER ── */}
        {alerts.length > 0 && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h3 className="text-lg font-bold text-slate-800">مركز الإجراءات المقترحة</h3>
            </div>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div key={idx} className={cn(
                  "p-4 rounded-2xl border-r-4 shadow-sm flex items-start gap-4 transition-transform active:scale-[0.98]",
                  alert.type === 'error' ? "bg-red-50 border-red-500" : alert.type === 'warning' ? "bg-amber-50 border-amber-500" : "bg-blue-50 border-blue-500"
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    alert.type === 'error' ? "bg-red-100 text-red-600" : alert.type === 'warning' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                  )}>
                    <alert.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800">{alert.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                    <button 
                      onClick={() => handleAction(alert.actionType)}
                      className={cn(
                        "mt-3 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2",
                        alert.type === 'error' ? "bg-red-600 text-white" : alert.type === 'warning' ? "bg-amber-600 text-white" : "bg-blue-600 text-white"
                      )}
                    >
                      {alert.action}
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DOCTOR PERFORMANCE ── */}
        <div className="animate-slide-up [animation-delay:100ms]">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-500 fill-blue-500" />
              <h3 className="text-lg font-bold text-slate-800">أداء الأطباء</h3>
            </div>
            <span className="text-xs text-slate-500">مرتب حسب الإيرادات</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {doctorPerformance.map((doc, idx) => {
              const isTop = idx === 0 && doc.revenue > 0;
              const percent = Math.min(100, currentData.revenue > 0 ? (doc.revenue / currentData.revenue) * 100 : 0);
              const docColor = doc.color || '#3b82f6';
              const bgTint = `${docColor}0A`; // Extemely light 4%
              
              return (
              <div key={doc.id} className="glass-card p-4 relative overflow-hidden transition-all" style={{ backgroundColor: bgTint, borderColor: `${docColor}20` }}>
                {isTop && (
                  <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl flex items-center gap-1 shadow-sm z-10">
                    <Star className="w-3 h-3 fill-white" />
                    الأعلى أداءً
                  </div>
                )}
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0 shadow-sm" style={{ backgroundColor: `${docColor}15`, color: docColor }}>
                    {doc.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{doc.name}</h4>
                    <p className="text-xs text-slate-500">{doc.specialization}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-500 mt-0.5 bg-white/60 px-2 py-1 rounded-md shadow-sm">{doc.patientCount} مريض</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/70 p-3 rounded-xl border border-white/50 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1 opacity-80"><Target className="w-3 h-3 text-blue-500"/> المتوقع (للفترة)</p>
                    <p className="text-sm font-black text-slate-800" dir="ltr">{doc.expectedRevenue.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">د.ع</span></p>
                  </div>
                  <div className="bg-white/70 p-3 rounded-xl border border-white/50 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1 opacity-80"><Wallet className="w-3 h-3 text-emerald-500"/> المستلم (الفعلي)</p>
                    <p className="text-sm font-black text-emerald-600" dir="ltr">{doc.revenue.toLocaleString()} <span className="text-[9px] font-normal text-emerald-500/70">د.ع</span></p>
                  </div>
                </div>

                <div className="relative pt-1 px-1">
                  <div className="flex mb-1.5 items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold inline-block text-slate-600">
                        نسبة الإنتاجية من العيادة
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black inline-block" style={{ color: isTop ? '#10b981' : '#f59e0b' }}>
                        {percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-slate-200/60 inset-shadow-sm">
                    <div 
                      style={{ width: `${percent}%`, backgroundColor: isTop ? '#10b981' : '#f59e0b' }} 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-700"
                    />
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* ── PATIENT & TREATMENT ANALYTICS ── */}
        <div className="animate-slide-up [animation-delay:200ms]">
          <div className="flex items-center gap-2 mb-4 px-1">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-slate-800">توزيع العلاجات</h3>
          </div>
          <div className="glass-card p-4">
            <div className="h-[200px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={treatmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {treatmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {treatmentData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SMART INSIGHTS (AI-like) ── */}
        <div className="animate-slide-up [animation-delay:250ms]">
          <div className="flex items-center gap-2 mb-4 px-1">
            <Zap className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-slate-800">تحليلات ذكية</h3>
          </div>
          <div className="bg-blue-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-blue-200">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
              </svg>
            </div>
            <div className="relative z-10 space-y-4">
              {smartInsights.length > 0 ? smartInsights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{insight}</p>
                </div>
              )) : (
                <p className="text-sm opacity-90">لا توجد تحليلات كافية للفترة الحالية. استمر في تسجيل المواعيد والمدفوعات.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── ACTION MODALS ── */}
      
      {/* 1. Smart Reminders Modal */}
      <Modal 
        isOpen={activeModal === 'activate_reminders'} 
        onClose={() => setActiveModal(null)}
        title="تفعيل التذكيرات الذكية"
      >
        <div className="space-y-4">
          <ReminderSystem />
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setActiveModal(null)}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              حفظ الإعدادات
            </button>
          </div>
        </div>
      </Modal>

      {/* 2. Promotion Campaign Modal */}
      <Modal
        isOpen={activeModal === 'send_promotion'}
        onClose={() => setActiveModal(null)}
        title="حملة عروض وخصومات"
      >
        <div className="space-y-5">
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-sm text-blue-800 font-medium mb-1">هدف الحملة:</p>
            <p className="text-xs text-blue-600">زيادة عدد المواعيد في الأيام التي يقل فيها الإشغال.</p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-800">اختر نوع العرض:</label>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 border-2 border-blue-500 bg-blue-50 rounded-xl text-center">
                <Gift className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <span className="text-xs font-bold text-blue-600">خصم 20%</span>
              </button>
              <button className="p-3 border-2 border-slate-100 rounded-xl text-center hover:border-blue-200">
                <Activity className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-slate-600">تنظيف مجاني</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">المرضى المستهدفين:</label>
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-xs text-slate-600">المرضى الذين لم يزوروا العيادة منذ 3 أشهر</span>
              <span className="text-xs font-bold text-blue-600">({Math.floor(patients.length * 0.4)} مريض)</span>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => {
                setIsProcessingAction(true);
                setTimeout(() => {
                  setIsProcessingAction(false);
                  setActiveModal(null);
                  haptic.success();
                }, 1500);
              }}
              disabled={isProcessingAction}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessingAction ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  إرسال الحملة الآن
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* 3. Call Patients Modal */}
      <Modal
        isOpen={activeModal === 'call_patients'}
        onClose={() => setActiveModal(null)}
        title="الاتصال بالمرضى"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">قائمة المرضى الذين يحتاجون لمتابعة فورية لتأكيد المواعيد:</p>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {patients.slice(0, 5).map(patient => (
              <div key={patient.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{patient.name}</p>
                  <p className="text-xs text-slate-500">{patient.phone}</p>
                </div>
                <button 
                  onClick={() => window.open(`tel:${patient.phone}`)}
                  className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors"
                >
                  <PhoneCall className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold mt-4"
          >
            إغلاق
          </button>
        </div>
      </Modal>

    </Layout>
  );
}