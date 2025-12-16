'use client';

// ============================================
// DentalHire - Lab Dashboard (Bilingual)
// ============================================

import Link from 'next/link';
import { useAuthStore, useJobStore } from '@/store';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardHeader, CardContent, Button, MatchScore } from '@/components/shared';
import {
    Search,
    Users,
    Heart,
    MessageSquare,
    ChevronRight,
    Eye,
    MapPin,
    Briefcase,
    Star,
    ArrowUpRight,
    Sparkles,
    FlaskConical
} from 'lucide-react';
import { CV } from '@/types';
import { useState, useEffect } from 'react';
import ReviewModal from '@/components/reviews/ReviewModal';
import RatingDisplay from '@/components/reviews/RatingDisplay';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LabDashboard() {
    const { user } = useAuthStore();
    const { language } = useLanguage();
    const [aiScores] = useState<Record<string, { score: number; reasoning: string }>>({});
    const [loadingScores, setLoadingScores] = useState<Record<string, boolean>>({});
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<{ id: string, name: string } | null>(null);

    // Translations specific for Labs
    const t = {
        welcomeBack: language === 'ar' ? 'مرحباً بعودتك،' : 'Welcome back,',
        findPerfect: language === 'ar' ? 'ابحث عن أفضل تقنيي الأسنان لمختبرك' : 'Find the perfect dental technicians for your lab',
        findCandidates: language === 'ar' ? 'البحث عن تقنيين' : 'Find Technicians',
        totalCandidates: language === 'ar' ? 'إجمالي التقنيين' : 'Total Technicians',
        savedProfiles: language === 'ar' ? 'الملفات المحفوظة' : 'Saved Profiles',
        profileViews: language === 'ar' ? 'مشاهدات الملف' : 'Profile Views',
        messages: language === 'ar' ? 'الرسائل' : 'Messages',
        thisWeek: language === 'ar' ? 'هذا الأسبوع' : 'this week',
        topMatches: language === 'ar' ? 'أفضل المطابقات' : 'Top Matches',
        candidatesFit: language === 'ar' ? 'التقنيون الأكثر ملاءمة لمتطلباتك' : 'Technicians that best fit your requirements',
        viewAll: language === 'ar' ? 'عرض الكل' : 'View All',
        jobSeeker: language === 'ar' ? 'باحث عن عمل' : 'Job Seeker',
        yearsExp: language === 'ar' ? '+ سنوات خبرة' : '+ years exp',
        rate: language === 'ar' ? 'تقييم' : 'Rate',
        view: language === 'ar' ? 'عرض' : 'View',
        aiScore: language === 'ar' ? 'تحليل AI' : 'AI Score',
        quickActions: language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions',
        searchCandidates: language === 'ar' ? 'البحث عن تقنيين' : 'Search Technicians',
        findPerfectHire: language === 'ar' ? 'ابحث عن التقني المثالي' : 'Find your perfect technician',
        savedCandidates: language === 'ar' ? 'المرشحون المحفوظون' : 'Saved Candidates',
        savedProfilesCount: language === 'ar' ? 'الملفات المحفوظة' : 'Saved profiles',
        unreadMessages: language === 'ar' ? 'الرسائل غير المقروءة' : 'Unread messages',
        hiringTip: language === 'ar' ? 'نصيحة توظيف' : 'Hiring Tip',
        completeProfile: language === 'ar' ? 'أكمل ملف مختبرك لجذب أفضل التقنيين. المختبرات الموثقة تحصل على طلبات أكثر.' : 'Complete your lab profile to attract top technicians. Verified labs get more applications.',
        completeProfileBtn: language === 'ar' ? '← أكمل الملف' : 'Complete Profile →',
        employee: language === 'ar' ? 'موظف' : 'Employee',
    };

    const handleRate = (cv: CV) => {
        setSelectedCandidate({ id: cv.id, name: cv.personalInfo.fullName });
        setIsReviewOpen(true);
    };

    const submitReview = (rating: number, comment: string) => {
        console.log('Submitting review:', { candidateId: selectedCandidate?.id, rating, comment });
        setIsReviewOpen(false);
        setSelectedCandidate(null);
    };

    const handleAnalyzeMatch = async (cv: CV) => {
        setLoadingScores(prev => ({ ...prev, [cv.id]: true }));
        setTimeout(() => {
            setLoadingScores(prev => ({ ...prev, [cv.id]: false }));
        }, 1000);
    };

    const [stats, setStats] = useState([
        { label: t.totalCandidates, value: '0', icon: <Users size={20} />, change: '-' },
        { label: t.savedProfiles, value: '0', icon: <Heart size={20} />, change: '-' },
        { label: t.profileViews, value: '0', icon: <Eye size={20} />, change: '-' },
        { label: t.messages, value: '0', icon: <MessageSquare size={20} />, change: '-' },
    ]);
    const [topCandidates, setTopCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { loadFavorites, favorites } = useJobStore();

    useEffect(() => {
        const fetchDashboardData = async () => {
            const supabase = getSupabaseClient();
            if (!user) return;

            try {
                setLoading(true);

                // 1. Fetch Stats
                // @ts-ignore
                const { data: statsData, error: statsError } = await supabase
                    .rpc('get_dashboard_stats', {
                        p_user_id: user.id,
                        p_role: 'clinic' // Using clinic stats for now as schema is shared
                    });

                let totalCandidates = 0;
                let savedProfiles = 0;

                if (!statsError && statsData) {
                    totalCandidates = statsData.total_candidates || 0;
                    savedProfiles = statsData.saved_profiles || 0;
                }

                // 2. Fetch Top Candidates (Technicians ONLY)
                const { data: recentCVs } = await supabase
                    .from('cvs')
                    .select('*, users!inner(user_type)')
                    .eq('status', 'active')
                    .eq('users.user_type', 'dental_technician') // STRICT FILTER FOR LABS
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (recentCVs) {
                    const mapped = recentCVs.map((cv: any) => ({
                        id: cv.id,
                        personalInfo: {
                            fullName: cv.full_name,
                            photo: cv.photo,
                            city: cv.city,
                        },
                        experience: cv.experience || [],
                        rating: cv.rating || 0
                    }));
                    setTopCandidates(mapped);
                }

                setStats([
                    {
                        label: t.totalCandidates,
                        value: totalCandidates.toString(), // This might need a specific RPC for tech count, but general is fine for now
                        icon: <Users size={20} />,
                        change: language === 'ar' ? 'نشط' : 'Active'
                    },
                    {
                        label: t.savedProfiles,
                        value: savedProfiles.toString(),
                        icon: <Heart size={20} />,
                        change: language === 'ar' ? 'المفضلة' : 'Favorites'
                    },
                    {
                        label: t.profileViews,
                        value: '14',
                        icon: <Eye size={20} />,
                        change: '+2%'
                    },
                    {
                        label: t.messages,
                        value: '2',
                        icon: <MessageSquare size={20} />,
                        change: '+1'
                    },
                ]);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, favorites, language, t]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t.welcomeBack} {user?.profile.firstName}! 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t.findPerfect}
                    </p>
                </div>
                <Link href="/lab/search">
                    <Button leftIcon={<Search size={18} />}>
                        {t.findCandidates}
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} hover>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-base text-muted-foreground">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    {stat.change} {t.thisWeek}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Top Matches */}
                <Card className="lg:col-span-2">
                    <CardHeader
                        title={t.topMatches}
                        subtitle={t.candidatesFit}
                        action={
                            <Link href="/lab/search" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                {t.viewAll} <ChevronRight size={16} />
                            </Link>
                        }
                    />
                    <CardContent>
                        {topCandidates.length > 0 ? (
                            <div className="space-y-4">
                                {topCandidates.map((cv) => (
                                    <div key={cv.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:shadow-md transition-all cursor-pointer">
                                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                            {cv.personalInfo.photo ? (
                                                <img src={cv.personalInfo.photo} alt={cv.personalInfo.fullName} className="w-full h-full object-cover" />
                                            ) : (
                                                cv.personalInfo.fullName.split(' ').map((n: string) => n[0]).join('')
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                {cv.personalInfo.fullName}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                <FlaskConical size={14} /> {t.jobSeeker}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {cv.rating && <RatingDisplay rating={cv.rating} size="sm" showCount={false} />}
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={12} /> {cv.personalInfo.city}
                                                    </span>
                                                    <span>{cv.experience.length}{t.yearsExp}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRate(cv);
                                                    }}
                                                >
                                                    {t.rate}
                                                </Button>
                                                <Button variant="outline" size="sm">{t.view}</Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>{language === 'ar' ? 'لم يتم العثور على تقنيين نشطين حالياً' : 'No active technicians found currently'}</p>
                            </div>
                        )}

                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader title={t.quickActions} />
                        <CardContent>
                            <div className="space-y-3">
                                <Link href="/lab/search" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                        <Search size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">{t.searchCandidates}</p>
                                        <p className="text-xs text-gray-500">{t.findPerfectHire}</p>
                                    </div>
                                    <ArrowUpRight size={16} className="text-gray-400" />
                                </Link>
                                <Link href="/lab/favorites" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                                        <Heart size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">{t.savedCandidates}</p>
                                        <p className="text-xs text-gray-500">{t.savedProfilesCount}</p>
                                    </div>
                                    <ArrowUpRight size={16} className="text-gray-400" />
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hiring Tips */}
                    <Card variant="gradient">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                                <Star size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">{t.hiringTip}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    {t.completeProfile}
                                </p>
                                <Link href="/lab/profile">
                                    <Button variant="ghost" size="sm" className="mt-2 -ml-2">
                                        {t.completeProfileBtn}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            <ReviewModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                onSubmit={submitReview}
                targetName={selectedCandidate?.name || t.employee}
                isSubmitting={false}
            />
        </div>
    );
}
