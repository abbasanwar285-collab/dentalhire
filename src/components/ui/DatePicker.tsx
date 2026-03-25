import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DatePickerAppointment {
    id: string;
    date: string;
    time: string;
    doctorId?: string;
    patientName?: string;
}

interface DatePickerProps {
    value: string; // 'YYYY-MM-DD'
    onChange: (date: string) => void;
    appointments?: DatePickerAppointment[];
    doctorColors?: Record<string, string>;
}

export function DatePicker({ value, onChange, appointments = [], doctorColors = {} }: DatePickerProps) {
    const selectedDate = value ? parseISO(value) : new Date();
    const [currentMonth, setCurrentMonth] = useState(selectedDate);

    const getDaysInMonth = () => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    };

    const getAppointmentsForDay = (day: Date) => {
        return appointments.filter(apt => isSameDay(parseISO(apt.date), day));
    };

    return (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[14px] text-slate-800 px-2">
                    {format(currentMonth, 'MMMM yyyy', { locale: ar })}
                </h3>
                <div className="flex gap-1.5">
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        title="الشهر السابق"
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        title="الشهر التالي"
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-center mb-2">
                {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
                    <div key={day} className="text-[11px] font-bold text-slate-400 py-1">{day}</div>
                ))}
            </div>

            {/* Day Grid */}
            <div className="grid grid-cols-7 gap-y-1.5 gap-x-1.5 text-center">
                {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {getDaysInMonth().map((day, idx) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentToday = isToday(day);
                    const dayApts = getAppointmentsForDay(day);
                    const aptCount = dayApts.length;
                    const isBusy = aptCount >= 3;

                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => onChange(format(day, 'yyyy-MM-dd'))}
                            className={cn(
                                "relative w-full aspect-square mx-auto flex flex-col items-center justify-center rounded-xl transition-all duration-200 border",
                                isSelected
                                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200/50 scale-[1.05] z-10"
                                    : isBusy
                                        ? "bg-amber-50 hover:bg-amber-100/80 text-amber-900 border-amber-200"
                                        : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700",
                                isCurrentToday && !isSelected && "text-blue-600 font-black ring-1 ring-blue-200 border-blue-100 bg-blue-50/30"
                            )}
                        >
                            <span className={cn("text-[13px]", isSelected ? "font-bold" : "font-medium")}>
                                {format(day, 'd')}
                            </span>
                            {/* Appointment dots */}
                            {aptCount > 0 && (
                                <div className="absolute bottom-1 flex gap-0.5">
                                    {aptCount <= 3 ? (
                                        dayApts.slice(0, 3).map((apt, i) => {
                                            const dotColor = (apt.doctorId && doctorColors[apt.doctorId]) || '#0d9488';
                                            return (
                                                <div
                                                    key={i}
                                                    className={cn("w-1 h-1 rounded-full", isSelected && "!bg-white")}
                                                    style={!isSelected ? { backgroundColor: dotColor } : {}}
                                                />
                                            );
                                        })
                                    ) : (
                                        <span className={cn(
                                            "text-[8px] font-black leading-none",
                                            isSelected ? "text-white/90" : "text-amber-600"
                                        )}>
                                            {aptCount}
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            
             {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-blue-600 bg-blue-600 shadow-sm" />
                    <span>محدد</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="flex gap-0.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </span>
                    <span className="mr-0.5">مواعيد</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-amber-200 bg-amber-50 shadow-sm" />
                    <span>يوم مزدحم</span>
                </div>
            </div>
        </div>
    );
}
