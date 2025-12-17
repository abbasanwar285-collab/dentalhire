'use client';

// ============================================
// DentalHire - Admin Dashboard (Real Data)
// ============================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, Button } from '@/components/shared';
import { getSupabaseClient } from '@/lib/supabase';
import {
    Users,
    Briefcase,
    Building2,
    FileText,
    TrendingUp,
    TrendingDown,
    UserCheck,
    UserPlus,
    CheckCircle,
    XCircle,
    Clock,
    MoreVertical,
    RefreshCw
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatRelativeTime } from '@/lib/utils';

interface DashboardStats {
    totalUsers: number;
    totalJobSeekers: number;
    totalClinics: number;
    totalCVs: number;
    activeJobs: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    pendingVerifications: number;
}

interface RecentUser {
    id: string;
    name: string;
    email: string;
    type: string;
    status: string;
    date: string;
}

interface PendingApproval {
    id: string;
    name: string;
    type: string;
    date: string;
}

export default function AdminDashboard() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const supabase = getSupabaseClient();

    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalJobSeekers: 0,
        totalClinics: 0,
        totalCVs: 0,
        activeJobs: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0,
        pendingVerifications: 0
    });
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // Get date ranges
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Fetch all stats in parallel
            const [
                usersResult,
                jobSeekersResult,
                clinicsResult,
                cvsResult,
                jobsResult,
                newUsersWeekResult,
                newUsersMonthResult,
                pendingResult,
                recentUsersResult
            ] = await Promise.all([
                // Total users
                supabase.from('users').select('id', { count: 'exact', head: true }),
                // Job seekers
                supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'job_seeker'),
                // Clinics/Companies/Labs
                supabase.from('clinics').select('id', { count: 'exact', head: true }),
                // CVs
                supabase.from('cvs').select('id', { count: 'exact', head: true }),
                // Active Jobs
                supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
                // New users this week
                supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
                // New users this month
                supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
                // Pending verifications
                supabase.from('users').select('id', { count: 'exact', head: true }).eq('verified', false),
                // Recent 5 users
                supabase.from('users')
                    .select('id, email, first_name, last_name, role, user_type, verified, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5)
            ]);

            setStats({
                totalUsers: usersResult.count || 0,
                totalJobSeekers: jobSeekersResult.count || 0,
                totalClinics: clinicsResult.count || 0,
                totalCVs: cvsResult.count || 0,
                activeJobs: jobsResult.count || 0,
                newUsersThisWeek: newUsersWeekResult.count || 0,
                newUsersThisMonth: newUsersMonthResult.count || 0,
                pendingVerifications: pendingResult.count || 0
            });

            // Format recent users
            if (recentUsersResult.data) {
                setRecentUsers(recentUsersResult.data.map(user => ({
                    id: user.id,
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Unknown',
                    email: user.email || '',
                    type: getUserTypeLabel(user.role, user.user_type),
                    status: user.verified ? 'active' : 'pending',
                    date: formatRelativeTime(user.created_at)
                })));
            }

            // Fetch pending approvals (unverified users)
            const { data: pendingData } = await supabase
                .from('users')
                .select('id, email, first_name, last_name, role, user_type, created_at')
                .eq('verified', false)
                .order('created_at', { ascending: false })
                .limit(5);

            if (pendingData) {
                setPendingApprovals(pendingData.map(user => ({
                    id: user.id,
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Unknown',
                    type: getUserTypeLabel(user.role, user.user_type),
                    date: formatRelativeTime(user.created_at)
                })));
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getUserTypeLabel = (role: string, userType: string): string => {
        const types: Record<string, { en: string; ar: string }> = {
            clinic: { en: 'Clinic', ar: 'عيادة' },
            company: { en: 'Company', ar: 'شركة' },
            lab: { en: 'Lab', ar: 'مختبر' },
            dentist: { en: 'Dentist', ar: 'طبيب أسنان' },
            dental_assistant: { en: 'Assistant', ar: 'مساعد' },
            sales_rep: { en: 'Sales Rep', ar: 'مندوب مبيعات' },
            secretary: { en: 'Secretary', ar: 'سكرتير' },
            media: { en: 'Media', ar: 'إعلام' },
            dental_technician: { en: 'Technician', ar: 'فني' },
            job_seeker: { en: 'Job Seeker', ar: 'باحث عن عمل' },
            admin: { en: 'Admin', ar: 'مدير' }
        };

        const key = role === 'clinic' ? userType : role;
        return language === 'ar' ? types[key]?.ar || key : types[key]?.en || key;
    };

    const handleApproveUser = async (userId: string) => {
        try {
            await supabase.from('users').update({ verified: true }).eq('id', userId);
            fetchDashboardData(); // Refresh data
        } catch (error) {
            console.error('Error approving user:', error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const statsDisplay = [
        {
            label: t('admin.stats.users'),
            value: stats.totalUsers.toLocaleString(),
            icon: <Users size={24} />,
            change: `+${stats.newUsersThisMonth}`,
            changeType: 'positive',
            color: 'blue',
        },
        {
            label: t('admin.stats.jobseekers'),
            value: stats.totalJobSeekers.toLocaleString(),
            icon: <Briefcase size={24} />,
            change: `-`,
            changeType: 'positive',
            color: 'green',
        },
        {
            label: t('admin.stats.clinics'),
            value: stats.totalClinics.toLocaleString(),
            icon: <Building2 size={24} />,
            change: `-`,
            changeType: 'positive',
            color: 'purple',
        },
        {
            label: t('admin.stats.activecvs'),
            value: stats.totalCVs.toLocaleString(),
            icon: <FileText size={24} />,
            change: `-`,
            changeType: 'positive',
            color: 'teal',
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('admin.dashboard')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {t('admin.subtitle')}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchDashboardData}
                        disabled={isLoading}
                    >
                        <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        {language === 'ar' ? 'تحديث' : 'Refresh'}
                    </Button>
                    <Button onClick={() => router.push('/admin/users')}>{t('admin.adduser')}</Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsDisplay.map((stat, index) => (
                    <Card key={index} hover>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {isLoading ? '...' : stat.value}
                                </p>
                                <div className={`flex items-center gap-1 mt-2 text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {stat.changeType === 'positive' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    {stat.change} {t('admin.thismonth')}
                                </div>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${stat.color}-100 text-${stat.color}-600 dark:bg-${stat.color}-900/30 dark:text-${stat.color}-400`}>
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Users */}
                <Card className="lg:col-span-2">
                    <CardHeader
                        title={t('admin.recentusers')}
                        subtitle={t('admin.recentusers.subtitle')}
                        action={
                            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/users')}>
                                {t('admin.viewall')}
                            </Button>
                        }
                    />
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                        <th className="pb-3 font-medium">{t('admin.table.user')}</th>
                                        <th className="pb-3 font-medium">{t('admin.table.type')}</th>
                                        <th className="pb-3 font-medium">{t('admin.table.status')}</th>
                                        <th className="pb-3 font-medium">{t('admin.table.registered')}</th>
                                        <th className="pb-3 font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-500">
                                                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                                            </td>
                                        </tr>
                                    ) : recentUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-500">
                                                {language === 'ar' ? 'لا يوجد مستخدمين' : 'No users yet'}
                                            </td>
                                        </tr>
                                    ) : recentUsers.map((user) => (
                                        <tr key={user.id} className="border-b border-gray-5 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.type === 'Clinic' || user.type === 'عيادة'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {user.type}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span className={`flex items-center gap-1 text-sm ${user.status === 'active' ? 'text-green-600' : 'text-amber-600'
                                                    }`}>
                                                    {user.status === 'active' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                    {user.status === 'active'
                                                        ? (language === 'ar' ? 'مفعل' : 'Active')
                                                        : (language === 'ar' ? 'معلق' : 'Pending')
                                                    }
                                                </span>
                                            </td>
                                            <td className="py-3 text-sm text-gray-500">{user.date}</td>
                                            <td className="py-3">
                                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="More options">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Approvals */}
                <Card>
                    <CardHeader
                        title={t('admin.pending')}
                        subtitle={t('admin.pending.subtitle')}
                    />
                    <CardContent>
                        <div className="space-y-4">
                            {isLoading ? (
                                <p className="text-center py-4 text-gray-500">
                                    {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                                </p>
                            ) : pendingApprovals.length === 0 ? (
                                <p className="text-center py-4 text-gray-500">
                                    {language === 'ar' ? 'لا توجد طلبات معلقة' : 'No pending approvals'}
                                </p>
                            ) : pendingApprovals.map((item) => (
                                <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                        <Clock size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{item.type}</p>
                                        <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleApproveUser(item.id)}
                                            className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg"
                                            title="Approve"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                        <button className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg" title="Reject">
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/admin/users?verified=unverified')}>
                            {t('admin.viewallpending')} ({stats.pendingVerifications})
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats Row */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100">{language === 'ar' ? 'الوظائف النشطة' : 'Active Jobs'}</p>
                            <p className="text-3xl font-bold mt-1">{isLoading ? '...' : stats.activeJobs}</p>
                        </div>
                        <TrendingUp size={40} className="text-blue-300" />
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100">{t('admin.activejobseekers')}</p>
                            <p className="text-3xl font-bold mt-1">{isLoading ? '...' : stats.totalJobSeekers}</p>
                        </div>
                        <UserCheck size={40} className="text-green-300" />
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100">{t('admin.newusers')}</p>
                            <p className="text-3xl font-bold mt-1">{isLoading ? '...' : stats.newUsersThisWeek}</p>
                        </div>
                        <UserPlus size={40} className="text-purple-300" />
                    </div>
                </Card>
            </div>
        </div>
    );
}
