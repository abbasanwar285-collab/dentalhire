'use client';

// ============================================
// DentalHire - Personal Info Step
// ============================================

import { useEffect } from 'react';
import { useCVStore, useAuthStore } from '@/store';
import { getSupabaseClient } from '@/lib/supabase';
import { useState } from 'react';
import { Input } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Mail, Phone, Calendar, MapPin, FileText } from 'lucide-react';
import { iraqLocations } from '@/data/iraq_locations';

export default function PersonalInfoStep() {
    const { personalInfo, updatePersonalInfo } = useCVStore();
    const { user } = useAuthStore();
    const { t, language } = useLanguage();
    const [isUploading, setIsUploading] = useState(false);

    // Handle Photo Upload
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(language === 'ar' ? 'حجم الملف كبير جداً (أقصى حد 5 ميجابايت)' : 'File too large (max 5MB)');
            return;
        }

        setIsUploading(true);
        try {
            const supabase = getSupabaseClient();

            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `cv-photos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars') // Using 'avatars' bucket as it's standard
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 1. Update local store
            updatePersonalInfo({ photo: publicUrl });

            // 2. Persist to Database immediately if user is logged in
            if (user?.id) {
                // First try to find existing CV
                const { data: existingCV } = await supabase
                    .from('cvs')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (existingCV) {
                    await (supabase.from('cvs') as any)
                        .update({ photo: publicUrl })
                        .eq('id', existingCV.id);
                } else {
                    // Create minimal CV with photo
                    await (supabase.from('cvs') as any)
                        .insert({
                            user_id: user.id,
                            photo: publicUrl,
                            full_name: personalInfo.fullName || '',
                            email: personalInfo.email || user.email || '',
                            phone: personalInfo.phone || '',
                            city: personalInfo.city || '',
                            status: 'draft'
                        });
                }
            }

        } catch (error) {
            console.error('Error uploading photo:', error);
            alert(language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload photo');
        } finally {
            setIsUploading(false);
        }
    };

    // Set defaults for Iraq
    useEffect(() => {
        if (!personalInfo.phone) {
            updatePersonalInfo({ phone: '+964 ' });
        }
        if (!personalInfo.nationality) {
            updatePersonalInfo({ nationality: language === 'ar' ? 'عراقي' : 'Iraqi' });
        }
        // Default City from Profile
        if (!personalInfo.city && user?.profile?.city) {
            updatePersonalInfo({ city: user.profile.city });
        }
    }, [language, personalInfo.phone, personalInfo.nationality, personalInfo.city, user?.profile?.city, updatePersonalInfo]);

    const handleChange = (field: string, value: string) => {
        updatePersonalInfo({ [field]: value });
    };

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <p className="text-gray-600 dark:text-gray-400">
                {t('cv.personal.intro')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label={`${t('cv.personal.fullname')} *`}
                    placeholder={t('cv.personal.fullname.placeholder')}
                    value={personalInfo.fullName || ''}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    leftIcon={<User size={18} />}
                />

                <Input
                    label={`${t('cv.personal.email')} *`}
                    type="email"
                    placeholder={t('cv.personal.email.placeholder')}
                    value={personalInfo.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    leftIcon={<Mail size={18} />}
                />

                <Input
                    label={`${t('cv.personal.phone')} *`}
                    type="tel"
                    placeholder={t('cv.personal.phone.placeholder')}
                    value={personalInfo.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    leftIcon={<Phone size={18} />}
                />

                <div>
                    <label htmlFor="city-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {language === 'ar' ? 'المحافظة *' : t('cv.personal.city') + ' *'}
                    </label>
                    <div className="relative">
                        <select
                            id="city-select"
                            value={personalInfo.city || ''}
                            onChange={(e) => handleChange('city', e.target.value)}
                            className="w-full px-4 py-2.5 pl-10 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
                        >
                            <option value="">{language === 'ar' ? 'اختر المحافظة' : 'Select Governorate'}</option>
                            {Object.entries(iraqLocations).map(([key, gov]) => {
                                const name = language === 'ar' ? gov.ar : (gov.en || key);
                                return (
                                    <option key={key} value={name}>
                                        {name}
                                    </option>
                                );
                            })}
                        </select>
                        <div className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}>
                            <MapPin size={18} />
                        </div>
                    </div>
                </div>

                <Input
                    label={t('cv.personal.dob')}
                    type="date"
                    value={personalInfo.dateOfBirth || ''}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    leftIcon={<Calendar size={18} />}
                />

                <div>
                    <label htmlFor="gender-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t('cv.personal.gender')}
                    </label>
                    <select
                        id="gender-select"
                        value={personalInfo.gender || ''}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        aria-label={t('cv.personal.gender')}
                    >
                        <option value="">{t('cv.personal.gender.select')}</option>
                        <option value="Male">{t('cv.personal.gender.male')}</option>
                        <option value="Female">{t('cv.personal.gender.female')}</option>
                        <option value="Other">{t('cv.personal.gender.other')}</option>
                        <option value="Prefer not to say">{t('cv.personal.gender.prefer')}</option>
                    </select>
                </div>

                <Input
                    label={t('cv.personal.nationality')}
                    placeholder={t('cv.personal.nationality.placeholder')}
                    value={personalInfo.nationality || ''}
                    onChange={(e) => handleChange('nationality', e.target.value)}
                />

                <Input
                    label={t('cv.personal.address')}
                    placeholder={t('cv.personal.address.placeholder')}
                    value={personalInfo.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    leftIcon={<MapPin size={18} />}
                />
            </div>

            <div>
                <label htmlFor="bio-textarea" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <div className="flex items-center gap-2">
                        <FileText size={18} />
                        {t('cv.personal.bio')}
                    </div>
                </label>
                <textarea
                    id="bio-textarea"
                    placeholder={t('cv.personal.bio.placeholder')}
                    value={personalInfo.bio || ''}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                    {(personalInfo.bio?.length || 0)}/500 {t('cv.personal.characters')}
                </p>
            </div>

            {/* Profile Photo Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('cv.personal.photo')}
                </label>
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        {personalInfo.photo ? (
                            <img src={personalInfo.photo} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={32} className="text-gray-400" />
                        )}
                    </div>
                    <div>
                        <input
                            type="file"
                            id="photo-upload"
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handlePhotoUpload}
                            disabled={isUploading}
                        />
                        <button
                            type="button"
                            onClick={() => document.getElementById('photo-upload')?.click()}
                            disabled={isUploading}
                            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? t('common.loading') : t('cv.personal.upload')}
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                            {language === 'ar'
                                ? '.JPG, .PNG أو .WebP. أقصى حجم 5MB'
                                : '.JPG, .PNG or .WebP. Max size 5MB'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>{t('common.tip')}:</strong> {t('cv.personal.tip')}
                </p>
            </div>
        </div>
    );
}


