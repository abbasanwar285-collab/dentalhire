import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/ui/Layout';
import { useClinic } from '../context/ClinicContext';
import { Calendar as CalendarIcon, Clock, Plus, Search, ChevronLeft, CheckCircle2, ChevronRight, List, Filter, ArrowUpRight, History, LayoutGrid } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { haptic } from '../lib/haptics';
import { smartMatch } from '../lib/search';
import { Modal } from '../components/ui/Modal';
import { AppointmentForm } from '../components/forms/AppointmentForm';
import { getAppointmentDisplayStatus, DisplayStatus } from '../lib/appointmentUtils';
import { debounce } from '../lib/security';

export function Appointments() {
  const navigate = useNavigate();
  const { appointments, doctors, patients, waitingRoom, addAppointment, updateAppointmentStatus } = useClinic();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientForNewApt, setSelectedPatientForNewApt] = useState<string>('');
  const [showAllPopovers, setShowAllPopovers] = useState(false);
  const [hideSelectedTooltip, setHideSelectedTooltip] = useState(false);

  const debouncedSetSearch = useMemo(
    () => debounce((val: string) => setSearchQuery(val), 300),
    []
  );

  // Calendar view: filter by selected date. List view: show all.
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const patient = patients.find(p => p.id === apt.patientId);
      const waitingEntry = waitingRoom.find(w => w.appointmentId === apt.id);
      const displayStatusResult = getAppointmentDisplayStatus(apt, patient, waitingEntry);

      // Ensure apt.date and apt.time exist to prevent crashes
      const safeDate = apt.date || new Date().toISOString().split('T')[0];
      const safeTime = apt.time || '00:00';
      
      // Filter logic
      if (filter === 'upcoming' && displayStatusResult.status !== 'upcoming' && displayStatusResult.status !== 'arrived' && displayStatusResult.status !== 'in_treatment') return false;
      if (filter === 'past' && displayStatusResult.status !== 'completed' && displayStatusResult.status !== 'missed') return false;

      // Search
      let dateStr = '';
      try {
        dateStr = format(parseISO(safeDate), 'EEEE dd MMMM yyyy', { locale: ar });
      } catch (e) {
        dateStr = safeDate;
      }
      const searchableText = `${apt.patientName} ${apt.treatment} ${apt.doctorName || ''} ${safeTime} ${dateStr} ${apt.notes || ''}`;
      if (!smartMatch(searchQuery, searchableText)) return false;

      // Calendar mode: only selected date
      if (viewMode === 'calendar') {
        try {
          return isSameDay(parseISO(safeDate), selectedDate);
        } catch (e) {
          return false;
        }
      }
      return true;
    });
  }, [appointments, patients, waitingRoom, filter, searchQuery, viewMode, selectedDate]);

  // For list view: group by date
  const groupedByDate = useMemo(() => {
    if (viewMode !== 'list') return {};
    const grouped: Record<string, typeof filteredAppointments> = {};
    filteredAppointments.forEach(apt => {
      const key = apt.date;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(apt);
    });
    return grouped;
  }, [filteredAppointments, viewMode]);

  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));
  }, [groupedByDate]);

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((apt) => {
      try {
        return isSameDay(parseISO(apt.date || new Date().toISOString().split('T')[0]), date);
      } catch (e) {
        return false;
      }
    });
  };

  const renderAppointmentCard = (apt: typeof appointments[0]) => {
    const docColor = doctors.find(d => d.id === apt.doctorId)?.color || '#0d9488';
    const docInitial = apt.doctorName?.charAt(0) || 'د';
    const patient = patients.find(p => p.id === apt.patientId);
    const waitingEntry = waitingRoom.find(w => w.appointmentId === apt.id);
    const displayStatus = getAppointmentDisplayStatus(apt, patient, waitingEntry);

    return (
      <div key={apt.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 active:scale-[0.98] transition-transform">
        <div
          className="flex items-center p-4 gap-3 cursor-pointer"
          onClick={() => navigate(`/patients/${apt.patientId}`)}
          style={{ borderRight: `4px solid ${docColor}` }}
        >
          {/* Doctor Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
            style={{ backgroundColor: docColor }}
          >
            {docInitial}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-800 truncate">{apt.patientName}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{apt.treatment}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {apt.time || '00:00'}
              </span>
              {viewMode === 'calendar' && (
                <span className="text-slate-300">·</span>
              )}
              {viewMode === 'calendar' && (
                <span style={{ color: docColor }} className="font-semibold text-xs">{apt.doctorName}</span>
              )}
            </div>
          </div>

          {/* Status + Action */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={cn(
              "text-[11px] font-semibold px-2.5 py-1 rounded-lg",
              displayStatus.bgColor,
              displayStatus.color
            )}>
              {displayStatus.label}
            </span>
            {displayStatus.status === 'upcoming' && !waitingEntry && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  haptic.light();
                  updateAppointmentStatus(apt.id, 'completed');
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all active:scale-90"
                title="تحديد كمكتمل"
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout
      title="المواعيد"
      subtitle={`${appointments.length} موعد مسجل`}
    >
      <div className="space-y-4">
        {/* Add Appointment Button */}
        <button
          onClick={() => {
            haptic.light();
            setSelectedPatientForNewApt('');
            setIsModalOpen(true);
          }}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3.5 rounded-2xl font-bold text-[15px] shadow-lg shadow-teal-200 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          إضافة موعد جديد
        </button>

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPatientForNewApt('');
          }}
          title="إضافة موعد جديد"
        >
          <AppointmentForm
            initialDate={format(selectedDate, 'yyyy-MM-dd')}
            initialPatientId={selectedPatientForNewApt}
            onSubmit={(data) => {
              addAppointment(data);
              setIsModalOpen(false);
              setSelectedPatientForNewApt('');
            }}
            onCancel={() => {
              setIsModalOpen(false);
              setSelectedPatientForNewApt('');
            }}
          />
        </Modal>

        {/* Search Bar - Full Width with Patient Suggestions */}
        <div className="relative w-full">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center z-10">
            <Search className="w-4 h-4 text-teal-600" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="بحث بأسم المريض أو رقم الهاتف..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              debouncedSetSearch(e.target.value);
            }}
            aria-label="بحث في المواعيد والمرضى"
            className="w-full pr-14 pl-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-[14px] text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-teal-500 focus:shadow-[0_0_0_3px_rgba(15,118,110,0.08)]"
          />
          {/* Patient Suggestions Dropdown */}
          {inputValue.trim().length >= 1 && (() => {
            const matchedPatients = patients.filter(p =>
              smartMatch(inputValue, p.name) || smartMatch(inputValue, p.phone || '')
            ).slice(0, 8);
            if (matchedPatients.length === 0) return null;
            return (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setInputValue('')} />
                <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-[280px] overflow-y-auto custom-scrollbar">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400">👤 المرضى المطابقون ({matchedPatients.length})</p>
                  </div>
                  {matchedPatients.map((p, idx) => (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 hover:bg-teal-50 cursor-pointer transition-colors",
                        idx !== 0 && "border-t border-slate-100"
                      )}
                      onClick={() => {
                        navigate(`/patients/${p.id}`);
                      }}
                    >
                      <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-[13px] font-bold shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-800 truncate">{p.name}</p>
                        {p.phone && <p className="text-[11px] text-slate-500 font-medium" dir="ltr">{p.phone}</p>}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatientForNewApt(p.id);
                          setInputValue('');
                          setSearchQuery('');
                          setIsModalOpen(true);
                        }}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-teal-500 text-white text-[11px] font-bold rounded-lg hover:bg-teal-600 transition-colors active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                        موعد
                      </button>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        {/* Filter Tabs - Separate Card */}
        <div className="glass-card p-1.5 !rounded-2xl">
          <div className="flex gap-1.5">
            {[
              { key: 'all' as const, label: 'الكل', icon: Filter },
              { key: 'upcoming' as const, label: 'القادمة', icon: ArrowUpRight },
              { key: 'past' as const, label: 'السابقة', icon: History },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-bold rounded-xl transition-all duration-200",
                  filter === item.key
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-200/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle - Separate Card */}
        <div className="glass-card p-1.5 !rounded-2xl">
          <div className="flex gap-1.5">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200",
                viewMode === 'calendar'
                  ? "bg-blue-500 text-white shadow-md shadow-blue-200/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <CalendarIcon className="w-4 h-4" />
              عرض التقويم
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200",
                viewMode === 'list'
                  ? "bg-blue-500 text-white shadow-md shadow-blue-200/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <List className="w-4 h-4" />
              عرض القائمة
            </button>
          </div>
        </div>

        {/* Extra Toolbar Row for Calendar */}
        {viewMode === 'calendar' && (
          <div className="flex justify-end animate-scale-in">
            <button
              onClick={() => {
                haptic.light();
                setShowAllPopovers(!showAllPopovers);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm",
                showAllPopovers 
                  ? "bg-teal-500 text-white border-teal-500" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              {showAllPopovers ? "إخفاء التفاصيل" : "عرض كل التفاصيل"}
            </button>
          </div>
        )}

        {/* ═══ Calendar View ═══ */}
        {viewMode === 'calendar' && (
          <div className="glass-card p-4 animate-scale-in">
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-800">
                {format(currentMonth, 'MMMM yyyy', { locale: ar })}
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"
                  title="الشهر السابق"
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"
                  title="الشهر التالي"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid Header */}
            <div className="grid grid-cols-7 gap-y-1 gap-x-1 sm:gap-y-2 sm:gap-x-2 text-center mb-1 sm:mb-2">
              {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
                <div key={day} className="text-[10px] sm:text-[13px] font-bold text-slate-400 py-1 sm:py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Day Grid — Clean, no popups */}
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {getDaysInMonth().map((day, idx) => {
                const dayAppointments = getAppointmentsForDay(day);
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentToday = isToday(day);
                const hasAppointments = dayAppointments.length > 0;
                
                // Dynamic positioning & z-indexing to avoid overlap
                const emptyDays = startOfMonth(currentMonth).getDay();
                const gridIndex = emptyDays + idx;
                const rowIndex = Math.floor(gridIndex / 7);
                
                // Smart alternating up/down logic for dense tooltips
                let isTopHalf = rowIndex < 3;
                if (showAllPopovers && hasAppointments) {
                  if (rowIndex > 0 && rowIndex < 5) {
                     // Odd days go one way, EVEN days go the other. Guarantees consecutive days do not overlap!
                    isTopHalf = (day.getDate() % 2 !== 0);
                  } else if (rowIndex === 0) {
                    isTopHalf = true;
                  } else if (rowIndex >= 5) {
                    isTopHalf = false;
                  }
                }
                
                const isVisible = ((isSelected && !hideSelectedTooltip) || showAllPopovers) && hasAppointments;
                
                let buttonZIndex = 1;
                if (isSelected) {
                  // Super high z-index to bring it absolutely to the front when tapped
                  buttonZIndex = 9999;
                } else if (isVisible) {
                  // If pointing down (isTopHalf), needs higher z-index to overlay rows below.
                  // If pointing up, technically needs higher z-index than rows above.
                  buttonZIndex = isTopHalf ? 50 - rowIndex : 10 + rowIndex; 
                } else if (isCurrentToday) {
                  buttonZIndex = 2;
                }

                // Make popover slightly smaller when expanding all but keep text perfectly readable
                const popoverWidth = showAllPopovers ? "w-[185px]" : "w-52";

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (isSameDay(day, selectedDate)) {
                        setHideSelectedTooltip(!hideSelectedTooltip);
                      } else {
                        setSelectedDate(day);
                        setHideSelectedTooltip(false);
                      }
                    }}
                    className={cn(
                      "relative w-10 h-10 mx-auto flex flex-col items-center justify-center rounded-xl transition-all duration-200",
                      isSelected
                        ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md shadow-teal-200/50 scale-105"
                        : "hover:bg-slate-50 text-slate-700",
                      isCurrentToday && !isSelected && "text-teal-600 font-bold ring-1.5 ring-teal-500/25",
                      showAllPopovers && !isSelected && hasAppointments && "bg-teal-50/50"
                    )}
                    style={{ zIndex: buttonZIndex }}
                  >
                    <span className="text-[13px]">{format(day, 'd')}</span>
                    {/* Appointment dots */}
                    {hasAppointments && (
                      <div className="absolute bottom-1 flex gap-[3px]">
                        {dayAppointments.slice(0, 3).map((apt, i) => {
                          const docColor = doctors.find(d => d.id === apt.doctorId)?.color || '#0d9488';
                          return (
                            <div
                              key={i}
                              className={cn(
                                "w-[4px] h-[4px] md:w-[5px] md:h-[5px] rounded-full",
                                isSelected && "ring-1 ring-white/50"
                              )}
                              style={{ backgroundColor: docColor }}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Chat Bubble Popover */}
                    {isVisible && (
                      <div className={cn(
                        "absolute bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/15 border border-slate-200/80 ring-1 ring-white/50 p-2 animate-in fade-in transition-all pointer-events-none",
                        popoverWidth,
                        isTopHalf ? "top-full mt-2 slide-in-from-top-2" : "bottom-full mb-2 slide-in-from-bottom-2",
                        day.getDay() >= 5 ? "-left-2" : day.getDay() <= 1 ? "-right-2" : "left-1/2 -translate-x-1/2"
                      )}>
                        {/* Triangle pointing down/up */}
                        <div className={cn(
                          "absolute w-3 h-3 bg-white border-slate-200/80 rotate-45 backdrop-blur-xl",
                          isTopHalf ? "-top-1.5 border-t border-l" : "-bottom-1.5 border-b border-r",
                          day.getDay() >= 5 ? "left-6" : day.getDay() <= 1 ? "right-6" : "left-1/2 -translate-x-1/2"
                        )} />
                        
                        <div className="flex flex-col gap-1.5 relative z-10 text-[11px]">
                          <div className="font-bold text-slate-700 pb-1.5 border-b border-slate-100 mb-0.5 flex items-center justify-between">
                            <span>مواعيد اليوم</span>
                            <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md text-[9px]">{dayAppointments.length}</span>
                          </div>
                          {/* Sort appointments by time safely */}
                          {[...dayAppointments].sort((a,b) => (a.time || '00:00').localeCompare(b.time || '00:00')).slice(0, showAllPopovers ? 3 : 10).map((apt, i) => {
                            const docColor = doctors.find(d => d.id === apt.doctorId)?.color || '#0d9488';
                            return (
                              <div 
                                key={i} 
                                className="flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg text-white shadow-sm"
                                style={{ backgroundColor: docColor }}
                              >
                                <span className="truncate flex-1 text-right font-bold text-[10px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                                  {apt.patientName}
                                </span>
                                <span dir="ltr" className="font-mono font-bold text-[9px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)] opacity-95 shrink-0">
                                  {apt.time || '00:00'}
                                </span>
                              </div>
                            );
                          })}
                          {showAllPopovers && dayAppointments.length > 3 && (
                            <div className="text-center text-[9px] text-slate-400 font-semibold py-0.5">
                              + {dayAppointments.length - 3} مواعيد أخرى
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ Day Label (Calendar mode) ═══ */}
        {viewMode === 'calendar' && (
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-800">
              مواعيد {format(selectedDate, 'EEEE d MMMM', { locale: ar })}
            </h3>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
              {filteredAppointments.length} موعد
            </span>
          </div>
        )}

        {/* ═══ Appointments — Calendar Mode (flat list for selected day) ═══ */}
        {viewMode === 'calendar' && (
          filteredAppointments.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {filteredAppointments.map(apt => renderAppointmentCard(apt))}
            </div>
          ) : (
            <div className="glass-card py-14 flex flex-col items-center justify-center text-center px-4 animate-scale-in">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-teal-100">
                <CalendarIcon className="w-8 h-8 text-teal-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1.5">لا مواعيد لهذا اليوم</h3>
              <p className="text-sm text-slate-400 max-w-[260px] mb-5 leading-relaxed">
                لا توجد مواعيد مجدولة. أضف موعداً جديداً لتنظيم جدولك.
              </p>
              <button
                onClick={() => {
                  haptic.light();
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-teal-200 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                إضافة موعد
              </button>
            </div>
          )
        )}

        {/* ═══ Appointments — List Mode (grouped by date) ═══ */}
        {viewMode === 'list' && (
          sortedDateKeys.length > 0 ? (
            <div className="space-y-4">
              {sortedDateKeys.map(dateKey => (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
                      <CalendarIcon className="w-3.5 h-3.5 text-teal-500" />
                      <span className="text-xs font-bold text-slate-600">
                        {(() => {
                          try {
                            return format(parseISO(dateKey), 'EEEE d MMMM', { locale: ar });
                          } catch(e) {
                            return dateKey;
                          }
                        })()}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {groupedByDate[dateKey].length} موعد
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  {/* Appointments for this date */}
                  <div className="flex flex-col gap-2">
                    {groupedByDate[dateKey].map(apt => renderAppointmentCard(apt))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card py-14 flex flex-col items-center justify-center text-center px-4 animate-scale-in">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-slate-100">
                <List className="w-8 h-8 text-slate-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1.5">لا توجد نتائج</h3>
              <p className="text-sm text-slate-400 max-w-[260px] leading-relaxed">
                لم نتمكن من العثور على مواعيد تطابق بحثك.
              </p>
            </div>
          )
        )}
      </div>
    </Layout>
  );
}
