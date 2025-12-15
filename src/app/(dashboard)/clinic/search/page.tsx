'use client';

// ============================================
// DentalHire - Clinic Search Page (Bilingual)
// ============================================

import { useState, useMemo, useDeferredValue, useEffect } from 'react';
import { useSearchStore, useAuthStore, useJobStore } from '@/store';
import { dentalSkills, dentalSkillsAr } from '@/data/mockData';
import { iraqLocations } from '@/data/iraq_locations';
import { Card, Button, Input, MatchScore, SkillBadge, RangeSlider, CVDetailsModal } from '@/components/shared';
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
    CheckCircle
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
    const [mapView, setMapView] = useState(false);
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);

    // Auth & Job Store for Favorites
    const { user } = useAuthStore();
    const { favorites, toggleFavorite, loadFavorites } = useJobStore();

    // Load favorites on mount
    useEffect(() => {
        if (user?.id) {
            loadFavorites(user.id);
        }
    }, [user?.id, loadFavorites]);

    const handleToggleFavorite = async (e: React.MouseEvent, cvId: string) => {
        e.stopPropagation(); // Prevent card click
        if (!user?.id) return;

        await toggleFavorite(user.id, cvId);
    };

    // Location State
    const [selectedGov, setSelectedGov] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');
    const [area, setArea] = useState<string>('');

    // Fetch initial data
    useEffect(() => {
        const fetchCVs = async () => {
            setIsLoading(true);
            try {
                // Join with users table to get user_type and verified status
                const { data, error } = await supabase
                    .from('cvs')
                    .select('*, users(user_type, verified)');

                if (error) {
                    console.error('Error fetching CVs:', error);
                }

                if (data) {
                    // Map the raw DB CVs (flat structure) to MatchResult structure (nested)
                    const mappedResults = data.map((cv: any) => ({
                        cv: {
                            id: cv.id,
                            userId: cv.user_id,
                            userType: cv.users?.user_type, // Map user_type from joined users table
                            personalInfo: {
                                fullName: cv.full_name,
                                email: cv.email,
                                verified: cv.users?.verified, // Map verified status
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
                        score: cv.matchScore || Math.floor(Math.random() * 30) + 70, // Mock score if missing
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
                    setResults(mappedResults);
                } else {
                    // If no data, ensure results are empty
                    setResults([]);
                }
            } catch (error) {
                console.error('Error in fetchCVs:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCVs();
    }, [setResults, supabase]);

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

    // Filter and sort results
    const filteredResults = useMemo(() => {
        let currentResults = [...results];

        if (filters.query) {
            const query = filters.query.toLowerCase();
            currentResults = currentResults.filter(m =>
                m.cv.personalInfo.fullName.toLowerCase().includes(query) ||
                m.cv.skills.some((s: string) => s.toLowerCase().includes(query)) ||
                m.cv.experience.some((e: any) => e.title.toLowerCase().includes(query))
            );
        }

        if (filters.role) {
            // Check against userType or experience title
            currentResults = currentResults.filter(m => {
                const roleMatch = (m.cv as any).userType === filters.role; // Use userType from joined users table
                const titleMatch = m.cv.experience.some((e: any) =>
                    e.title.toLowerCase().includes(filters.role!.replace('_', ' ').toLowerCase())
                );
                return roleMatch || titleMatch;
            });
        }

        if (filters.location) {
            const locFilter = filters.location.toLowerCase();
            const isGovernorate = Object.keys(iraqLocations).some(k => k.toLowerCase() === locFilter);

            let possibleMatches = [locFilter];
            let parentGovernorate = '';

            if (isGovernorate) {
                // Find casing content key
                const govKey = Object.keys(iraqLocations).find(k => k.toLowerCase() === locFilter);
                if (govKey) {
                    parentGovernorate = govKey.toLowerCase();
                    const govAr = (iraqLocations as any)[govKey].ar;
                    const districts = (iraqLocations as any)[govKey]?.districts.map((d: any) => d.en.toLowerCase()) || [];
                    const districtsAr = (iraqLocations as any)[govKey]?.districts.map((d: any) => d.ar) || [];

                    possibleMatches = [locFilter, govAr, ...districts, ...districtsAr];

                    // Add stripped Arabic versions (e.g. remove "قضاء ", "ناحية ", "مركز ")
                    if (govAr.startsWith('محافظة ')) possibleMatches.push(govAr.replace('محافظة ', ''));
                    districtsAr.forEach((d: string) => {
                        const stripped = d.replace(/^(قضاء|ناحية|مركز)\s+/, '');
                        if (stripped !== d) possibleMatches.push(stripped);
                    });
                }
            } else {
                // Check if it matches a district significantly
                for (const [govName, gov] of Object.entries(iraqLocations)) {
                    const foundDist = (gov as any).districts.find((d: any) => d.en.toLowerCase() === locFilter);
                    if (foundDist) {
                        parentGovernorate = govName.toLowerCase();
                        possibleMatches.push(foundDist.ar);
                        // Strip prefix
                        const stripped = foundDist.ar.replace(/^(قضاء|ناحية|مركز)\s+/, '');
                        if (stripped !== foundDist.ar) possibleMatches.push(stripped);

                        // Also add the governorate name to prevent cross-governorate matches
                        possibleMatches.push(govName.toLowerCase());
                        possibleMatches.push((gov as any).ar);
                        break;
                    }
                }
            }

            currentResults = currentResults.filter(m => {
                const cityLower = m.cv.personalInfo.city?.toLowerCase() || '';
                const preferredLower = m.cv.location.preferred.map((l: string) => l.toLowerCase());

                // Helper function for more precise matching (Fixed for Arabic)
                const matchesLocation = (text: string, pattern: string): boolean => {
                    if (!text || !pattern) return false;

                    // Exact match
                    if (text === pattern) return true;

                    // Regex check with custom boundaries (works for Arabic unlike \b)
                    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    // Matches start OR separator + pattern + end OR separator
                    const regex = new RegExp(`(^|[\\s.,;:\\-،])(${escapedPattern})($|[\\s.,;:\\-،])`, 'i');

                    if (regex.test(text)) {
                        // If searching for a governorate, ensure it's not a district of another governorate
                        if (isGovernorate && parentGovernorate) {
                            // Check if the text contains markers of being in a different governorate
                            const otherGovernorates = Object.entries(iraqLocations)
                                .filter(([key]) => key.toLowerCase() !== parentGovernorate)
                                .map(([_, val]) => [(val as any).ar, ...Object.keys(iraqLocations).filter(k => k.toLowerCase() !== parentGovernorate)])
                                .flat();

                            // If text contains another governorate name, it's not a match
                            const containsOtherGov = otherGovernorates.some(otherGov =>
                                // Simple includes check for exclusion is usually safer/enough
                                text.includes(String(otherGov).toLowerCase())
                            );

                            if (containsOtherGov) return false;
                        }
                        return true;
                    }

                    return false;
                };

                // Check city field
                const cityMatches = possibleMatches.some(pm => matchesLocation(cityLower, pm?.toLowerCase() || ''));

                // Check preferred locations
                const preferredMatches = preferredLower.some(pl =>
                    possibleMatches.some(pm => matchesLocation(pl, pm?.toLowerCase() || ''))
                );

                return cityMatches || preferredMatches;
            });
        }

        if (filters.skills && filters.skills.length > 0) {
            currentResults = currentResults.filter(m =>
                filters.skills!.some(skill =>
                    m.cv.skills.some((s: string) => s.toLowerCase().includes(skill.toLowerCase()))
                )
            );
        }

        if (filters.experienceMin !== undefined) {
            currentResults = currentResults.filter(m => {
                const years = m.cv.experience.length;
                return years >= filters.experienceMin!;
            });
        }

        if (filters.salaryMin !== undefined) {
            currentResults = currentResults.filter(m => m.cv.salary.expected >= filters.salaryMin!);
        }

        if (filters.salaryMax !== undefined) {
            currentResults = currentResults.filter(m => m.cv.salary.expected <= filters.salaryMax!);
        }

        if (filters.employmentType && filters.employmentType.length > 0) {
            currentResults = currentResults.filter(m =>
                filters.employmentType!.some(t => m.cv.availability?.type === t)
            );
        }

        return currentResults.sort((a, b) => b.score - a.score);
    }, [results, filters]);

    // Use deferred value for loading detection
    const deferredFilters = useDeferredValue(filters);
    const isSearching = filters !== deferredFilters;

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
                                                {m.cv.experience[0]?.company && (
                                                    <span className="block text-[10px] text-gray-400 mt-0.5">
                                                        {language === 'ar' ? 'عمل سابقاً في: ' : 'Previously at: '}
                                                        {m.cv.experience[0].company}
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

                                    {/* Salary Range - Simplified Dropdown */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
                                            {t.salaryRange}
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
                                            <option value="0-500" className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">{language === 'ar' ? 'أقل من $500' : 'Under $500'}</option>
                                            <option value="500-1000" className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">$500 - $1,000</option>
                                            <option value="1000-2000" className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">$1,000 - $2,000</option>
                                            <option value="2000-3000" className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">$2,000 - $3,000</option>
                                            <option value="3000-5000" className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">$3,000 - $5,000</option>
                                            <option value="5000-100000" className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">{language === 'ar' ? 'أكثر من $5,000' : 'Above $5,000'}</option>
                                        </select>
                                        <div className="mt-2 text-xs text-center text-gray-400">
                                            {t.min}: ${filters.salaryMin || 0} - {t.max}: ${filters.salaryMax || 10000}
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
                                            {match.cv?.experience?.[0]?.company && (
                                                <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
                                                    {language === 'ar' ? 'عمل سابقاً في: ' : 'Previously at: '}
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                                        {match.cv.experience[0].company}
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
                                                        {match.cv.experience[0]?.company && (
                                                            <span className="block mt-1 text-xs text-gray-500">
                                                                {language === 'ar' ? 'عمل سابقاً في: ' : 'Previously at: '}
                                                                <span className="font-medium">{match.cv.experience[0].company}</span>
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

                                            <div className="flex items-center gap-4 hidden md:flex">
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {(match.cv.salary.expected / 1000).toFixed(0)} ألف د.ع/شهر
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {employmentTypeLabels[match.cv.availability.type] || match.cv.availability.type.replace('_', ' ')}
                                                    </p>
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
                    onClose={() => setSelectedCV(null)}
                    cv={selectedCandidate.cv}
                />
            )}
        </div>
    );
}
