'use client';

// ============================================
// DentalHire - Salary Step
// ============================================

import { useMemo } from 'react';
import { useCVStore, useAuthStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { SALARY_RANGES_BY_ROLE } from '@/data/mockData';
import { TrendingUp } from 'lucide-react';

export default function SalaryStep() {
    const { salary, updateSalary } = useCVStore();
    const { language } = useLanguage();

    // Only Iraqi Dinar currency
    const currency = { code: 'IQD', symbol: 'د.ع', name: language === 'ar' ? 'دينار عراقي' : 'Iraqi Dinar' };

    const { user } = useAuthStore();
    const userType = user?.userType || 'dental_assistant';

    // Get salary ranges based on role
    const salaryRanges = useMemo(() => {
        const ranges = SALARY_RANGES_BY_ROLE[userType] || SALARY_RANGES_BY_ROLE['dental_assistant'];
        return ranges.map((range: any) => ({
            min: range.min,
            max: range.max,
            label: language === 'ar' ? range.labelAr : range.labelEn,
            level: language === 'ar' ? range.levelAr : range.levelEn
        }));
    }, [userType, language]);

    // Dynamic Market Insight
    const marketInsight = useMemo(() => {
        if (language === 'ar') {
            switch (userType) {
                case 'dentist': return 'أطباء الأسنان في العراق تتراوح رواتبهم بين 750 ألف إلى 4 مليون دينار، وتعتمد بشكل كبير على النسبة والخبرة.';
                case 'dental_technician': return 'فنيو الأسنان يحققون دخلاً جيداً يعتمد غالباً على عدد القطع المنجزة (Piecework) أو راتب ثابت مرتفع.';
                case 'sales_rep': return 'نظام العمولات يلعب دوراً كبيراً في دخل مندوبي المبيعات، حيث يمكن أن يتضاعف الراتب الأساسي.';
                case 'media': return 'رواتب صناع المحتوى تعتمد على جودة الإنتاج وحجم المسؤوليات (تصوير، مونتاج، إدارة).';
                default: return 'مساعدو طب الأسنان في العراق يكسبون عادة بين 250,000 - 750,000 دينار عراقي شهرياً، حسب الخبرة والشهادات.';
            }
        } else {
            switch (userType) {
                case 'dentist': return 'Dentists in Iraq earn between 750K to 4M IQD, heavily depending on commission/share and experience.';
                case 'dental_technician': return 'Dental Technicians often earn based on piecework or a high fixed salary.';
                case 'sales_rep': return 'Commissions play a major role in Sales Rep income, potentially doubling the base salary.';
                case 'media': return 'Content creators salary depends on production quality and responsibilities (filming, editing, managing).';
                default: return 'Dental assistants in Iraq typically earn between 250K - 750K IQD monthly, depending on experience and certifications.';
            }
        }
    }, [userType, language]);

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
                            {marketInsight}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
