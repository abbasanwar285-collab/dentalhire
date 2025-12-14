'use client';

import { useAuthStore } from '@/store';
import { getSupabaseClient } from '@/lib/supabase';
import { Button, useToast } from '@/components/shared';
import { Lock, Building2, CreditCard, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

export default function ClinicSettingsPage() {
    const { user, updateProfile } = useAuthStore();
    const { language } = useLanguage();
    const { addToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Local state for fields
    const [firstName, setFirstName] = useState(user?.profile?.firstName || '');
    const [lastName, setLastName] = useState(user?.profile?.lastName || '');

    const handlePasswordChange = async () => {
        if (!newPassword || !confirmPassword) {
            addToast(
                language === 'ar' ? 'يرجى إدخال كلمة المرور وتأكيدها' : 'Please enter and confirm password',
                'error'
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            addToast(
                language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match',
                'error'
            );
            return;
        }

        if (newPassword.length < 6) {
            addToast(
                language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters',
                'error'
            );
            return;
        }

        setIsChangingPassword(true);
        try {
            // Import should be handled if getSupabaseClient is not available, but usually stick to store
            // useAuthStore doesn't expose updateUser directly, so we need to get supabase client
            const { createClientComponentClient } = require('@supabase/auth-helpers-nextjs');
            // OR use our lib
            const { getSupabaseClient } = require('@/lib/supabase');
            const supabase = getSupabaseClient();

            const { error } = await supabase.auth.updateUser({ password: newPassword });

            if (error) throw error;

            addToast(
                language === 'ar' ? 'تم تغيير كلمة المرور بنجاح ✨' : 'Password updated successfully ✨',
                'success'
            );
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Password error:', error);
            addToast(
                language === 'ar' ? 'حدث خطأ أثناء تغيير كلمة المرور' : 'Error updating password',
                'error'
            );
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);

        try {
            await updateProfile({
                firstName,
                lastName
            });

            addToast(
                language === 'ar' ? 'تم حفظ التغييرات بنجاح ✨' : 'Changes saved successfully ✨',
                'success'
            );
        } catch (error) {
            console.error('Save error:', error);
            addToast(
                language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving changes',
                'error'
            );
        } finally {
            setIsSaving(false);
        }
    };

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
            planName: 'الخطة المجانية',
            planDetails: 'مجاني • لا تتطلب الدفع',
            manageSub: 'الخطة الحالية',
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
            planDetails: 'Free Plan • No billing required',
            manageSub: 'Current Plan',
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
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
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
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : text.save}
                            </Button>
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
                            <Button variant="outline" disabled>{text.manageSub}</Button>
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
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder={language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="pt-2">
                                <Button onClick={handlePasswordChange} disabled={isChangingPassword} variant="outline" leftIcon={<Lock size={16} />}>
                                    {isChangingPassword ? (language === 'ar' ? 'جاري التغيير...' : 'Updating...') : text.changePass}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
