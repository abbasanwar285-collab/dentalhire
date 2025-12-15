'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { Button, ProfileImageUpload } from '@/components/shared';
import { Building2, MapPin, Globe, Edit, CheckCircle, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ClinicProfilePage() {
    const { user, updateProfile } = useAuthStore();
    const { language } = useLanguage();
    const [clinic, setClinic] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClinic = async () => {
            if (!user) return;
            try {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase.rpc('get_my_clinic');
                if (data && (data as any[]).length > 0) {
                    setClinic((data as any[])[0]);
                }
            } catch (err) {
                console.error('Error fetching clinic:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchClinic();
    }, [user]);

    const handleImageUpload = async (url: string) => {
        await updateProfile({ avatar: url });
        if (user?.id) {
            const supabase = getSupabaseClient();
            await (supabase.from('clinics') as any).update({ logo: url }).eq('user_id', user.id);
        }
    };

    if (!user || loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const getEmployerLabel = () => {
        const type = user?.userType || 'clinic';
        if (language === 'ar') {
            switch (type) {
                case 'company': return 'الشركة';
                case 'lab': return 'المختبر';
                default: return 'العيادة';
            }
        }
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const employerLabel = getEmployerLabel();

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'ar' ? `ملف ${employerLabel}` : `${employerLabel} Profile`}
                </h1>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex flex-col sm:flex-row justify-between items-end -mt-16 mb-6 gap-4">
                        <div className="relative">
                            <ProfileImageUpload
                                userId={user.id}
                                currentImageUrl={user.profile.avatar}
                                onUpload={handleImageUpload}
                                altText={user.profile.firstName}
                                size="lg"
                                type="company"
                            />
                        </div>
                        <Link href="/clinic/settings">
                            <Button variant="outline" leftIcon={<Edit size={16} />}>
                                {language === 'ar' ? 'تعديل الملف' : 'Edit Profile'}
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {clinic?.name || `${user.profile.firstName} ${user.profile.lastName}`}
                            </h2>
                            <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-300">
                                {clinic?.city && (
                                    <div className="flex items-center gap-2">
                                        <MapPin size={18} className="text-gray-400" />
                                        <span>{clinic.city}{clinic.address ? `, ${clinic.address}` : ''}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Globe size={18} className="text-gray-400" />
                                    <span className="text-blue-600 hover:underline cursor-pointer">
                                        {clinic?.website || 'dentalhire.com'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 py-6 border-t border-gray-100 dark:border-gray-700">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                                </h3>
                                <p className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                                    <Mail size={14} />
                                    {user.email}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {language === 'ar' ? 'الهاتف' : 'Phone'}
                                </h3>
                                <p className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                                    <Phone size={14} />
                                    {user.profile.phone || clinic?.phone || (language === 'ar' ? 'غير متوفر' : 'Not provided')}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {language === 'ar' ? 'الحالة' : 'Status'}
                                </h3>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    <CheckCircle size={12} /> {language === 'ar' ? `${employerLabel} موثقة` : `Verified ${employerLabel}`}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                                {language === 'ar' ? `عن ${employerLabel}` : `About the ${employerLabel}`}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {clinic?.description || (language === 'ar'
                                    ? `لا يوجد وصف متاح حالياً. يرجى تعديل الملف الشخصي لإضافة وصف لـ ${employerLabel}.`
                                    : `No description available yet. Please edit your profile to add a ${employerLabel.toLowerCase()} description.`)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
