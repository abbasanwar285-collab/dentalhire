'use client';

import { Card, CardHeader, CardContent, Button } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthStore, useJobStore } from '@/store';
import { getSupabaseClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Users, FileText, Plus, FlaskConical } from 'lucide-react';
import Link from 'next/link';

export default function LabDashboard() {
    const { language } = useLanguage();
    const { user } = useAuthStore();
    const {
        jobs,
        clinicApplications,
        favorites,
        loadClinicJobs,
        loadClinicApplications,
        loadFavorites
    } = useJobStore();
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.id) return;

            try {
                // Load applications and favorites (these take userId based on store implementation)
                loadClinicApplications(user.id);
                loadFavorites(user.id);

                // Get clinic ID for jobs (loadClinicJobs expects internal clinic ID)
                const supabase = getSupabaseClient();
                const { data: clinic } = await supabase
                    .from('clinics')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (clinic) {
                    await loadClinicJobs((clinic as any).id);
                }
            } catch (error) {
                console.error('Error loading dashboard stats:', error);
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchStats();
    }, [user?.id, loadClinicJobs, loadClinicApplications, loadFavorites]);

    const activeJobsCount = (jobs as any[]).filter(j => j.status === 'active').length;
    const applicationsCount = clinicApplications.length;
    const favoritesCount = favorites.length;

    const t = {
        ar: {
            vacancies: 'شواغر الفنيين',
            applications: 'طلبات التوظيف',
            qualifiedTechs: 'فنيين مؤهلين',
            roles: 'وظائف فنيي المختبر',
            hire: 'توظيف فنيين',
            noListings: 'لا توجد وظائف نشطة. ابحث عن فنيين ماهرين لمختبرك.',
        },
        en: {
            vacancies: 'Technician Vacancies',
            applications: 'Applications',
            qualifiedTechs: 'Qualified Techs',
            roles: 'Lab Technician Roles',
            hire: 'Hire Technicians',
            noListings: 'No active listings. Find skilled technicians for your lab.',
        },
    };

    const text = t[language as keyof typeof t] || t.en;

    const stats = [
        { label: text.vacancies, value: isLoadingStats ? '-' : activeJobsCount.toString(), icon: <FileText size={20} /> },
        { label: text.applications, value: isLoadingStats ? '-' : applicationsCount.toString(), icon: <Users size={20} /> },
        { label: text.qualifiedTechs, value: isLoadingStats ? '-' : favoritesCount.toString(), icon: <FlaskConical size={20} /> },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-base text-muted-foreground dark:text-gray-200">{stat.label}</p>
                                <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{stat.value}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader
                    title={text.roles}
                    action={
                        <Link href="/lab/jobs?new=true">
                            <Button size="sm" leftIcon={<Plus size={16} />}>
                                {text.hire}
                            </Button>
                        </Link>
                    }
                />
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground dark:text-gray-200">
                        {jobs.length > 0 ? (
                            <div className="space-y-4">
                                {jobs.slice(0, 3).map(job => (
                                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{job.title}</p>
                                            <p className="text-sm text-muted-foreground dark:text-gray-200">{job.location} • {job.employmentType}</p>
                                        </div>
                                        <div className="text-sm text-muted-foreground dark:text-gray-200">
                                            {job.applications} {text.applications}
                                        </div>
                                    </div>
                                ))}
                                {jobs.length > 3 && (
                                    <Link href="/lab/jobs" className="text-blue-600 hover:underline text-sm block mt-2">
                                        {language === 'ar' ? 'عرض جميع الوظائف' : 'View all jobs'}
                                    </Link>
                                )}
                            </div>
                        ) : (
                            text.noListings
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
