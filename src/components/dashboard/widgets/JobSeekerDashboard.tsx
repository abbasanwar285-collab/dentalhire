'use client';

import { useJobStore, useAuthStore } from '@/store';
import { Card, Button } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Briefcase,
    Bookmark,
    Eye,
    Clock,
    Search,
    Building,
    ChevronRight,
    Star
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export default function JobSeekerDashboard() {
    const { user } = useAuthStore();
    const { t, language } = useLanguage();
    const { savedJobs, jobs } = useJobStore();

    // Local state for counts (in a real app, these might come from a store or API)
    const [stats, setStats] = useState({
        applications: 0,
        interviews: 0,
        views: 0
    });

    const [recentApplications, setRecentApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Derive saved job objects from the jobs store
    const safeJobs = Array.isArray(jobs) ? jobs : [];
    const savedJobItems = safeJobs.filter(job => savedJobs.includes(job.id));

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.id) return;

            const supabase = getSupabaseClient();

            try {
                // Fetch applications count
                const { count: appCount, data: apps } = await supabase
                    .from('job_applications')
                    .select('*, job:jobs(title, location)', { count: 'exact' }) // Simplified select, ensuring job relation works
                    .eq('applicant_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(3);

                // Fetch interviews (real status check)
                const { count: interviewCount } = await supabase
                    .from('job_applications')
                    .select('*', { count: 'exact' })
                    .eq('applicant_id', user.id)
                    .eq('status', 'interview');

                setStats({
                    applications: appCount || 0,
                    interviews: interviewCount || 0,
                    views: 0 // Placeholder for now
                });

                setRecentApplications(apps || []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user?.id]);

    const statCards = [
        {
            label: t('dashboard.applications'),
            value: stats.applications,
            icon: <Briefcase size={24} />,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20'
        },
        {
            label: t('dashboard.saved'),
            value: savedJobs.length,
            icon: <Bookmark size={24} />,
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20'
        },
        {
            label: t('dashboard.interviews'),
            value: stats.interviews,
            icon: <Clock size={24} />,
            color: 'text-orange-600',
            bg: 'bg-orange-50 dark:bg-orange-900/20'
        },
        {
            label: t('dashboard.profileviews'),
            value: stats.views,
            icon: <Eye size={24} />,
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-900/20'
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <Card key={index} hover className="border-none shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-base font-medium text-gray-600 dark:text-gray-300">
                                    {stat.label}
                                </p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Recent Applications */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {language === 'ar' ? 'آخر التقديمات' : 'Recent Applications'}
                        </h2>
                        <Link href="/job-seeker/applications">
                            <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={16} className={language === 'ar' ? 'rotate-180' : ''} />}>
                                {language === 'ar' ? 'عرض الكل' : 'View All'}
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading...</div>
                        ) : recentApplications.length > 0 ? (
                            recentApplications.map((app) => (
                                <Card key={app.id} className="group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-muted-foreground">
                                                <Building size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                    {app.job?.title || 'Unknown Job'}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-300">
                                                    {app.job?.location || 'Unknown Location'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                        ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                            app.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                app.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                        }`}>
                                                        {app.status ? (app.status.charAt(0).toUpperCase() + app.status.slice(1)) : 'Unknown'}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(app.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link href={`/job-seeker/applications/${app.id}`}>
                                            <Button variant="ghost" size="sm">
                                                {language === 'ar' ? 'التفاصيل' : 'Details'}
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <Card className="text-center py-8 text-gray-500 dark:text-gray-300">
                                {language === 'ar' ? 'لم تقدم على أي وظيفة بعد' : 'No applications yet'}
                            </Card>
                        )}
                    </div>
                </div>

                {/* Quick Actions / Recommendations */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
                    </h2>

                    <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none">
                        <div className="space-y-4">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Search size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">
                                    {language === 'ar' ? 'ابحث عن وظيفتك القادمة' : 'Find Your Next Job'}
                                </h3>
                                <p className="text-blue-100 text-sm">
                                    {language === 'ar'
                                        ? 'تصفح مئات الوظائف في مجال طب الأسنان'
                                        : 'Browse hundreds of dental jobs suited for you.'}
                                </p>
                            </div>
                            <Link href="/jobs" className="block">
                                <Button className="w-full bg-white text-blue-600 hover:bg-white/90 border-none">
                                    {language === 'ar' ? 'ابدأ البحث' : 'Start Searching'}
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Star size={18} className="text-yellow-500" />
                            {language === 'ar' ? 'وظائف محفوظة' : 'Saved Jobs'}
                        </h3>
                        {savedJobItems.length > 0 ? (
                            <div className="space-y-3">
                                {savedJobItems.slice(0, 3).map(job => (
                                    <Link key={job.id} href={`/jobs?id=${job.id}`} className="block">
                                        <div className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-muted-foreground overflow-hidden relative border border-gray-200 dark:border-gray-600">
                                                {job.clinicLogo ? (
                                                    <img
                                                        src={job.clinicLogo}
                                                        alt={job.clinicName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Briefcase size={16} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{job.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-300 truncate">{job.location}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                <Link href="/job-seeker/favorites" className="block text-center text-sm text-blue-600 hover:underline mt-2">
                                    {language === 'ar' ? 'عرض كل المحفوظات' : 'View All Saved'}
                                </Link>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-300 text-center py-4">
                                {language === 'ar' ? 'لا توجد وظائف محفوظة' : 'No saved jobs'}
                            </p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
