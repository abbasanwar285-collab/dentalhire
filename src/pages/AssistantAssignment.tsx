import { useState, useMemo } from 'react';
import { Layout } from '../components/ui/Layout';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { haptic } from '../lib/haptics';
import {
  UsersRound, UserCheck, Link2, Unlink, Stethoscope,
  ChevronDown, Check, Sparkles, AlertCircle
} from 'lucide-react';

export function AssistantAssignment() {
  const { doctors, assistantAssignments, addAssignment, removeAssignment } = useClinic();
  const { users } = useAuth();
  const [saved, setSaved] = useState<string | null>(null);

  // Get assistants/secretaries
  const assistants = useMemo(() =>
    users.filter(u => u.isActive && (u.role === 'secretary' || u.role === 'accountant')),
    [users]
  );

  // Get doctor users
  const doctorUsers = useMemo(() =>
    users.filter(u => u.isActive && u.role === 'doctor'),
    [users]
  );

  // Build assignment map: doctorId -> assistantUserId
  const assignmentMap = useMemo(() => {
    const map: Record<string, { assignmentId: string; assistantUserId: string }> = {};
    assistantAssignments.forEach(a => {
      map[a.doctorUserId] = { assignmentId: a.id, assistantUserId: a.assistantUserId };
    });
    return map;
  }, [assistantAssignments]);

  const handleAssign = (doctorId: string, assistantId: string) => {
    if (!assistantId) return;
    haptic.success();
    addAssignment(assistantId, doctorId);
    setSaved(doctorId);
    setTimeout(() => setSaved(null), 2000);
  };

  const handleUnassign = (assignmentId: string) => {
    haptic.medium();
    removeAssignment(assignmentId);
  };

  const getAssistantName = (userId: string) => {
    return users.find(u => u.id === userId)?.displayName || 'غير محدد';
  };

  const getDoctorColor = (doctorId: string) => {
    return doctors.find(d => d.id === doctorId)?.color || '#0d9488';
  };

  return (
    <Layout title="ربط المساعدين" subtitle="تعيين المساعدين للأطباء">
      <div className="space-y-5 pb-8">

        {/* Header Info Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <UsersRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[16px]">ربط المساعدين بالأطباء</h3>
              <p className="text-white/70 text-[12px] mt-0.5">حدد المساعد التابع لكل طبيب</p>
            </div>
          </div>
          <p className="text-white/80 text-[13px] leading-relaxed">
            عند ربط مساعد بطبيب، سيرى المساعد تلقائياً مهام تحضير الأدوات والمواد بناءً على مواعيد الطبيب اليومية.
          </p>
        </div>

        {/* No assistants warning */}
        {assistants.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-amber-800">لا يوجد مساعدون مسجلون</p>
              <p className="text-[12px] text-amber-600 mt-1">
                أضف مساعداً أو سكرتارية من صفحة "الأمان والصلاحيات" أولاً.
              </p>
            </div>
          </div>
        )}

        {/* Doctor Cards */}
        <div className="space-y-3">
          {doctorUsers.map(doctor => {
            const docColor = getDoctorColor(doctor.id);
            const assignment = assignmentMap[doctor.id];
            const isAssigned = !!assignment;
            const isSaved = saved === doctor.id;

            return (
              <div
                key={doctor.id}
                className="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all"
                style={{ borderColor: isAssigned ? docColor + '40' : '#e2e8f0', borderRightWidth: '4px', borderRightColor: docColor }}
              >
                {/* Doctor Header */}
                <div className="p-4 flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-[18px] shadow-sm"
                    style={{ backgroundColor: docColor }}
                  >
                    {doctor.displayName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[15px] font-bold text-slate-800">{doctor.displayName}</h4>
                    <p className="text-[12px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Stethoscope className="w-3 h-3" />
                      {doctor.specialization || 'طبيب أسنان'}
                    </p>
                  </div>
                  {isAssigned && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[11px] font-bold text-emerald-600">مربوط</span>
                    </div>
                  )}
                </div>

                {/* Assignment Section */}
                <div className="px-4 pb-4">
                  {isAssigned ? (
                    <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[12px] font-bold">
                          {getAssistantName(assignment.assistantUserId).charAt(0)}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                            <Link2 className="w-3 h-3 text-indigo-400" />
                            {getAssistantName(assignment.assistantUserId)}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">المساعد المعيّن</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassign(assignment.assignmentId)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 text-[11px] font-bold hover:bg-red-100 active:scale-95 transition-all border border-red-100"
                      >
                        <Unlink className="w-3 h-3" />
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <select
                          id={`assign-${doctor.id}`}
                          defaultValue=""
                          onChange={(e) => handleAssign(doctor.id, e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all appearance-none pr-10"
                        >
                          <option value="" disabled>اختر المساعد...</option>
                          {assistants.map(a => (
                            <option key={a.id} value={a.id}>{a.displayName}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Save feedback */}
                {isSaved && (
                  <div className="px-4 pb-3 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-1.5 text-emerald-600 text-[12px] font-bold">
                      <Check className="w-4 h-4" />
                      تم الربط بنجاح!
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {doctorUsers.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <Stethoscope className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-700 mb-1">لا يوجد أطباء</h3>
            <p className="text-xs text-slate-400">أضف أطباء من صفحة الأمان والصلاحيات أولاً</p>
          </div>
        )}

        {/* Info Tip */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[12px] text-blue-700 leading-relaxed">
            <strong>كيف يعمل؟</strong> بعد ربط المساعد بالطبيب، سيرى المساعد في صفحة "المهام" قائمة تحضير تلقائية
            تشمل الأدوات والمواد اللازمة بناءً على مواعيد الطبيب لهذا اليوم.
          </p>
        </div>
      </div>
    </Layout>
  );
}
