'use client';

// ============================================
// DentalHire - Availability Step
// ============================================

import { useCVStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmploymentType, WeeklySchedule } from '@/types';
import { Clock, Calendar, Briefcase, Timer, FileCheck, PartyPopper } from 'lucide-react';

export default function AvailabilityStep() {
    const { availability, updateAvailability } = useCVStore();
    const { language } = useLanguage();

    const employmentTypes: { value: EmploymentType; label: string; labelAr: string; description: string; descriptionAr: string; icon: React.ReactNode }[] = [
        { value: 'full_time', label: 'Full-Time', labelAr: 'دوام كامل', description: '40+ hours/week', descriptionAr: '+40 ساعة/أسبوع', icon: <Briefcase size={20} /> },
        { value: 'part_time', label: 'Part-Time', labelAr: 'دوام جزئي', description: 'Less than 40 hours', descriptionAr: 'أقل من 40 ساعة', icon: <Timer size={20} /> },
        { value: 'contract', label: 'Contract', labelAr: 'عقد', description: 'Fixed-term project', descriptionAr: 'مشروع محدد المدة', icon: <FileCheck size={20} /> },
        { value: 'temporary', label: 'Temporary', labelAr: 'مؤقت', description: 'Short-term fill-in', descriptionAr: 'بديل قصير المدة', icon: <PartyPopper size={20} /> },
    ];

    const daysData = [
        { key: 'monday', en: 'Monday', ar: 'الإثنين' },
        { key: 'tuesday', en: 'Tuesday', ar: 'الثلاثاء' },
        { key: 'wednesday', en: 'Wednesday', ar: 'الأربعاء' },
        { key: 'thursday', en: 'Thursday', ar: 'الخميس' },
        { key: 'friday', en: 'Friday', ar: 'الجمعة' },
        { key: 'saturday', en: 'Saturday', ar: 'السبت' },
        { key: 'sunday', en: 'Sunday', ar: 'الأحد' },
    ] as const;

    const toggleDay = (day: keyof WeeklySchedule) => {
        const currentSchedule = (availability.schedule || {
            monday: { available: false },
            tuesday: { available: false },
            wednesday: { available: false },
            thursday: { available: false },
            friday: { available: false },
            saturday: { available: false },
            sunday: { available: false },
        }) as WeeklySchedule;

        updateAvailability({
            schedule: {
                ...currentSchedule,
                [day]: {
                    ...currentSchedule[day],
                    available: !currentSchedule[day]?.available,
                },
            },
        });
    };

    const updateHours = (day: keyof WeeklySchedule, hours: string) => {
        const currentSchedule = (availability.schedule || {}) as WeeklySchedule;
        updateAvailability({
            schedule: {
                ...currentSchedule,
                [day]: {
                    ...currentSchedule[day],
                    hours,
                },
            },
        });
    };

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <p className="text-gray-600 dark:text-gray-400">
                {language === 'ar'
                    ? 'أخبر أصحاب العمل بمدى تواجدك ونوع التوظيف المفضل.'
                    : 'Let employers know your availability and preferred employment type.'}
            </p>

            {/* Employment Type */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {language === 'ar' ? 'نوع التوظيف' : 'Employment Type'}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {employmentTypes.map(type => (
                        <button
                            key={type.value}
                            onClick={() => updateAvailability({ type: type.value })}
                            className={`p-4 rounded-xl border-2 text-center transition-all ${availability.type === type.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-lg mx-auto flex items-center justify-center mb-2 ${availability.type === type.value
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                                }`}>
                                {type.icon}
                            </div>
                            <p className={`font-medium text-sm ${availability.type === type.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                                }`}>
                                {language === 'ar' ? type.labelAr : type.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{language === 'ar' ? type.descriptionAr : type.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Start Date */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ar' ? 'أقرب تاريخ للبدء' : 'Earliest Start Date'}
                </label>
                <div className="flex gap-3">
                    <button
                        onClick={() => updateAvailability({ startDate: new Date().toISOString().split('T')[0] })}
                        className={`px-4 py-2.5 rounded-lg border-2 flex items-center gap-2 transition-all ${!availability.startDate || availability.startDate === new Date().toISOString().split('T')[0]
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                            }`}
                    >
                        <Clock size={18} />
                        {language === 'ar' ? 'فوراً' : 'Immediately'}
                    </button>
                    <div className="flex-1">
                        <input
                            type="date"
                            value={availability.startDate || ''}
                            onChange={(e) => updateAvailability({ startDate: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            aria-label={language === 'ar' ? 'تاريخ البدء' : 'Start date'}
                        />
                    </div>
                </div>
            </div>

            {/* Weekly Schedule */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Calendar size={18} className="text-gray-500" />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {language === 'ar' ? 'التوفر الأسبوعي' : 'Weekly Availability'}
                    </label>
                </div>
                <div className="space-y-2">
                    {daysData.map(day => {
                        const dayData = availability.schedule?.[day.key as keyof WeeklySchedule];
                        const isAvailable = dayData?.available;

                        return (
                            <div
                                key={day.key}
                                className={`p-3 rounded-lg border transition-all ${isAvailable
                                    ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleDay(day.key as keyof WeeklySchedule)}
                                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isAvailable
                                            ? 'border-blue-500 bg-blue-500 text-white'
                                            : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                    >
                                        {isAvailable && <span className="text-xs">✓</span>}
                                    </button>
                                    <span className={`w-24 font-medium ${isAvailable ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                                        }`}>
                                        {language === 'ar' ? day.ar : day.en}
                                    </span>
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="relative flex-1">
                                            <input
                                                type="time"
                                                value={(() => {
                                                    if (!isAvailable || !dayData?.hours) return '';
                                                    const parts = dayData.hours.split('-').map(s => s.trim());
                                                    if (parts.length !== 2) return '';

                                                    // Parse start time to HH:mm
                                                    const timeStr = parts[0].toLowerCase();
                                                    const isPM = timeStr.includes('pm') || timeStr.includes('م');
                                                    let [h, m] = timeStr.replace(/[^0-9:]/g, '').split(':');
                                                    if (!h || !m) return '';

                                                    let hour = parseInt(h);
                                                    if (isPM && hour < 12) hour += 12;
                                                    if (!isPM && hour === 12) hour = 0;

                                                    return `${hour.toString().padStart(2, '0')}:${m}`;
                                                })()}
                                                onChange={(e) => {
                                                    const newStart = e.target.value;
                                                    if (!newStart) return;

                                                    // Get current end time or default
                                                    let currentEnd = '';
                                                    if (dayData?.hours && dayData.hours.includes('-')) {
                                                        const parts = dayData.hours.split('-').map(s => s.trim());
                                                        currentEnd = parts[1] || '';
                                                    }

                                                    // Format new start time
                                                    const [h, m] = newStart.split(':');
                                                    let hour = parseInt(h);
                                                    const ampm = hour >= 12 ? (language === 'ar' ? 'م' : 'PM') : (language === 'ar' ? 'ص' : 'AM');
                                                    if (hour > 12) hour -= 12;
                                                    if (hour === 0) hour = 12;
                                                    const formattedStart = `${hour}:${m} ${ampm}`;

                                                    updateHours(day.key as keyof WeeklySchedule, `${formattedStart} - ${currentEnd}`);
                                                }}
                                                className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                aria-label={language === 'ar' ? `وقت البدء لليوم ${day.ar}` : `Start time for ${day.en}`}
                                            />
                                        </div>
                                        <span className="text-gray-400 font-medium">-</span>
                                        <div className="relative flex-1">
                                            <input
                                                type="time"
                                                value={(() => {
                                                    if (!isAvailable || !dayData?.hours) return '';
                                                    const parts = dayData.hours.split('-').map(s => s.trim());
                                                    if (parts.length !== 2) return '';

                                                    // Parse end time to HH:mm
                                                    const timeStr = parts[1].toLowerCase();
                                                    const isPM = timeStr.includes('pm') || timeStr.includes('م');
                                                    const [h, m] = timeStr.replace(/[^0-9:]/g, '').split(':');
                                                    if (!h || !m) return '';

                                                    let hour = parseInt(h);
                                                    if (isPM && hour < 12) hour += 12;
                                                    if (!isPM && hour === 12) hour = 0;

                                                    return `${hour.toString().padStart(2, '0')}:${m}`;
                                                })()}
                                                onChange={(e) => {
                                                    const newEnd = e.target.value;
                                                    if (!newEnd) return;

                                                    // Get current start time or default
                                                    let currentStart = '';
                                                    if (dayData?.hours && dayData.hours.includes('-')) {
                                                        const parts = dayData.hours.split('-').map(s => s.trim());
                                                        currentStart = parts[0] || '';
                                                    }

                                                    // Format new end time
                                                    const [h, m] = newEnd.split(':');
                                                    let hour = parseInt(h);
                                                    const ampm = hour >= 12 ? (language === 'ar' ? 'م' : 'PM') : (language === 'ar' ? 'ص' : 'AM');
                                                    if (hour > 12) hour -= 12;
                                                    if (hour === 0) hour = 12;
                                                    const formattedEnd = `${hour}:${m} ${ampm}`;

                                                    updateHours(day.key as keyof WeeklySchedule, `${currentStart} - ${formattedEnd}`);
                                                }}
                                                className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                aria-label={language === 'ar' ? `وقت الانتهاء لليوم ${day.ar}` : `End time for ${day.en}`}
                                            />
                                        </div>
                                    </div>
                                    {!isAvailable && (
                                        <span className="text-sm text-gray-400">{language === 'ar' ? 'غير متاح' : 'Not available'}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Presets */}
            <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    {language === 'ar' ? 'إعدادات سريعة' : 'Quick Presets'}
                </label>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => updateAvailability({
                            schedule: {
                                monday: { available: true, hours: language === 'ar' ? '9:00 ص - 5:00 م' : '9:00 AM - 5:00 PM' },
                                tuesday: { available: true, hours: language === 'ar' ? '9:00 ص - 5:00 م' : '9:00 AM - 5:00 PM' },
                                wednesday: { available: true, hours: language === 'ar' ? '9:00 ص - 5:00 م' : '9:00 AM - 5:00 PM' },
                                thursday: { available: true, hours: language === 'ar' ? '9:00 ص - 5:00 م' : '9:00 AM - 5:00 PM' },
                                friday: { available: true, hours: language === 'ar' ? '9:00 ص - 5:00 م' : '9:00 AM - 5:00 PM' },
                                saturday: { available: false },
                                sunday: { available: false },
                            }
                        })}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {language === 'ar' ? 'أحد-خميس (9-5)' : 'Sun-Thu (9-5)'}
                    </button>
                    <button
                        onClick={() => updateAvailability({
                            schedule: {
                                monday: { available: true, hours: language === 'ar' ? '8:00 ص - 6:00 م' : '8:00 AM - 6:00 PM' },
                                tuesday: { available: true, hours: language === 'ar' ? '8:00 ص - 6:00 م' : '8:00 AM - 6:00 PM' },
                                wednesday: { available: true, hours: language === 'ar' ? '8:00 ص - 6:00 م' : '8:00 AM - 6:00 PM' },
                                thursday: { available: true, hours: language === 'ar' ? '8:00 ص - 6:00 م' : '8:00 AM - 6:00 PM' },
                                friday: { available: true, hours: language === 'ar' ? '8:00 ص - 6:00 م' : '8:00 AM - 6:00 PM' },
                                saturday: { available: true, hours: language === 'ar' ? '9:00 ص - 1:00 م' : '9:00 AM - 1:00 PM' },
                                sunday: { available: false },
                            }
                        })}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {language === 'ar' ? 'أسبوع كامل + سبت صباحاً' : 'Full Week + Sat AM'}
                    </button>
                    <button
                        onClick={() => updateAvailability({
                            schedule: {
                                monday: { available: true, hours: language === 'ar' ? 'مرن' : 'Flexible' },
                                tuesday: { available: true, hours: language === 'ar' ? 'مرن' : 'Flexible' },
                                wednesday: { available: true, hours: language === 'ar' ? 'مرن' : 'Flexible' },
                                thursday: { available: true, hours: language === 'ar' ? 'مرن' : 'Flexible' },
                                friday: { available: true, hours: language === 'ar' ? 'مرن' : 'Flexible' },
                                saturday: { available: true, hours: language === 'ar' ? 'مرن' : 'Flexible' },
                                sunday: { available: true, hours: language === 'ar' ? 'مرن' : 'Flexible' },
                            }
                        })}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {language === 'ar' ? 'مرن بالكامل' : 'Fully Flexible'}
                    </button>
                </div>
            </div>
        </div>
    );
}
