'use client';

// ============================================
// DentalHire - Clinic Search Page (Bilingual)
// ============================================

import { useState, useMemo, useDeferredValue, useEffect } from 'react';
import { useSearchStore, useAuthStore, useJobStore } from '@/store';
import { dentalSkills, dentalSkillsAr } from '@/data/mockData';
import { iraqLocations } from '@/data/iraq_locations';
import { Card, Button, Input, MatchScore, SkillBadge, RangeSlider, CVDetailsModal, useToast } from '@/components/shared';
import {
    Search,
    Grid3X3,
    List,
    MessageSquare,
    MapPin,
    DollarSign,
    X,
    SlidersHorizontal,
    Map as MapIcon,
    Briefcase,
    Building2,
    User,
    Stethoscope,
    Heart,
    CheckCircle,
    Award,
    FileText
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { getSupabaseClient } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

// Dynamic import for LeafletMap
const LeafletMap = dynamic(
    () => import('@/components/shared/LeafletMap'),
    { ssr: false, loading: () => <div className="h-[400px] w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" /> }
);

export default function ClinicSearchPage() {
    const supabase = getSupabaseClient();
    const { filters, setFilter, clearFilters, results, setResults, viewMode, setViewMode } = useSearchStore();
    const [showFilters, setShowFilters] = useState(true);

    // Mobile check to collapse filters by default
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setShowFilters(false);
        }
    }, []);
    const [selectedCV, setSelectedCV] = useState<string | null>(null);
    const [cvViewMode, setCvViewMode] = useState<'profile' | 'cv'>('profile');
    const [mapView, setMapView] = useState(false);
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);

    // Auth & Job Store for Favorites
    const { user } = useAuthStore();
    const { favorites, toggleFavorite, loadFavorites } = useJobStore();
    const { addToast } = useToast();

    // Load favorites on mount
    useEffect(() => {
        if (user) loadFavorites(user.id);
    }, [user, loadFavorites]);

    const handleToggleFavorite = async (e: React.MouseEvent, cvId: string) => {
        e.stopPropagation(); // Prevent card click
        if (!user?.id) return;

        await toggleFavorite(user.id, cvId);
    };

    // Location State
    const [selectedGov, setSelectedGov] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');
    const [area, setArea] = useState<string>('');
    const [cvRequests, setCvRequests] = useState<Record<string, string>>({}); // candidateId -> status
    const [requestingIds, setRequestingIds] = useState<Set<string>>(new Set());

    // Fetch CV Requests
    useEffect(() => {
        const fetchRequests = async () => {
            if (!user) return;
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('cv_access_requests')
                .select('job_seeker_id, status')
                .eq('employer_id', user.id);

            if (data) {
                const requestsMap: Record<string, string> = {};
                data.forEach((r: any) => {
                    requestsMap[r.job_seeker_id] = r.status;
                });
                setCvRequests(requestsMap);
            }
        };

        fetchRequests();
    }, [user]);

    const handleRequestCV = async (e: React.MouseEvent, cvId: string, candidateId: string) => {
        e.stopPropagation();
        if (!user) return;

        setRequestingIds(prev => new Set(prev).add(candidateId));

        try {
            const supabase = getSupabaseClient();
            // @ts-ignore
            const { error } = await supabase.rpc('request_cv_access', {
                p_employer_id: user.id,
                p_job_seeker_id: candidateId
            });

            if (error) throw error;

            setCvRequests(prev => ({ ...prev, [candidateId]: 'pending' }));
            addToast(language === 'ar' ? 'تم إرسال الطلب بنجاح' : 'Request sent successfully', 'success');
        } catch (error) {
            console.error(error);
            addToast(language === 'ar' ? 'حدث خطأ في طلب السيرة الذاتية' : 'Error requesting CV', 'error');
        } finally {
            setRequestingIds(prev => {
                const next = new Set(prev);
                next.delete(candidateId);
                return next;
            });
        }
    };


    // Fetch CVs with server-side filtering
    useEffect(() => {
        const fetchCVs = async () => {
            setIsLoading(true);
            try {
                let query = supabase
                    .from('cvs')
                    .select('*, users!inner(user_type, verified)'); // Inner join to filter by user_type

                // 1. Role Filter (Server-side)
                if (filters.role) {
                    query = query.eq('users.user_type', filters.role);
                }

                // 2. Location Filter (Server-side ILIKE)
                if (filters.location) {
                    // Search in city OR preferred locations
                    // Note: This simple OR check might need an RPC for complex array searching, 
                    // but for now we'll check the 'city' column which is the primary indexed location.
                    // For array searching 'location_preferred', we'd need: .contains('location_preferred', [filters.location])
                    // But standard text search is often better.
                    query = query.ilike('city', `%${filters.location}%`);
                }

                // 3. Experience Filter (Server-side)
                // Note: 'experience' is a JSONB column. Exact querying depends on structure.
                // For 'Min Years', it's hard to do in SQL without a generated column or RPC.
                // We will keep Experience filtering CLIENT-SIDE for now as it requires parsing JSON array length.

                // 4. Salary Filter (Server-side)
                if (filters.salaryMin !== undefined) {
                    query = query.gte('salary_expected', filters.salaryMin);
                }
                if (filters.salaryMax !== undefined) {
                    query = query.lte('salary_expected', filters.salaryMax);
                }

                // 5. Employment Type (Server-side)
                if (filters.employmentType && filters.employmentType.length > 0) {
                    // availability_type is string text
                    query = query.in('availability_type', filters.employmentType);
                }

                const { data, error } = await query;

                if (error) {
                    console.error('Error fetching CVs:', error);
                    addToast('Error fetching candidates', 'error');
                }

                if (data) {
                    // Map results
                    let mappedResults = data.map((cv: any) => ({
                        cv: {
                            id: cv.id,
                            userId: cv.user_id,
                            userType: cv.users?.user_type,
                            personalInfo: {
                                fullName: cv.full_name,
                                email: cv.email,
                                verified: cv.users?.verified,
                                phone: cv.phone,
                                city: cv.city,
                                bio: cv.bio,
                                photo: cv.photo,
                            },
                            experience: cv.experience || [],
                            skills: cv.skills || [],
                            certifications: cv.certifications || [],
                            languages: cv.languages || [],
                            salary: {
                                expected: cv.salary_expected,
                                currency: cv.salary_currency,
                                negotiable: cv.salary_negotiable,
                            },
                            location: {
                                preferred: cv.location_preferred || [],
                                willingToRelocate: cv.willing_to_relocate,
                                remoteWork: cv.remote_work,
                            },
                            availability: {
                                type: cv.availability_type,
                                startDate: cv.availability_start_date,
                                schedule: cv.availability_schedule,
                            },
                            documents: cv.documents || [],
                            status: cv.status,
                            createdAt: cv.created_at,
                            updatedAt: cv.updated_at,
                        },
                        score: cv.matchScore || Math.floor(Math.random() * 30) + 70,
                        matchDetails: {
                            location: 0,
                            salary: 0,
                            experience: 0,
                            skills: 0,
                            availability: 0
                        },
                        breakdown: {
                            location: 0,
                            salary: 0,
                            experience: 0,
                            skills: 0,
                            availability: 0
                        }
                    }));

                    // --- Client-side Refinement (where Server-side is limited) ---

                    // Filter by Text Query (Name, Skills, Title)
                    if (filters.query) {
                        const q = filters.query.toLowerCase();
                        mappedResults = mappedResults.filter((m: any) =>
                            m.cv.personalInfo.fullName.toLowerCase().includes(q) ||
                            m.cv.skills.some((s: string) => s.toLowerCase().includes(q)) ||
                            m.cv.experience.some((e: any) => e.title.toLowerCase().includes(q))
                        );
                    }

                    // Filter by Experience (Calculated)
                    if (filters.experienceMin !== undefined) {
                        mappedResults = mappedResults.filter((m: any) => {
                            // Approximation: just array length or reuse the helper if imported
                            return (m.cv.experience?.length || 0) >= filters.experienceMin!;
                        });
                    }

                    // Filter by Skills (Client side check for array overlap)
                    if (filters.skills && filters.skills.length > 0) {
                        mappedResults = mappedResults.filter((m: any) =>
                            filters.skills!.some(skill =>
                                m.cv.skills.some((s: string) => s.toLowerCase().includes(skill.toLowerCase()))
                            )
                        );
                    }

                    setResults(mappedResults);
                } else {
                    setResults([]);
                }
            } catch (error) {
                console.error('Error in fetchCVs:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce fetching if needed, but for now we fetch on filter change
        const timeoutId = setTimeout(() => {
            fetchCVs();
        }, 300); // Small debounce to prevent rapid firing on typing

        return () => clearTimeout(timeoutId);

    }, [filters, supabase, setResults, addToast]); // Re-run when filters change

    // Handle initial location parsing if needed (simple check)
    useEffect(() => {
        // If filters.location is cleared externally, reset local state
        if (!filters.location) {
            setSelectedGov('');
            setSelectedDistrict('');
            setArea('');
        }
    }, [filters.location]);

    // Update location filter when parts change
    const updateLocationFilter = (gov: string, dist: string, ar: string) => {
        // We set the most specific part as the location filter or a combination
        let locString = '';
        if (ar) locString = ar;
        else if (dist) locString = dist;
        else if (gov) locString = gov;

        setFilter('location', locString);
    };

    // Translations
    const t = {
        findCandidates: language === 'ar' ? 'البحث عن مرشحين' : 'Find Candidates',
        candidatesMatch: language === 'ar' ? 'مرشح يطابق معاييرك' : 'candidates match your criteria',
        filters: language === 'ar' ? 'تصفية' : 'Filters',
        clearAll: language === 'ar' ? 'مسح الكل' : 'Clear All',
        searchCandidates: language === 'ar' ? 'ابحث عن مرشحين...' : 'Search candidates...',
        location: language === 'ar' ? 'الموقع' : 'Location',
        governorate: language === 'ar' ? 'المحافظة' : 'Governorate',
        district: language === 'ar' ? 'القضاء' : 'District',
        area: language === 'ar' ? 'الحي / المنطقة' : 'Neighborhood / Area',
        select: language === 'ar' ? 'اختر...' : 'Select...',
        role: language === 'ar' ? 'المسمى الوظيفي' : 'Role',
        minimumExperience: language === 'ar' ? 'الحد الأدنى للخبرة' : 'Minimum Experience',
        any: language === 'ar' ? 'أقل من سنة' : 'Less than a year',
        anyRange: language === 'ar' ? 'أي نطاق' : 'Any Range',
        yearsPlus: language === 'ar' ? 'سنوات +' : 'years +',
        salaryRange: language === 'ar' ? 'نطاق الراتب' : 'Salary Range',
        min: language === 'ar' ? 'الحد الأدنى' : 'Min',
        max: language === 'ar' ? 'الحد الأقصى' : 'Max',
        skills: language === 'ar' ? 'المهارات' : 'Skills',
        employmentType: language === 'ar' ? 'نوع التوظيف' : 'Employment Type',
        fullTime: language === 'ar' ? 'دوام كامل' : 'Full Time',
        partTime: language === 'ar' ? 'دوام جزئي' : 'Part Time',
        contract: language === 'ar' ? 'عقد' : 'Contract',
        temporary: language === 'ar' ? 'مؤقت' : 'Temporary',
        noCandidatesFound: language === 'ar' ? 'لم يتم العثور على مرشحين' : 'No candidates found',
        tryAdjusting: language === 'ar' ? 'حاول تعديل الفلاتر أو معايير البحث' : 'Try adjusting your filters or search criteria',
        clearFilters: language === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset Filters',
        mapView: language === 'ar' ? 'عرض الخريطة' : 'Map View',
        listView: language === 'ar' ? 'عرض القائمة' : 'List View',
        viewProfile: language === 'ar' ? 'عرض الملف' : 'View Profile',
        message: language === 'ar' ? 'رسالة' : 'Message',
        viewFullProfile: language === 'ar' ? 'عرض الملف الكامل' : 'View Full Profile',
        save: language === 'ar' ? 'حفظ' : 'Save',
        saved: language === 'ar' ? 'محفوظ' : 'Saved',
        kmAway: language === 'ar' ? 'كم بعيد' : 'km away',
        dentalProfessional: language === 'ar' ? 'أخصائي أسنان' : 'Dental Professional',
        searching: language === 'ar' ? 'جارٍ البحث...' : 'Searching...',
        dentist: language === 'ar' ? 'طبيب أسنان' : 'Dentist',
        assistant: language === 'ar' ? 'مساعد طبيب' : 'Dental Assistant',
        secretary: language === 'ar' ? 'سكرتير' : 'Secretary',
        sales: language === 'ar' ? 'مندوب مبيعات' : 'Sales Representative',
        media: language === 'ar' ? 'وجه إعلاني' : 'Public Figure',
        technician: language === 'ar' ? 'فني أسنان' : 'Dental Technician',
    };

    const roles = [
        { id: 'dentist', label: t.dentist, icon: <Stethoscope size={18} /> },
        { id: 'dental_assistant', label: t.assistant, icon: <User size={18} /> },
        { id: 'secretary', label: t.secretary, icon: <Briefcase size={18} /> },
        { id: 'sales_rep', label: t.sales, icon: <DollarSign size={18} /> },
        { id: 'media', label: t.media, icon: <Building2 size={18} /> },
        { id: 'dental_technician', label: t.technician, icon: <Briefcase size={18} /> },
    ];

    const employmentTypeLabels: Record<string, string> = {
        full_time: t.fullTime,
        part_time: t.partTime,
        contract: t.contract,
        temporary: t.temporary,
    };

    // Default clinic location (Baghdad)
    const clinicLocation = { lat: 33.3128, lng: 44.3615 };

    // Derive available skills from actual candidates
    const availableSkills = useMemo(() => {
        const skillsSet = new Set<string>();
        results.forEach(m => {
            m.cv.skills?.forEach(s => {
                if (s && s.trim()) skillsSet.add(s.trim());
            });
        });
        return Array.from(skillsSet).sort();
    }, [results]);

    // Use deferred value for loading detection UI
    const deferredFilters = useDeferredValue(filters);
    const isSearching = filters !== deferredFilters;

    const filteredResults = results; // Results are now already filtered by the server/client logic above
    const selectedCandidate = selectedCV ? filteredResults.find(m => m.cv.id === selectedCV) : null;

    // Helper to format role label
    const getRoleLabel = (roleId?: string) => {
        if (!roleId) return t.dentalProfessional;
        const role = roles.find(r => r.id === roleId);
        return role ? role.label : roleId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getExperienceLabel = (experience: any[]) => {
        if (!experience || experience.length === 0) return language === 'ar' ? 'حديث التخرج' : 'Fresh Graduate';

        const totalMonths = experience.reduce((acc, exp) => {
            if (!exp.startDate) return acc;
            const start = new Date(exp.startDate);
            const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
            const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
            return acc + (months > 0 ? months : 0);
        }, 0);

        if (totalMonths < 12) return language === 'ar' ? 'أقل من سنة' : 'Less than 1 year';

        const years = Math.floor(totalMonths / 12);
        return language === 'ar'
            ? `${years} ${years > 2 && years < 11 ? 'سنوات' : 'سنة'} خبرة`
            : `${years} Year${years > 1 ? 's' : ''} Exp`;
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header with Search Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t.findCandidates}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {isLoading ? t.searching : (isSearching ? t.searching : `${filteredResults.length} ${t.candidatesMatch}`)}
                        </p>
                    </div>

                    <div className="flex-1 max-w-xl w-full">
                        <Input
                            placeholder={t.searchCandidates}
                            value={filters.query || ''}
                            onChange={(e) => setFilter('query', e.target.value)}
                            leftIcon={<Search size={18} />}
                            className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                            <button
                                aria-label="Grid View"
                                onClick={() => { setViewMode('grid'); setMapView(false); }}
                                className={`p-2 transition-colors ${!mapView && viewMode === 'grid' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                <Grid3X3 size={20} />
                            </button>
                            <button
                                aria-label="List View"
                                onClick={() => { setViewMode('list'); setMapView(false); }}
                                className={`p-2 transition-colors ${!mapView && viewMode === 'list' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                <List size={20} />
                            </button>
                        </div>

                        <Button
                            variant={mapView ? 'primary' : 'outline'}
                            leftIcon={<MapIcon size={18} />}
                            onClick={() => setMapView(!mapView)}
                        >
                            {mapView ? t.listView : t.mapView}
                        </Button>

                        <Button
                            variant={showFilters ? 'primary' : 'outline'}
                            leftIcon={<SlidersHorizontal size={18} />}
                            onClick={() => setShowFilters(!showFilters)}
                            className="md:hidden"
                        >
                            {t.filters}
                        </Button>
                    </div>
                </div>
            </div>

            {mapView ? (
                // Map View
                <div className="space-y-6">
                    <Card>
                        <div className="p-1">
                            <LeafletMap
                                center={clinicLocation}
                                zoom={11}
                                radius={filters.radius ? filters.radius * 1609.34 : 15000}
                                markers={filteredResults.map(m => ({
                                    id: m.cv.id,
                                    position: m.cv.location.coordinates || { lat: 0, lng: 0 },
                                    title: m.cv.personalInfo.fullName,
                                    content: (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className="font-semibold text-sm">{m.cv.personalInfo.fullName}</h4>
                                                {m.cv.personalInfo.verified && (
                                                    <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium border border-blue-100">
                                                        <CheckCircle size={10} />
                                                        {language === 'ar' ? 'موثق' : 'Verified'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {m.cv.experience[0]?.title || getRoleLabel((m.cv as any).userType)}
                                                {m.cv.certifications && m.cv.certifications.length > 0 && (
                                                    <span className="block text-[10px] text-gray-500 mt-0.5 line-clamp-1">
                                                        <Award size={10} className="inline-block mr-1 align-text-top" />
                                                        {m.cv.certifications.map(c => c.name).join(language === 'ar' ? '، ' : ', ')}
                                                    </span>
                                                )}
                                                {m.cv.experience && m.cv.experience.length > 0 && (
                                                    <span className="block text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                                                        {language === 'ar' ? 'عمل سابقاً في: ' : 'Previously at: '}
                                                        {m.cv.experience.map(e => e.company).join(language === 'ar' ? '، ' : ', ')}
                                                    </span>
                                                )}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <MatchScore score={m.score} size="sm" />
                                                <span className="text-xs font-medium">{(m.cv.salary.expected / 1000).toFixed(0)} ألف د.ع</span>
                                            </div>
                                            <Button size="sm" className="w-full h-7 text-xs" onClick={() => setSelectedCV(m.cv.id)}>
                                                {t.viewProfile}
                                            </Button>
                                        </div>
                                    )
                                })).filter(m => m.position.lat !== 0)}
                                height="600px"
                            />
                        </div>
                    </Card>

                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Filters Sidebar */}
                    {showFilters && (
                        <div className="w-full md:w-72 flex-shrink-0">
                            <Card className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <SlidersHorizontal size={18} />
                                        {t.filters}
                                    </h3>
                                    <button onClick={() => {
                                        clearFilters();
                                        setSelectedGov('');
                                        setSelectedDistrict('');
                                        setArea('');
                                    }} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                        {t.clearAll}
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Role Filter */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                                            {t.role}
                                        </label>
                                        <select
                                            aria-label={t.role}
                                            value={filters.role || ''}
                                            onChange={(e) => setFilter('role', e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-shadow appearance-none"
                                            style={{ backgroundImage: 'none' }}
                                        >
                                            <option value="" className="text-gray-500">{t.select}</option>
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id} className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <hr className="border-gray-100 dark:border-gray-700" />

                                    {/* Location Filter */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
                                            {t.location}
                                        </label>
                                        <div className="space-y-3">
                                            {/* Governorate */}
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">{t.governorate}</label>
                                                <select
                                                    aria-label={t.governorate}
                                                    value={selectedGov}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setSelectedGov(val);
                                                        setSelectedDistrict('');
                                                        setArea('');
                                                        updateLocationFilter(val, '', '');
                                                    }}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none"
                                                    style={{ backgroundImage: 'none' }}
                                                >
                                                    <option value="" className="text-gray-500">{t.select}</option>
                                                    {Object.keys(iraqLocations).map(gov => (
                                                        <option key={gov} value={gov} className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">
                                                            {language === 'ar' ? (iraqLocations as any)[gov].ar : gov}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* District */}
                                            {selectedGov && (
                                                <div className="animate-fade-in">
                                                    <label className="text-xs text-gray-500 mb-1 block">{t.district}</label>
                                                    <select
                                                        aria-label={t.district}
                                                        value={selectedDistrict}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setSelectedDistrict(val);
                                                            setArea('');
                                                            updateLocationFilter(selectedGov, val, '');
                                                        }}
                                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none"
                                                        style={{ backgroundImage: 'none' }}
                                                    >
                                                        <option value="" className="text-gray-500">{t.select}</option>
                                                        {(iraqLocations as any)[selectedGov]?.districts.map((d: any) => (
                                                            <option key={d.en} value={d.en} className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">
                                                                {language === 'ar' ? d.ar : d.en}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Area / Neighborhood */}
                                            {selectedDistrict && (
                                                <div className="animate-fade-in">
                                                    <label className="text-xs text-gray-500 mb-1 block">{t.area}</label>
                                                    <Input
                                                        placeholder={t.area}
                                                        value={area}
                                                        onChange={(e) => {
                                                            setArea(e.target.value);
                                                            updateLocationFilter(selectedGov, selectedDistrict, e.target.value);
                                                        }}
                                                        className="bg-gray-50 dark:bg-gray-800"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <hr className="border-gray-100 dark:border-gray-700" />

                                    {/* Experience Filter (Kept as is) */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                                            {t.minimumExperience}
                                        </label>
                                        <select
                                            aria-label={t.minimumExperience}
                                            value={filters.experienceMin || ''}
                                            onChange={(e) => setFilter('experienceMin', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                            <option value="">{t.any}</option>
                                            <option value="1">1 {t.yearsPlus}</option>
                                            <option value="2">2 {t.yearsPlus}</option>
                                            <option value="3">3 {t.yearsPlus}</option>
                                            <option value="5">5 {t.yearsPlus}</option>
                                            <option value="10">10 {t.yearsPlus}</option>
                                        </select>
                                    </div>

                                    <hr className="border-gray-100 dark:border-gray-700" />

                                    {/* Salary Range - Iraqi Dinar */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
                                            {t.salaryRange} <span className="text-xs font-normal text-gray-500">({language === 'ar' ? 'د.ع' : 'IQD'})</span>
                                        </label>
                                        <select
                                            value={`${filters.salaryMin || 0}-${filters.salaryMax || 100000000}`}
                                            onChange={(e) => {
                                                const [min, max] = e.target.value.split('-').map(Number);
                                                setFilter('salaryMin', min);
                                                setFilter('salaryMax', max);
                                            }}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none"
                                            style={{ backgroundImage: 'none' }}
                                        >
                                            <option value="0-100000000" className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">{t.anyRange}</option>
                                            <option value="0-500000" className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">{language === 'ar' ? 'أقل من 500 ألف د.ع' : 'Under 500,000 IQD'}</option>
                                            <option value="500000-1000000" className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">{language === 'ar' ? '500 ألف - 1 مليون د.ع' : '500K - 1M IQD'}</option>
                                            <option value="1000000-2000000" className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">{language === 'ar' ? '1 مليون - 2 مليون د.ع' : '1M - 2M IQD'}</option>
                                            <option value="2000000-4000000" className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">{language === 'ar' ? '2 مليون - 4 مليون د.ع' : '2M - 4M IQD'}</option>
                                            <option value="4000000-100000000" className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">{language === 'ar' ? 'أكثر من 4 مليون د.ع' : 'Above 4M IQD'}</option>
                                        </select>
                                        <div className="mt-2 text-xs text-center text-gray-400">
                                            {t.min}: {(filters.salaryMin || 0).toLocaleString()} - {t.max}: {(filters.salaryMax || 5000000).toLocaleString()}
                                        </div>
                                    </div>

                                    <hr className="border-gray-100 dark:border-gray-700" />

                                    {/* Employment Type */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                                            {t.employmentType}
                                        </label>
                                        <div className="space-y-2">
                                            {['full_time', 'part_time', 'contract', 'temporary'].map(type => (
                                                <label key={type} className="flex items-center gap-2 cursor-pointer group">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={filters.employmentType?.includes(type as any) || false}
                                                            onChange={(e) => {
                                                                const current = filters.employmentType || [];
                                                                if (e.target.checked) {
                                                                    setFilter('employmentType', [...current, type as any]);
                                                                } else {
                                                                    setFilter('employmentType', current.filter((t: any) => t !== type));
                                                                }
                                                            }}
                                                            className="peer h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">
                                                        {employmentTypeLabels[type]}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Skills Filter */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                                            {t.skills}
                                        </label>
                                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                                            {availableSkills.length > 0 ? (
                                                availableSkills.map(skill => (
                                                    <button
                                                        key={skill}
                                                        onClick={() => {
                                                            const current = filters.skills || [];
                                                            if (current.includes(skill)) {
                                                                setFilter('skills', current.filter(s => s !== skill));
                                                            } else {
                                                                setFilter('skills', [...current, skill]);
                                                            }
                                                        }}
                                                        className={`px-2 py-1 rounded-full text-xs transition-all ${filters.skills?.includes(skill)
                                                            ? 'bg-blue-500 text-white shadow-md'
                                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                            }`}
                                                    >
                                                        {skill}
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-500 p-1">{t.noCandidatesFound}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )
                    }

                    {/* Results Grid */}
                    <div className="flex-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : filteredResults.length > 0 ? (
                            viewMode === 'grid' ? (
                                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredResults.map((match) => (
                                        <Card key={match.cv.id} hover onClick={() => setSelectedCV(match.cv.id)}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                                                    {match.cv?.personalInfo?.photo ? (
                                                        <img src={match.cv.personalInfo.photo} alt={match.cv.personalInfo.fullName || 'Candidate'} className="w-full h-full object-cover" />
                                                    ) : (
                                                        (match.cv?.personalInfo?.fullName || 'C').split(' ').map((n: string) => n[0]).join('').substring(0, 2)
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <MatchScore score={match.score} size="sm" />
                                                    <button
                                                        onClick={(e) => handleToggleFavorite(e, match.cv.id)}
                                                        className={`p-1.5 rounded-full transition-colors ${favorites.includes(match.cv.id)
                                                            ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                                                            : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                            }`}
                                                    >
                                                        <Heart
                                                            size={18}
                                                            fill={favorites.includes(match.cv.id) ? "currentColor" : "none"}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-2 w-full">
                                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {match.cv?.personalInfo?.fullName || 'Unknown Candidate'}
                                                </h3>
                                                {match.cv?.personalInfo?.verified && (
                                                    <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-800">
                                                        <CheckCircle size={12} />
                                                        {language === 'ar' ? 'موثق' : 'Verified'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                {match.cv?.experience?.[0]?.title || getRoleLabel((match.cv as any).userType)}
                                            </p>
                                            {match.cv?.certifications && match.cv.certifications.length > 0 && (
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-1" title={match.cv.certifications.map((c: any) => c.name).join(language === 'ar' ? '، ' : ', ')}>
                                                    <Award size={12} className="inline-block mr-1 text-gray-400" />
                                                    {match.cv.certifications.map((c: any) => c.name).join(language === 'ar' ? '، ' : ', ')}
                                                </p>
                                            )}
                                            {match.cv?.experience && match.cv.experience.length > 0 && (
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2" title={match.cv.experience.map((e: any) => e.company).join(language === 'ar' ? '، ' : ', ')}>
                                                    {language === 'ar' ? 'عمل سابقاً في: ' : 'Previously at: '}
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                                        {match.cv.experience.map((e: any) => e.company).join(language === 'ar' ? '، ' : ', ')}
                                                    </span>
                                                </p>
                                            )}
                                            <div className="flex flex-col gap-1.5 mt-2 text-xs text-gray-500">
                                                <span className="flex items-center gap-1.5 truncate" title={match.cv?.location?.preferred?.[0] || match.cv?.personalInfo?.city || ''}>
                                                    <MapPin size={12} className="flex-shrink-0" />
                                                    {match.cv?.location?.preferred?.[0] || match.cv?.personalInfo?.city || 'Iraq'}
                                                </span>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="flex items-center gap-1.5">
                                                        <Briefcase size={12} /> {getExperienceLabel(match.cv.experience)}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                                                        <DollarSign size={12} /> {(match.cv?.salary?.expected / 1000).toFixed(0)}k
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-3 h-12 overflow-hidden">
                                                {match.cv?.skills?.slice(0, 3).map((skill: string) => (
                                                    <SkillBadge key={skill} skill={skill} size="sm" />
                                                ))}
                                                {match.cv?.skills?.length > 3 && (
                                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs rounded-full">
                                                        +{match.cv.skills.length - 3}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCV(match.cv.id);
                                                    }}
                                                >
                                                    {t.viewProfile}
                                                </Button>
                                                {cvRequests[match.cv.userId] === 'approved' ? (
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCvViewMode('cv');
                                                            setSelectedCV(match.cv.id);
                                                        }}
                                                    >
                                                        <FileText size={14} className="mr-1" />
                                                        {language === 'ar' ? 'عرض السيرة' : 'View CV'}
                                                    </Button>
                                                ) : cvRequests[match.cv.userId] === 'pending' ? (
                                                    <Button
                                                        size="sm"
                                                        disabled
                                                        className="flex-1 text-xs bg-yellow-100 text-yellow-700 border-yellow-200"
                                                    >
                                                        {language === 'ar' ? 'تم الطلب' : 'Request Sent'}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                                        loading={requestingIds.has(match.cv.userId)}
                                                        onClick={(e) => handleRequestCV(e, match.cv.id, match.cv.userId)}
                                                    >
                                                        {language === 'ar' ? 'طلب CV' : 'Request CV'}
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredResults.map((match) => (
                                        <Card key={match.cv.id} hover onClick={() => setSelectedCV(match.cv.id)}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                    {match.cv.personalInfo.photo ? (
                                                        <img src={match.cv.personalInfo.photo} alt={match.cv.personalInfo.fullName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        match.cv.personalInfo.fullName.split(' ').map((n: string) => n[0]).join('')
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                                            {match.cv.personalInfo.fullName}
                                                        </h3>
                                                        {match.cv.personalInfo.verified && (
                                                            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-800">
                                                                <CheckCircle size={12} />
                                                                {language === 'ar' ? 'موثق' : 'Verified'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {match.cv.experience[0]?.title || getRoleLabel((match.cv as any).userType)} • {match.cv.location.preferred?.[0] || match.cv.personalInfo.city} • {getExperienceLabel(match.cv.experience)}
                                                        {match.cv.certifications && match.cv.certifications.length > 0 && (
                                                            <span className="block mt-1 text-xs text-gray-500 line-clamp-1" title={match.cv.certifications.map((c: any) => c.name).join(language === 'ar' ? '، ' : ', ')}>
                                                                <Award size={12} className="inline-block mr-1 text-gray-400" />
                                                                {match.cv.certifications.map((c: any) => c.name).join(language === 'ar' ? '، ' : ', ')}
                                                            </span>
                                                        )}
                                                        {match.cv.experience && match.cv.experience.length > 0 && (
                                                            <span className="block mt-1 text-xs text-gray-500 line-clamp-1" title={match.cv.experience.map((e: any) => e.company).join(language === 'ar' ? '، ' : ', ')}>
                                                                {language === 'ar' ? 'عمل سابقاً في: ' : 'Previously at: '}
                                                                <span className="font-medium">{match.cv.experience.map((e: any) => e.company).join(language === 'ar' ? '، ' : ', ')}</span>
                                                            </span>
                                                        )}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {match.cv.skills.slice(0, 4).map((skill: string) => (
                                                            <SkillBadge key={skill} skill={skill} size="sm" />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                                                    <span className="flex items-center gap-1" title={match.cv.location.preferred?.[0] || match.cv.personalInfo.city}>
                                                        <MapPin size={14} /> <span className="truncate max-w-[150px]">{match.cv.location.preferred?.[0] || match.cv.personalInfo.city}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase size={14} /> {match.cv.experience[0]?.title || getRoleLabel((match.cv as any).userType)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign size={14} /> {(match.cv.salary.expected / 1000).toFixed(0)} ألف د.ع
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Mobile Actions for List View */}
                                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2 md:hidden">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCV(match.cv.id);
                                                    }}
                                                >
                                                    {t.viewProfile}
                                                </Button>
                                                {cvRequests[match.cv.userId] === 'approved' ? (
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCvViewMode('cv');
                                                            setSelectedCV(match.cv.id);
                                                        }}
                                                    >
                                                        <FileText size={14} className="mr-1" />
                                                        {language === 'ar' ? 'عرض' : 'View'}
                                                    </Button>
                                                ) : cvRequests[match.cv.userId] === 'pending' ? (
                                                    <Button
                                                        size="sm"
                                                        disabled
                                                        className="flex-1 text-xs bg-yellow-100 text-yellow-700 border-yellow-200"
                                                    >
                                                        {language === 'ar' ? 'تم الطلب' : 'Sent'}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                                        loading={requestingIds.has(match.cv.userId)}
                                                        onClick={(e) => handleRequestCV(e, match.cv.id, match.cv.userId)}
                                                    >
                                                        {language === 'ar' ? 'طلب CV' : 'Request'}
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 hidden md:flex">
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {(match.cv.salary.expected / 1000).toFixed(0)} ألف د.ع/شهر
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {employmentTypeLabels[match.cv.availability.type] || match.cv.availability.type.replace('_', ' ')}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-3 min-w-[120px]">
                                                    <div className="flex items-center gap-2">
                                                        <MatchScore score={match.score} size="sm" />
                                                        <button
                                                            onClick={(e) => handleToggleFavorite(e, match.cv.id)}
                                                            className={`p-1.5 rounded-full transition-colors ${favorites.includes(match.cv.id)
                                                                ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                                                                : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                                }`}
                                                        >
                                                            <Heart
                                                                size={18}
                                                                fill={favorites.includes(match.cv.id) ? "currentColor" : "none"}
                                                            />
                                                        </button>
                                                    </div>

                                                    {cvRequests[match.cv.userId] === 'approved' ? (
                                                        <Button
                                                            size="sm"
                                                            className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCvViewMode('cv');
                                                                setSelectedCV(match.cv.id);
                                                            }}
                                                        >
                                                            <FileText size={14} className="mr-1" />
                                                            {language === 'ar' ? 'عرض' : 'View'}
                                                        </Button>
                                                    ) : cvRequests[match.cv.userId] === 'pending' ? (
                                                        <Button
                                                            size="sm"
                                                            disabled
                                                            className="w-full text-xs bg-yellow-100 text-yellow-700 border-yellow-200"
                                                        >
                                                            {language === 'ar' ? 'تم الطلب' : 'Sent'}
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                                            loading={requestingIds.has(match.cv.userId)}
                                                            onClick={(e) => handleRequestCV(e, match.cv.id, match.cv.userId)}
                                                        >
                                                            {language === 'ar' ? 'طلب CV' : 'Request'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                                    <Search size={32} className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.noCandidatesFound}</h3>
                                <p className="text-gray-500 mt-1 mb-4">{t.tryAdjusting}</p>
                                <Button variant="outline" onClick={clearFilters}>
                                    {t.clearFilters}
                                </Button>
                            </div>
                        )}
                    </div>
                </div >
            )}
            {selectedCandidate && (
                <CVDetailsModal
                    isOpen={!!selectedCandidate}
                    onClose={() => {
                        setSelectedCV(null);
                        setCvViewMode('profile');
                    }}
                    cv={selectedCandidate.cv}
                    isApproved={selectedCandidate.cv.userId ? cvRequests[selectedCandidate.cv.userId] === 'approved' : false}
                    viewMode={cvViewMode}
                />
            )}
        </div>
    );
}
