'use client';

// ============================================
// DentalHire - Admin Dashboard
// ============================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, Button } from '@/components/shared';
// import { mockAnalytics } from '@/data/mockData';
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
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import MobileStatsCarousel from '@/components/dashboard/widgets/MobileStatsCarousel';
import MobileUserListItem from '@/components/dashboard/widgets/MobileUserListItem';

export default function AdminDashboard() {
    const { t } = useLanguage();
    const router = useRouter();

    const [statsData, setStatsData] = useState({
        totalUsers: 0,
        totalJobSeekers: 0,
        totalClinics: 0,
        totalCVs: 0,
    });
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const supabase = getSupabaseClient();

                // Fetch counts
                const [
                    { count: totalUsers },
                    { count: totalJobSeekers },
                    { count: totalClinics },
                    { count: totalCVs }
                ] = await Promise.all([
                    supabase.from('users').select('*', { count: 'exact', head: true }),
                    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'job_seeker'),
                    supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['clinic', 'company', 'lab']),
                    supabase.from('job_seeker_profiles').select('*', { count: 'exact', head: true }) // active CVs assumption
                ]);

                setStatsData({
                    totalUsers: totalUsers || 0,
                    totalJobSeekers: totalJobSeekers || 0,
                    totalClinics: totalClinics || 0,
                    totalCVs: totalCVs || 0,
                });

                // Fetch recent users
                const { data: usersData } = await supabase
                    .from('users')
                    .select('id, first_name, last_name, email, role, user_type, created_at, phone_verified')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (usersData) {
                    setRecentUsers(usersData.map(u => ({
                        id: u.id,
                        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'No Name',
                        email: u.email,
                        type: u.user_type === 'clinic' ? 'Clinic' :
                            u.user_type === 'dentist' ? 'Dentist' :
                                u.user_type === 'dental_assistant' ? 'Assistant' :
                                    u.role === 'clinic' ? 'Employer' : 'Job Seeker',
                        status: u.phone_verified ? 'active' : 'pending', // using phone_verified as proxy for active status for now
                        date: new Date(u.created_at).toLocaleDateString()
                    })));
                }

            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const stats: {
        label: string;
        value: string;
        icon: React.ReactNode;
        change: string;
        changeType: 'positive' | 'negative';
        color: string;
    }[] = [
            {
                label: t('admin.stats.users'),
                value: isLoading ? '-' : statsData.totalUsers.toLocaleString(),
                icon: <Users size={24} />,
                change: '+',
                changeType: 'positive',
                color: 'blue',
            },
            {
                label: t('admin.stats.jobseekers'),
                value: isLoading ? '-' : statsData.totalJobSeekers.toLocaleString(),
                icon: <Briefcase size={24} />,
                change: '+',
                changeType: 'positive',
                color: 'green',
            },
            {
                label: t('admin.stats.clinics'),
                value: isLoading ? '-' : statsData.totalClinics.toLocaleString(),
                icon: <Building2 size={24} />,
                change: '+',
                changeType: 'positive',
                color: 'purple',
            },
            {
                label: t('admin.stats.activecvs'),
                value: isLoading ? '-' : statsData.totalCVs.toLocaleString(),
                icon: <FileText size={24} />,
                change: '+',
                changeType: 'positive',
                color: 'teal',
            },
        ];

    // Pending approvals will come from database
    const pendingApprovals: { id: string; name: string; type: string; date: string }[] = [];

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
                    <Button variant="outline">{t('admin.export')}</Button>
                    <Button onClick={() => router.push('/admin/users')}>{t('admin.adduser')}</Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} hover>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stat.value}
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

            {/* Mobile Stats Carousel */}
            <div className="md:hidden">
                <MobileStatsCarousel stats={stats} />
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
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
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
                                    {recentUsers.map((user) => (
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
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.type === 'Clinic'
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
                                                    {user.status}
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

                        {/* Mobile List View */}
                        <div className="md:hidden space-y-3">
                            {recentUsers.map((user) => (
                                <MobileUserListItem key={user.id} user={user} />
                            ))}
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
                            {pendingApprovals.map((item) => (
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
                                        <button className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg" title="Approve">
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
                            {t('admin.viewallpending')} ({pendingApprovals.length + 5})
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats Row */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100">{t('admin.matches')}</p>
                            <p className="text-3xl font-bold mt-1">{isLoading ? '-' : '0'}</p>
                        </div>
                        <TrendingUp size={40} className="text-blue-300" />
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100">{t('admin.activejobseekers')}</p>
                            <p className="text-3xl font-bold mt-1">{isLoading ? '-' : statsData.totalJobSeekers.toLocaleString()}</p>
                        </div>
                        <UserCheck size={40} className="text-green-300" />
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100">{t('admin.newusers')}</p>
                            <p className="text-3xl font-bold mt-1">{isLoading ? '-' : recentUsers.length}<span className="text-sm font-normal ml-1">/ {t('admin.thisweek')}</span></p>
                        </div>
                        <UserPlus size={40} className="text-purple-300" />
                    </div>
                </Card>
            </div>
        </div>
    );
}
