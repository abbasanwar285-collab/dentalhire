'use client';

import { useAuthStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button, useToast } from '@/components/shared';
import { Bell, Lock, User, Shield, MapPin, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { iraqLocations } from '@/data/iraq_locations';
import { getSupabaseClient } from '@/lib/supabase';

export default function SettingsPage() {
    const { user, updateProfile } = useAuthStore();
    const { language } = useLanguage();
    const { addToast } = useToast();

    // Form States
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [city, setCity] = useState('');

    // Notification State
    const [emailNotifications, setEmailNotifications] = useState(true);

    // Password State
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Loading States
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    // Initialize state from user data
    useEffect(() => {
        if (user) {
            setFirstName(user.profile.firstName || '');
            setLastName(user.profile.lastName || '');
            setCity(user.profile.city || '');
        }
    }, [user]);

    // Load notification settings from metadata
    useEffect(() => {
        const loadSettings = async () => {
            const supabase = getSupabaseClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser?.user_metadata?.email_notifications !== undefined) {
                setEmailNotifications(authUser.user_metadata.email_notifications);
            }
        };
        loadSettings();
    }, []);

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSavingProfile(true);

        try {
            // 1. Update User Profile (Store + DB)
            await updateProfile({
                firstName,
                lastName,
                city
            });

            // 2. Sync to CV (Profile -> CV)
            const supabase = getSupabaseClient();
            const { data: cv } = await supabase
                .from('cvs')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (cv) {
                await (supabase
                    .from('cvs') as any)
                    .update({ city: city })
                    .eq('id', cv.id);
            }

            addToast(language === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully', 'success');
        } catch (error) {
            console.error('Error saving profile:', error);
            addToast(language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving changes', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleToggleNotifications = async (checked: boolean) => {
        setEmailNotifications(checked);
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.updateUser({
                data: { email_notifications: checked }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error updating notification settings:', error);
            // Revert on error
            setEmailNotifications(!checked);
            addToast(language === 'ar' ? 'فشل تحديث الإعدادات' : 'Failed to update settings', 'error');
        }
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            addToast(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters', 'warning');
            return;
        }
        if (newPassword !== confirmPassword) {
            addToast(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match', 'warning');
            return;
        }

        setIsSavingPassword(true);
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            addToast(language === 'ar' ? 'تم تحديث كلمة المرور بنجاح' : 'Password updated successfully', 'success');
            setNewPassword('');
            setConfirmPassword('');
            setIsChangingPassword(false);
        } catch (error: any) {
            console.error('Error updating password:', error);
            addToast(language === 'ar' ? 'خطأ في تحديث كلمة المرور: ' + error.message : 'Error updating password: ' + error.message, 'error');
        } finally {
            setIsSavingPassword(false);
        }
    };

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
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
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
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
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
                                value={user?.email || ''}
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
                                        aria-label={language === 'ar' ? 'المحافظة' : 'Governorate'}
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
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
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                leftIcon={isSavingProfile ? undefined : <Save size={18} />}
                            >
                                {isSavingProfile
                                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                                    : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
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
                                    checked={emailNotifications}
                                    onChange={(e) => handleToggleNotifications(e.target.checked)}
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
                            {!isChangingPassword && (
                                <Button
                                    variant="outline"
                                    leftIcon={<Lock size={16} />}
                                    onClick={() => setIsChangingPassword(true)}
                                >
                                    {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                                </Button>
                            )}
                        </div>

                        {isChangingPassword && (
                            <div className="bg-gray-50 dark:bg-gray-700/20 p-4 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                                <div className="flex items-center gap-2 pt-2">
                                    <Button
                                        onClick={handleChangePassword}
                                        disabled={isSavingPassword}
                                        size="sm"
                                    >
                                        {isSavingPassword ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...') : (language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password')}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setIsChangingPassword(false);
                                            setNewPassword('');
                                            setConfirmPassword('');
                                        }}
                                        disabled={isSavingPassword}
                                        size="sm"
                                    >
                                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
