'use client';

import { Card, CardHeader, CardContent, Button } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, FileText, Plus, ShoppingBag, Search } from 'lucide-react';
import Link from 'next/link';

export default function CompanyDashboard() {
    const { language } = useLanguage();

    const t = {
        ar: {
            openPositions: 'الوظائف المفتوحة',
            applications: 'طلبات التوظيف',
            topCandidates: 'أفضل المرشحين',
            salesJobs: 'وظائف المبيعات والتسويق',
            recruitReps: 'توظيف مندوبين',
            noJobs: 'لا توجد وظائف نشطة حالياً',
            findCandidates: 'ابحث عن مندوبي مبيعات',
            postJob: 'أنشر وظيفة جديدة',
        },
        en: {
            openPositions: 'Open Positions',
            applications: 'Applications',
            topCandidates: 'Top Candidates',
            salesJobs: 'Sales & Marketing Jobs',
            recruitReps: 'Recruit Reps',
            noJobs: 'No active jobs yet',
            findCandidates: 'Find Sales Reps',
            postJob: 'Post a Job',
        },
    };

    const text = t[language as keyof typeof t] || t.en;

    const stats = [
        { label: text.openPositions, value: '0', icon: <FileText size={20} /> },
        { label: text.applications, value: '0', icon: <Users size={20} /> },
        { label: text.topCandidates, value: '0', icon: <ShoppingBag size={20} /> },
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
                            <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader
                    title={text.salesJobs}
                    action={
                        <Link href="/company/jobs/new">
                            <Button size="sm" leftIcon={<Plus size={16} />}>
                                {text.recruitReps}
                            </Button>
                        </Link>
                    }
                />
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-muted-foreground dark:text-gray-200 mb-4">{text.noJobs}</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link href="/company/search">
                                <Button variant="outline" leftIcon={<Search size={16} />}>
                                    {text.findCandidates}
                                </Button>
                            </Link>
                            <Link href="/company/jobs/new">
                                <Button leftIcon={<Plus size={16} />}>
                                    {text.postJob}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
