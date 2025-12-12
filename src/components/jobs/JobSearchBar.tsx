import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search } from 'lucide-react';

interface JobSearchBarProps {
    onSearch: (query: string) => void;
    initialQuery?: string;
}

export default function JobSearchBar({ onSearch, initialQuery = '' }: JobSearchBarProps) {
    const { language } = useLanguage();
    const [query, setQuery] = useState(initialQuery);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    const suggestedSearches = [
        { label: { en: 'Dentist - Baghdad', ar: 'طبيب أسنان - بغداد' }, value: 'طبيب أسنان بغداد' },
        { label: { en: 'Dental Assistant - Basra', ar: 'مساعد طبيب - البصرة' }, value: 'مساعد طبيب البصرة' },
        { label: { en: 'Lab Technician - Erbil', ar: 'فني مختبر - أربيل' }, value: 'فني مختبر أربيل' },
        { label: { en: 'Receptionist - Najaf', ar: 'موظف استقبال - النجف' }, value: 'موظف استقبال النجف' },
    ];

    return (
        <div className="w-full">
            <form onSubmit={handleSearch} className="relative mb-4">
                <Search
                    size={20}
                    className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`}
                />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onSearch(e.target.value);
                    }}
                    placeholder={language === 'ar' ? 'ابحث عن وظائف، عيادات، أو مواقع...' : 'Search jobs, clinics, or locations...'}
                    className={`w-full ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm`}
                />
                <button
                    type="submit"
                    className={`absolute ${language === 'ar' ? 'left-2' : 'right-2'} top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm`}
                >
                    {language === 'ar' ? 'بحث' : 'Search'}
                </button>
            </form>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0 uppercase tracking-wider">
                    {language === 'ar' ? 'مقترح:' : 'Suggested:'}
                </span>
                {suggestedSearches.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            setQuery(item.value);
                            onSearch(item.value);
                        }}
                        className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400 transition-all whitespace-nowrap"
                    >
                        {language === 'ar' ? item.label.ar : item.label.en}
                    </button>
                ))}
            </div>
        </div>
    );
}
