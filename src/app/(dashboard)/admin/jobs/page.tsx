'use client';

// ============================================
// DentalHire - Admin Jobs Management
// ============================================

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Button, Input } from '@/components/shared';
import { getSupabaseClient } from '@/lib/supabase';
import {
    Search,
    Filter,
    Trash2,
    Eye,
    Briefcase,
    Calendar,
    MapPin,
    Building2,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Job {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'closed' | 'draft';
    created_at: string;
    location: string;
    type: string;
    salary_range: string;
    clinic: {
        id: string;
        name: string; // from clinic profile actually, but joined via user_id usually
        user: {
            first_name: string;
            last_name: string;
            email: string;
        };
    } | null;
}

function AdminJobsContent() {
    const { t, language } = useLanguage();
    const searchParams = useSearchParams();

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            // Use server action to bypass RLS
            const { getAdminJobs } = await import('@/app/actions/admin');
            const data = await getAdminJobs();
            setJobs(data as any[]);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            // alert('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    const deleteJob = async (jobId: string) => {
        if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الوظيفة؟' : 'Are you sure you want to delete this job?')) return;

        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase
                .from('jobs')
                .delete()
                .eq('id', jobId);

            if (error) throw error;

            setJobs(jobs.filter(j => j.id !== jobId));
            alert(language === 'ar' ? 'تم الحذف بنجاح' : 'Job deleted successfully');
        } catch (error) {
            console.error('Error deleting job:', error);
            alert('Failed to delete job');
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch =
            (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (job.location || '').toLowerCase().includes(searchQuery.toLowerCase());

        let matchesStatus = true;
        if (selectedStatus !== 'all') {
            matchesStatus = job.status === selectedStatus;
        }

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {language === 'ar' ? 'إدارة الوظائف' : 'Manage Jobs'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {language === 'ar' ? 'عرض وحذف الوظائف المنشورة في المنصة' : 'View and manage all job postings'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchJobs} leftIcon={<Search size={18} />}>
                        {language === 'ar' ? 'تحديث' : 'Refresh'}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-col md:flex-row gap-4 p-4">
                    <div className="flex-1">
                        <Input
                            placeholder={language === 'ar' ? 'بحث عن وظيفة...' : 'Search jobs...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftIcon={<Search size={18} />}
                        />
                    </div>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    >
                        <option value="all">{language === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
                        <option value="active">{language === 'ar' ? 'نشطة' : 'Active'}</option>
                        <option value="closed">{language === 'ar' ? 'مغلقة' : 'Closed'}</option>
                        <option value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</option>
                    </select>
                </div>
            </Card>

            {/* Jobs List */}
            <Card>
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 font-medium">{language === 'ar' ? 'عنوان الوظيفة' : 'Job Title'}</th>
                                <th className="p-4 font-medium">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                                <th className="p-4 font-medium">{language === 'ar' ? 'الموقع' : 'Location'}</th>
                                <th className="p-4 font-medium">{language === 'ar' ? 'تاريخ النشر' : 'Posted Date'}</th>
                                <th className="p-4 font-medium">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td>
                                </tr>
                            ) : filteredJobs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">
                                        {language === 'ar' ? 'لا توجد وظائف' : 'No jobs found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredJobs.map((job) => (
                                    <tr key={job.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                                                    <Briefcase size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {job.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {job.type} • {job.salary_range}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${job.status === 'active' ? 'bg-green-100 text-green-700' :
                                                job.status === 'closed' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {job.status === 'active' ? (language === 'ar' ? 'نشطة' : 'Active') :
                                                    job.status === 'closed' ? (language === 'ar' ? 'مغلقة' : 'Closed') :
                                                        (language === 'ar' ? 'مسودة' : 'Draft')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={14} className="text-gray-400" />
                                                {job.location}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} className="text-gray-400" />
                                                {new Date(job.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => deleteJob(job.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title={language === 'ar' ? 'حذف' : 'Delete'}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

export default function AdminJobsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AdminJobsContent />
        </Suspense>
    );
}
