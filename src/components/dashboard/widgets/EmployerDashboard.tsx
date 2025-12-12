'use client';

import { Card, CardHeader, CardContent, Button } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { Building2, Users, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

export default function EmployerDashboard() {
    const { t } = useLanguage();

    const stats = [
        { label: 'Active Jobs', value: '3', icon: <FileText size={20} /> },
        { label: 'Total Applications', value: '12', icon: <Users size={20} /> },
        { label: 'Shortlisted', value: '5', icon: <FileText size={20} /> },
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
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader
                    title="Recent Job Postings"
                    action={
                        <Link href="/clinic/jobs/new">
                            <Button size="sm" leftIcon={<Plus size={16} />}>
                                Post New Job
                            </Button>
                        </Link>
                    }
                />
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground dark:text-gray-200">
                        No active jobs found. Start hiring today!
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
