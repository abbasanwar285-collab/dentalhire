'use client';

import { useAuthStore } from '@/store';
import { Button } from '@/components/shared';
import { Lock, Building2, CreditCard, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ClinicSettingsPage() {
    const { user } = useAuthStore();
    const { language } = useLanguage();

    const getUserTypeLabel = () => {
        const type = user?.userType || 'clinic';
        if (language === 'ar') {
            if (type === 'lab') return 'المختبر';
            if (type === 'company') return 'الشركة';
            return 'العيادة';
        }
        if (type === 'lab') return 'Lab';
        if (type === 'company') return 'Company';
        return 'Clinic';
    };

    const typeLabel = getUserTypeLabel();

    const t_loc = {
        ar: {
            title: 'الإعدادات',
            subtitle: `إدارة معلومات ${typeLabel} وتفضيلات الحساب`,
            infoTitle: `معلومات ${typeLabel}`,
            nameLabel: `اسم ${typeLabel} (الاسم الأول)`,
            lastNameLabel: '(اسم العائلة / اللقب)',
            save: 'حفظ التغييرات',
            subTitle: 'الاشتراك والفوترة',
            planName: 'الخطة القياسية',
            planDetails: '$49/شهرياً • تاريخ الفوترة القادم: 1 يناير 2026',
            manageSub: 'إدارة الاشتراك',
            secTitle: 'الأمان',
            passLabel: 'كلمة المرور',
            passDetails: 'تم التغيير آخر مرة قبل 6 أشهر',
            changePass: 'تغيير كلمة المرور'
        },
        en: {
            title: 'Settings',
            subtitle: `Manage ${typeLabel.toLowerCase()} information and account preferences`,
            infoTitle: `${typeLabel} Information`,
            nameLabel: `${typeLabel} Name (First Name)`,
            lastNameLabel: '(Last Name / Suffix)',
            save: 'Save Changes',
            subTitle: 'Subscription & Billing',
            planName: 'Standard Plan',
            planDetails: '$49/month • Next billing date: Jan 1, 2026',
            manageSub: 'Manage Subscription',
            secTitle: 'Security',
            passLabel: 'Password',
            passDetails: 'Last changed 6 months ago',
            changePass: 'Change Password'
        }
    };

    const text = t_loc[language as keyof typeof t_loc] || t_loc.en;

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{text.title}</h1>
                <p className="text-gray-500 dark:text-gray-200 mt-1">
                    {text.subtitle}
                </p>
            </div>

            <div className="grid gap-6">
                {/* Info Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <Building2 size={20} />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{text.infoTitle}</h2>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    {text.nameLabel}
                                </label>
                                <input
                                    type="text"
                                    aria-label="First Name"
                                    defaultValue={user?.profile.firstName}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    {text.lastNameLabel}
                                </label>
                                <input
                                    type="text"
                                    aria-label="Last Name"
                                    defaultValue={user?.profile.lastName}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <Button>{text.save}</Button>
                        </div>
                    </div>
                </div>

                {/* Subscription */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                <CreditCard size={20} />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{text.subTitle}</h2>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{text.planName}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-200">{text.planDetails}</p>
                            </div>
                            <Button variant="outline">{text.manageSub}</Button>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                <Shield size={20} />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{text.secTitle}</h2>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{text.passLabel}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-200">{text.passDetails}</p>
                            </div>
                            <Button variant="outline" leftIcon={<Lock size={16} />}>{text.changePass}</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
