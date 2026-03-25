import React, { useState, useMemo } from 'react';
import { Appointment } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { DatePicker } from '../ui/DatePicker';
import { TimePicker } from '../ui/TimePicker';
import { Modal } from '../ui/Modal';
import { haptic } from '../../lib/haptics';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { smartMatch } from '../../lib/search';
import { calculatePunctualityProfile, getPunctualityBadge } from '../../lib/punctualityTracker';
import { useAuth } from '../../context/AuthContext';
import {
    User, Calendar as CalendarIcon, Clock, Stethoscope,
    FileText, Search, Phone, Check, Activity, ChevronRight,
    TrendingUp, TrendingDown, Minus
} from 'lucide-react';

interface AppointmentFormProps {
    onSubmit: (appointment: Omit<Appointment, 'id'>) => void;
    onCancel: () => void;
    initialData?: Appointment;
    initialDate?: string;
    initialPatientId?: string;
}

export function AppointmentForm({ onSubmit, onCancel, initialData, initialDate, initialPatientId }: AppointmentFormProps) {
    const { patients, treatments, doctors, appointments, arrivalRecords } = useClinic();
    const { currentUser } = useAuth();

    // Auto-fill doctor: match logged-in user to a doctor
    const getDefaultDoctorId = () => {
        if (initialData?.doctorId) return initialData.doctorId;
        const userName = currentUser?.displayName?.replace('د. ', '').replace('د.', '').trim().toLowerCase() || '';
        const matched = doctors.find(d => d.name.replace('د. ', '').replace('د.', '').trim().toLowerCase() === userName);
        return matched?.id || '';
    };

    const [formData, setFormData] = useState({
        patientId: initialData?.patientId || initialPatientId || '',
        doctorId: getDefaultDoctorId(),
        date: initialData?.date || initialDate || new Date().toISOString().split('T')[0],
        time: initialData?.time || '10:00',
        treatment: initialData?.treatment || '',
        status: initialData?.status || 'scheduled',
        notes: initialData?.notes || '',
    });

    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientList, setShowPatientList] = useState(false);
    const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);

    const selectedPatient = patients.find(p => p.id === formData.patientId);

    // Doctor color map for calendar dots
    const doctorColors = useMemo(() => {
        const map: Record<string, string> = {};
        doctors.forEach(d => { if (d.color) map[d.id] = d.color; });
        return map;
    }, [doctors]);

    // Filter patients by search
    const filteredPatients = patientSearch
        ? patients.filter(p => smartMatch(patientSearch, p.name) || smartMatch(patientSearch, p.phone || ''))
        : patients;

    // Time conflict detection
    const bookedTimesOnDate = useMemo(() => {
        return appointments
            .filter(apt => apt.date === formData.date && apt.id !== initialData?.id)
            .map(apt => apt.time);
    }, [appointments, formData.date, initialData?.id]);

    const timeConflict = bookedTimesOnDate.includes(formData.time);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.patientId || !formData.treatment || !formData.doctorId) {
            haptic.error();
            return;
        }
        haptic.success();
        const patientName = patients.find(p => p.id === formData.patientId)?.name || 'مريض غير معروف';
        const doctorName = doctors.find(d => d.id === formData.doctorId)?.name || 'طبيب غير معروف';
        onSubmit({
            ...formData,
            patientName,
            doctorName,
            status: formData.status as 'scheduled' | 'completed' | 'cancelled'
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 text-right pb-4">
            {/* ━━━━ 1. Patient Selection ━━━━ */}
            <div className="space-y-2 relative">
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 px-1">
                    <User className="w-4 h-4 text-teal-500" />
                    المريض
                    {!selectedPatient && <span className="text-slate-400 font-normal text-[11px] mr-auto">{patients.length} مريض متاح</span>}
                </label>
                {!selectedPatient ? (
                    <div className="relative">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="ابحث باسم المريض أو رقم الهاتف..."
                            value={patientSearch}
                            onChange={(e) => { setPatientSearch(e.target.value); setShowPatientList(true); }}
                            onFocus={() => setShowPatientList(true)}
                            className="w-full pr-10 pl-3 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all shadow-sm"
                        />
                        {showPatientList && (
                            <>
                                {/* Click-outside overlay to close dropdown */}
                                <div className="fixed inset-0 z-40" onClick={() => setShowPatientList(false)} />
                                <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-[240px] overflow-y-auto custom-scrollbar">
                                    {filteredPatients.length > 0 ? (
                                        filteredPatients.slice(0, 15).map((p, idx) => (
                                            <div
                                                key={p.id}
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, patientId: p.id }));
                                                    setShowPatientList(false);
                                                    setPatientSearch('');
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-3 hover:bg-teal-50 cursor-pointer transition-colors",
                                                    idx !== 0 && "border-t border-slate-100"
                                                )}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-[13px] font-bold shrink-0">
                                                    {p.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-bold text-slate-800 truncate">{p.name}</p>
                                                    {p.phone && <p className="text-[11px] text-slate-500 font-medium" dir="ltr">{p.phone}</p>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-5 text-center text-[13px] text-slate-400">لا توجد نتائج مطابقة</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                    <div className="flex items-center justify-between bg-white border border-teal-200 rounded-2xl p-2 shadow-sm ring-2 ring-teal-50 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center text-sm font-bold shadow-inner">
                                {selectedPatient.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-[14px] font-bold text-slate-800">{selectedPatient.name}</p>
                                {selectedPatient.phone && (
                                    <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                                        {selectedPatient.phone}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setFormData(prev => ({ ...prev, patientId: '' })); setPatientSearch(''); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 transition-colors ml-1"
                        >
                            تغيير
                        </button>
                    </div>
                    {/* Punctuality Alert Card */}
                    {(() => {
                        const profile = calculatePunctualityProfile(selectedPatient.id, arrivalRecords);
                        const badge = getPunctualityBadge(profile);
                        if (!badge || !profile) return null;

                        return (
                            <div className={cn(
                                'mt-2 p-3 rounded-xl border transition-all animate-in fade-in slide-in-from-top-2 duration-300',
                                badge.bgColor, badge.borderColor
                            )}>
                                <div className="flex flex-col gap-1">
                                    <span className={cn('text-[13px] font-bold', badge.color)}>
                                        {badge.label}
                                    </span>
                                    <p className={cn('text-[11.5px] font-medium leading-relaxed', badge.color, 'opacity-90')}>
                                        {badge.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })()}
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* ━━━━ 2. Calendar Selection ━━━━ */}
                <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 px-1">
                        <CalendarIcon className="w-4 h-4 text-blue-500" />
                        التاريخ
                        <span className="text-slate-400 text-xs font-normal bg-slate-100 px-1.5 py-0.5 rounded-md mr-auto">
                            {format(parseISO(formData.date), 'dd MMM yyyy', { locale: ar })}
                        </span>
                    </label>
                    <DatePicker
                        value={formData.date}
                        onChange={(d) => setFormData(prev => ({ ...prev, date: d }))}
                        appointments={appointments}
                        doctorColors={doctorColors}
                    />
                </div>

                {/* ━━━━ 3. Time Selection ━━━━ */}
                <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 px-1">
                        <Clock className="w-4 h-4 text-amber-500" />
                        الوقت
                    </label>
                    <TimePicker
                        value={formData.time}
                        onChange={(t) => setFormData(prev => ({ ...prev, time: t }))}
                        bookedTimes={bookedTimesOnDate}
                    />
                    
                    {timeConflict && (
                         <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded-xl flex items-start gap-2 animate-in fade-in zoom-in-95 duration-200 mt-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                             <div>
                                 <p className="font-bold">تنبيه: الوقت محجوز مسبقاً</p>
                                 <p className="text-amber-600/80 mt-0.5">لا يزال بإمكانك تأكيد الموعد إذا كنت ترغب في ذلك.</p>
                             </div>
                         </div>
                    )}
                </div>
            </div>

            {/* ━━━━ 4. Doctor Selection ━━━━ */}
            <div className="space-y-2 z-40 relative">
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 px-1">
                    <Stethoscope className="w-4 h-4 text-indigo-500" />
                    الطبيب المعالج
                </label>
                <div className="flex gap-2 w-full">
                    {doctors.map(d => {
                        const isSelected = formData.doctorId === d.id;
                        return (
                            <button
                                key={d.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, doctorId: d.id })}
                                className={cn(
                                    "flex items-center justify-center gap-2 p-2 rounded-xl border transition-all duration-200 flex-1 whitespace-nowrap",
                                    isSelected
                                        ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20 shadow-sm"
                                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                <div 
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm shrink-0" 
                                    style={{ backgroundColor: d.color || '#6366f1' }}
                                >
                                    {d.name.charAt(0)}
                                </div>
                                <span className={cn("text-[11px] font-bold truncate", isSelected ? "text-indigo-900" : "text-slate-700")}>
                                    {d.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ━━━━ 5. Treatment Selection ━━━━ */}
            <div className="space-y-2 z-30 relative">
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 px-1">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    نوع العلاج
                </label>
                <button
                    type="button"
                    onClick={() => setIsTreatmentModalOpen(true)}
                    className={cn(
                        "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all shadow-sm",
                        formData.treatment
                            ? "bg-emerald-50/60 border-emerald-200 text-emerald-800"
                            : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                    )}
                >
                    <span className={cn("text-[14px] font-bold", !formData.treatment && "font-medium")}>
                        {formData.treatment || 'اختر نوع العلاج...'}
                    </span>
                    <ChevronRight className="w-5 h-5 opacity-40 rotate-90" />
                </button>
            </div>

            {/* Treatment Modal */}
            <Modal isOpen={isTreatmentModalOpen} onClose={() => setIsTreatmentModalOpen(false)} title="نوع العلاج">
                <div className="grid grid-cols-1 gap-2">
                    {treatments.map((t) => {
                        const isSelected = formData.treatment === t.name;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                    setFormData({ ...formData, treatment: t.name });
                                    setIsTreatmentModalOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-right ${
                                    isSelected
                                        ? 'border-[#0071E3] bg-[#0071E3]/10 shadow-[0_2px_8px_rgba(0,113,227,0.15)]'
                                        : 'border-apple-separator bg-white hover:bg-apple-fill'
                                }`}
                            >
                                <span className={`text-[15px] font-bold ${isSelected ? 'text-[#0056B3]' : 'text-slate-700'}`}>
                                    {t.name}
                                </span>
                                {isSelected
                                    ? <Check className="w-5 h-5 text-[#0071E3]" />
                                    : <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                                }
                            </button>
                        );
                    })}
                </div>
            </Modal>


            {/* ━━━━ 6. Notes ━━━━ */}
            <div className="space-y-2 pb-2">
                <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700 px-1">
                    <FileText className="w-4 h-4 text-slate-400" />
                    ملاحظات 
                    <span className="text-slate-400 font-normal text-xs">(اختياري)</span>
                </label>
                <textarea
                    name="notes"
                    rows={2}
                    placeholder="تفاصيل إضافية عن حالة المريض أو الموعد..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full text-[14px] text-slate-800 bg-white border border-slate-200 rounded-2xl p-4 outline-none placeholder:text-slate-400 resize-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all shadow-sm"
                />
            </div>

            {/* ━━━━ 7. Action Buttons ━━━━ */}
            <div className="flex gap-3 pt-2">
                <button
                    type="submit"
                    disabled={!formData.patientId || !formData.treatment || !formData.doctorId}
                    onClick={() => haptic.light()}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold text-[15px] shadow-lg shadow-slate-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                >
                    <Check className="w-5 h-5" />
                    {initialData ? 'تحديث الموعد' : 'حفظ الموعد'}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        haptic.light();
                        onCancel();
                    }}
                    className="px-6 py-4 rounded-2xl font-bold text-[15px] text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all"
                >
                    إلغاء
                </button>
            </div>
        </form>
    );
}
