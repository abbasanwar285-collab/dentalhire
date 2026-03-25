import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/ui/Layout';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import {
  ArrowRight, Banknote, Edit2, X, Save, CalendarDays, Percent, ShieldAlert,
  Users, Check, UserCircle, Gift, Minus, Eye, Settings, Trash2, Plus, StickyNote,
  TrendingUp
} from 'lucide-react';
import { AppUser, UserRole, SalaryAdjustment } from '../types';
import { differenceInDays, format } from 'date-fns';
import { ar } from 'date-fns/locale';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'مدير النظام', doctor: 'طبيب', secretary: 'سكرتارية', accountant: 'محاسب',
};
const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700', doctor: 'bg-blue-100 text-blue-700',
  secretary: 'bg-violet-100 text-violet-700', accountant: 'bg-amber-100 text-amber-700',
};
const SALARY_TYPE_BADGE: Record<string, { label: string; color: string }> = {
  fixed: { label: 'راتب ثابت', color: 'bg-blue-500 text-white' },
  percentage: { label: 'نسبة', color: 'bg-emerald-500 text-white' },
  both: { label: 'راتب+نسبة', color: 'bg-indigo-500 text-white' },
  none: { label: 'غير محدد', color: 'bg-slate-200 text-slate-500' },
};
const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

type ModalTab = 'settings' | 'preview' | 'adjustments';

// ── Helper: compute salary cycle dates ──
function getSalaryCycle(startDay: number, today: Date) {
  const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
  let start: Date, end: Date;
  if (d < startDay) {
    start = new Date(y, m - 1, startDay); end = new Date(y, m, startDay - 1);
  } else {
    start = new Date(y, m, startDay); end = new Date(y, m + 1, startDay - 1);
  }
  start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
  return { cycleStart: start, cycleEnd: end };
}

function getCycleKey(cycleStart: Date) {
  return format(cycleStart, 'yyyy-MM');
}

