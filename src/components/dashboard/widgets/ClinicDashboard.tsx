'use client';

import { useEffect } from 'react';
import { Card, CardHeader, CardContent, Button } from '@/components/shared';
import { useAuthStore, useJobStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, FileText, Plus, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';

export default function ClinicDashboard() {
    const { user } = useAuthStore();
    const { jobs, loadClinicJobs, isLoading } = useJobStore();
    const { language } = useLanguage();

    useEffect(() => {
        if (user?.id) {
            loadClinicJobs(user.id);
        }
    }, [user?.id, loadClinicJobs]);

    const activeJobs = jobs.filter(j => j.status === 'active');
    const totalApplications = jobs.reduce((acc, job) => acc + (job.applications || 0), 0);

    // Calculate new applications (mock logic based on recent date or status if available, 
    // for MVP just showing total for now or we could check 'pending' status if we loaded applications deeply)
    // Since loadClinicJobs only loads job summary, we'll stick to total applications.

    const stats = [
        {
            label: language === 'ar' ? 'الوظائف النشطة' : 'Active Job Posts',
            value: activeJobs.length,
            icon: <FileText size={20} />,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            label: language === 'ar' ? 'الطلبات المستلمة' : 'Applications Received',
            value: totalApplications,
            icon: <Users size={20} />,
            color: 'text-purple-600',
            bg: 'bg-purple-100'
        },
        {
            label: language === 'ar' ? 'إجمالي الوظائف' : 'Total Jobs',
            value: jobs.length,
            icon: <Briefcase size={20} />,
            color: 'text-green-600',
            bg: 'bg-green-100'
        },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-base text-muted-foreground dark:text-gray-200">{stat.label}</p>
                                <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{stat.value}</p>
                            </div>
                            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader
                    title={language === 'ar' ? 'آخر الوظائف المنشورة' : 'Recent Job Postings'}
                    action={
                        <Link href="/clinic/jobs?new=true">
                            <Button size="sm" leftIcon={<Plus size={16} />}>
                                {language === 'ar' ? 'نشر وظيفة' : 'Post New Job'}
                            </Button>
                        </Link>
                    }
                />
                <CardContent>
                    {isLoading ? (
                        <div className="py-8 text-center text-muted-foreground dark:text-gray-200">Loading...</div>
                    ) : jobs.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {jobs.slice(0, 5).map((job) => (
                                <div key={job.id} className="py-4 flex items-center justify-between group">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                            {job.title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground dark:text-gray-200 mt-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {job.status.toUpperCase()}
                                            </span>
                                            <span>{formatRelativeTime(job.createdAt)}</span>
                                            <span>• {job.applications} {language === 'ar' ? 'متقدم' : 'applicants'}</span>
                                        </div>
                                    </div>
                                    <Link href={`/clinic/jobs/${job.id}`}>
                                        <Button variant="ghost" size="sm">
                                            {language === 'ar' ? 'إدارة' : 'Manage'}
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground dark:text-gray-200">
                            {language === 'ar'
                                ? 'لا توجد وظائف نشطة. ابدأ بتوظيف أطباء الأسنان اليوم!'
                                : 'No active jobs found. Start hiring dentists today!'}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
