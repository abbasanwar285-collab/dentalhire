import React from 'react';
import { cn } from '../../lib/utils';
import { Clock } from 'lucide-react';

interface TimePickerProps {
    value: string; // "HH:mm"
    onChange: (time: string) => void;
    bookedTimes?: string[]; // Array of booked "HH:mm" slots
}

// Generate time slots from 15:00 (3 PM) to 21:00 (9 PM) every 30 mins
const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 15; hour <= 21; hour++) {
        for (let min of [0, 30]) {
            // End exactly at 21:00 (skip 21:30)
            if (hour === 21 && min === 30) continue;
            
            const time24 = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
            const ampm = hour >= 12 ? 'م' : 'ص';
            const hour12 = hour % 12 || 12;
            const label = `${hour12}:${min.toString().padStart(2, '0')} ${ampm}`;
            
            slots.push({ value: time24, label });
        }
    }
    return slots;
};

const TIME_SLOTS = generateTimeSlots();

export function TimePicker({ value, onChange, bookedTimes = [] }: TimePickerProps) {
    return (
        <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-4 px-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-[13px] font-bold text-slate-700">اختر الوقت المناسب</span>
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                {TIME_SLOTS.map((slot) => {
                    const isSelected = value === slot.value;
                    const isBooked = bookedTimes.includes(slot.value);
                    const isConflict = isSelected && isBooked;

                    return (
                        <button
                            key={slot.value}
                            type="button"
                            onClick={() => onChange(slot.value)}
                            className={cn(
                                "flex items-center justify-center py-2.5 rounded-xl text-[12px] font-bold transition-all duration-200 border",
                                isSelected
                                    ? isConflict
                                        ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-200"
                                        : "bg-teal-500 text-white border-teal-600 shadow-md shadow-teal-200"
                                    : isBooked
                                        ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 opacity-60"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50"
                            )}
                        >
                            {slot.label}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-200 bg-white shadow-sm" />
                    <span>متاح</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-amber-200 bg-amber-50 shadow-sm" />
                    <span>محجوز مسبقاً</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-teal-600 bg-teal-500 shadow-sm" />
                    <span>محدد</span>
                </div>
            </div>
        </div>
    );
}
