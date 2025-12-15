import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Button } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { Briefcase, Eye, DollarSign, MapPin, CheckCircle2, Award } from 'lucide-react';
import { useAuthStore } from '@/store';
import { getSupabaseClient } from '@/lib/supabase';

export default function AssistantDashboard() {
    const { language } = useLanguage();
    const { user } = useAuthStore();

    const [nearbyJobs, setNearbyJobs] = useState<{ id: string; title: string; clinic: string; dist: string; salary: string }[]>([]);
    const [statsData, setStatsData] = useState({
        nearby_jobs: 0,
        avg_salary: 0,
        profile_views: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatsAndJobs = async () => {
            if (!user) return;
            const supabase = getSupabaseClient();
            try {
                // 1. Fetch Stats
                // @ts-ignore
                const { data: stats, error: statsError } = await supabase
                    .rpc('get_dashboard_stats', {
                        p_user_id: user.id,
                        p_role: 'job_seeker'
                    });

                if (stats && !statsError) {
                    setStatsData({
                        nearby_jobs: stats.nearby_jobs || 0,
                        avg_salary: stats.avg_salary || 0,
                        profile_views: stats.profile_views || 0
                    });
                }

                // 2. Fetch Nearby Jobs List
                // Get user city first
                const { data: userData } = await supabase
                    .from('cvs')
                    .select('city')
                    .eq('user_id', user.id)
                    .single();

                const userCity = userData?.city || '';

                if (userCity) {
                    const { data: jobs } = await supabase
                        .from('jobs')
                        .select('id, title, salary_min, salary_max, location, clinics(name)')
                        .eq('status', 'active')
                        .ilike('location', `%${userCity}%`)
                        .order('created_at', { ascending: false })
                        .limit(3);

                    if (jobs) {
                        const mappedJobs = jobs.map((job: any) => ({
                            id: job.id,
                            title: job.title,
                            clinic: job.clinics?.name || 'Unknown Clinic',
                            dist: userCity, // Since we matched city, it's local
                            salary: `${job.salary_min}-${job.salary_max}`
                        }));
                        setNearbyJobs(mappedJobs);
                    }
                }

            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatsAndJobs();
    }, [user]);

    // ... stats definition ...

    // ... return ...

    const stats = [
        {
            label: language === 'ar' ? 'الوظائف القريبة' : 'Nearby Jobs',
            value: loading ? '-' : statsData.nearby_jobs.toString(),
            icon: <MapPin size={20} />,
            change: language === 'ar' ? 'نطاق مدينتك' : 'Your City'
        },
        {
            label: language === 'ar' ? 'الراتب المتوقع' : 'Est. Salary',
            value: loading ? '-' : (statsData.avg_salary > 0
                ? `${statsData.avg_salary.toLocaleString()} ${language === 'ar' ? 'د.ع' : 'IQD'}`
                : (language === 'ar' ? 'غير متوفر' : 'N/A')),
            icon: <DollarSign size={20} />,
            change: 'Monthly'
        },
        {
            label: language === 'ar' ? 'مشاهدات العيادات' : 'Clinic Views',
            value: loading ? '-' : statsData.profile_views.toString(),
            icon: <Eye size={20} />,
            change: language === 'ar' ? 'آخر 30 يوم' : 'Last 30 days'
        },
        {
            label: language === 'ar' ? 'جاهزية الملف' : 'Profile Ready',
            value: '85%', // Keep static or implement separate logic
            icon: <Award size={20} />,
            change: 'High'
        },
    ];



    const skillsChecklist = [
        { skill: language === 'ar' ? 'التعقيم ومكافحة العدوى' : 'Sterilization & Infection Control', status: true },
        { skill: language === 'ar' ? 'تحضير المواد السنية' : 'Mixing Dental Materials', status: true },
        { skill: language === 'ar' ? 'أخذ الأشعة السينية' : 'Taking X-rays', status: false },
        { skill: language === 'ar' ? 'برامج إدارة العيادات' : 'Practice Management Software', status: false },
    ];

    return (
        <div className="space-y-6">
            {/* Assistant Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} hover>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-base text-gray-600 dark:text-gray-300">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                                    {stat.change}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Nearby Jobs Widget */}
                <Card className="lg:col-span-2">
                    <CardHeader
                        title={language === 'ar' ? 'وظائف قريبة منك' : 'Jobs Near You'}
                    // icon and action removed to fix type error, will re-add if supported or refactor
                    />
                    <CardContent>
                        <div className="space-y-3">
                            {nearbyJobs.length > 0 ? (
                                nearbyJobs.map((job, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm">
                                                <Briefcase size={16} className="text-teal-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">{job.title}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-300">{job.clinic} • <span className="text-teal-600 dark:text-teal-400 font-medium">{job.dist}</span></p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{job.salary}</div>
                                            <Button size="sm" variant="ghost" className="h-6 p-0 text-xs">{language === 'ar' ? 'تفاصيل' : 'Details'}</Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <MapPin className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                    <p className="text-gray-500 dark:text-gray-300">{language === 'ar' ? 'لا توجد وظائف قريبة حالياً' : 'No jobs found nearby'}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Skills Checklist Widget */}
                <Card variant="gradient">
                    <CardHeader
                        title={language === 'ar' ? 'قائمة المهارات المطلوبة' : 'Top Skills Checklist'}
                    // icon={<Zap className="text-yellow-400" size={20} />} // Removed for type safety
                    />
                    <CardContent>
                        <div className="space-y-3">
                            <p className="text-xs text-white/90 mb-2">
                                {language === 'ar' ? 'المهارات الأكثر طلباً في سوق العمل:' : 'Skills most requested by clinics:'}
                            </p>
                            {skillsChecklist.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-white">
                                    {item.status ? (
                                        <CheckCircle2 size={18} className="text-green-300" />
                                    ) : (
                                        <div className="w-[18px] h-[18px] rounded-full border-2 border-white/30" />
                                    )}
                                    <span className={`text-sm ${item.status ? '' : 'opacity-70'}`}>{item.skill}</span>
                                </div>
                            ))}
                            <Button className="w-full mt-2 bg-white/20 hover:bg-white/30 text-white border-0" size="sm">
                                {language === 'ar' ? 'تحديث المهارات' : 'Update My Skills'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
