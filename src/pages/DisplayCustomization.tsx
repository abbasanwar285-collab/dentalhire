import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/ui/Layout';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { haptic } from '../lib/haptics';
import {
  ArrowRight, Calendar, Phone, Eye, EyeOff,
  ToggleLeft, ToggleRight, Square, Circle,
  Stethoscope, FileText, ClipboardList, StickyNote,
  ChevronDown, ChevronUp, RotateCcw, LayoutDashboard,
  BarChart3, Activity, Users2
} from 'lucide-react';
import { DEFAULT_DISPLAY_PREFERENCES } from '../types';

export function DisplayCustomization() {
  const navigate = useNavigate();
  const { displayPreferences, updateDisplayPreferences } = useClinic();
  const { hasPermission } = useAuth();

  const canCustomizeDashboard = hasPermission('customize_dashboard');

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between p-3.5">
      <div className="flex items-center gap-2.5">
        {value ? <Eye className="w-4 h-4 text-teal-500" /> : <EyeOff className="w-4 h-4 text-slate-300" />}
        <span className="text-[13px] text-slate-700 font-medium">{label}</span>
      </div>
      <button
        onClick={() => { haptic.light(); onChange(!value); }}
        className="transition-colors"
      >
        {value ? (
          <ToggleRight className="w-10 h-6 text-teal-500" />
        ) : (
          <ToggleLeft className="w-10 h-6 text-slate-300" />
        )}
      </button>
    </div>
  );

  return (
    <Layout title="تخصيص العرض" subtitle="تخصيص قائمة المرضى والملف الطبي">
      <div className="space-y-5 pb-8">
        {/* Back */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 text-sm text-teal-600 font-semibold"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع للإعدادات
        </button>

        {/* ── Patient List Settings ── */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-2 px-1 tracking-wider">قائمة المرضى</h3>
          <div className="glass-card overflow-hidden !rounded-2xl divide-y divide-slate-100">

            {/* Date Format */}
            <div className="p-3.5">
              <div className="flex items-center gap-2.5 mb-3">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span className="text-[13px] text-slate-700 font-medium">تنسيق تاريخ آخر زيارة</span>
              </div>
              <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-200">
                <button
                  onClick={() => { haptic.light(); updateDisplayPreferences({ dateFormat: 'absolute' }); }}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all ${
                    displayPreferences.dateFormat === 'absolute'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  📅 تاريخ محدد
                  <span className="block text-[10px] font-medium text-slate-400 mt-0.5">22-03-2026</span>
                </button>
                <button
                  onClick={() => { haptic.light(); updateDisplayPreferences({ dateFormat: 'relative' }); }}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all ${
                    displayPreferences.dateFormat === 'relative'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  ⏱ فترة زمنية
                  <span className="block text-[10px] font-medium text-slate-400 mt-0.5">قبل يومين</span>
                </button>
              </div>
            </div>

            <Toggle
              value={displayPreferences.showPhoneInList}
              onChange={v => updateDisplayPreferences({ showPhoneInList: v })}
              label="إظهار رقم الهاتف"
            />

            <Toggle
              value={displayPreferences.showLastVisitInList}
              onChange={v => updateDisplayPreferences({ showLastVisitInList: v })}
              label="إظهار تاريخ آخر زيارة"
            />

            {/* Avatar Style */}
            <div className="p-3.5">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-[13px] text-slate-700 font-medium">شكل صورة المريض</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { haptic.light(); updateDisplayPreferences({ avatarStyle: 'square' }); }}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    displayPreferences.avatarStyle === 'square'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <Square className="w-8 h-8 text-teal-500" />
                  <span className="text-[11px] font-bold text-slate-600">مربع</span>
                </button>
                <button
                  onClick={() => { haptic.light(); updateDisplayPreferences({ avatarStyle: 'circle' }); }}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    displayPreferences.avatarStyle === 'circle'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <Circle className="w-8 h-8 text-teal-500" />
                  <span className="text-[11px] font-bold text-slate-600">دائري</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Dashboard Settings ── */}
        {canCustomizeDashboard && (
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-2 px-1 tracking-wider">لوحة التحكم (الداشبورد)</h3>
            <div className="glass-card overflow-hidden !rounded-2xl divide-y divide-slate-100">
              <div className="p-3.5 flex items-center gap-2.5 bg-slate-50/50">
                <LayoutDashboard className="w-4 h-4 text-teal-600" />
                <span className="text-[12px] font-bold text-slate-600">تخصيص العناصر المعروضة</span>
              </div>
              
              <Toggle
                value={displayPreferences.showDashboardStats}
                onChange={v => updateDisplayPreferences({ showDashboardStats: v })}
                label="إظهار بطاقات الإحصائيات (المرضى، الحالات...)"
              />
              <Toggle
                value={displayPreferences.showDashboardChart}
                onChange={v => updateDisplayPreferences({ showDashboardChart: v })}
                label="إظهار مخطط المواعيد الأسبوعي"
              />
              <Toggle
                value={displayPreferences.showDashboardAppointments}
                onChange={v => updateDisplayPreferences({ showDashboardAppointments: v })}
                label="إظهار قائمة المواعيد القادمة"
              />
              <Toggle
                value={displayPreferences.showDashboardDoctors}
                onChange={v => updateDisplayPreferences({ showDashboardDoctors: v })}
                label="إظهار قائمة الأطباء المتواجدين"
              />
            </div>
          </div>
        )}

        {/* ── Patient Profile Settings ── */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-2 px-1 tracking-wider">الملف الطبي للمريض</h3>
          <div className="glass-card overflow-hidden !rounded-2xl divide-y divide-slate-100">
            <Toggle
              value={displayPreferences.showDentalChart}
              onChange={v => updateDisplayPreferences({ showDentalChart: v })}
              label="إظهار مخطط الأسنان"
            />
            <Toggle
              value={displayPreferences.showMedicalHistory}
              onChange={v => updateDisplayPreferences({ showMedicalHistory: v })}
              label="إظهار التاريخ الطبي والحساسية"
            />
            <Toggle
              value={displayPreferences.showAppointments}
              onChange={v => updateDisplayPreferences({ showAppointments: v })}
              label="إظهار قسم المواعيد"
            />
            <Toggle
              value={displayPreferences.showNotes}
              onChange={v => updateDisplayPreferences({ showNotes: v })}
              label="إظهار الملاحظات العامة"
            />

            {/* Default Plan View */}
            <div className="p-3.5">
              <div className="flex items-center gap-2.5 mb-3">
                <ClipboardList className="w-4 h-4 text-amber-500" />
                <span className="text-[13px] text-slate-700 font-medium">عرض الخطط العلاجية</span>
              </div>
              <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-200">
                <button
                  onClick={() => { haptic.light(); updateDisplayPreferences({ defaultPlanView: 'expanded' }); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-bold transition-all ${
                    displayPreferences.defaultPlanView === 'expanded'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  <ChevronDown className="w-3.5 h-3.5" /> موسّعة
                </button>
                <button
                  onClick={() => { haptic.light(); updateDisplayPreferences({ defaultPlanView: 'collapsed' }); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-bold transition-all ${
                    displayPreferences.defaultPlanView === 'collapsed'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  <ChevronUp className="w-3.5 h-3.5" /> مطوية
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            haptic.medium();
            updateDisplayPreferences(DEFAULT_DISPLAY_PREFERENCES);
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 text-[13px] font-bold active:scale-[0.98] transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          إعادة التعيين للإعدادات الافتراضية
        </button>
      </div>
    </Layout>
  );
}
