'use client';

import { useAuthStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button, Input } from '@/components/shared';
import { Bell, Lock, User, Shield, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { iraqLocations } from '@/data/iraq_locations';
import { getSupabaseClient } from '@/lib/supabase';

export default function SettingsPage() {
    const { user } = useAuthStore();
    const { language, t } = useLanguage();
    const [emailNotifications, setEmailNotifications] = useState(true);

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'ar' ? 'الإعدادات' : 'Settings'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {language === 'ar' ? 'إدارة تفضيلاتك وإعدادات حسابك' : 'Manage your preferences and account settings'}
                </p>
            </div>

            <div className="grid gap-6">
                {/* Profile Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <User size={20} />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {language === 'ar' ? 'إعدادات الملف الشخصي' : 'Profile Settings'}
                            </h2>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {language === 'ar' ? 'الاسم الأول' : 'First Name'}
                                </label>
                                <input
                                    type="text"
                                    aria-label={language === 'ar' ? 'الاسم الأول' : 'First Name'}
                                    defaultValue={user?.profile.firstName}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {language === 'ar' ? 'اسم العائلة' : 'Last Name'}
                                </label>
                                <input
                                    type="text"
                                    aria-label={language === 'ar' ? 'اسم العائلة' : 'Last Name'}
                                    defaultValue={user?.profile.lastName}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                            </label>
                            <input
                                type="email"
                                aria-label={language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                                defaultValue={user?.email}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                {language === 'ar' ? 'الموقع' : 'Location'}
                            </h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {language === 'ar' ? 'المحافظة' : 'Governorate'}
                                </label>
                                <div className="relative">
                                    <select
                                        name="city"
                                        aria-label={language === 'ar' ? 'المحافظة' : 'Governorate'}
                                        defaultValue={user?.profile.city || ''}
                                        className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                    >
                                        <option value="">{language === 'ar' ? 'اختر المحافظة' : 'Select Governorate'}</option>
                                        {Object.entries(iraqLocations).map(([key, gov]) => (
                                            <option key={key} value={language === 'ar' ? gov.ar : (gov.en || key)}>
                                                {language === 'ar' ? gov.ar : (gov.en || key)}
                                            </option>
                                        ))}
                                    </select>
                                    <MapPin size={18} className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {language === 'ar'
                                        ? 'سيتم تحديث موقعك في السيرة الذاتية تلقائياً عند الحفظ.'
                                        : 'Your CV location will be automatically updated when you save.'}
                                </p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={async (e) => {
                                    const btn = e.currentTarget;
                                    const form = btn.closest('.p-6') as HTMLDivElement;
                                    const inputs = form.querySelectorAll('input, select');
                                    const values: Record<string, string> = {};

                                    inputs.forEach(input => {
                                        const el = input as HTMLInputElement | HTMLSelectElement;
                                        if (el.type !== 'submit' && el.type !== 'button') {
                                            // Handle mapping name attributes if available, else infer from order/context
                                            // Or better, add name attributes to inputs above
                                            if (el.getAttribute('aria-label') === (language === 'ar' ? 'الاسم الأول' : 'First Name')) values.firstName = el.value;
                                            if (el.getAttribute('aria-label') === (language === 'ar' ? 'اسم العائلة' : 'Last Name')) values.lastName = el.value;
                                            if (el.tagName === 'SELECT') values.city = el.value;
                                        }
                                    });

                                    if (user) {
                                        btn.disabled = true;
                                        try {
                                            // 1. Update Profile using Auth Store
                                            await useAuthStore.getState().updateProfile({
                                                firstName: values.firstName,
                                                lastName: values.lastName,
                                                city: values.city
                                            });

                                            // 2. Sync to CV (Profile -> CV)
                                            // Check if CV exists
                                            const supabase = getSupabaseClient();
                                            const { data: cv } = await supabase
                                                .from('cvs')
                                                .select('id, personal_info') // Need personal_info to merge
                                                .eq('user_id', user.id)
                                                .single();

                                            if (cv) {
                                                // Create updated personal info object (preserving other fields like phone, bio etc)
                                                // Wait, we can just update the 'city' column directly if it's a top-level column?
                                                // Checking useCVStore, it saves: city: state.personalInfo.city || '' column in Insert/Update.
                                                // It seems 'city' IS a top-level column in 'cvs' table based on PersonalInfoStep logic:
                                                /*
                                                    await (supabase.from('cvs') as any)
                                                        .insert({
                                                            user_id: user.id,
                                                            photo: publicUrl,
                                                            full_name: ...,
                                                            city: personalInfo.city || '', 
                                                            ...
                                                */
                                                // Yes, 'city' is a top-level column.

                                                await supabase
                                                    .from('cvs')
                                                    .update({ city: values.city })
                                                    .eq('id', cv.id);

                                                console.log('Synced city to CV:', values.city);
                                            }

                                            alert(language === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully');
                                        } catch (err) {
                                            console.error(err);
                                            alert(language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving changes');
                                        } finally {
                                            btn.disabled = false;
                                        }
                                    }
                                }}
                            >
                                {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg">
                                <Bell size={20} />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                            </h2>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {language === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {language === 'ar' ? 'استلام رسائل بريد إلكتروني حول الوظائف المطابقة الجديدة' : 'Receive emails about new job matches'}
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    aria-label={language === 'ar' ? 'تبديل إشعارات البريد الإلكتروني' : 'Toggle Email Notifications'}
                                    checked={emailNotifications}
                                    onChange={(e) => setEmailNotifications(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
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
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {language === 'ar' ? 'الأمان' : 'Security'}
                            </h2>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {language === 'ar' ? 'كلمة المرور' : 'Password'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {language === 'ar' ? 'تم تغييرها منذ 3 أشهر' : 'Last changed 3 months ago'}
                                </p>
                            </div>
                            <Button variant="outline" leftIcon={<Lock size={16} />}>
                                {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
