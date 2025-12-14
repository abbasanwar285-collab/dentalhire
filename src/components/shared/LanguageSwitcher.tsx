'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
    className?: string;
}

export default function LanguageSwitcher({ className }: LanguageSwitcherProps) {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ar' : 'en');
    };

    return (
        <button
            onClick={toggleLanguage}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600 bg-white dark:bg-gray-800 transition-all shadow-sm hover:shadow-md group",
                className
            )}
            aria-label="Toggle language"
        >
            <Globe size={20} className="group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-medium text-sm">
                {language === 'en' ? 'العربية' : 'English'}
            </span>
        </button>
    );
}
