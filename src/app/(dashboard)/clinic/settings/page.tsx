'use client';

import { useAuthStore } from '@/store';
import { getSupabaseClient } from '@/lib/supabase';
import { Button, useToast } from '@/components/shared';
import { Lock, Building2, CreditCard, Shield, CheckCircle, MapPin, Globe, FileText, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export default function ClinicSettingsPage() {
    const { user, updateProfile } = useAuthStore();
    const { language } = useLanguage();
    const { addToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Local state for User fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    // Local state for Clinic fields
    const [clinicName, setClinicName] = useState('');
    const [description, setDescription] = useState('');
    const [website, setWebsite] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');

    // Debounced values
    const debouncedFirstName = useDebounce(firstName, 1000);
    const debouncedLastName = useDebounce(lastName, 1000);
    const debouncedClinicName = useDebounce(clinicName, 1000);
    const debouncedDescription = useDebounce(description, 1000);
    const debouncedWebsite = useDebounce(website, 1000);
    const debouncedCity = useDebounce(city, 1000);
    const debouncedAddress = useDebounce(address, 1000);
    const debouncedPhone = useDebounce(phone, 1000);

    // Initial Load Tracking
    const [initialLoad, setInitialLoad] = useState(true);

    // Fetch Clinic Data
    useEffect(() => {
        const fetchClinicData = async () => {
            if (!user) return;
            const supabase = getSupabaseClient();
            try {
                // Fetch the clinic/company associated with this user
                const { data, error } = await supabase
                    .from('clinics')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (data) {
                    setClinicName(data.name || '');
                    setDescription(data.description || '');
                    setWebsite(data.website || '');
                    setCity(data.city || '');
                    setAddress(data.address || '');
                    setPhone(data.phone || user.profile.phone || '');
                }
            } catch (err) {
                console.error('Error fetching clinic data:', err);
            } finally {
                setInitialLoad(false);
            }
        };

        if (user) {
            setFirstName(user.profile.firstName || '');
            setLastName(user.profile.lastName || '');
            fetchClinicData();
        }
    }, [user]);

    // Auto-save effect
    useEffect(() => {
        if (initialLoad) return; // Don't auto-save on initial load

        // Check if values differ from what might be in DB/Store (Simplified check)
        // ideally we compare against 'original' state, but for auto-save trigger:
        handleSave(true);
    }, [
        debouncedFirstName,
        debouncedLastName,
        debouncedClinicName,
        debouncedDescription,
        debouncedWebsite,
        debouncedCity,
        debouncedAddress,
        debouncedPhone
    ]);

    const handlePasswordChange = async () => {
        if (!newPassword || !confirmPassword) {
            addToast(language === 'ar' ? 'يرجى إدخال كلمة المرور وتأكيدها' : 'Please enter and confirm password', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            addToast(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match', 'warning');
            return;
        }

        if (newPassword.length < 6) {
            addToast(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters', 'warning');
            return;
        }

        setIsChangingPassword(true);
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.updateUser({ password: newPassword });

            if (error) throw error;

            addToast(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح ✨' : 'Password updated successfully ✨', 'success');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Password error:', error);
            addToast(language === 'ar' ? 'خطأ في تحديث كلمة المرور: ' + error.message : 'Error updating password: ' + error.message, 'error');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleSave = async (isAutoSave = false) => {
        if (!user || initialLoad) return;

        if (isAutoSave) {
            setSaveStatus('saving');
        } else {
            setIsSaving(true);
        }

        try {
            const supabase = getSupabaseClient();

            // 1. Update User Profile
            await updateProfile({
                firstName,
                lastName,
                phone // Sync phone to user profile as well
            });

            // 2. Update Clinic Details
            const { error } = await supabase
                .from('clinics')
                .update({
                    name: clinicName,
                    description: description,
                    website: website,
                    city: city,
                    address: address,
                    phone: phone,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (error) throw error;

            if (isAutoSave) {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                addToast(language === 'ar' ? 'تم حفظ التغييرات بنجاح ✨' : 'Changes saved successfully ✨', 'success');
            }
        } catch (error) {
            console.error('Save error:', error);
            if (!isAutoSave) {
                addToast(language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving changes', 'error');
            }
        } finally {
            if (!isAutoSave) {
                setIsSaving(false);
            }
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
            nameLabel: `اسم المسؤول (الاسم الأول)`,
            lastNameLabel: '(اسم العائلة)',
            entityNameLabel: `اسم ${typeLabel}`,
            descLabel: 'نبذة / وصف',
            cityLabel: 'المدينة',
            addressLabel: 'العنوان',
            websiteLabel: 'الموقع الإلكتروني',
            phoneLabel: 'رقم الهاتف',
            save: 'حفظ التغييرات',
            subTitle: 'الاشتراك والفوترة',
            planName: 'الخطة المجانية',
            planDetails: 'مجاني • لا تتطلب الدفع',
            manageSub: 'الخطة الحالية',
            secTitle: 'الأمان',
            passLabel: 'كلمة المرور',
            changePass: 'تغيير كلمة المرور'
        },
        en: {
            title: 'Settings',
            subtitle: `Manage ${typeLabel.toLowerCase()} information and account preferences`,
            infoTitle: `${typeLabel} Information`,
            nameLabel: `Admin Name (First Name)`,
            lastNameLabel: '(Last Name)',
            entityNameLabel: `${typeLabel} Name`,
            descLabel: 'Description / Bio',
            cityLabel: 'City',
            addressLabel: 'Address',
            websiteLabel: 'Website',
            phoneLabel: 'Phone Number',
            save: 'Save Changes',
            subTitle: 'Subscription & Billing',
            planName: 'Standard Plan',
            planDetails: 'Free Plan • No billing required',
            manageSub: 'Current Plan',
            secTitle: 'Security',
            passLabel: 'Password',
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
                        {/* Entity Name & Description */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    {text.entityNameLabel}
                                </label>
                                <input
                                    type="text"
                                    value={clinicName}
                                    onChange={(e) => setClinicName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    {text.descLabel}
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                        </div>

                        {/* Contact & Location */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                                    <MapPin size={14} /> {text.cityLabel}
                                </label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                                    <MapPin size={14} /> {text.addressLabel}
                                </label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                                    <Phone size={14} /> {text.phoneLabel}
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                                    <Globe size={14} /> {text.websiteLabel}
                                </label>
                                <input
                                    type="text"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <hr className="border-gray-100 dark:border-gray-700" />

                        {/* Admin Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    {text.nameLabel}
                                </label>
                                <input
                                    type="text"
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
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex items-center gap-3">
                            <Button onClick={() => handleSave(false)} disabled={isSaving}>
                                {isSaving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : text.save}
                            </Button>

                            {saveStatus === 'saving' && (
                                <span className="text-sm text-blue-600 dark:text-blue-400 animate-pulse">
                                    {language === 'ar' ? 'جاري الحفظ تلقائياً...' : 'Auto-saving...'}
                                </span>
                            )}
                            {saveStatus === 'saved' && (
                                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <CheckCircle size={14} />
                                    {language === 'ar' ? 'تم الحفظ' : 'Saved'}
                                </span>
                            )}
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
