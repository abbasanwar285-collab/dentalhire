'use client';

import { useEffect, useState } from 'react';
import { useJobStore, useAuthStore } from '@/store';
import { Button, Card, CVDetailsModal, MatchScore, SkillBadge } from '@/components/shared';
import {
    Heart,
    Search,
    MapPin,
    Briefcase,
    DollarSign,
    User
} from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { dentalSkills, dentalSkillsAr } from '@/data/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { Database } from '@/types/database';

type CVRow = Database['public']['Tables']['cvs']['Row'];

export default function ClinicFavoritesPage() {
    const { favorites, toggleFavorite, loadFavorites } = useJobStore();
    const { user } = useAuthStore();
    const [savedCVs, setSavedCVs] = useState<any[]>([]);
    const [selectedCV, setSelectedCV] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { t, language } = useLanguage();

    const supabase = getSupabaseClient();

    // Load favorites IDs if not loaded
    useEffect(() => {
        if (user?.id) {
            loadFavorites(user.id);
        }
    }, [user?.id, loadFavorites]);

    // Fetch CV details when favorites change
    useEffect(() => {
        const fetchSavedCVs = async () => {
            if (favorites.length === 0) {
                setSavedCVs([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('cvs')
                    .select('*, users(user_type)')
                    .in('id', favorites);

                if (data) {
                    // Type assertion to ensure TypeScript knows cv is an object
                    const typedData = data as unknown as CVRow[];
                    const mappedCVs = typedData.map(cv => ({
                        ...cv,
                        personalInfo: {
                            fullName: cv.full_name,
                            city: cv.city,
                            photo: cv.photo,
                        },
                        salary: {
                            expected: cv.salary_expected
                        },
                        experience: cv.experience || [],
                        skills: cv.skills || [],
                        availability: {
                            type: cv.availability_type || 'full_time'
                        }
                    }));
                    setSavedCVs(mappedCVs);
                }
            } catch (err) {
                console.error('Error fetching favorites:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSavedCVs();
    }, [favorites]);

    const handleRemoveFavorite = async (e: React.MouseEvent, cvId: string) => {
        e.stopPropagation();
        if (!user?.id) return;

        // Optimistic UI update handled in store, but we can also update local list slightly later or rely on rerender
        await toggleFavorite(user.id, cvId);
    };

    const t_loc = {
        ar: {
            title: 'المرشحين المحفوظين',
            subtitle: 'إدارة قائمة المرشحين المختصرة',
            emptyTitle: 'لا يوجد مرشحين محفوظين بعد',
            emptyDesc: 'ابدأ البحث عن مرشحين وقم بحفظهم هنا للمراجعة لاحقاً.',
            findCandidates: 'البحث عن مرشحين',
            unknown: 'مرشح غير معروف',
            remove: 'إزالة من المحفوظات'
        },
        en: {
            title: 'Saved Candidates',
            subtitle: 'Manage your shortlisted candidates',
            emptyTitle: 'No saved candidates yet',
            emptyDesc: 'Start searching for candidates and save them here to review later.',
            findCandidates: 'Find Candidates',
            unknown: 'Unknown Candidate',
            remove: 'Remove from favorites'
        }
    };

    const text = t_loc[language as keyof typeof t_loc] || t_loc.en;
    const searchLink = user?.userType && ['lab', 'company'].includes(user.userType)
        ? `/${user.userType}/search`
        : '/clinic/search';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{text.title}</h1>
                <p className="text-gray-500 dark:text-gray-200 mt-1">
                    {text.subtitle} ({favorites.length})
                </p>
            </div>

            {savedCVs.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <Heart size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{text.emptyTitle}</h3>
                    <p className="text-gray-500 dark:text-gray-200 max-w-sm mx-auto mb-6">
                        {text.emptyDesc}
                    </p>
                    <Link href={searchLink}>
                        <Button leftIcon={<Search size={18} />}>
                            {text.findCandidates}
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedCVs.map((cv) => (
                        <Card
                            key={cv.id}
                            hover
                            onClick={() => setSelectedCV(cv)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                                    {cv.personalInfo?.photo ? (
                                        <img src={cv.personalInfo.photo} alt={cv.personalInfo.fullName} className="w-full h-full object-cover" />
                                    ) : (
                                        (cv.personalInfo?.fullName || 'C').substring(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <button
                                        onClick={(e) => handleRemoveFavorite(e, cv.id)}
                                        className="p-1.5 rounded-full transition-colors text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-gray-100 dark:hover:bg-gray-800 z-10 relative"
                                        title={text.remove}
                                    >
                                        <Heart size={18} fill="currentColor" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {cv.personalInfo?.fullName || text.unknown}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-200 truncate">
                                {cv.experience?.[0]?.title || 'Dental Professional'}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-200 flex-wrap mt-3">
                                <span className="flex items-center gap-1">
                                    <MapPin size={14} /> {cv.personalInfo.city || 'Iraq'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <DollarSign size={14} /> {(cv.salary.expected / 1000).toFixed(0)} ألف د.ع
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-3 h-12 overflow-hidden">
                                {cv.skills?.slice(0, 3).map((skill: string) => (
                                    <SkillBadge key={skill} skill={skill} size="sm" />
                                ))}
                                {cv.skills?.length > 3 && (
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs rounded-full">
                                        +{cv.skills.length - 3}
                                    </span>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <CVDetailsModal
                isOpen={!!selectedCV}
                onClose={() => setSelectedCV(null)}
                cv={selectedCV}
            />
        </div>
    );
}
