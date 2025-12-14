'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TimeSelectProps {
    value: string; // HH:mm (24h)
    onChange: (value: string) => void;
    label?: string;
    className?: string;
}

export function TimeSelect({ value, onChange, label, className }: TimeSelectProps) {
    const { language } = useLanguage();

    // Parse initial value
    const parseTime = (timeStr: string) => {
        if (!timeStr) return { hour: '12', minute: '00', ampm: 'AM' };
        const [h, m] = timeStr.split(':');
        let hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';

        if (hour > 12) hour -= 12;
        if (hour === 0) hour = 12;

        return {
            hour: hour.toString(),
            minute: m,
            ampm
        };
    };

    const [state, setState] = useState(parseTime(value));

    useEffect(() => {
        setState(parseTime(value));
    }, [value]);

    const handleChange = (field: 'hour' | 'minute' | 'ampm', newVal: string) => {
        const newState = { ...state, [field]: newVal };
        setState(newState);

        // Convert back to 24h for parent
        let h = parseInt(newState.hour);
        if (newState.ampm === 'PM' && h < 12) h += 12;
        if (newState.ampm === 'AM' && h === 12) h = 0;

        const hStr = h.toString().padStart(2, '0');
        onChange(`${hStr}:${newState.minute}`);
    };

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const minutes = ['00', '15', '30', '45'];

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </label>
            )}
            <div className="flex gap-2" dir="ltr">
                <select
                    value={state.hour}
                    onChange={(e) => handleChange('hour', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    aria-label={language === 'ar' ? 'ساعة' : 'Hour'}
                >
                    {hours.map(h => (
                        <option key={h} value={h}>{h}</option>
                    ))}
                </select>
                <span className="flex items-center text-gray-400">:</span>
                <select
                    value={state.minute}
                    onChange={(e) => handleChange('minute', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    aria-label={language === 'ar' ? 'دقيقة' : 'Minute'}
                >
                    {minutes.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
                <select
                    value={state.ampm}
                    onChange={(e) => handleChange('ampm', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    aria-label={language === 'ar' ? 'ص/م' : 'AM/PM'}
                >
                    <option value="AM">{language === 'ar' ? 'ص' : 'AM'}</option>
                    <option value="PM">{language === 'ar' ? 'م' : 'PM'}</option>
                </select>
            </div>
        </div>
    );
}
