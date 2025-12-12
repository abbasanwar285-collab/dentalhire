'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useJobStore, useAuthStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/utils';
import {
    Briefcase,
    MapPin,
    Clock,
    Building2,
    Calendar,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    Search
} from 'lucide-react';
import { Button } from '@/components/shared';

export default function ApplicationsPage() {
    const { user } = useAuthStore();
    const { userApplications, loadUserApplications, isLoading } = useJobStore();
    const { language, t } = useLanguage();

    useEffect(() => {
        if (user) {
            loadUserApplications(user.id);
        }
    }, [user, loadUserApplications]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'reviewed':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'interview':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'accepted':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'rejected':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock size={16} />;
            case 'reviewed':
                return <CheckCircle size={16} />;
            case 'interview':
                return <Calendar size={16} />;
            case 'accepted':
                return <CheckCircle size={16} />;
            case 'rejected':
                return <XCircle size={16} />;
            default:
                return <AlertCircle size={16} />;
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, { en: string; ar: string }> = {
            pending: { en: 'Pending', ar: 'قيد المراجعة' },
            reviewed: { en: 'Reviewed', ar: 'تمت المراجعة' },
            interview: { en: 'Interview', ar: 'مقابلة' },
            accepted: { en: 'Accepted', ar: 'مقبول' },
            rejected: { en: 'Rejected', ar: 'مرفوض' },
        };
        return language === 'ar' ? labels[status]?.ar || status : labels[status]?.en || status;
    };

    const formatDisplayDate = (date: Date) => {
        return formatDate(date);
    };

    if (isLoading) {
        return (
            <div className="p-8 flex justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'ar' ? 'طلباتي' : 'My Applications'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {language === 'ar' ? 'تتبع حالة طلبات التوظيف الخاصة بك' : 'Track the status of your job applications'}
                </p>
            </div>

            {userApplications.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Briefcase size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {language === 'ar' ? 'لا توجد طلبات بعد' : 'No applications yet'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                        {language === 'ar'
                            ? 'لم تتقدم لأي وظائف بعد. ابدأ بتصفح الوظائف للعثور على فرصتك التالية.'
                            : "You haven't applied to any jobs yet. Start browsing jobs to find your next opportunity."}
                    </p>
                    <Link href="/jobs">
                        <Button leftIcon={<Search size={18} />}>
                            {language === 'ar' ? 'تصفح الوظائف' : 'Browse Jobs'}
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {userApplications.map((application) => (
                        <div
                            key={application.id}
                            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col md:flex-row gap-6 justify-between">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                                {application.job?.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                <Building2 size={16} className="text-gray-400" />
                                                <span>{application.job?.clinicName}</span>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusColor(application.status)} md:hidden`}>
                                            {getStatusIcon(application.status)}
                                            {getStatusLabel(application.status)}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={16} />
                                            {application.job?.location}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={16} />
                                            {language === 'ar' ? 'تقدمت في' : 'Applied'} {formatDisplayDate(application.appliedAt)}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Briefcase size={16} />
                                            <span className="capitalize">{application.job?.employmentType?.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-4 min-w-[140px]">
                                    <div className={`hidden md:flex px-3 py-1 rounded-full text-xs font-medium items-center gap-1.5 ${getStatusColor(application.status)}`}>
                                        {getStatusIcon(application.status)}
                                        {getStatusLabel(application.status)}
                                    </div>

                                    <Link href={`/jobs?id=${application.jobId}`} className="w-full md:w-auto">
                                        <Button variant="outline" className="w-full" rightIcon={language === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}>
                                            {language === 'ar' ? 'عرض الوظيفة' : 'View Job'}
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
