'use client';

import { useAuthStore, useCVStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/shared';
import { User, Mail, Phone, Calendar, Edit, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function JobSeekerProfilePage() {
    const { user } = useAuthStore();
    const { getCompletionPercentage } = useCVStore();
    const { language, t } = useLanguage();

    if (!user || !user.profile) {
        return <div>{language === 'ar' ? 'جاري تحميل الملف الشخصي...' : 'Loading profile...'}</div>;
    }

    const { firstName, lastName, phone, avatar, verified } = user.profile;
    const completion = getCompletionPercentage();

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {language === 'ar' ? 'ملفي الشخصي' : 'My Profile'}
            </h1>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-teal-500"></div>
                <div className="px-6 pb-6">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-700 overflow-hidden relative">
                                {avatar ? (
                                    <Image
                                        src={avatar}
                                        alt={`${firstName} ${lastName}`}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-800">
                                        <User size={40} />
                                    </div>
                                )}
                            </div>
                            {verified && (
                                <div className={`absolute bottom-0 ${language === 'ar' ? 'left-0' : 'right-0'} bg-white dark:bg-gray-800 rounded-full p-1 border border-gray-100 dark:border-gray-700`} title={language === 'ar' ? 'ملف موثق' : 'Verified Profile'}>
                                    <CheckCircle size={20} className="text-blue-500" fill="currentColor" />
                                </div>
                            )}
                        </div>
                        <Link href="/job-seeker/settings">
                            <Button variant="outline" leftIcon={<Edit size={16} />}>
                                {language === 'ar' ? 'تعديل الملف' : 'Edit Profile'}
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {firstName} {lastName}
                                {verified && <CheckCircle size={20} className="text-blue-500" />}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 capitalize">
                                {language === 'ar' ? 'مساعد طب أسنان' : user.userType?.replace('_', ' ')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <Mail size={18} className="text-gray-400" />
                                <span>{user.email}</span>
                            </div>
                            {phone && (
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <Phone size={18} className="text-gray-400" />
                                    <span>{phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <Calendar size={18} className="text-gray-400" />
                                <span>{language === 'ar' ? 'انضم في' : 'Joined'} {formatDate(user.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* CV Status Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText size={20} className="text-blue-500" />
                            {language === 'ar' ? 'قوة السيرة الذاتية' : 'CV Strength'}
                        </h3>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {language === 'ar' ? `مكتمل ${completion}%` : `${completion}% Complete`}
                        </span>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${completion}%` }}
                        ></div>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        {language === 'ar'
                            ? 'السيرة الذاتية المكتملة تزيد من فرص مطابقتك مع أفضل العيادات.'
                            : 'A complete CV increases your chances of getting matched with top clinics.'}
                    </p>

                    <Link href="/job-seeker/cv-builder">
                        <Button className="w-full">
                            {language === 'ar' ? 'تحديث السيرة الذاتية' : 'Update CV'}
                        </Button>
                    </Link>
                </div>

                {/* Account Status */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                        {language === 'ar' ? 'حالة الحساب' : 'Account Status'}
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {language === 'ar' ? 'التوثيق' : 'Verification'}
                            </span>
                            {verified ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    <CheckCircle size={12} /> {language === 'ar' ? 'موثق' : 'Verified'}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                    {language === 'ar' ? 'قيد المراجعة' : 'Pending'}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {language === 'ar' ? 'الاشتراك' : 'Subscription'}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                {language === 'ar' ? 'خطة مجانية' : 'Free Plan'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
