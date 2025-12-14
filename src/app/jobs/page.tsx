'use client';

// ============================================
// DentalHire - Jobs Listing Page
// ============================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJobStore } from '@/store/useJobStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCVStore } from '@/store/useCVStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button, Card, SkillBadge } from '@/components/shared';
import { formatRelativeTime, formatTime } from '@/lib/utils';
import { Job } from '@/types';
import {
    ArrowLeft,
    ArrowRight,
    Map as MapIcon,
    List,
    Building2,
    MapPin,
    Users,
    Heart,
    Share2,
    BookmarkPlus,
    Clock,
    Filter,
    SlidersHorizontal,
    Menu
} from 'lucide-react';

// New Components
import JobCard from '@/components/jobs/JobCard';
import Sidebar from '@/components/layout/Sidebar';
import JobFilters from '@/components/jobs/JobFilters';
import JobSearchBar from '@/components/jobs/JobSearchBar';
import JobEmptyState from '@/components/jobs/JobEmptyState';
import JobSkeletons, { JobDetailSkeleton } from '@/components/jobs/JobSkeletons';
import ApplicationSuccessModal from '@/components/jobs/ApplicationSuccessModal';

import { Suspense } from 'react';

function JobsContent() {
    const { jobs, loadJobs, subscribeToJobs, isLoading, savedJobs, toggleSavedJob, applyToJob, searchJobsSmart } = useJobStore();
    const { user } = useAuthStore();
    const { cvId, loadCV } = useCVStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobIdParam = searchParams.get('id');
    const { language } = useLanguage();

    // Local State
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [modalType, setModalType] = useState<'success' | 'duplicate'>('success');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        employmentType: [] as string[],
        experienceLevel: [] as string[],
        salaryRange: [0, 500000] as [number, number],
        location: [] as string[],
        jobRole: [] as string[]
    });

    useEffect(() => {
        const unsubscribe = subscribeToJobs();
        return () => {
            unsubscribe();
        };
    }, [subscribeToJobs]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (user) {
                loadCV(user.id);
                searchJobsSmart(user.id, searchQuery);
            } else {
                loadJobs();
            }
        }, 500); // Debounce search

        return () => clearTimeout(debounceTimer);
    }, [user, searchQuery, loadJobs, loadCV, searchJobsSmart]);

    // URL-Driven State Synchronization
    useEffect(() => {
        if (jobs.length > 0) {
            if (jobIdParam) {
                // If URL has ID, sync local state
                const jobFromUrl = jobs.find(j => j.id === jobIdParam);
                if (jobFromUrl) {
                    setSelectedJobId(jobFromUrl.id);
                }
            } else {
                // If URL has NO ID, always clear selection
                // This prevents "sticky" selection when navigating back
                setSelectedJobId(null);
            }
        }
        // CRITICAL FIX: Only depend on external data (jobs) and URL (jobIdParam).
        // Do NOT depend on selectedJobId or router/searchParams, as that causes race conditions
        // where the old URL state reverts the optimistic new local state.
    }, [jobs, jobIdParam]);

    // Navigation Helpers
    const handleJobSelect = (jobId: string) => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('id', jobId);
        router.push(`/jobs?${newParams.toString()}`, { scroll: false });
    };

    const handleBackToJobs = (e?: React.MouseEvent) => {
        // Prevent event bubbling and default behavior
        e?.preventDefault();
        e?.stopPropagation();

        // Immediate UI Update (Optimistic)
        setSelectedJobId(null);

        // Background URL Update
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('id');
        router.replace(`/jobs?${newParams.toString()}`, { scroll: false });
    };

    const selectedJob = jobs.find(j => j.id === selectedJobId) || null;

    // Helper to determine role from title/desc
    const getJobRole = (job: Job): string | null => {
        const text = (job.title + ' ' + job.description).toLowerCase();

        // Priority 1: Specific Specialist Roles
        if (text.includes('orthodontist') || text.includes('تقويم')) return 'orthodontist';
        if (text.includes('endodontist') || text.includes('جذور') || text.includes('عصب') || text.includes('حشوات')) return 'endodontist';
        if (text.includes('surgeon') || text.includes('جراح')) return 'surgeon';
        if (text.includes('pedodontist') || text.includes('kids') || text.includes('pediatric') || text.includes('أطفال')) return 'pedodontist';
        if (text.includes('prosthodontist') || text.includes('prostho') || text.includes('تركيبات')) return 'prosthodontist';

        // Priority 2: Support Roles
        if (text.includes('assistant') || text.includes('مساعد') || text.includes('nurse') || text.includes('ممرض')) return 'assistant';
        if (text.includes('technician') || text.includes('lab') || text.includes('تقني') || text.includes('مختبر')) return 'technician';
        if (text.includes('ceramist') || text.includes('سيراميست')) return 'ceramist';
        if (text.includes('manager') || text.includes('مدير')) return 'manager';
        if (text.includes('secretary') || text.includes('reception') || text.includes('سكرتير') || text.includes('استقبال')) return 'secretary';
        if (text.includes('cleaner') || text.includes('service') || text.includes('نظافة') || text.includes('خدمات')) return 'cleaner';

        // Priority 3: General Roles
        if (text.includes('dentist') || text.includes('طبيب') || text.includes('دكتور')) return 'dentist';
        if (text.includes('advertising') || text.includes('marketing') || text.includes('اعلان') || text.includes('تسويق')) return 'advertising';
        if (text.includes('representative') || text.includes('sales') || text.includes('مندوب') || text.includes('مبيعات')) return 'representative';

        return null;
    };

    // Filtering Logic
    const filteredJobs = jobs.filter((job) => {
        const matchesSearch =
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.clinicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.location.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = filters.employmentType.length === 0 ||
            filters.employmentType.includes(job.employmentType);

        // Location Filter Logic (Simple includes)
        const matchesLocation = filters.location.length === 0 ||
            filters.location.some(loc => job.location.toLowerCase().includes(loc === 'remote' ? 'remote' : loc));

        // Job Role Filter Logic
        const role = getJobRole(job);
        const matchesRole = filters.jobRole.length === 0 || (role && filters.jobRole.includes(role));

        return matchesSearch && matchesType && matchesLocation && matchesRole && job.status === 'active';
    });

    // Dynamic Filter Counting
    const jobCounts = {
        employmentType: {} as Record<string, number>,
        location: {} as Record<string, number>,
        jobRole: {} as Record<string, number>
    };

    // Calculate available counts
    jobs.forEach(job => {
        // Check if job matches search
        const matchesSearch =
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.clinicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.location.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch || job.status !== 'active') return;

        // Determine this job's role
        const role = getJobRole(job);

        // 1. Calculate Employment Type counts
        const matchesLocationForType = filters.location.length === 0 ||
            filters.location.some(loc => job.location.toLowerCase().includes(loc === 'remote' ? 'remote' : loc));
        const matchesRoleForType = filters.jobRole.length === 0 || (role && filters.jobRole.includes(role));

        if (matchesLocationForType && matchesRoleForType) {
            jobCounts.employmentType[job.employmentType] = (jobCounts.employmentType[job.employmentType] || 0) + 1;
        }

        // 2. Calculate Location counts
        const matchesTypeForLocation = filters.employmentType.length === 0 ||
            filters.employmentType.includes(job.employmentType);
        const matchesRoleForLocation = filters.jobRole.length === 0 || (role && filters.jobRole.includes(role));

        if (matchesTypeForLocation && matchesRoleForLocation) {
            const normalizedLoc = job.location.toLowerCase();
            // Full List of Iraqi Cities to Count
            const cities = [
                'baghdad', 'basra', 'erbil', 'najaf', 'karbala', 'nineveh', 'kirkuk',
                'babylon', 'hilla', 'wasit', 'kut', 'anbar', 'diyala', 'dhi qar', 'nasiriyah',
                'maysan', 'amarah', 'muthanna', 'samawa', 'qadisiyah', 'diwaniya', 'saladin',
                'tikrit', 'halabja', 'sulaymaniyah', 'duhok', 'remote'
            ];

            cities.forEach(city => {
                if (normalizedLoc.includes(city)) {
                    // Map variations to standard keys if needed
                    let key = city;
                    if (city === 'hilla') key = 'babylon';
                    if (city === 'kut') key = 'wasit';
                    if (city === 'nasiriyah') key = 'dhi qar';
                    if (city === 'amarah') key = 'maysan';
                    if (city === 'samawa') key = 'muthanna';
                    if (city === 'diwaniya') key = 'qadisiyah';
                    if (city === 'tikrit') key = 'saladin';

                    jobCounts.location[key] = (jobCounts.location[key] || 0) + 1;
                }
            });
        }

        // 3. Calculate Role counts
        const matchesTypeForRole = filters.employmentType.length === 0 || filters.employmentType.includes(job.employmentType);
        const matchesLocationForRole = filters.location.length === 0 ||
            filters.location.some(loc => job.location.toLowerCase().includes(loc === 'remote' ? 'remote' : loc));

        if (matchesTypeForRole && matchesLocationForRole && role) {
            jobCounts.jobRole[role] = (jobCounts.jobRole[role] || 0) + 1;
        }
    });



    const isJobSaved = selectedJob ? savedJobs.includes(selectedJob.id) : false;

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            employmentType: [],
            experienceLevel: [],
            salaryRange: [0, 500000],
            location: [],
            jobRole: [] // Reset role
        });
        setSearchQuery('');
    };

    const handleApply = async () => {
        if (!selectedJob) return;

        if (!user) {
            alert(language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
            // router.push('/login'); // Optional: redirect
            return;
        }

        if (user.role !== 'job_seeker') {
            alert(language === 'ar' ? 'يجب أن تكون باحثاً عن عمل للتقديم' : 'Only job seekers can apply');
            return;
        }

        // Check if CV exists
        let activeCvId = cvId;

        if (!activeCvId) {
            // If no CV exists, create one automatically
            try {
                const { updatePersonalInfo, saveCV } = useCVStore.getState();

                // Pre-fill with user info
                updatePersonalInfo({
                    fullName: `${user.profile.firstName} ${user.profile.lastName}`,
                    email: user.email,
                    // city: user.profile.city // If available in user profile
                });

                // Create the CV
                const created = await saveCV(user.id);
                if (created) {
                    activeCvId = useCVStore.getState().cvId;
                } else {
                    throw new Error('Failed to create CV');
                }
            } catch (err) {
                console.error('Auto-CV creation failed:', err);
                alert(language === 'ar' ? 'يرجى إنشاء سيرة ذاتية أولاً' : 'Please create a CV first');
                router.push('/job-seeker/cv-builder');
                return;
            }
        }

        if (!activeCvId) {
            alert(language === 'ar' ? 'فشل إنشاء السيرة الذاتية' : 'Failed to create CV');
            return;
        }

        setIsApplying(true);
        try {
            // 1. Force save current CV state to ensure latest draft is in DB
            // This captures "what he completed" even if he didn't explicitly save in builder
            const { saveCV } = useCVStore.getState();
            const saved = await saveCV(user.id);

            if (!saved) {
                throw new Error('Failed to save CV profile');
            }

            // 2. Get the guaranteed ID
            const activeCvId = useCVStore.getState().cvId;

            if (!activeCvId) {
                throw new Error('No CV ID after save');
            }

            // 3. Apply to job
            const result = await applyToJob(selectedJob.id, user.id, activeCvId);

            if (result === 'success') {
                setModalType('success');
                setShowSuccessModal(true);
            } else if (result === 'duplicate') {
                setModalType('duplicate');
                setShowSuccessModal(true);
            } else {
                alert(language === 'ar' ? 'حدث خطأ أثناء التقديم' : 'Error applying to job');
            }
        } catch (error) {
            console.error('Apply error:', error);
            alert(language === 'ar' ? 'حدث خطأ غير متوقع' : 'Unexpected error');
        } finally {
            setIsApplying(false);
        }
    };

    const getEmploymentTypeLabel = (type: string) => {
        const types: Record<string, { en: string; ar: string }> = {
            full_time: { en: 'Full-Time', ar: 'دوام كامل' },
            part_time: { en: 'Part-Time', ar: 'دوام جزئي' },
            contract: { en: 'Contract', ar: 'عقد' },
            temporary: { en: 'Temporary', ar: 'مؤقت' },
        };
        return language === 'ar' ? types[type]?.ar || type : types[type]?.en || type.replace('_', ' ');
    };

    const getSalaryLabel = (job: Job) => {
        if (job.salary.min === 0 && job.salary.max === 0) {
            return language === 'ar' ? 'قابل للتفاوض' : 'Negotiable';
        }

        if (job.employmentType === 'part_time') {
            return `${job.salary.min.toLocaleString()}-${job.salary.max.toLocaleString()} د.ع/${language === 'ar' ? 'ساعة' : 'hr'}`;
        }

        // Ensure values are numbers before toFixed and handle "K" inputs
        const minVal = Number(job.salary.min);
        const maxVal = Number(job.salary.max);

        const minK = minVal < 1000 ? minVal : (minVal / 1000).toFixed(0);
        const maxK = maxVal < 1000 ? maxVal : (maxVal / 1000).toFixed(0);

        return `${minK}-${maxK} ألف د.ع`;
    };

    const getBackLink = () => {
        if (!user) return '/';

        if (user.role === 'clinic') return '/clinic/dashboard';
        if (user.role === 'admin') return '/admin/dashboard';

        // For job seekers and other roles
        const typeToDashboard: Record<string, string> = {
            dentist: 'dentist',
            dental_assistant: 'assistant',
            sales_rep: 'sales',
            secretary: 'secretary',
            media: 'media',
            dental_technician: 'technician',
            company: 'company',
            lab: 'lab'
        };

        const dashboard = user.userType ? (typeToDashboard[user.userType] || 'job-seeker') : 'job-seeker';
        return `/${dashboard}/dashboard`;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-teal-600 pb-12 md:pb-20 pt-6 md:pt-8">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-8 relative z-20">
                        {/* Right Actions: Back + Menu */}
                        <div className="flex items-center gap-3">
                            <Link
                                href={getBackLink()}
                                className="flex items-center gap-2 text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg transition-all shadow-sm border border-white/10"
                            >
                                {language === 'ar' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                                <span className="font-medium">{language === 'ar' ? 'الرجوع' : 'Back'}</span>
                            </Link>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="md:hidden p-2 text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all border border-white/10"
                            >
                                <Menu size={24} />
                            </button>
                        </div>
                    </div>

                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-2 leading-tight">
                        {language === 'ar' ? 'اعثر على وظيفة أحلامك في طب الأسنان' : 'Find Your Dream Dental Job'}
                    </h1>
                    <p className="text-blue-100 mb-6 md:mb-8 max-w-2xl text-base md:text-lg leading-relaxed">
                        {language === 'ar'
                            ? 'نحن معك حتى نعثر على وظيفة تناسبك وتناسب مؤهلاتك'
                            : 'We are with you until we find a job that suits you and your qualifications.'}
                    </p>

                    <div className="flex gap-4 items-start">
                        <div className="flex-1 min-w-0">
                            <JobSearchBar
                                onSearch={setSearchQuery}
                                initialQuery={searchQuery}
                            />
                        </div>
                        <Button
                            className="bg-white text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200 border border-gray-100 shadow-sm h-[52px] hidden md:flex min-w-[120px] transition-all duration-300"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                            {language === 'ar' ? 'تصفية' : 'Filters'}
                        </Button>
                    </div>
                </div>
            </div>



            <div className="container-custom -mt-6 md:-mt-8 pb-12">
                <div className="flex gap-6">
                    {/* Filters Sidebar (Desktop) */}
                    <div className={`hidden md:block transition-all duration-300 ${showFilters ? 'w-80' : 'w-0 overflow-hidden'}`}>
                        <JobFilters
                            isOpen={showFilters}
                            onClose={() => setShowFilters(false)}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onReset={resetFilters}
                            jobCounts={jobCounts}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit sticky top-24"
                        />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Mobile Filter Toggle & View Switcher */}
                        <div className="flex items-center justify-between mb-6 md:hidden">
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(true)}
                                className="flex items-center gap-2"
                            >
                                <Filter size={18} />
                                {language === 'ar' ? 'تصفية' : 'Filter'}
                            </Button>
                            <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'text-gray-400'}`}
                                >
                                    <List size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'text-gray-400'}`}
                                >
                                    <MapIcon size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Filters Drawer */}
                        <div className="md:hidden">
                            <JobFilters
                                isOpen={showFilters}
                                onClose={() => setShowFilters(false)}
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                onReset={resetFilters}
                            />
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <JobSkeletons />
                                <div className="hidden lg:block h-[600px]">
                                    <JobDetailSkeleton />
                                </div>
                            </div>
                        ) : viewMode === 'map' ? (
                            <div className="flex flex-col items-center justify-center h-[600px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
                                    <MapIcon size={48} className="text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {language === 'ar' ? 'عرض الخريطة' : 'Map View'}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                                    {language === 'ar'
                                        ? 'ميزة الخريطة التفاعلية ستكون متاحة قريباً! ستتمكن من رؤية الوظائف حسب الموقع.'
                                        : 'Interactive map view is coming soon! You will be able to see jobs by location.'}
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-6"
                                    onClick={() => setViewMode('list')}
                                >
                                    {language === 'ar' ? 'العودة للقائمة' : 'Back to List'}
                                </Button>
                            </div>
                        ) : filteredJobs.length > 0 ? (
                            <div className="flex flex-col lg:flex-row gap-6 items-start pb-20">
                                {/* Job List */}
                                <div className="w-full lg:w-2/5 space-y-4">
                                    {filteredJobs.map((job) => (
                                        <JobCard
                                            key={job.id}
                                            job={job}
                                            isSelected={selectedJob?.id === job.id}
                                            onClick={() => handleJobSelect(job.id)}
                                        />
                                    ))}
                                </div>

                                {/* Job Details (Desktop) */}
                                <div className="hidden lg:block lg:w-3/5 sticky top-24">
                                    {selectedJob ? (
                                        <Card className="max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-8">
                                                <div className="flex items-start gap-5">
                                                    <div className="w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                        <Building2 size={40} />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                                            {language === 'ar' && !selectedJob.title.startsWith('مطلوب') ? `مطلوب ${selectedJob.title}` : selectedJob.title}
                                                        </h2>
                                                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                                                            {selectedJob.clinicName}
                                                        </p>
                                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                                                                <MapPin size={14} /> {selectedJob.location}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                                                                <Users size={14} /> {selectedJob.applications} {language === 'ar' ? 'متقدمين' : 'applicants'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => toggleSavedJob(selectedJob.id)}
                                                        className={`p-3 rounded-xl transition-all ${isJobSaved ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                                        title={language === 'ar' ? 'حفظ الوظيفة' : 'Save job'}
                                                    >
                                                        <Heart size={24} fill={isJobSaved ? "currentColor" : "none"} />
                                                    </button>
                                                    <button className="p-3 bg-gray-50 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title={language === 'ar' ? 'مشاركة الوظيفة' : 'Share job'}>
                                                        <Share2 size={24} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Quick Stats (Now 2 columns, moved time to bottom) */}
                                            <div className="grid grid-cols-2 gap-4 mb-8">
                                                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 opacity-70">{language === 'ar' ? 'الراتب' : 'Salary'}</p>
                                                    <div className="font-bold text-gray-900 dark:text-white flex items-center justify-start gap-1">
                                                        {selectedJob.salary.min === 0 && selectedJob.salary.max === 0 ? (
                                                            <span>{language === 'ar' ? 'قابل للتفاوض' : 'Negotiable'}</span>
                                                        ) : (
                                                            <>
                                                                <span>
                                                                    {Number(selectedJob.salary.min) < 1000
                                                                        ? Number(selectedJob.salary.min)
                                                                        : (Number(selectedJob.salary.min) / 1000).toFixed(0)}
                                                                </span>
                                                                <span>-</span>
                                                                <span>
                                                                    {Number(selectedJob.salary.max) < 1000
                                                                        ? Number(selectedJob.salary.max)
                                                                        : (Number(selectedJob.salary.max) / 1000).toFixed(0)}
                                                                </span>
                                                                <span>{language === 'ar' ? 'ألف د.ع' : 'k IQD'}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 opacity-70">{language === 'ar' ? 'النوع' : 'Type'}</p>
                                                    <p className="font-bold text-gray-900 dark:text-white capitalize">
                                                        {getEmploymentTypeLabel(selectedJob.employmentType)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-8">
                                                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 opacity-70">{language === 'ar' ? 'الجنس' : 'Gender'}</p>
                                                    <p className="font-bold text-gray-900 dark:text-white capitalize">
                                                        {selectedJob.gender === 'male'
                                                            ? (language === 'ar' ? 'ذكر' : 'Male')
                                                            : selectedJob.gender === 'female'
                                                                ? (language === 'ar' ? 'أنثى' : 'Female')
                                                                : (language === 'ar' ? 'للجنسين' : 'Any')
                                                        }
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 opacity-70">{language === 'ar' ? 'ساعات العمل' : 'Working Hours'}</p>
                                                    <div className="font-bold text-gray-900 dark:text-white flex items-center justify-start gap-1">
                                                        {selectedJob.workingHours ? (
                                                            <>
                                                                <span>{formatTime(selectedJob.workingHours.start, language)}</span>
                                                                <span>-</span>
                                                                <span>{formatTime(selectedJob.workingHours.end, language)}</span>
                                                            </>
                                                        ) : (
                                                            <span>{language === 'ar' ? 'غير محدد' : 'Not specified'}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="space-y-8">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">
                                                        {language === 'ar' ? 'الوصف الوظيفي' : 'Job Description'}
                                                    </h3>
                                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                                        {selectedJob.description}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">
                                                        {language === 'ar' ? 'المتطلبات الأساسية' : 'Key Requirements'}
                                                    </h3>
                                                    <ul className="space-y-3">
                                                        {selectedJob.requirements.map((req, index) => (
                                                            <li key={index} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0" />
                                                                <span className="leading-relaxed">{req}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">
                                                        {language === 'ar' ? 'المهارات المطلوبة' : 'Required Skills'}
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedJob.skills.map((skill) => (
                                                            <SkillBadge key={skill} skill={skill} variant="primary" />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Posted Date (Moved to bottom) */}
                                            <div className="mt-8 flex items-center justify-end text-sm text-gray-500 gap-1">
                                                <Clock size={14} />
                                                <span>
                                                    {language === 'ar' ? 'نشرت' : 'Posted'} {formatRelativeTime(selectedJob.createdAt)}
                                                </span>
                                            </div>

                                            {/* Action Footer */}
                                            <div className="mt-4 pt-6 border-t border-gray-100 dark:border-gray-700 flex gap-4">
                                                <Button
                                                    size="lg"
                                                    className="flex-1 text-lg h-14"
                                                    leftIcon={<BookmarkPlus size={20} />}
                                                    onClick={handleApply}
                                                    disabled={isApplying}
                                                >
                                                    {isApplying
                                                        ? (language === 'ar' ? 'جاري التقديم...' : 'Applying...')
                                                        : (language === 'ar' ? 'تقديم الآن' : 'Apply Now')
                                                    }
                                                </Button>
                                            </div>
                                        </Card>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400">
                                            {language === 'ar' ? 'اختر وظيفة لعرض التفاصيل' : 'Select a job to view details'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <JobEmptyState onReset={resetFilters} />
                        )}

                        {/* Mobile Job Details Sheet/Drawer */}
                        <div className={`fixed inset-0 z-50 lg:hidden transition-transform duration-300 transform ${selectedJobId ? 'translate-x-0' : (language === 'ar' ? '-translate-x-full' : 'translate-x-full')} bg-white dark:bg-gray-900 overflow-y-auto`}>
                            {selectedJob && (
                                <div className="min-h-screen pb-20">
                                    {/* Mobile Header */}
                                    <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3 z-10">
                                        <button
                                            onClick={(e) => handleBackToJobs(e)}
                                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                                            type="button"
                                        >
                                            {language === 'ar' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
                                        </button>
                                        <h2 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                                            {selectedJob.title}
                                        </h2>
                                    </div>

                                    <div className="p-5 space-y-6">
                                        {/* Job Header Info */}
                                        <div className="flex flex-col gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <Building2 size={32} />
                                            </div>
                                            <div>
                                                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                                    {language === 'ar' && !selectedJob.title.startsWith('مطلوب') ? `مطلوب ${selectedJob.title}` : selectedJob.title}
                                                </h1>
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    {selectedJob.clinicName}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Meta Tags */}
                                        <div className="flex flex-wrap gap-3">
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                <MapPin size={14} /> {selectedJob.location}
                                            </span>
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-sm font-medium text-blue-600 dark:text-blue-400">
                                                <Users size={14} /> {selectedJob.applications} {language === 'ar' ? 'متقدمين' : 'applicants'}
                                            </span>
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-sm font-medium text-purple-600 dark:text-purple-400">
                                                <Clock size={14} /> {formatRelativeTime(selectedJob.createdAt)}
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            <Button
                                                className="flex-1 py-6 text-lg"
                                                onClick={handleApply}
                                                disabled={isApplying}
                                                leftIcon={<BookmarkPlus size={20} />}
                                            >
                                                {isApplying
                                                    ? (language === 'ar' ? 'جاري التقديم...' : 'Applying...')
                                                    : (language === 'ar' ? 'تقديم الآن' : 'Apply Now')
                                                }
                                            </Button>
                                            <button
                                                onClick={() => toggleSavedJob(selectedJob.id)}
                                                className={`p-4 rounded-xl border border-gray-200 dark:border-gray-700 transition-all ${isJobSaved ? 'bg-red-50 text-red-500 border-red-200' : 'text-gray-400'}`}
                                            >
                                                <Heart size={24} fill={isJobSaved ? "currentColor" : "none"} />
                                            </button>
                                        </div>

                                        <div className="h-px bg-gray-100 dark:bg-gray-800" />

                                        {/* Highlights Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'الراتب' : 'Salary'}</p>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                    {getSalaryLabel(selectedJob)}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'النوع' : 'Type'}</p>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm capitalize">
                                                    {getEmploymentTypeLabel(selectedJob.employmentType)}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'الجنس' : 'Gender'}</p>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm capitalize">
                                                    {selectedJob.gender === 'male'
                                                        ? (language === 'ar' ? 'ذكر' : 'Male')
                                                        : (language === 'ar' ? 'أنثى' : 'Female')}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'ساعات العمل' : 'Working Hours'}</p>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                    {selectedJob.workingHours
                                                        ? `${formatTime(selectedJob.workingHours.start, language)} - ${formatTime(selectedJob.workingHours.end, language)}`
                                                        : (language === 'ar' ? 'غير محدد' : 'Not specified')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                                                {language === 'ar' ? 'الوصف الوظيفي' : 'Job Description'}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                                                {selectedJob.description}
                                            </p>
                                        </div>

                                        {/* Requirements */}
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                                                {language === 'ar' ? 'المتطلبات' : 'Requirements'}
                                            </h3>
                                            <ul className="space-y-2">
                                                {selectedJob.requirements.map((req, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0" />
                                                        <span>{req}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ApplicationSuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                type={modalType}
            />

            {/* Mobile Sidebar Navigation */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
        </div>
    );
}

export default function JobsPage() {
    return (
        <Suspense fallback={<div className="container-custom pt-8"><JobSkeletons /></div>}>
            <JobsContent />
        </Suspense>
    );
}
