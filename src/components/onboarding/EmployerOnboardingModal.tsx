'use client';

// ============================================
// DentalHire - Employer Onboarding Modal
// Shows after first login for clinic/company/lab users
// ============================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/shared';
import { useAuthStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSupabaseClient } from '@/lib/supabase';
import { iraqLocations } from '@/data/iraq_locations';
import {
    Building2,
    MapPin,
    User,
    CheckCircle2,
    Sparkles,
    X
} from 'lucide-react';

interface EmployerOnboardingModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

export default function EmployerOnboardingModal({ isOpen, onComplete }: EmployerOnboardingModalProps) {
    const { user } = useAuthStore();
    const { language } = useLanguage();
    const router = useRouter();
    const supabase = getSupabaseClient();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [fullName, setFullName] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');

    // Translations
    const t = {
        ar: {
            title: 'مرحباً بك! 🎉',
            subtitle: 'أكمل ملفك الشخصي للبدء',
            fullName: 'الاسم الكامل',
            fullNamePlaceholder: 'أدخل اسمك الكامل',
            clinicName: 'اسم العيادة',
            clinicNamePlaceholder: 'أدخل اسم العيادة',
            companyName: 'اسم الشركة',
            companyNamePlaceholder: 'أدخل اسم الشركة',
            labName: 'اسم المختبر',
            labNamePlaceholder: 'أدخل اسم المختبر',
            city: 'المدينة',
            cityPlaceholder: 'اختر المدينة',
            address: 'العنوان (اختياري)',
            addressPlaceholder: 'أدخل العنوان التفصيلي',
            save: 'حفظ والمتابعة',
            saving: 'جاري الحفظ...',
            error: 'حدث خطأ، يرجى المحاولة مرة أخرى',
            required: 'هذا الحقل مطلوب',
        },
        en: {
            title: 'Welcome! 🎉',
            subtitle: 'Complete your profile to get started',
            fullName: 'Full Name',
            fullNamePlaceholder: 'Enter your full name',
            clinicName: 'Clinic Name',
            clinicNamePlaceholder: 'Enter clinic name',
            companyName: 'Company Name',
            companyNamePlaceholder: 'Enter company name',
            labName: 'Lab Name',
            labNamePlaceholder: 'Enter lab name',
            city: 'City',
            cityPlaceholder: 'Select city',
            address: 'Address (Optional)',
            addressPlaceholder: 'Enter detailed address',
            save: 'Save & Continue',
            saving: 'Saving...',
            error: 'An error occurred, please try again',
            required: 'This field is required',
        },
    };

    const text = t[language as keyof typeof t] || t.en;

    // Get business name label based on user type
    const getBusinessLabel = () => {
        switch (user?.userType) {
            case 'clinic':
                return { label: text.clinicName, placeholder: text.clinicNamePlaceholder };
            case 'company':
                return { label: text.companyName, placeholder: text.companyNamePlaceholder };
            case 'lab':
                return { label: text.labName, placeholder: text.labNamePlaceholder };
            default:
                return { label: text.clinicName, placeholder: text.clinicNamePlaceholder };
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!fullName.trim()) {
            setError(text.required);
            return;
        }
        if (!businessName.trim()) {
            setError(text.required);
            return;
        }
        if (!city) {
            setError(text.required);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // First check if clinic record already exists
            const { data: existingClinic } = await supabase
                .from('clinics')
                .select('id')
                .eq('user_id', user?.id || '')
                .single();

            let updateError;

            if (existingClinic) {
                // Update existing record
                const { error } = await (supabase
                    .from('clinics') as any)
                    .update({
                        name: businessName,
                        city: city,
                        address: address || city,
                    } as any)
                    .eq('user_id', user?.id || '');
                updateError = error;
            } else {
                // Insert new record
                const { error } = await (supabase
                    .from('clinics') as any)
                    .insert({
                        user_id: user?.id,
                        name: businessName,
                        city: city,
                        address: address || city,
                        email: user?.email || '',
                        verified: false,
                    } as any);
                updateError = error;
            }

            if (updateError) {
                console.error('Error updating profile:', updateError);
                setError(text.error + ' - ' + updateError.message);
                return;
            }

            // Update user profile with full name
            const { error: profileError } = await (supabase
                .from('users') as any)
                .update({
                    first_name: fullName.split(' ')[0],
                    last_name: fullName.split(' ').slice(1).join(' ') || '',
                } as any)
                .eq('id', user?.id || '');

            if (profileError) {
                console.error('Error updating user profile:', profileError);
            }

            // Success - call onComplete callback
            onComplete();

        } catch (err) {
            console.error('Onboarding error:', err);
            setError(text.error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const businessLabels = getBusinessLabel();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
                {/* Header with gradient */}
                <div className="bg-gradient-to-br from-blue-600 to-teal-600 p-8 text-white text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Sparkles className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{text.title}</h2>
                    <p className="text-blue-100">{text.subtitle}</p>
                </div>

                {/* Form */}
                <div className="p-6 space-y-5">
                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                            <X size={18} />
                            {error}
                        </div>
                    )}

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {text.fullName} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`}>
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder={text.fullNamePlaceholder}
                                className={`w-full ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                            />
                        </div>
                    </div>

                    {/* Business Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {businessLabels.label} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`}>
                                <Building2 size={18} />
                            </div>
                            <input
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                placeholder={businessLabels.placeholder}
                                className={`w-full ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                            />
                        </div>
                    </div>

                    {/* City */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {text.city} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 z-10`}>
                                <MapPin size={18} />
                            </div>
                            <select
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className={`w-full ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer`}
                                title={text.city}
                            >
                                <option value="">{text.cityPlaceholder}</option>
                                {Object.keys(iraqLocations).map((key) => (
                                    <option key={key} value={key}>
                                        {language === 'ar' ? (iraqLocations as any)[key].ar : (iraqLocations as any)[key].en || key}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Address (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {text.address}
                        </label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder={text.addressPlaceholder}
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        loading={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-lg py-4"
                        rightIcon={<CheckCircle2 size={20} />}
                    >
                        {isLoading ? text.saving : text.save}
                    </Button>
                </div>
            </div>
        </div>
    );
}
