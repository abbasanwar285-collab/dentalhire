import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/ui/Layout';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  Plus, 
  User, 
  ChevronLeft, 
  Stethoscope, 
  Trash2, 
  LogIn, 
  CheckCircle2, 
  Search,
  AlertCircle,
  Timer,
  UserCheck,
  X,
  UserPlus
} from 'lucide-react';
import { format, parseISO, isSameDay, differenceInMinutes } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { haptic } from '../lib/haptics';
import { Modal } from '../components/ui/Modal';
import { PatientForm } from '../components/forms/PatientForm';
import { createArrivalRecord, calculatePunctualityProfile, getPunctualityInlineBadge } from '../lib/punctualityTracker';

export function WaitingRoom() {
  const navigate = useNavigate();
  const { patients, appointments, doctors, waitingRoom, addToWaitingRoom, updateWaitingStatus, removeFromWaitingRoom, updateAppointmentStatus, arrivalRecords, recordPatientArrival, addPatient } = useClinic();
  const { hasPermission } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddNewPatient, setIsAddNewPatient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(new Date());
  const [confirmApt, setConfirmApt] = useState<typeof todayAppointments[0] | null>(null);

  // Tick every 30 seconds to update wait times
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Today's scheduled appointments
  const todayAppointments = useMemo(() => {
    const today = new Date();
    return appointments
      .filter(a => a.status === 'scheduled' && isSameDay(parseISO(a.date), today))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments]);

  // Patients already in waiting room
  const waitingIds = new Set(waitingRoom.map(w => w.patientId));

  // Active entries (not done)
  const activeWaiting = waitingRoom.filter(w => w.status !== 'done');
  const waitingCount = activeWaiting.filter(w => w.status === 'waiting').length;
  const inSessionCount = activeWaiting.filter(w => w.status === 'in_session').length;

  const getWaitColor = (minutes: number) => {
    if (minutes < 30) return { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', label: 'وقت مناسب' };
    if (minutes < 60) return { bg: 'bg-amber-400', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200', label: 'انتظار متوسط' };
    if (minutes < 90) return { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-200', label: 'انتظار طويل' };
    return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-200', label: 'انتظار طويل جداً!' };
  };

  const formatWaitTime = (arrivalTime: string) => {
    const mins = differenceInMinutes(now, parseISO(arrivalTime));
    if (mins < 1) return 'الآن';
    if (mins < 60) return `${mins} د`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs} س ${remMins > 0 ? `${remMins} د` : ''}`;
  };

  const handleConfirmArrival = () => {
    if (!confirmApt) return;
    haptic.success();
    const now = new Date();
    addToWaitingRoom({
      patientId: confirmApt.patientId,
      patientName: confirmApt.patientName,
      doctorId: confirmApt.doctorId,
      doctorName: confirmApt.doctorName,
      appointmentId: confirmApt.id,
      arrivalTime: now.toISOString(),
      status: 'waiting',
    });
    // Record arrival for punctuality tracking
    const record = createArrivalRecord(
      confirmApt.patientId,
      confirmApt.id,
      confirmApt.date,
      confirmApt.time,
      now,
      `arr_${Date.now()}`
    );
    recordPatientArrival(record);
    setConfirmApt(null);
  };

  const handleAddFromAppointment = (apt: typeof todayAppointments[0]) => {
    haptic.light();
    const now = new Date();
    addToWaitingRoom({
      patientId: apt.patientId,
      patientName: apt.patientName,
      doctorId: apt.doctorId,
      doctorName: apt.doctorName,
      appointmentId: apt.id,
      arrivalTime: now.toISOString(),
      status: 'waiting',
    });
    // Record arrival for punctuality tracking
    const record = createArrivalRecord(
      apt.patientId,
      apt.id,
      apt.date,
      apt.time,
      now,
      `arr_${Date.now()}`
    );
    recordPatientArrival(record);
    setIsAddModalOpen(false);
  };

  const handleAddManual = (patient: { id: string; name: string }) => {
    haptic.light();
    addToWaitingRoom({
      patientId: patient.id,
      patientName: patient.name,
      arrivalTime: new Date().toISOString(),
      status: 'waiting',
    });
    setIsAddModalOpen(false);
    setSearchQuery('');
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return patients
      .filter(p => 
        !waitingIds.has(p.id) && 
        (p.name.toLowerCase().includes(q) || p.phone.includes(q))
      )
      .slice(0, 8);
  }, [searchQuery, patients, waitingIds]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-28" dir="rtl">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-95 transition-transform" title="رجوع">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-[17px] font-extrabold text-slate-800 flex items-center gap-2">
                  <Timer className="w-5 h-5 text-teal-600" />
                  صالة الانتظار
                </h1>
              </div>
            </div>
            <button
              onClick={() => { haptic.light(); setIsAddModalOpen(true); }}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-500 text-white shadow-lg shadow-teal-500/25 active:scale-95 transition-transform"
              title="إضافة مريض"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Today's Quick Add - Compact chips */}
        {todayAppointments.filter(a => !waitingIds.has(a.patientId)).length > 0 && (
          <div className="px-4 pt-3 pb-1">
            <h3 className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5 tracking-wide">
              <Clock className="w-3 h-3" />
              مواعيد اليوم
            </h3>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {todayAppointments.filter(a => !waitingIds.has(a.patientId)).map(apt => {
                const doc = doctors.find(d => d.id === apt.doctorId);
                return (
                  <button
                    key={apt.id}
                    onClick={() => { haptic.light(); setConfirmApt(apt); }}
                    className="shrink-0 flex items-center gap-2 bg-white rounded-full border border-slate-200 pl-2 pr-3 py-1.5 shadow-sm active:scale-95 transition-all hover:shadow-md hover:border-teal-300 group"
                  >
                    {doc ? (
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0" style={{ backgroundColor: doc.color || '#94a3b8' }}>
                        {doc.name.charAt(0)}
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-slate-400" />
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-[90px]">{apt.patientName}</span>
                    <span className="text-[9px] text-slate-400 font-medium">{apt.time}</span>
                    <span className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors">
                      <UserCheck className="w-3 h-3 text-teal-500" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="px-4 py-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm text-center">
              <div className="text-2xl font-black text-amber-500">{waitingCount}</div>
              <div className="text-[10px] font-semibold text-slate-500 mt-0.5">ينتظرون</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm text-center">
              <div className="text-2xl font-black text-sky-500">{inSessionCount}</div>
              <div className="text-[10px] font-semibold text-slate-500 mt-0.5">داخل العيادة</div>
            </div>
          </div>
        </div>

        {/* Waiting List */}
        <div className="px-4">
          {activeWaiting.length > 0 ? (
            <div className="space-y-2">
              {activeWaiting
                .sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime())
                .map((entry, idx) => {
                  const mins = differenceInMinutes(now, parseISO(entry.arrivalTime));
                  const waitStyle = entry.status === 'in_session' 
                    ? { bg: 'bg-sky-500', text: 'text-sky-600', light: 'bg-sky-50', border: 'border-sky-200', label: 'داخل العيادة' }
                    : getWaitColor(mins);
                  const doc = doctors.find(d => d.id === entry.doctorId);

                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all",
                        waitStyle.border,
                        entry.status === 'in_session' && 'ring-1 ring-sky-300'
                      )}
                    >
                      {/* Color indicator bar */}
                      <div className={cn("h-1 w-full", waitStyle.bg)} />
                      
                      <div className="p-3">
                        <div className="flex items-start gap-3">
                          {/* Number badge */}
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", waitStyle.light)}>
                            {entry.status === 'in_session' ? (
                              <Stethoscope className={cn("w-5 h-5", waitStyle.text)} />
                            ) : (
                              <span className={cn("text-base font-black", waitStyle.text)}>{idx + 1}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <h4 
                                  className="text-[14px] font-bold text-slate-800 truncate cursor-pointer"
                                  onClick={() => navigate(`/patients/${entry.patientId}`)}
                                >
                                  {entry.patientName}
                                </h4>
                                {(() => {
                                  const profile = calculatePunctualityProfile(entry.patientId, arrivalRecords);
                                  const badge = getPunctualityInlineBadge(profile);
                                  if (!badge) return null;
                                  return (
                                    <span
                                      className={cn('text-[11px] px-1.5 py-0.5 rounded-full shrink-0', badge.bgColor)}
                                      title={badge.tooltip}
                                    >
                                      {badge.icon}
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className={cn("flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold", waitStyle.light, waitStyle.text)}>
                                <Clock className="w-3 h-3" />
                                {entry.status === 'in_session' ? 'داخل العيادة' : formatWaitTime(entry.arrivalTime)}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                وصل {format(parseISO(entry.arrivalTime), 'hh:mm a', { locale: ar })}
                              </span>
                              {doc && (
                                <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: doc.color || '#64748b' }}>
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: doc.color || '#64748b' }} />
                                  د. {doc.name}
                                </span>
                              )}
                            </div>

                            {/* Wait bar */}
                            {entry.status === 'waiting' && (
                              <div className="mt-2">
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={cn("h-full rounded-full transition-all duration-1000", waitStyle.bg)}
                                    style={{ width: `${Math.min(100, (mins / 45) * 100)}%` }}
                                  />
                                </div>
                                {mins >= 30 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-3 h-3 text-red-500" />
                                    <span className="text-[9px] font-bold text-red-500">{waitStyle.label}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-2.5 mr-13">
                          {entry.status === 'waiting' && (
                            <button
                              onClick={() => { haptic.light(); updateWaitingStatus(entry.id, 'in_session'); }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-sky-50 text-sky-600 text-[11px] font-bold active:scale-95 transition-transform border border-sky-100"
                            >
                              <LogIn className="w-3.5 h-3.5" /> إدخال للعيادة
                            </button>
                          )}
                          {entry.status === 'in_session' && (
                            <button
                              onClick={() => {
                                haptic.success();
                                // Auto-complete the linked appointment
                                if (entry.appointmentId) {
                                  updateAppointmentStatus(entry.appointmentId, 'completed');
                                }
                                removeFromWaitingRoom(entry.id);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[11px] font-bold active:scale-95 transition-transform border border-emerald-100"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> تم / انتهى
                            </button>
                          )}
                          <button
                            onClick={() => { haptic.light(); removeFromWaitingRoom(entry.id); }}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 active:scale-95 transition-transform border border-red-100"
                            title="إزالة"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center mt-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Timer className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-600 font-bold text-sm mb-1">صالة الانتظار فارغة</p>
              <p className="text-slate-400 text-xs">اضغط + لإضافة مريض أو اضغط "وصل" من مواعيد اليوم</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Patient Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setSearchQuery(''); setIsAddNewPatient(false); }} title={isAddNewPatient ? "إضافة مريض جديد" : "إضافة مريض لصالة الانتظار"}>
        {isAddNewPatient ? (
          <div className="mt-2 text-right" dir="rtl">
            <PatientForm
              onSubmit={(data) => {
                const result = addPatient(data);
                if (!result.success || !result.patient) {
                  alert(result.error || 'حدث خطأ أثناء إضافة المريض');
                  return;
                }
                const now = new Date();
                addToWaitingRoom({
                  patientId: result.patient.id,
                  patientName: result.patient.name,
                  arrivalTime: now.toISOString(),
                  status: 'waiting',
                });
                const record = createArrivalRecord(
                  result.patient.id,
                  '', // no appointment
                  format(now, 'yyyy-MM-dd'),
                  format(now, 'HH:mm'),
                  now,
                  `arr_${Date.now()}`
                );
                recordPatientArrival(record);
                setIsAddModalOpen(false);
                setIsAddNewPatient(false);
                setSearchQuery('');
              }}
              onCancel={() => setIsAddNewPatient(false)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              placeholder="ابحث باسم المريض أو رقم الهاتف..."
              autoFocus
            />
          </div>

          {/* Search Results */}
          {filteredPatients.length > 0 && (
            <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 max-h-[250px] overflow-y-auto">
              {filteredPatients.map(patient => (
                <button
                  key={patient.id}
                  onClick={() => handleAddManual(patient)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-right active:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{patient.name}</p>
                    <p className="text-[11px] text-slate-400">{patient.phone}</p>
                  </div>
                  <Plus className="w-4 h-4 text-teal-500 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {searchQuery.trim() && filteredPatients.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-sm">
              <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              لا توجد نتائج
            </div>
          )}

          {/* Today appointments not yet added */}
          {!searchQuery.trim() && todayAppointments.filter(a => !waitingIds.has(a.patientId)).length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-slate-500 mb-2">مواعيد اليوم المتبقية</h4>
              <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 max-h-[250px] overflow-y-auto">
                {todayAppointments.filter(a => !waitingIds.has(a.patientId)).map(apt => {
                  const doc = doctors.find(d => d.id === apt.doctorId);
                  return (
                    <button
                      key={apt.id}
                      onClick={() => handleAddFromAppointment(apt)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-right active:bg-slate-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-sky-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-slate-800 truncate">{apt.patientName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">{apt.time}</span>
                          {doc && (
                            <span className="text-[10px] font-semibold" style={{ color: doc.color || '#64748b' }}>
                              د. {doc.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <UserCheck className="w-4 h-4 text-teal-500 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add New Patient Quick Button */}
          <button
            onClick={() => setIsAddNewPatient(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 rounded-xl bg-teal-50 text-teal-700 text-[13px] font-bold border border-teal-100 active:scale-95 transition-all shadow-sm hover:bg-teal-100"
          >
            <UserPlus className="w-5 h-5 text-teal-600" />
            إضافة مريض جديد
          </button>
        </div>
        )}
      </Modal>

      {/* Confirmation Overlay */}
      {confirmApt && (() => {
        const cDoc = doctors.find(d => d.id === confirmApt.doctorId);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6" dir="rtl">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmApt(null)} />
            <div 
              className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-[320px]"
              style={{ animation: 'scaleUp 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-teal-500" />
              </div>

              {/* Title */}
              <h3 className="text-center text-[16px] font-extrabold text-slate-800 mb-1">تأكيد الوصول</h3>
              <p className="text-center text-[13px] text-slate-500 mb-4">هل وصل المريض إلى العيادة؟</p>

              {/* Patient Info Card */}
              <div className="bg-slate-50 rounded-xl p-3 mb-5 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-slate-800 truncate">{confirmApt.patientName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {confirmApt.time}
                      </span>
                      {cDoc && (
                        <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: cDoc.color || '#64748b' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cDoc.color || '#64748b' }} />
                          د. {cDoc.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmArrival}
                  className="flex-1 py-3 rounded-xl bg-teal-500 text-white text-[13px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-teal-500/25"
                >
                  <CheckCircle2 className="w-4 h-4" /> نعم، وصل
                </button>
                <button
                  onClick={() => setConfirmApt(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <X className="w-4 h-4" /> إلغاء
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </Layout>
  );
}