export function AdminSalarySettings() {
  const navigate = useNavigate();
  const { users, currentUser, updateUser } = useAuth();
  const { patients } = useClinic();

  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>('settings');

  // Form State
  const [formSalaryType, setFormSalaryType] = useState<'none' | 'fixed' | 'percentage' | 'both'>('none');
  const [formFixedSalary, setFormFixedSalary] = useState(0);
  const [formPercentage, setFormPercentage] = useState(0);
  const [formStartDate, setFormStartDate] = useState(1);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Adjustment form
  const [adjAmount, setAdjAmount] = useState(0);
  const [adjReason, setAdjReason] = useState('');
  const [adjType, setAdjType] = useState<'bonus' | 'deduction'>('bonus');

  if (currentUser?.role !== 'admin') {
    return (
      <Layout title="إدارة الرواتب">
        <div className="empty-state">
          <ShieldAlert className="w-16 h-16 text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg font-semibold">لا تملك صلاحية الوصول</p>
        </div>
      </Layout>
    );
  }

  const activeUsers = users.filter(u => u.isActive && u.role !== 'admin');
  const totalFixedLiabilities = activeUsers.reduce((s, u) => s + ((u.salaryType === 'fixed' || u.salaryType === 'both') ? (u.fixedSalary || 0) : 0), 0);
  const configuredCount = activeUsers.filter(u => u.salaryType && u.salaryType !== 'none').length;

  const startEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormSalaryType(user.salaryType || 'none');
    setFormFixedSalary(user.fixedSalary || 0);
    setFormPercentage(user.percentage || 0);
    setFormStartDate(user.salaryStartDate || 1);
    setFormNotes(user.salaryNotes || '');
    setFormError(''); 
    setActiveTab('settings');
    setAdjAmount(0); setAdjReason(''); setAdjType('bonus');
  };

  const handleSave = () => {
    if (!editingUser) return;
    if (formStartDate < 1 || formStartDate > 28) { setFormError('يوم البدء 1-28'); return; }
    updateUser(editingUser.id, {
      salaryType: formSalaryType, fixedSalary: formFixedSalary,
      percentage: formPercentage, salaryStartDate: formStartDate,
      salaryNotes: formNotes,
    });
    setEditingUser(null);
  };

  // ── Salary Preview Calculation (same logic as MySalary.tsx) ──
  const previewData = useMemo(() => {
    if (!editingUser) return null;
    const user = editingUser;
    const sType = user.salaryType || 'none';
    if (sType === 'none') return null;

    const today = new Date();
    const startDay = user.salaryStartDate || 1;
    const { cycleStart, cycleEnd } = getSalaryCycle(startDay, today);
    const totalDays = differenceInDays(cycleEnd, cycleStart) + 1;
    const currentDay = Math.max(1, differenceInDays(today, cycleStart) + 1);
    const fixedSal = user.fixedSalary || 0;
    const pct = user.percentage || 0;

    let earnedFixed = 0;
    if (sType === 'fixed' || sType === 'both') {
      earnedFixed = totalDays > 0 ? (fixedSal / totalDays) * currentDay : 0;
    }

    let totalIncome = 0;
    if (sType === 'percentage' || sType === 'both') {
      patients.forEach(patient => {
        patient.treatmentPlans?.forEach(plan => {
          if (user.role === 'doctor') {
            plan.payments?.forEach(pay => {
              if ((pay.doctorId || plan.doctorId) === user.id) {
                const d = new Date(pay.date);
                if (d >= cycleStart && d <= cycleEnd) totalIncome += pay.amount;
              }
            });
          } else {
            plan.payments?.forEach(pay => {
              const d = new Date(pay.date);
              if (d >= cycleStart && d <= cycleEnd) totalIncome += pay.amount;
            });
          }
        });
      });
    }
    const earnedPct = (totalIncome * pct) / 100;
    const cycleKey = getCycleKey(cycleStart);

    const bonuses = (user.bonuses || []).filter(b => b.cycleKey === cycleKey);
    const deductions = (user.deductions || []).filter(d => d.cycleKey === cycleKey);
    const totalBonuses = bonuses.reduce((s, b) => s + b.amount, 0);
    const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);

    const grossSalary = earnedFixed + earnedPct;
    const netSalary = grossSalary + totalBonuses - totalDeductions;
    const progress = Math.min((currentDay / totalDays) * 100, 100);

    return {
      cycleStart, cycleEnd, totalDays, currentDay, progress,
      earnedFixed, earnedPct, totalIncome,
      bonuses, deductions, totalBonuses, totalDeductions,
      grossSalary, netSalary, cycleKey, sType, fixedSal, pct,
    };
  }, [editingUser, patients]);

  const handleAddAdj = () => {
    if (!editingUser || !previewData || adjAmount <= 0 || !adjReason.trim()) return;
    const newAdj: SalaryAdjustment = {
      id: crypto.randomUUID(),
      amount: adjAmount, reason: adjReason.trim(),
      date: new Date().toISOString(), cycleKey: previewData.cycleKey,
    };
    if (adjType === 'bonus') {
      updateUser(editingUser.id, { bonuses: [...(editingUser.bonuses || []), newAdj] });
      setEditingUser({ ...editingUser, bonuses: [...(editingUser.bonuses || []), newAdj] });
    } else {
      updateUser(editingUser.id, { deductions: [...(editingUser.deductions || []), newAdj] });
      setEditingUser({ ...editingUser, deductions: [...(editingUser.deductions || []), newAdj] });
    }
    setAdjAmount(0); setAdjReason('');
  };

  const handleDeleteAdj = (type: 'bonus' | 'deduction', id: string) => {
    if (!editingUser) return;
    if (type === 'bonus') {
      const updated = (editingUser.bonuses || []).filter(b => b.id !== id);
      updateUser(editingUser.id, { bonuses: updated });
      setEditingUser({ ...editingUser, bonuses: updated });
    } else {
      const updated = (editingUser.deductions || []).filter(d => d.id !== id);
      updateUser(editingUser.id, { deductions: updated });
      setEditingUser({ ...editingUser, deductions: updated });
    }
  };

  const badgeOf = (u: AppUser) => SALARY_TYPE_BADGE[u.salaryType || 'none'];

  // ────────── RENDER ──────────
  return (
    <Layout title="إدارة الرواتب الشاملة">
      <div className="space-y-5 pb-20">
        <button onClick={() => navigate('/settings')} className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
          <ArrowRight className="w-4 h-4" /> رجوع للإعدادات
        </button>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 flex flex-col items-center text-center bg-gradient-to-br from-[#FF2D55] to-[#FF6482] rounded-2xl border-0">
            <Banknote className="w-6 h-6 mb-1 text-white/80" />
            <h3 className="text-[10px] font-semibold text-white/80">الرواتب الثابتة / شهر</h3>
            <p className="font-extrabold text-lg text-white">{totalFixedLiabilities.toLocaleString()}</p>
            <span className="text-[9px] text-white/60">دينار عراقي</span>
          </div>
          <div className="glass-card p-4 flex flex-col items-center text-center bg-gradient-to-br from-[#5856D6] to-[#7B79E8] rounded-2xl border-0">
            <Users className="w-6 h-6 mb-1 text-white/80" />
            <h3 className="text-[10px] font-semibold text-white/80">موظفون بنظام رواتب</h3>
            <p className="font-extrabold text-lg text-white">{configuredCount}<span className="text-xs font-medium text-white/60"> / {activeUsers.length}</span></p>
          </div>
        </div>

        {/* ── Employee List ── */}
        <div>
          <h3 className="text-[14px] font-bold text-slate-800 mb-2 px-1">قائمة الموظفين</h3>
          <div className="space-y-2">
            {activeUsers.map(user => {
              const badge = badgeOf(user);
              return (
                <div key={user.id} className="glass-card p-3 flex items-center gap-3 cursor-pointer" onClick={() => startEdit(user)}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                    {user.displayName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-800 truncate">{user.displayName}</h4>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${ROLE_BADGE_COLORS[user.role]}`}>{ROLE_LABELS[user.role]}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${badge.color}`}>{badge.label}</span>
                    </div>
                    {user.salaryType && user.salaryType !== 'none' && (
                      <div className="flex gap-2 mt-1 text-[9px] text-slate-500 flex-wrap">
                        {(user.salaryType === 'fixed' || user.salaryType === 'both') && (
                          <span className="flex items-center gap-0.5"><Banknote className="w-2.5 h-2.5 text-blue-500" />{(user.fixedSalary || 0).toLocaleString()}</span>
                        )}
                        {(user.salaryType === 'percentage' || user.salaryType === 'both') && (
                          <span className="flex items-center gap-0.5"><Percent className="w-2.5 h-2.5 text-emerald-500" />{user.percentage}%</span>
                        )}
                        <span className="flex items-center gap-0.5"><CalendarDays className="w-2.5 h-2.5 text-orange-500" />يوم {user.salaryStartDate || 1}</span>
                      </div>
                    )}
                  </div>
                  <button title="تعديل" className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
            {activeUsers.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <UserCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-medium text-sm">لا يوجد موظفين نشطين</p>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════ EDIT MODAL ═══════════ */}
        {editingUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditingUser(null)} />
            <div className="relative w-full sm:max-w-md bg-white rounded-2xl animate-scale-in shadow-2xl max-h-[75vh] overflow-hidden flex flex-col mb-16">

              {/* ── Header ── */}
              <div className="shrink-0 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {editingUser.displayName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight">{editingUser.displayName}</h3>
                    <p className="text-[10px] text-slate-500">{ROLE_LABELS[editingUser.role]}</p>
                  </div>
                </div>
                <button title="إغلاق" onClick={() => setEditingUser(null)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>

              {/* ── Tabs ── */}
              <div className="shrink-0 flex border-b border-slate-100 bg-slate-50">
                {([
                  { id: 'settings' as ModalTab, label: 'الإعدادات', icon: <Settings className="w-3.5 h-3.5" /> },
                  { id: 'preview' as ModalTab, label: 'معاينة', icon: <Eye className="w-3.5 h-3.5" /> },
                  { id: 'adjustments' as ModalTab, label: 'مكافآت/خصومات', icon: <Gift className="w-3.5 h-3.5" /> },
                ]).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 flex items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                        : 'text-slate-500'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Tab Content (scrollable) ── */}
              <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-20 space-y-3">

                {/* ════════ TAB: SETTINGS ════════ */}
                {activeTab === 'settings' && (
                  <>
                    {/* Salary Type */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'none', label: 'بدون راتب', color: 'slate' },
                        { id: 'fixed', label: 'راتب ثابت', color: 'blue' },
                        { id: 'percentage', label: 'نسبة فقط', color: 'emerald' },
                        { id: 'both', label: 'راتب + نسبة', color: 'indigo' },
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => setFormSalaryType(type.id as any)}
                          className={`p-2 rounded-lg text-[11px] font-bold border-2 text-center ${
                            formSalaryType === type.id
                              ? type.color === 'blue' ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : type.color === 'emerald' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : type.color === 'indigo' ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-slate-400 bg-slate-50 text-slate-600'
                              : 'border-transparent bg-slate-50 text-slate-500'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>

                    {/* Fixed */}
                    {(formSalaryType === 'fixed' || formSalaryType === 'both') && (
                      <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                        <label className="block text-[11px] font-bold text-blue-800 mb-1 flex items-center gap-1"><Banknote className="w-3.5 h-3.5" /> الراتب الثابت</label>
                        <input type="number" value={formFixedSalary || ''} onChange={e => setFormFixedSalary(Number(e.target.value))}
                          className="w-full p-2 bg-white border-2 border-blue-200 rounded-lg text-[13px] font-bold text-blue-800 outline-none focus:border-blue-500" placeholder="المبلغ (د.ع)" />
                      </div>
                    )}

                    {/* Percentage */}
                    {(formSalaryType === 'percentage' || formSalaryType === 'both') && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <label className="block text-[11px] font-bold text-emerald-800 mb-1 flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> النسبة من الوارد</label>
                        <div className="relative">
                          <input type="number" min="0" max="100" value={formPercentage || ''} onChange={e => setFormPercentage(Number(e.target.value))}
                            className="w-full p-2 bg-white border-2 border-emerald-200 rounded-lg text-[13px] font-bold text-emerald-800 outline-none focus:border-emerald-500 pr-8" placeholder="النسبة" />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500 text-[13px] font-bold">%</span>
                        </div>
                      </div>
                    )}

                    {/* Day Picker */}
                    {formSalaryType !== 'none' && (
                      <div className="p-2.5 bg-orange-50 border border-orange-100 rounded-xl">
                        <label className="block text-[11px] font-bold text-orange-800 mb-1 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> يوم بدء دورة الراتب</label>
                        <div className="grid grid-cols-7 gap-1">
                          {DAYS.map(day => (
                            <button key={day} onClick={() => setFormStartDate(day)} className={`h-7 rounded-md text-[10px] font-bold flex items-center justify-center ${formStartDate === day ? 'bg-orange-500 text-white shadow-sm scale-105' : 'bg-white text-slate-600 border border-slate-200'}`}>{day}</button>
                          ))}
                        </div>
                        <div className="mt-1.5 text-center text-[10px] font-bold text-orange-700 bg-orange-100/50 py-0.5 rounded">يوم {formStartDate} من كل شهر</div>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="p-2.5 bg-violet-50 border border-violet-100 rounded-xl">
                      <label className="block text-[11px] font-bold text-violet-800 mb-1 flex items-center gap-1"><StickyNote className="w-3.5 h-3.5" /> ملاحظات للموظف</label>
                      <textarea
                        value={formNotes}
                        onChange={e => setFormNotes(e.target.value)}
                        className="w-full p-2 bg-white border-2 border-violet-200 rounded-lg text-[12px] text-violet-800 outline-none focus:border-violet-500 resize-none"
                        rows={2} placeholder="ملاحظة تظهر للموظف في صفحة راتبي..."
                      />
                    </div>

                    {formError && <p className="text-red-600 text-[11px] bg-red-50 p-2 rounded-lg font-medium">{formError}</p>}

                    <button onClick={handleSave} className="w-full py-2.5 rounded-lg font-bold text-[13px] flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm hover:shadow-md transition-all">
                      <Save className="w-3.5 h-3.5" /> حفظ الإعدادات
                    </button>
                  </>
                )}

                {/* ════════ TAB: PREVIEW ════════ */}
                {activeTab === 'preview' && previewData && (
                  <>
                    {/* Total Card */}
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-4 text-white text-center">
                      <p className="text-[10px] text-indigo-200 font-medium">صافي المستحق حتى الآن</p>
                      <p className="font-extrabold text-2xl mt-1">{Math.round(previewData.netSalary).toLocaleString()}</p>
                      <p className="text-[10px] text-indigo-300">دينار عراقي</p>
                      <p className="text-[9px] text-indigo-200 mt-2 bg-white/10 inline-block px-2 py-0.5 rounded-full">
                        {format(previewData.cycleStart, 'dd MMM', { locale: ar })} → {format(previewData.cycleEnd, 'dd MMM', { locale: ar })} ({previewData.currentDay}/{previewData.totalDays} يوم)
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                        <span>التقدم الزمني</span><span>{Math.round(previewData.progress)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${previewData.progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.max(5, previewData.progress)}%` }} />
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2">
                      {(previewData.sType === 'fixed' || previewData.sType === 'both') && (
                        <div className="flex justify-between items-center bg-blue-50 rounded-lg p-2.5">
                          <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1"><Banknote className="w-3.5 h-3.5" /> الثابت</span>
                          <span className="text-[12px] font-extrabold text-blue-700">{Math.round(previewData.earnedFixed).toLocaleString()}</span>
                        </div>
                      )}
                      {(previewData.sType === 'percentage' || previewData.sType === 'both') && (
                        <div className="flex justify-between items-center bg-emerald-50 rounded-lg p-2.5">
                          <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> النسبة ({previewData.pct}%)</span>
                          <span className="text-[12px] font-extrabold text-emerald-700">{Math.round(previewData.earnedPct).toLocaleString()}</span>
                        </div>
                      )}
                      {previewData.totalBonuses > 0 && (
                        <div className="flex justify-between items-center bg-green-50 rounded-lg p-2.5">
                          <span className="text-[11px] font-bold text-green-800 flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> المكافآت</span>
                          <span className="text-[12px] font-extrabold text-green-700">+{previewData.totalBonuses.toLocaleString()}</span>
                        </div>
                      )}
                      {previewData.totalDeductions > 0 && (
                        <div className="flex justify-between items-center bg-red-50 rounded-lg p-2.5">
                          <span className="text-[11px] font-bold text-red-800 flex items-center gap-1"><Minus className="w-3.5 h-3.5" /> الخصومات</span>
                          <span className="text-[12px] font-extrabold text-red-700">-{previewData.totalDeductions.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {(previewData.sType === 'percentage' || previewData.sType === 'both') && (
                      <div className="bg-slate-50 rounded-lg p-2.5 flex justify-between text-[10px] text-slate-600">
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> الوارد الكلي</span>
                        <span className="font-bold text-slate-800">{previewData.totalIncome.toLocaleString()} د.ع</span>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'preview' && !previewData && (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm font-medium">لم يتم تعيين نظام مالي لهذا الموظف</p>
                  </div>
                )}

                {/* ════════ TAB: ADJUSTMENTS ════════ */}
                {activeTab === 'adjustments' && (
                  <>
                    {/* Add Form */}
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex gap-1.5">
                        <button onClick={() => setAdjType('bonus')} className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 ${adjType === 'bonus' ? 'bg-green-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                          <Gift className="w-3 h-3" /> مكافأة
                        </button>
                        <button onClick={() => setAdjType('deduction')} className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 ${adjType === 'deduction' ? 'bg-red-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                          <Minus className="w-3 h-3" /> خصم
                        </button>
                      </div>
                      <input type="number" value={adjAmount || ''} onChange={e => setAdjAmount(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-800 outline-none focus:border-blue-500" placeholder="المبلغ (د.ع)" />
                      <input type="text" value={adjReason} onChange={e => setAdjReason(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 outline-none focus:border-blue-500" placeholder="السبب..." />
                      <button onClick={handleAddAdj} disabled={adjAmount <= 0 || !adjReason.trim()}
                        className="w-full py-2 rounded-lg font-bold text-[12px] flex items-center justify-center gap-1 bg-blue-600 text-white disabled:opacity-40">
                        <Plus className="w-3.5 h-3.5" /> إضافة {adjType === 'bonus' ? 'مكافأة' : 'خصم'}
                      </button>
                    </div>

                    {/* Existing Adjustments */}
                    {previewData && (previewData.bonuses.length > 0 || previewData.deductions.length > 0) ? (
                      <div className="space-y-1.5">
                        <h4 className="text-[11px] font-bold text-slate-600 px-0.5">الدورة الحالية</h4>
                        {previewData.bonuses.map(b => (
                          <div key={b.id} className="flex items-center justify-between bg-green-50 rounded-lg p-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold text-green-700 flex items-center gap-1"><Gift className="w-3 h-3" /> مكافأة</span>
                              <p className="text-[11px] text-green-800 font-bold">{b.amount.toLocaleString()} د.ع</p>
                              <p className="text-[9px] text-green-600 truncate">{b.reason}</p>
                            </div>
                            <button title="حذف" onClick={() => handleDeleteAdj('bonus', b.id)} className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {previewData.deductions.map(d => (
                          <div key={d.id} className="flex items-center justify-between bg-red-50 rounded-lg p-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold text-red-700 flex items-center gap-1"><Minus className="w-3 h-3" /> خصم</span>
                              <p className="text-[11px] text-red-800 font-bold">{d.amount.toLocaleString()} د.ع</p>
                              <p className="text-[9px] text-red-600 truncate">{d.reason}</p>
                            </div>
                            <button title="حذف" onClick={() => handleDeleteAdj('deduction', d.id)} className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        {/* Summary */}
                        <div className="bg-indigo-50 rounded-lg p-2.5 flex justify-between text-[11px] font-bold mt-2">
                          <span className="text-indigo-800">صافي التعديلات</span>
                          <span className={previewData.totalBonuses - previewData.totalDeductions >= 0 ? 'text-green-700' : 'text-red-700'}>
                            {(previewData.totalBonuses - previewData.totalDeductions >= 0 ? '+' : '')}{(previewData.totalBonuses - previewData.totalDeductions).toLocaleString()} د.ع
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-400 text-[11px]">
                        <p>لا توجد مكافآت أو خصومات للدورة الحالية</p>
                      </div>
                    )}
                  </>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
