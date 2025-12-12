
'use client';

import Link from 'next/link';
import { useAuthStore, useCVStore } from '@/store';
import { Card, Button } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    FileText,
    Eye,
    MessageSquare,
    Briefcase,
    Target,
    Sparkles,
    Search,
} from 'lucide-react';
import { useState } from 'react';
import ReviewModal from '@/components/reviews/ReviewModal';
import DoctorDashboard from './widgets/DoctorDashboard';
import AssistantDashboard from './widgets/AssistantDashboard';
import SecretaryDashboard from './widgets/SecretaryDashboard';
import TechnicianDashboard from './widgets/TechnicianDashboard';
import SalesDashboard from './widgets/SalesDashboard';
import MediaDashboard from './widgets/MediaDashboard';
import ClinicDashboard from './widgets/ClinicDashboard';
import CompanyDashboard from './widgets/CompanyDashboard';
import LabDashboard from './widgets/LabDashboard';
import JobSeekerDashboard from './widgets/JobSeekerDashboard';

interface RoleBasedDashboardProps {
    role: string;
}

export default function RoleBasedDashboard({ role }: RoleBasedDashboardProps) {
    const { user } = useAuthStore();
    const { getCompletionPercentage } = useCVStore();
    const { t, language } = useLanguage();
    const cvCompletion = getCompletionPercentage();

    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState<{ name: string } | null>(null);

    const submitReview = (rating: number, comment: string) => {
        console.log('Submitting review:', { clinic: selectedClinic?.name, rating, comment });
        setIsReviewOpen(false);
        setSelectedClinic(null);
    };

    const stats = [
        { label: t('dashboard.profileviews'), value: '0', icon: <Eye size={20} />, change: '0%' },
        { label: t('dashboard.messages'), value: '0', icon: <MessageSquare size={20} />, change: '0' },
        { label: t('dashboard.matchscore'), value: 'N/A', icon: <Target size={20} />, change: '' },
        { label: t('dashboard.applications'), value: '0', icon: <Briefcase size={20} />, change: '0' },
    ];

    const isEmployer = ['clinic', 'company', 'lab'].includes(role);

    return (
        <div className="space-y-6 animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('dashboard.welcome')}، {user?.profile.firstName}! 👋
                    </h1>
                    <p className="text-muted-foreground dark:text-gray-200 mt-1">
                        {t('dashboard.welcomesubtitle')}
                    </p>
                </div>
                {!isEmployer && (
                    <Link href={`/${role}/cv-builder`}>
                        <Button leftIcon={<FileText size={18} />}>
                            {t('dashboard.editcv')}
                        </Button>
                    </Link>
                )}
            </div>

            {/* CV Completion Banner - Only for Job Seekers */}
            {!isEmployer && cvCompletion < 100 && (
                <Card variant="gradient" className="animate-fade-in-up">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t('dashboard.completecv')}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {t('dashboard.profilecomplete')} {cvCompletion}% {t('dashboard.complete')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-teal-500 transition-all duration-500"
                                    style={{ width: `${cvCompletion}%` }}
                                />
                            </div>
                            <Link href={`/${role}/cv-builder`}>
                                <Button size="sm">{t('dashboard.completenow')}</Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            )}

            {/* Role Specific Content */}
            {(() => {
                switch (role) {
                    case 'job_seeker': return <JobSeekerDashboard />;
                    case 'dentist': return <DoctorDashboard />;
                    case 'dental_assistant':
                    case 'assistant': return <AssistantDashboard />;
                    case 'secretary': return <SecretaryDashboard />;
                    case 'dental_technician':
                    case 'technician': return <TechnicianDashboard />;
                    case 'sales_rep':
                    case 'sales': return <SalesDashboard />;
                    case 'media': return <MediaDashboard />;

                    // Employer Roles
                    case 'clinic':
                    case 'company':
                    case 'lab':
                        // Specific check for userType to serve correct dashboard
                        if (user?.userType === 'company') return <CompanyDashboard />;
                        if (user?.userType === 'lab') return <LabDashboard />;
                        return <ClinicDashboard />; // Default to Clinic if type is clinic or undefined

                        return (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {stats.map((stat, index) => (
                                        <Card key={index} hover>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-base text-muted-foreground dark:text-gray-200">{stat.label}</p>
                                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                                        {stat.value}
                                                    </p>
                                                </div>
                                                <div className="text-blue-500">
                                                    {stat.icon}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {/* Job Search CTA */}
                                <div className="flex justify-center">
                                    <Link href="/jobs">
                                        <Button size="lg" leftIcon={<Search size={20} />} className="px-8 h-12 text-lg">
                                            {language === 'ar' ? 'ابحث عن وظائف' : 'Find Jobs'}
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        );
                }
            })()}

            {/* Review Modal */}
            <ReviewModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                onSubmit={submitReview}
                targetName={selectedClinic?.name || 'Clinic'}
            />
        </div>
    );
}
