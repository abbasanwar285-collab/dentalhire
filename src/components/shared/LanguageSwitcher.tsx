'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ar' : 'en');
    };

    return (
        <button
            onClick={toggleLanguage}
            className="fixed top-6 end-6 z-50 flex items-center gap-3 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600 bg-white dark:bg-gray-800 transition-all shadow-lg hover:shadow-xl group"
            aria-label="Toggle language"
        >
            <Globe size={24} className="group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-bold text-lg tracking-wide">
                {language === 'en' ? 'العربية' : 'English'}
            </span>
        </button>
    );
}
