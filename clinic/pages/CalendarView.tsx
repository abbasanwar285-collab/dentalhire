
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, MessageCircle, CalendarDays, List, LayoutGrid, Edit, Trash2, CheckCircle2, MapPin, Clock, AlertCircle } from 'lucide-react';
import { db } from '../services/db';
import { Appointment, DOCTORS } from '../types';
import { NotificationService } from '../services/notificationService';

const STATUS_CONFIG = {
    confirmed: { label: 'مؤكد', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    arrived: { label: 'وصل', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    completed: { label: 'مكتمل', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    cancelled: { label: 'ملغى', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    pending: { label: 'قيد الانتظار', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
};

export const CalendarView: React.FC = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<any[]>([]); // To store patient details for mobile lookup
    const [viewMode, setViewMode] = useState<'timeline' | 'month'>('timeline');
    const [selectedNote, setSelectedNote] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        // 1. Instant Local Load
        const [localApps, localPatients] = await Promise.all([
            db.getLocalAppointments(),
            db.getLocalPatients()
        ]);

        if (localApps.length > 0 || localPatients.length > 0) {
            const isUnlocked = localStorage.getItem('ortho_unlocked') === 'true';
            const visibleApps = localApps.filter(app => app.doctorId !== 'dr_ali' || isUnlocked);
            setAppointments(visibleApps);
            setPatients(localPatients);
        }

        // 2. Network Fetch (Background)
        try {
            const [appsData, patientsData] = await Promise.all([
                db.getAppointments(),
                db.getPatients()
            ]);

            const isUnlocked = localStorage.getItem('ortho_unlocked') === 'true';

            // Merge network data with local data to preserve local-only fields like status
            const localAppsMap = new Map(localApps.map(a => [a.id, a]));
            const mergedApps = appsData.map(app => {
                const localApp = localAppsMap.get(app.id);
                if (localApp && localApp.status) {
                    // Preserve local status which isn't synced to Supabase
                    return { ...app, status: localApp.status };
                }
                return app;
            });

            const visibleApps = mergedApps.filter(app => app.doctorId !== 'dr_ali' || isUnlocked);

            setAppointments(visibleApps);
            setPatients(patientsData);
        } catch (error) {
            console.error("Background sync failed:", error);
        }
    };

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setDate(1);
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setDate(newDate.getDate() - 1);
        }
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setDate(1);
            newDate.setMonth(newDate.getMonth() + 1);
        } else {
            newDate.setDate(newDate.getDate() + 1);
        }
        setCurrentDate(newDate);
    };

    const handleWhatsApp = (app: Appointment, e: React.MouseEvent) => {
        e.stopPropagation();

        // Find patient mobile
        const patient = patients.find(p => p.id === app.patientId);
        const mobile = patient?.mobile;

        if (!mobile) {
            alert('لا يوجد رقم هاتف مسجل لهذا المريض');
            return;
        }

        // Format mobile (remove leading 0 if present, assume IQ code 964 if not present or handle basic cases)
        let phone = mobile.replace(/[^\d]/g, '');
        if (phone.startsWith('07')) {
            phone = '964' + phone.substring(1);
        } // IQ format

        const message = `مرحباً ${app.patientName}، نود تذكيركم بموعدكم في عيادة الأسنان يوم ${app.date} الساعة ${app.time}.`;
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleEdit = (appId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/appointments?id=${appId}`);
    };

    const handleDelete = async (appId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('هل أنت متأكد من حذف هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء.')) {
            await db.deleteAppointment(appId);
            loadData(); // Refresh list
        }
    };

    const handleStatusUpdate = async (app: Appointment, newStatus: Appointment['status'], e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedApp = { ...app, status: newStatus };

        // Optimistic update
        setAppointments(prev => prev.map(a => a.id === app.id ? updatedApp : a));

        try {
            await db.saveAppointment(updatedApp);

            // Send Telegram Notification (only if Arrived)
            if (newStatus === 'arrived' && app.status !== 'arrived') {
                // Check if not Dr. Ali (usually restricted) or allow all. 
                // Assuming Dr. Ali is Ortho and might not want general ops notifications, 
                // but usually Arrived is good for everyone. Let's keep the filter consistent for now if needed,
                // or just send it. The User complained about duplicate, so we just send one.
                if (updatedApp.doctorId !== 'dr_ali') {
                    NotificationService.sendTelegramNotification(updatedApp);
                }
            }
        } catch (error) {
            console.error("Failed to update status", error);
            // Revert on failure
            setAppointments(prev => prev.map(a => a.id === app.id ? app : a));
            alert('فشل في تحديث الحالة، يرجى المحاولة مرة أخرى');
        }
    };

    const getDoctorStyle = (doctorId?: string) => {
        const doc = DOCTORS.find(d => d.id === doctorId);
        if (doc) {
            return doc;
        }
        return {
            name: '',
            color: 'bg-gray-700',
            border: 'border-gray-600',
            text: 'text-white',
            iconColor: 'text-violet-400',
            badgeBg: 'bg-gray-700'
        };
    };

    const headerDateDisplay = (() => {
        const formatter = new Intl.DateTimeFormat('ar-IQ', {
            calendar: 'gregory',
            month: 'long',
            year: 'numeric',
            day: viewMode === 'timeline' ? 'numeric' : undefined,
            weekday: viewMode === 'timeline' ? 'long' : undefined
        });
        const monthNum = new Intl.NumberFormat('ar-IQ').format(currentDate.getMonth() + 1);
        return formatter.formatToParts(currentDate)
            .map(({ type, value }) => type === 'month' ? `${value} (${monthNum})` : value)
            .join('');
    })();

    // Helper to get local date YYYY-MM-DD
    const getLocalDateStr = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const dateStr = getLocalDateStr(currentDate);
    const todayStr = getLocalDateStr(new Date());


    const isMissed = (app: Appointment) => {
        // 1. Status Check
        if (['arrived', 'completed', 'cancelled'].includes(app.status || 'confirmed')) {
            return false;
        }

        // 2. New Policy Check (Must be created after today's start)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        if (app.createdAt && new Date(app.createdAt).getTime() < todayStart.getTime()) {
            return false;
        }

        // 3. Date/Time Check
        const appDate = app.date; // YYYY-MM-DD
        if (appDate < todayStr) {
            return true;
        } // Past day

        if (appDate === todayStr) {
            // Check time
            try {
                // Parse "03:00 م"
                const timePart = app.time.replace('ص', 'AM').replace('م', 'PM');
                // Create date object for appointment
                const appDateTime = new Date(`${appDate} ${timePart}`);
                if (isNaN(appDateTime.getTime())) {
                    return false;
                } // Safety

                return appDateTime < new Date();
            } catch (e) {
                return false;
            }
        }

        return false;
    };

    return (
        <div className="space-y-4 relative pb-8">
            {/* Sub-Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-600/20 text-violet-400 rounded-xl">
                        <CalendarDays size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">المواعيد</h2>
                        <p className="text-gray-400 text-[10px]">تنظيم حجوزات العيادة</p>
                    </div>
                </div>
            </div>

            {/* Date Navigation Bar - Sticky but adjusted for unified scroll */}
            <div className="bg-gray-800/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-gray-700/50 flex items-center justify-between sticky top-2 z-20">
                <button onClick={handlePrev} className="p-2 hover:bg-gray-700 rounded-full transition text-white" title="اليوم السابق" aria-label="اليوم السابق"><ChevronRight /></button>

                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                        <h2 className="text-md font-bold text-white">{headerDateDisplay}</h2>
                    </div>
                    <div className="flex gap-2 mt-1 bg-gray-700/50 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`p-1.5 rounded-md transition ${viewMode === 'timeline' ? 'bg-gray-600 shadow text-white' : 'text-gray-400'}`}
                            title="عرض القائمة"
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`p-1.5 rounded-md transition ${viewMode === 'month' ? 'bg-gray-600 shadow text-white' : 'text-gray-400'}`}
                            title="عرض الشهر"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                </div>
                <button onClick={handleNext} className="p-2 hover:bg-gray-700 rounded-full transition text-white" title="اليوم التالي" aria-label="اليوم التالي"><ChevronLeft /></button>
            </div>

            {/* Add Appointment Button (Integrated at Top) */}
            <button
                onClick={() => navigate('/appointments?date=' + dateStr)}
                className="w-full bg-violet-600 text-white py-3 rounded-2xl shadow-md hover:bg-violet-700 transition active:scale-[0.98] flex items-center justify-center gap-2 font-bold text-lg"
            >
                <Plus size={22} />
                حجز موعد جديد
            </button>

            {/* Content */}
            {viewMode === 'timeline' ? (
                <div className="space-y-3 pb-4">
                    {appointments
                        .filter(a => a.date === dateStr)
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map(app => {
                            const style = getDoctorStyle(app.doctorId);

                            // Get background and border colors based on doctor
                            const getBgClasses = () => {
                                if (app.doctorId === 'dr_abbas') {
                                    return {
                                        bg: 'bg-blue-500/15',
                                        border: 'border-blue-500/40',
                                        leftBorder: 'border-l-blue-500',
                                        badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                    };
                                } else if (app.doctorId === 'dr_ali') {
                                    return {
                                        bg: 'bg-emerald-500/15',
                                        border: 'border-emerald-500/40',
                                        leftBorder: 'border-l-emerald-500',
                                        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    };
                                } else if (app.doctorId === 'dr_qasim') {
                                    return {
                                        bg: 'bg-orange-500/15',
                                        border: 'border-orange-500/40',
                                        leftBorder: 'border-l-orange-500',
                                        badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                    };
                                }
                                return {
                                    bg: 'bg-gray-800/60',
                                    border: 'border-gray-700',
                                    leftBorder: 'border-l-violet-500',
                                    badge: 'bg-gray-700 text-gray-300'
                                };
                            };

                            const colors = getBgClasses();
                            const missed = isMissed(app);

                            return (
                                <div
                                    key={app.id}
                                    onClick={() => app.patientId ? navigate(`/patient/${app.patientId}`) : null}
                                    className={`p-4 rounded-2xl border-l-4 ${colors.leftBorder} ${colors.bg} ${colors.border} border shadow-sm relative group cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all backdrop-blur-md`}
                                >
                                    <div className="relative flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-gray-300 bg-gray-800/50 px-2 py-0.5 rounded-lg border border-gray-700 flex items-center gap-1">
                                                    <Clock size={12} className="text-gray-400" />
                                                    {app.time}
                                                </span>
                                                {missed && (
                                                    <span className="bg-rose-500/10 text-rose-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-rose-500/20">
                                                        <AlertCircle size={10} />
                                                        فائت
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className={`font-bold text-lg text-white`}>{app.patientName}</h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${colors.badge}`}>
                                                    {style.name || 'غير محدد'}
                                                </span>
                                                {/* Status Badge */}
                                                {app.status && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-md font-bold border flex items-center gap-1 ${STATUS_CONFIG[app.status]?.color || 'text-gray-400'}`}>
                                                        {app.status === 'arrived' && <MapPin size={10} />}
                                                        {app.status === 'completed' && <CheckCircle2 size={10} />}
                                                        {STATUS_CONFIG[app.status]?.label || app.status}
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-400 px-2 py-0.5 rounded-md bg-gray-700/50 border border-gray-600">
                                                    {app.type}
                                                </span>
                                            </div>
                                            {app.notes && (
                                                <p
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedNote(app.notes!);
                                                    }}
                                                    className="text-xs mt-2 text-gray-400 line-clamp-1 border-r-2 border-gray-600 pr-2 hover:text-white transition-colors cursor-pointer"
                                                >
                                                    {app.notes}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-1 justify-end">
                                                {/* Status Actions */}
                                                {app.status !== 'arrived' && app.status !== 'completed' && (
                                                    <button
                                                        onClick={(e) => handleStatusUpdate(app, 'arrived', e)}
                                                        className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-bold border border-blue-500/20 transition flex items-center gap-1"
                                                        title="تسجيل وصول"
                                                    >
                                                        <MapPin size={12} />
                                                        وصل
                                                    </button>
                                                )}
                                                {app.status === 'arrived' && (
                                                    <button
                                                        onClick={(e) => handleStatusUpdate(app, 'completed', e)}
                                                        className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold border border-emerald-500/20 transition flex items-center gap-1"
                                                        title="إكمال الموعد"
                                                    >
                                                        <CheckCircle2 size={12} />
                                                        اكمل
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={(e) => handleEdit(app.id, e)}
                                                    className="p-2 rounded-full bg-gray-700 border border-gray-600 shadow-sm hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30 transition text-gray-400"
                                                    title="تعديل الموعد"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(app.id, e)}
                                                    className="p-2 rounded-full bg-gray-700 border border-gray-600 shadow-sm hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition text-gray-400"
                                                    title="حذف الموعد"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleWhatsApp(app, e)}
                                                    className={`p-2 rounded-full bg-gray-700 border border-gray-600 shadow-sm hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/30 transition text-gray-400`}
                                                    title="إرسال عبر واتساب"
                                                >
                                                    <MessageCircle size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                    {appointments.filter(a => a.date === dateStr).length === 0 && (
                        <div className="text-center py-20 opacity-50">
                            <CalendarDays size={48} className="mx-auto mb-4 text-gray-500" />
                            <p className="text-gray-400">لا توجد مواعيد لهذا اليوم</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-1 text-center" dir="rtl">
                    {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(d => (
                        <div key={d} className="text-xs font-bold text-gray-400 py-2">{d}</div>
                    ))}

                    {(() => {
                        const year = currentDate.getFullYear();
                        const month = currentDate.getMonth();
                        const firstDay = new Date(year, month, 1);
                        const lastDay = new Date(year, month + 1, 0);
                        const daysInMonth = lastDay.getDate();
                        const startDay = firstDay.getDay(); // 0-6

                        const cells = [];
                        // Empty cells
                        for (let i = 0; i < startDay; i++) {
                            cells.push(<div key={`empty-${i}`} className="h-24 bg-gray-800/30 rounded-lg"></div>);
                        }

                        // Day cells
                        for (let i = 1; i <= daysInMonth; i++) {
                            const d = new Date(year, month, i);
                            const dStr = getLocalDateStr(d);
                            const dayApps = appointments.filter(a => a.date === dStr);
                            const isToday = dStr === todayStr;

                            const missedApps = dayApps.filter(a => isMissed(a));

                            cells.push(
                                <div
                                    key={i}
                                    onClick={() => {
                                        setCurrentDate(d);
                                        setViewMode('timeline');
                                    }}
                                    className={`h-24 border rounded-xl p-1 relative cursor-pointer hover:border-violet-500 transition ${isToday ? 'bg-violet-500/10 border-violet-500' : 'bg-gray-800/60 backdrop-blur-md border-gray-700'}`}
                                >
                                    <span className={`text-sm font-bold block mb-1 ${isToday ? 'text-violet-400' : 'text-gray-300'}`}>{i}</span>

                                    {/* Appointment Dots */}
                                    <div className="flex flex-wrap content-start gap-1 mb-1">
                                        {dayApps.slice(0, 4).map((a, idx) => {
                                            const style = getDoctorStyle(a.doctorId);
                                            const colorClass = style.color.includes('blue') ? 'bg-blue-400' :
                                                style.color.includes('emerald') ? 'bg-emerald-400' :
                                                    style.color.includes('orange') ? 'bg-orange-400' : 'bg-violet-500';

                                            return (
                                                <div key={idx} className={`w-2 h-2 rounded-full ${colorClass}`}></div>
                                            );
                                        })}
                                        {dayApps.length > 4 && <span className="text-[10px] text-gray-400">+</span>}
                                    </div>

                                    {/* Missed Appointment Indicator - High Visibility */}
                                    {missedApps.length > 0 && (
                                        <div className="absolute bottom-1 right-1 left-1 flex items-center justify-center gap-1">
                                            <span className="bg-rose-950/80 border border-rose-500/40 text-rose-200 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                                <AlertCircle size={10} className="text-rose-400" />
                                                <span>فائت ({missedApps.length})</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        return cells;
                    })()}
                </div>
            )}

            {/* Note Modal */}
            {selectedNote && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedNote(null)}
                >
                    <div
                        className="bg-gray-800 rounded-3xl border border-gray-700 w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="bg-violet-600 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <AlertCircle size={20} />
                                ملاحظات الموعد
                            </h3>
                            <button
                                onClick={() => setSelectedNote(null)}
                                className="text-violet-200 hover:text-white transition"
                                aria-label="إغلاق التنبيه"
                                title="إغلاق"
                            >
                                <CheckCircle2 size={24} />
                            </button>
                        </div>
                        <div className="p-6 text-right">
                            <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                                {selectedNote}
                            </p>
                        </div>
                        <div className="p-4 border-t border-gray-700 bg-gray-900/50 flex justify-center">
                            <button
                                onClick={() => setSelectedNote(null)}
                                className="px-8 py-2.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition active:scale-95"
                            >
                                تم
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
