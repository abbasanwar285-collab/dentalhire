'use client';

// ============================================
// DentalHire - Salary Step
// ============================================

import { useCVStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp } from 'lucide-react';

export default function SalaryStep() {
    const { salary, updateSalary } = useCVStore();
    const { language } = useLanguage();

    // Only Iraqi Dinar currency
    const currency = { code: 'IQD', symbol: 'د.ع', name: language === 'ar' ? 'دينار عراقي' : 'Iraqi Dinar' };

    // Salary ranges: 200K-300K for entry, then +50K for each level
    const salaryRanges = [
        { min: 200000, max: 300000, label: language === 'ar' ? '200 - 300 ألف' : '200K - 300K', level: language === 'ar' ? 'مبتدئ' : 'Entry Level' },
        { min: 300000, max: 350000, label: language === 'ar' ? '300 - 350 ألف' : '300K - 350K', level: language === 'ar' ? 'مبتدئ متقدم' : 'Junior' },
        { min: 350000, max: 400000, label: language === 'ar' ? '350 - 400 ألف' : '350K - 400K', level: language === 'ar' ? 'متوسط' : 'Mid-Level' },
        { min: 400000, max: 450000, label: language === 'ar' ? '400 - 450 ألف' : '400K - 450K', level: language === 'ar' ? 'متقدم' : 'Senior' },
        { min: 450000, max: 500000, label: language === 'ar' ? '450 - 500 ألف' : '450K - 500K', level: language === 'ar' ? 'قيادي' : 'Lead/Manager' },
        { min: 500000, max: 600000, label: language === 'ar' ? '500+ ألف' : '500K+', level: language === 'ar' ? 'مدير تنفيذي' : 'Director/Executive' },
    ];

    const formatSalary = (value: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-IQ' : 'en-IQ', {
            style: 'decimal',
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <p className="text-gray-600 dark:text-gray-400">
                {language === 'ar'
                    ? 'حدد توقعاتك للراتب. هذا يساعد في مطابقتك مع الوظائف التي تلبي متطلباتك.'
                    : 'Set your salary expectations. This helps match you with positions that meet your requirements.'}
            </p>

            {/* Currency Display - IQD Only */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ar' ? 'العملة' : 'Currency'}
                </label>
                <div className="p-3 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-center w-fit">
                    <p className="text-lg font-bold text-blue-600">
                        {currency.symbol}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{currency.name}</p>
                </div>
            </div>

            {/* Expected Salary Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ar' ? 'الراتب الشهري المتوقع' : 'Expected Monthly Salary'}
                </label>
                <div className="relative">
                    <div className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 font-bold`}>
                        {currency.symbol}
                    </div>
                    <input
                        type="number"
                        placeholder="250000"
                        value={salary.expected || ''}
                        onChange={(e) => updateSalary({ expected: parseInt(e.target.value) || 0, currency: 'IQD' })}
                        className={`w-full ${language === 'ar' ? 'pr-14 pl-20' : 'pl-14 pr-20'} py-3 text-lg rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                    />
                    <span className={`absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-gray-500`}>
                        /{language === 'ar' ? 'شهر' : 'month'}
                    </span>
                </div>
                {salary.expected && salary.expected > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                        {currency.symbol} {formatSalary(salary.expected)} {language === 'ar' ? 'شهرياً' : 'per month'}
                        {' '}≈ {currency.symbol} {formatSalary(salary.expected * 12)} {language === 'ar' ? 'سنوياً' : 'per year'}
                    </p>
                )}
            </div>

            {/* Quick Select Ranges */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {language === 'ar' ? 'اختيار سريع' : 'Quick Select Range'}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {salaryRanges.map((range) => (
                        <button
                            key={range.label}
                            onClick={() => updateSalary({ expected: Math.round((range.min + range.max) / 2), currency: 'IQD' })}
                            className={`p-3 rounded-lg border-2 text-start transition-all ${salary.expected && salary.expected >= range.min && salary.expected <= range.max
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <p className="font-medium text-gray-900 dark:text-white">{range.label}</p>
                            <p className="text-xs text-gray-500">{range.level}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Negotiable Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                        {language === 'ar' ? 'مفتوح للتفاوض' : 'Open to Negotiation'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'ar' ? 'أخبر أصحاب العمل أنك مرن بشأن الراتب' : "Let employers know you're flexible on salary"}
                    </p>
                </div>
                <button
                    onClick={() => updateSalary({ negotiable: !salary.negotiable })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${salary.negotiable ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                    aria-label={language === 'ar' ? 'تبديل التفاوض على الراتب' : 'Toggle negotiable salary'}
                >
                    <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${salary.negotiable ? (language === 'ar' ? '-translate-x-7' : 'translate-x-7') : (language === 'ar' ? '-translate-x-1' : 'translate-x-1')
                            }`}
                    />
                </button>
            </div>

            {/* Market Insight */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                            {language === 'ar' ? 'رؤية السوق' : 'Market Insight'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {language === 'ar'
                                ? 'مساعدو طب الأسنان في العراق يكسبون عادة بين 200,000 - 500,000 دينار عراقي شهرياً، حسب الخبرة والشهادات.'
                                : 'Dental assistants in Iraq typically earn between 200K - 500K IQD monthly, depending on experience and certifications.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
