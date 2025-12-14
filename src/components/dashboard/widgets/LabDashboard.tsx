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

    const [stats, setStats] = useState({
        activeJobs: 0,
        applications: 0,
        favorites: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.id) return;
            const supabase = getSupabaseClient();
            try {
                // 1. Active Jobs
                const { count: jobsCount } = await supabase
                    .from('jobs')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('status', 'open');

                // 2. Applications
                const { data: jobs } = await supabase.from('jobs').select('id').eq('user_id', user.id);
                let appCount = 0;
                if (jobs && jobs.length > 0) {
                    const jobIds = jobs.map(j => j.id);
                    const { count } = await supabase
                        .from('job_applications')
                        .select('*', { count: 'exact', head: true })
                        .in('job_id', jobIds);
                    appCount = count || 0;
                }

                // 3. Favorites/Qualified Techs (counting saved profiles for now, or just CVs if Favorites logic is complex)
                const { count: favCount } = await supabase
                    .from('job_favorites') // Assuming this table stores saved candidate profiles for employers too, or use separate table
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                setStats({
                    activeJobs: jobsCount || 0,
                    applications: appCount || 0,
                    favorites: favCount || 0
                });

            } catch (error) {
                console.error('Error loading lab dashboard stats:', error);
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchStats();
    }, [user?.id]);

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

    const dashboardStats = [
        { label: text.vacancies, value: isLoadingStats ? '-' : stats.activeJobs.toString(), icon: <FileText size={20} /> },
        { label: text.applications, value: isLoadingStats ? '-' : stats.applications.toString(), icon: <Users size={20} /> },
        { label: text.qualifiedTechs, value: isLoadingStats ? '-' : stats.favorites.toString(), icon: <FlaskConical size={20} /> },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboardStats.map((stat, i) => (
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
