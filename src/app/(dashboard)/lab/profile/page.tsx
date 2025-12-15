'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input, useToast, ProfileImageUpload } from '@/components/shared';
import { useAuthStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSupabaseClient } from '@/lib/supabase';
import { Building2, MapPin, Mail, Phone, Save, CheckCircle } from 'lucide-react';

export default function LabProfilePage() {
    const { user, updateProfile } = useAuthStore();
    const { language } = useLanguage();
    const { addToast } = useToast();
    const supabase = getSupabaseClient();

    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [labData, setLabData] = useState({
        name: '',
        city: '',
        address: '',
        email: '',
        phone: '',
        description: '',
    });

    const t = {
        ar: {
            title: 'معلومات المختبر',
            subtitle: 'إدارة بيانات مختبرك',
            labName: 'اسم المختبر',
            city: 'المدينة',
            address: 'العنوان',
            email: 'البريد الإلكتروني',
            phone: 'رقم الهاتف',
            description: 'وصف المختبر',
            save: 'حفظ التغييرات',
            saving: 'جاري الحفظ...',
            saved: 'تم الحفظ بنجاح!',
            photoLabel: 'صورة المختبر / الشعار'
        },
        en: {
            title: 'Lab Info',
            subtitle: 'Manage your lab details',
            labName: 'Lab Name',
            city: 'City',
            address: 'Address',
            email: 'Email',
            phone: 'Phone Number',
            description: 'Lab Description',
            save: 'Save Changes',
            saving: 'Saving...',
            saved: 'Saved Successfully!',
            photoLabel: 'Lab Photo / Logo'
        },
    };

    const text = t[language as keyof typeof t] || t.en;

    useEffect(() => {
        const loadLabData = async () => {
            if (!user?.id) return;

            const { data, error } = await supabase
                .from('clinics')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data && !error) {
                const typedData = data as any;
                setLabData({
                    name: typedData.name || '',
                    city: typedData.city || '',
                    address: typedData.address || '',
                    email: typedData.email || '',
                    phone: typedData.phone || '',
                    description: typedData.description || '',
                });
            }
        };

        loadLabData();
    }, [user?.id, supabase]);

    const handleSave = async () => {
        if (!user?.id) return;

        setIsLoading(true);
        setIsSaved(false);

        const { error } = await (supabase
            .from('clinics') as any)
            .update({
                name: labData.name,
                city: labData.city,
                address: labData.address,
                email: labData.email,
                phone: labData.phone,
                description: labData.description,
            } as any)
            .eq('user_id', user.id);

        setIsLoading(false);

        if (!error) {
            setIsSaved(true);
            addToast(
                language === 'ar' ? 'تم حفظ التغييرات بنجاح ✨' : 'Changes saved successfully ✨',
                'success'
            );
            setTimeout(() => setIsSaved(false), 3000);
        } else {
            addToast(
                language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving changes',
                'error'
            );
        }
    };

    const handleImageUpload = async (url: string) => {
        await updateProfile({ avatar: url });
        if (user?.id) {
            await (supabase.from('clinics') as any).update({ logo: url }).eq('user_id', user.id);
        }
    };

    const cities = [
        { value: 'baghdad', ar: 'بغداد', en: 'Baghdad' },
        { value: 'basra', ar: 'البصرة', en: 'Basra' },
        { value: 'erbil', ar: 'أربيل', en: 'Erbil' },
        { value: 'sulaymaniyah', ar: 'السليمانية', en: 'Sulaymaniyah' },
        { value: 'duhok', ar: 'دهوك', en: 'Duhok' },
        { value: 'najaf', ar: 'النجف', en: 'Najaf' },
        { value: 'karbala', ar: 'كربلاء', en: 'Karbala' },
        { value: 'kirkuk', ar: 'كركوك', en: 'Kirkuk' },
        { value: 'mosul', ar: 'الموصل', en: 'Mosul' },
    ];

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Building2 className="text-indigo-500" />
                    {text.title}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{text.subtitle}</p>
            </div>

            <Card>
                <div className="p-6 space-y-6">
                    {/* Profile Image */}
                    <div className="flex flex-col items-center sm:items-start gap-4 pb-6 border-b border-gray-100 dark:border-gray-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {text.photoLabel}
                        </label>
                        <ProfileImageUpload
                            userId={user.id}
                            currentImageUrl={user.profile.avatar}
                            onUpload={handleImageUpload}
                            altText={labData.name || 'Lab Logo'}
                            type="company"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {text.labName}
                        </label>
                        <Input
                            value={labData.name}
                            onChange={(e) => setLabData({ ...labData, name: e.target.value })}
                            leftIcon={<Building2 size={18} />}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {text.city}
                        </label>
                        <div className="relative">
                            <div className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 z-10`}>
                                <MapPin size={18} />
                            </div>
                            <select
                                value={labData.city}
                                onChange={(e) => setLabData({ ...labData, city: e.target.value })}
                                className={`w-full ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                title={text.city}
                            >
                                <option value="">{language === 'ar' ? 'اختر المدينة' : 'Select City'}</option>
                                {cities.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {language === 'ar' ? c.ar : c.en}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {text.address}
                        </label>
                        <Input
                            value={labData.address}
                            onChange={(e) => setLabData({ ...labData, address: e.target.value })}
                            leftIcon={<MapPin size={18} />}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {text.email}
                        </label>
                        <Input
                            type="email"
                            value={labData.email}
                            onChange={(e) => setLabData({ ...labData, email: e.target.value })}
                            leftIcon={<Mail size={18} />}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {text.phone}
                        </label>
                        <Input
                            value={labData.phone}
                            onChange={(e) => setLabData({ ...labData, phone: e.target.value })}
                            leftIcon={<Phone size={18} />}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {text.description}
                        </label>
                        <textarea
                            value={labData.description}
                            onChange={(e) => setLabData({ ...labData, description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={handleSave}
                            loading={isLoading}
                            leftIcon={isSaved ? <CheckCircle size={18} /> : <Save size={18} />}
                            className={isSaved ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                            {isLoading ? text.saving : isSaved ? text.saved : text.save}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
