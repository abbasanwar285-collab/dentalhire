
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Save, Stethoscope, ChevronRight, ChevronLeft, Edit, X, Activity, ChevronDown } from 'lucide-react';
import { db } from '../services/db';
import { Patient, TREATMENT_TYPES, TIME_SLOTS, Appointment, DOCTORS } from '../types';
import { appointmentSchema } from '../types/validation';
import { NotificationService } from '../services/notificationService';
import { useDoctorContext } from '../hooks/useDoctorContext';

export const AppointmentBooking: React.FC = () => {
  const navigate = useNavigate();
  const { currentDoctorId: _currentDoctorId } = useDoctorContext();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('id');
  const preSelectedPatientId = searchParams.get('patientId');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);

  // Helper for local date
  const getLocalDateStr = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize with URL params if available, otherwise defaults to local Today
  const [date, setDate] = useState(searchParams.get('date') || getLocalDateStr());
  const [time, setTime] = useState(searchParams.get('time') || '');

  const [type, setType] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(''); // Default to empty
  const [status, setStatus] = useState<Appointment['status']>('confirmed');
  const [notes, setNotes] = useState('');
  const [existingCreatedAt, setExistingCreatedAt] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Calendar State
  const [_viewMode, _setViewMode] = useState<'timeline' | 'month'>('timeline');
  const [viewDate, setViewDate] = useState(new Date());

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showDayAppsModal, setShowDayAppsModal] = useState(false);
  const [selectedDayApps, setSelectedDayApps] = useState<Appointment[]>([]);

  useEffect(() => {
    if (date) {
      setViewDate(new Date(date));
    }
  }, []); // Only runs once on mount/date init

  useEffect(() => {
    const loadData = async () => {
      setFetching(true);

      // 1. Local Cache (Instant)
      try {
        const localPatients = await db.getLocalPatients();
        const localApps = await db.getLocalAppointments();

        if (localPatients.length > 0) {
          setPatients(localPatients);
        }
        if (localApps.length > 0) {
          const isUnlocked = localStorage.getItem('ortho_unlocked') === 'true';
          const visibleApps = localApps.filter(app => app.doctorId !== 'dr_ali' || isUnlocked);
          setAppointments(visibleApps);
        }

        // Instant name resolution from local cache
        if (localPatients.length > 0) {
          if (appointmentId) {
            const app = localApps.find(a => a.id === appointmentId);
            if (app) {
              setSelectedPatientId(app.patientId);
              setDate(app.date);
              setTime(app.time);
              setType(app.type);
              setSelectedDoctorId(app.doctorId || DOCTORS[0].id);
              setStatus(app.status || 'confirmed');
              setNotes(app.notes || '');
              setExistingCreatedAt(app.createdAt || null);
              const p = localPatients.find(pat => pat.id === app.patientId);
              if (p) {
                setPatientSearch(p.name);
              }
            }
          } else if (preSelectedPatientId) {
            setSelectedPatientId(preSelectedPatientId);
            const p = localPatients.find(pat => pat.id === preSelectedPatientId);
            if (p) {
              setPatientSearch(p.name);
            }
          }
        }

        if (localPatients.length > 0 || localApps.length > 0) {
          setFetching(false); // Show UI immediately if we have *something*
        }
      } catch (e) {
        console.warn('Local load failed', e);
      }

      // 2. Network Fetch (Fresh) - Parallelized
      try {
        const [patientsData, appsData] = await Promise.all([
          db.getPatients(),
          db.getAppointments()
        ]);

        // Only update if we have new data, to potentially avoid flicker if identical (React handles reference checks mostly)
        if (patientsData) {
          setPatients(patientsData);
        }
        if (appsData) {
          const isUnlocked = localStorage.getItem('ortho_unlocked') === 'true';
          const visibleApps = appsData.filter(app => app.doctorId !== 'dr_ali' || isUnlocked);
          setAppointments(visibleApps);
        }

        // Handle specific appointment fetch if an ID is present
        if (appointmentId) {
          // We can fetch this in parallel too, or after we have the base data. 
          // Often for editing, we want the specific record fresh.
          const app = await db.getAppointmentById(appointmentId);
          if (app) {
            setSelectedPatientId(app.patientId);
            setDate(app.date);
            setTime(app.time);
            setType(app.type);
            setSelectedDoctorId(app.doctorId || DOCTORS[0].id);
            setStatus(app.status || 'confirmed');
            setNotes(app.notes || '');
            setExistingCreatedAt(app.createdAt);
            setViewDate(new Date(app.date));
            // Find patient name for search field
            const p = patientsData.find(pat => pat.id === app.patientId);
            if (p) {
              setPatientSearch(p.name);
            }
          }
        } else if (preSelectedPatientId) {
          setSelectedPatientId(preSelectedPatientId);
          const p = patientsData.find(pat => pat.id === preSelectedPatientId);
          if (p) {
            setPatientSearch(p.name);
          }
        }

      } catch (error) {
        console.error("Failed to load fresh data", error);
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, [appointmentId, preSelectedPatientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const patient = patients.find(p => p.id === selectedPatientId);
    const effectivePatientName = patient?.name || patientSearch || 'Unknown';

    const validationResult = appointmentSchema.safeParse({
      patientId: selectedPatientId,
      patientName: effectivePatientName,
      doctorId: selectedDoctorId,
      date,
      time,
      type,
      status,
      notes
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      const errorMessage = firstError ? firstError.message : 'بيانات غير صحيحة';
      alert(errorMessage);
      return;
    }

    setLoading(true);

    // ALLOW OVERLAPPING: Validation removed.
    // const isTaken = existingAppointments.find(...)

    const newAppointment: Appointment = {
      id: appointmentId || (Date.now().toString() + Math.random().toString(36).slice(2, 7)),
      patientId: selectedPatientId, // Can be empty if just a text name (walk-in without file)
      patientName: effectivePatientName,
      date,
      time,
      type: type,
      status: status,
      doctorId: selectedDoctorId,
      notes,
      createdAt: existingCreatedAt || new Date().toISOString()
    };

    await db.saveAppointment(newAppointment);

    // Send Local Notification (Confirmation)
    await NotificationService.sendLocalNotification(
      'تم حجز الموعد بنجاح',
      `موعد لـ ${patient?.name} يوم ${date} الساعة ${time}`
    );

    // Send Telegram Notification (Silent/Background)
    NotificationService.sendTelegramNotification(newAppointment);


    // Schedule Reminder (Optional - e.g. 1 hour before, skipping logic for simple immediate test first)
    setLoading(false);
    navigate('/calendar');
  };

  const _selectedDoctorStyle = DOCTORS.find(d => d.id === selectedDoctorId) || DOCTORS[0];

  // --- Calendar Logic ---
  const arabicDays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const arabicMonths = [
    'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
    'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
  ];

  const handlePrevMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setDate(1); // Avoid overflow issues
    newDate.setMonth(newDate.getMonth() - 1);
    setViewDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setDate(1); // Avoid overflow issues
    newDate.setMonth(newDate.getMonth() + 1);
    setViewDate(newDate);
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = date === currentDateStr;
      const isToday = currentDateStr === getLocalDateStr(new Date());

      // Filter appointments for this day
      const dayApps = appointments.filter(a => a.date === currentDateStr);
      const hasApps = dayApps.length > 0;

      days.push(
        <button
          key={d}
          type="button"
          onClick={() => {
            setDate(currentDateStr);
            if (hasApps) {
              setSelectedDayApps(dayApps);
              setShowDayAppsModal(true);
            }
          }}
          className={`h-12 w-full rounded-lg text-sm font-bold transition flex flex-col items-center justify-center relative gap-0.5
                    ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-700 hover:bg-gray-100'}
                    ${isToday && !isSelected ? 'border border-primary text-primary' : ''}
                `}
        >
          <span>{d}</span>
          {/* Dots Indicator */}
          {hasApps && (
            <div className="flex gap-0.5">
              {dayApps.slice(0, 3).map((app, i) => {
                const doc = DOCTORS.find(d => d.id === app.doctorId);
                // Map light bg colors to strong dot colors
                let dotColor = 'bg-gray-400';
                if (doc?.color.includes('blue')) {
                  dotColor = 'bg-blue-500';
                } else if (doc?.color.includes('emerald')) {
                  dotColor = 'bg-emerald-500';
                } else if (doc?.color.includes('orange')) {
                  dotColor = 'bg-orange-500';
                }

                return (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : dotColor}`}></div>
                );
              })}
              {dayApps.length > 3 && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-gray-400'}`}></div>}
            </div>
          )}
        </button>
      );
    }
    return days;
  };

  const filteredPatients = patients.filter(p => {
    const term = patientSearch.toLowerCase().trim();
    if (!term) {
      return false;
    }
    return p.name.toLowerCase().includes(term) || (p.mobile && p.mobile.includes(term));
  }).slice(0, 8);

  if (fetching) {
    return <div className="p-10 text-center text-white">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Sub-Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-gray-700/50 text-gray-400 hover:text-white hover:bg-violet-600 transition"
            title="رجوع"
          >
            <ChevronRight size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">
              {appointmentId ? 'تعديل الموعد' : 'حجز موعد جديد'}
            </h2>
            <p className="text-gray-400 text-[10px]">تنظيم جدول مواعيد العيادة</p>
          </div>
        </div>
        <div className="p-2 bg-violet-600/20 text-violet-400 rounded-xl">
          {appointmentId ? <Edit size={20} /> : <Calendar size={20} />}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Patient Selection - Smart Search */}
        <div className="relative">
          <label htmlFor="patient-search" className="block text-sm font-bold text-gray-400 mb-2">اسم المريض</label>
          <div className="relative">
            <div className="absolute left-3 top-3.5 text-gray-400">
              {fetching ? <Activity size={20} className="animate-spin" /> : <ChevronDown size={20} />}
            </div>
            <input
              type="text"
              placeholder="ابحث باسم المريض أو رقم الهاتف..."
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setShowPatientResults(true);
                if (!e.target.value) {
                  setSelectedPatientId('');
                }
              }}
              onFocus={() => setShowPatientResults(true)}
              disabled={!!appointmentId}
              id="patient-search"
              className="w-full p-3 pl-10 rounded-xl border border-gray-600 focus:ring-2 focus:ring-violet-500 outline-none bg-gray-700/50 text-white transition disabled:bg-gray-800 disabled:text-gray-500"
            />
          </div>

          {/* Results Dropdown */}
          {showPatientResults && filteredPatients.length > 0 && !appointmentId && (
            <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              {filteredPatients.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    setPatientSearch(p.name);
                    setShowPatientResults(false);
                  }}
                  className="w-full p-4 flex flex-col items-start hover:bg-violet-600/20 transition-colors border-b border-gray-700 last:border-0"
                >
                  <span className="font-bold text-white">{p.name}</span>
                  {p.mobile && <span className="text-xs text-gray-400">{p.mobile}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Fallback for no results if searching */}
          {showPatientResults && patientSearch && filteredPatients.length === 0 && !appointmentId && (
            <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl p-4 text-center text-gray-500 shadow-2xl">
              لا يوجد مريض بهذا الاسم
            </div>
          )}
        </div>

        {/* Custom Calendar Date Picker */}
        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2">تاريخ الحجز</label>
          <div className="border border-gray-700 rounded-2xl p-4 bg-gray-800/30">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4 px-2">
              <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-gray-700 hover:shadow-sm rounded-full transition text-gray-400" title="الشهر السابق" aria-label="الشهر السابق">
                <ChevronRight size={20} />
              </button>
              <div className="font-bold text-white text-lg">
                {arabicMonths[viewDate.getMonth()]} {viewDate.getFullYear()}
              </div>
              <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-gray-700 hover:shadow-sm rounded-full transition text-gray-400" title="الشهر التالي" aria-label="الشهر التالي">
                <ChevronLeft size={20} />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {arabicDays.map(day => (
                <div key={day} className="text-xs font-bold text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>

            <div className="mt-3 text-center">
              <span className="text-xs text-violet-300 font-medium bg-violet-500/10 px-3 py-1 rounded-full">
                التاريخ المختار: {date}
              </span>
            </div>
          </div>
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2">الوقت (3:00م - 9:00م)</label>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map(slot => (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className={`p-2 rounded-lg text-sm font-medium transition-all ${time === slot
                  ? 'bg-violet-600 text-white shadow-lg scale-105'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600 border border-gray-600'
                  }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Treatment Type & Doctor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="treatment-type" className="block text-sm font-bold text-gray-400 mb-2">نوع العلاج</label>
            <select
              id="treatment-type"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full p-3 rounded-xl border border-gray-600 focus:ring-2 focus:ring-violet-500 outline-none bg-gray-700/50 text-white"
            >
              <option value="" disabled>اختر العلاج</option>
              {TREATMENT_TYPES.map(t => (
                <option key={t} value={t} className="bg-gray-800">{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="doctor-select" className="block text-sm font-bold text-gray-400 mb-2">الطبيب المعالج</label>
            <div className="relative">
              <select
                id="doctor-select"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className={`w-full p-3 pl-10 rounded-xl border-2 outline-none appearance-none transition bg-gray-700/50 text-white border-gray-600 focus:border-violet-500`}
              >
                <option value="" disabled>اختر الطبيب</option>
                {DOCTORS.map(doc => (
                  <option key={doc.id} value={doc.id} className="bg-gray-800 text-white">{doc.name}</option>
                ))}
              </select>
              <Stethoscope className={`absolute right-3 top-3.5 text-gray-400`} size={20} />
            </div>
          </div>
        </div>

        {/* Status Selection (Only if editing or admin) */}
        <div>
          <label htmlFor="status-select" className="block text-sm font-bold text-gray-400 mb-2">حالة الموعد</label>
          <div className="relative">
            <select
              id="status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full p-3 pl-10 rounded-xl border border-gray-600 focus:ring-2 focus:ring-violet-500 outline-none bg-gray-700/50 text-white appearance-none"
            >
              <option value="confirmed" className="bg-emerald-900 text-emerald-100">مؤكد</option>
              <option value="arrived" className="bg-blue-900 text-blue-100">وصل العيادة</option>
              <option value="completed" className="bg-gray-700 text-gray-300">مكتمل</option>
              <option value="cancelled" className="bg-red-900 text-red-100">ملغى</option>
              <option value="pending" className="bg-yellow-900 text-yellow-100">قيد الانتظار</option>
            </select>
            <Activity className="absolute right-3 top-3.5 text-gray-400" size={20} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes-textarea" className="block text-sm font-bold text-gray-400 mb-2">ملاحظات</label>
          <textarea
            id="notes-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-600 focus:ring-2 focus:ring-violet-500 outline-none h-24 resize-none bg-gray-700/50 text-white placeholder-gray-500"
            placeholder="ملاحظات إضافية..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-violet-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-violet-700 active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-violet-600/20"
        >
          <Save size={20} />
          {loading ? 'جاري الحفظ...' : (appointmentId ? 'تعديل الموعد' : 'حجز الموعد')}
        </button>
      </form>

      {/* Day Appointments Modal */}
      {showDayAppsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm border border-gray-700 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">مواعيد يوم {date}</h3>
              <button
                type="button"
                onClick={() => setShowDayAppsModal(false)}
                className="p-1 hover:bg-gray-700 rounded-full text-gray-400 transition"
                aria-label="إغلاق"
                title="إغلاق"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
              {selectedDayApps.length > 0 ? (
                selectedDayApps.sort((a, b) => a.time.localeCompare(b.time)).map(app => (
                  <div key={app.id} className="bg-gray-700/50 p-3 rounded-xl border border-gray-600">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-violet-300">{app.time}</span>
                      <span className="text-xs bg-gray-600 px-2 py-0.5 rounded text-gray-300">{
                        DOCTORS.find(d => d.id === app.doctorId)?.name
                      }</span>
                    </div>
                    <div className="font-medium text-white">{app.patientName}</div>
                    <div className="text-sm text-gray-400">{app.type}</div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">لا توجد مواعيد في هذا اليوم</p>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-800/50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowDayAppsModal(false)}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
