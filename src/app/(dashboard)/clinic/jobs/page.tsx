'use client';

// ============================================
// DentalHire - Clinic Job Postings Page (Bilingual)
// ============================================

import { useState, useEffect } from 'react';
import { useJobStore } from '@/store/useJobStore';
import { useAuthStore } from '@/store';
import { Card, Button, Input } from '@/components/shared';
import { useSearchParams } from 'next/navigation';
import { iraqLocations } from '@/data/iraq_locations';
import { formatRelativeTime, formatTime } from '@/lib/utils';
import { Job, EmploymentType } from '@/types';
import { generateJobDescription } from '@/lib/gemini';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSupabaseClient } from '@/lib/supabase';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Users,
    CheckCircle,
    Pause,
    X,
    MapPin,
    DollarSign,
    Clock,
} from 'lucide-react';

export default function ClinicJobsPage() {
    const { jobs, addJob, updateJob, deleteJob, loadClinicJobs } = useJobStore();
    const { user } = useAuthStore();
    const { language } = useLanguage();
    const [showForm, setShowForm] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [clinicId, setClinicId] = useState<string | null>(null);
    const [clinicName, setClinicName] = useState<string>('');
    const [loadingClinic, setLoadingClinic] = useState(true);
    const searchParams = useSearchParams();

    // Check for 'new' query param to open modal
    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            setShowForm(true);
        }
    }, [searchParams]);

    // Fetch clinic info on mount
    useEffect(() => {
        const fetchClinic = async () => {
            if (!user) {
                console.log('[fetchClinic] No user, skipping');
                return;
            }

            console.log('[fetchClinic] Starting RPC for user:', user.email);

            try {
                const supabase = getSupabaseClient();

                // USE THE FAILSAFE FUNCTION (RPC)
                // This bypasses RLS issues by running as system secure function
                const { data, error } = await supabase.rpc('get_my_clinic');

                console.log('[fetchClinic] RPC result:', { data, error });

                if (data && (data as any[]).length > 0) {
                    const clinic = (data as any[])[0];
                    console.log('[fetchClinic] Found clinic via RPC:', clinic.id);
                    setClinicId(clinic.id);
                    setClinicName(clinic.name);
                } else {
                    console.error('[fetchClinic] RPC returned no data:', error);
                    // This should not happen if the quick fix SQL was run
                    // But if it does, we avoid creating duplicates.
                    alert('Could not find your Clinic Profile. Please contact support.');
                }
            } catch (err: unknown) {
                console.error('[fetchClinic] Catch error:', err);
                const message = err instanceof Error ? err.message : 'Unknown error';
                alert(`Error: ${message}`);
            } finally {
                setLoadingClinic(false);
            }
        };

        fetchClinic();
    }, [user]);

    // Load jobs when clinicId is available
    useEffect(() => {
        if (clinicId) {
            loadClinicJobs(clinicId);
        }
    }, [clinicId, loadClinicJobs]);

    // Translations
    const t = {
        jobPostings: language === 'ar' ? 'إعلانات الوظائف' : 'Job Postings',
        manageJobs: language === 'ar' ? 'إدارة إعلانات الوظائف وعرض الطلبات' : 'Manage your job listings and view applications',
        postNewJob: language === 'ar' ? 'نشر وظيفة جديدة' : 'Post New Job',
        activeJobs: language === 'ar' ? 'الوظائف النشطة' : 'Active Jobs',
        totalApplications: language === 'ar' ? 'إجمالي الطلبات' : 'Total Applications',
        closedJobs: language === 'ar' ? 'الوظائف المغلقة' : 'Closed Jobs',
        searchJobs: language === 'ar' ? 'ابحث في إعلانات الوظائف...' : 'Search your job postings...',
        editJob: language === 'ar' ? 'تعديل إعلان الوظيفة' : 'Edit Job Posting',
        createJob: language === 'ar' ? 'إنشاء إعلان وظيفة جديد' : 'Create New Job Posting',
        jobTitle: language === 'ar' ? 'المسمى الوظيفي *' : 'Job Title *',
        jobTitlePlaceholder: language === 'ar' ? 'مثال: مساعد طبيب أسنان' : 'e.g., Dental Assistant',
        description: language === 'ar' ? 'الوصف *' : 'Description *',
        descriptionPlaceholder: language === 'ar' ? 'اكتب وصف الوظيفة والمسؤوليات...' : 'Describe the role and responsibilities...',
        suggestWithAI: language === 'ar' ? '✨ اقتراح بالذكاء الاصطناعي' : '✨ Suggest with AI',
        generating: language === 'ar' ? 'جاري التوليد...' : 'Generating...',
        requirements: language === 'ar' ? 'المتطلبات (مفصولة بفواصل)' : 'Requirements (comma separated)',
        requirementsPlaceholder: language === 'ar' ? 'مثال: شهادة RDA، خبرة سنتين+' : 'e.g., RDA Certification, 2+ years experience',
        minSalary: language === 'ar' ? 'الحد الأدنى للراتب' : 'Min Salary',
        maxSalary: language === 'ar' ? 'الحد الأقصى للراتب' : 'Max Salary',
        location: language === 'ar' ? 'الموقع *' : 'Location *',
        locationPlaceholder: language === 'ar' ? 'مثال: بغداد، العراق' : 'e.g., Los Angeles, CA',
        employmentType: language === 'ar' ? 'نوع التوظيف' : 'Employment Type',
        fullTime: language === 'ar' ? 'دوام كامل' : 'Full-Time',
        partTime: language === 'ar' ? 'دوام جزئي' : 'Part-Time',
        contract: language === 'ar' ? 'عقد' : 'Contract',
        temporary: language === 'ar' ? 'مؤقت' : 'Temporary',
        requiredSkills: language === 'ar' ? 'المهارات المطلوبة (مفصولة بفواصل)' : 'Required Skills (comma separated)',
        skillsPlaceholder: language === 'ar' ? 'مثال: العناية بالمرضى، الأشعة السينية، التعقيم' : 'e.g., Patient Care, X-rays, Sterilization',
        cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
        updateJob: language === 'ar' ? 'تحديث الوظيفة' : 'Update Job',
        postJob: language === 'ar' ? 'نشر الوظيفة' : 'Post Job',
        applicants: language === 'ar' ? 'متقدم' : 'applicants',
        posted: language === 'ar' ? 'نُشرت' : 'Posted',
        noJobsYet: language === 'ar' ? 'لا توجد إعلانات وظائف بعد' : 'No job postings yet',
        postFirstJob: language === 'ar' ? 'نشر أول وظيفة' : 'Post Your First Job',
        active: language === 'ar' ? 'نشط' : 'active',
        closed: language === 'ar' ? 'مغلق' : 'closed',
        paused: language === 'ar' ? 'متوقف' : 'paused',
        edit: language === 'ar' ? 'تعديل' : 'Edit',
        pause: language === 'ar' ? 'إيقاف' : 'Pause',
        activate: language === 'ar' ? 'تفعيل' : 'Activate',
        delete: language === 'ar' ? 'حذف' : 'Delete',
        enterTitleLocation: language === 'ar' ? 'يرجى إدخال المسمى الوظيفي والموقع أولاً.' : 'Please enter a Job Title and select a Location first.',
        generateFailed: language === 'ar' ? 'فشل في توليد الوصف. يرجى التحقق من مفتاح API.' : 'Failed to generate description. Please check your API key.',
        loadingClinic: language === 'ar' ? 'جاري تحميل بيانات العيادة...' : 'Loading clinic info...',
        clinicError: language === 'ar' ? 'لا يمكن العثور على بيانات العيادة. يرجى التواصل مع الدعم.' : 'Could not find clinic information. Please contact support.',
        gender: language === 'ar' ? 'الجنس المفضل' : 'Preferred Gender',
        male: language === 'ar' ? 'ذكر' : 'Male',
        female: language === 'ar' ? 'أنثى' : 'Female',
        anyGender: language === 'ar' ? 'الجنسين' : 'Any',
        workingHours: language === 'ar' ? 'ساعات العمل' : 'Working Hours',
        from: language === 'ar' ? 'من' : 'From',
        to: language === 'ar' ? 'إلى' : 'To',
    };

    // Filter jobs
    const clinicJobs = jobs.filter((job) => {
        // If we have a clinicId, only show jobs for this clinic
        if (clinicId && job.clinicId !== clinicId) return false;

        const matchesSearch =
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const [form, setForm] = useState({
        title: '',
        description: '',
        requirements: '',
        salary: { min: 0, max: 0 },
        location: '',
        employmentType: 'full_time' as EmploymentType,
        gender: 'any' as 'male' | 'female' | 'any',
        workingHours: { start: '09:00', end: '17:00' },
        skills: '',
    });

    const resetForm = () => {
        setForm({
            title: '',
            description: '',
            requirements: '',
            salary: { min: 0, max: 0 },
            location: '',
            employmentType: 'full_time',
            gender: 'any',
            workingHours: { start: '09:00', end: '17:00' },
            skills: '',
        });
        setShowForm(false);
        setEditingJob(null);
        setIsGenerating(false);
    };

    const handleGenerateDescription = async () => {
        if (!form.title || !form.location) {
            alert(t.enterTitleLocation);
            return;
        }

        setIsGenerating(true);
        try {
            const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
            const description = await generateJobDescription(form.title, skills, form.location);
            setForm(prev => ({ ...prev, description }));
        } catch (error) {
            console.error('Failed to generate description', error);
            alert(t.generateFailed);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!clinicId) {
            alert(t.clinicError);
            return;
        }

        const jobData = {
            clinicId: clinicId,
            clinicName: clinicName || 'Unknown Clinic',
            title: form.title,
            description: form.description,
            requirements: form.requirements.split(',').map((r) => r.trim()).filter(Boolean),
            salary: { ...form.salary, currency: 'USD' },
            location: form.location,
            employmentType: form.employmentType,
            gender: form.gender,
            workingHours: form.workingHours,
            skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
            status: 'active' as const,
        };

        let result = false;
        if (editingJob) {
            result = await updateJob(editingJob.id, jobData);
        } else {
            result = await addJob(jobData);
        }

        if (result) {
            resetForm();
        } else {
            // Optional: show error toast
        }
    };

    const handleEdit = (job: Job) => {
        setForm({
            title: job.title,
            description: job.description,
            requirements: job.requirements.join(', '),
            salary: { min: job.salary.min, max: job.salary.max },
            location: job.location,
            employmentType: job.employmentType,
            gender: job.gender || 'any',
            workingHours: job.workingHours || { start: '09:00', end: '17:00' },
            skills: job.skills.join(', '),
        });
        setEditingJob(job);
        setShowForm(true);
    };

    const handleToggleStatus = (job: Job) => {
        updateJob(job.id, {
            status: job.status === 'active' ? 'closed' : 'active',
        });
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return t.active;
            case 'closed': return t.closed;
            case 'paused': return t.paused;
            default: return status;
        }
    };

    const getEmploymentTypeLabel = (type: string) => {
        switch (type) {
            case 'full_time': return t.fullTime;
            case 'part_time': return t.partTime;
            case 'contract': return t.contract;
            case 'temporary': return t.temporary;
            default: return type.replace('_', ' ');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t.jobPostings}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {t.manageJobs}
                    </p>
                </div>
                <Button leftIcon={<Plus size={18} />} onClick={() => setShowForm(true)} disabled={loadingClinic}>
                    {loadingClinic ? t.loadingClinic : t.postNewJob}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {clinicJobs.filter((j) => j.status === 'active').length}
                        </p>
                        <p className="text-sm text-gray-500">{t.activeJobs}</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {clinicJobs.reduce((acc, job) => acc + job.applications, 0)}
                        </p>
                        <p className="text-sm text-gray-500">{t.totalApplications}</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {clinicJobs.filter((j) => j.status === 'closed').length}
                        </p>
                        <p className="text-sm text-gray-500">{t.closedJobs}</p>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <Input
                placeholder={t.searchJobs}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
            />

            {/* Job Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingJob ? t.editJob : t.createJob}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label={t.jobTitle}
                                placeholder={t.jobTitlePlaceholder}
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex justify-between items-center">
                                    <span>{t.description}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={handleGenerateDescription}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? t.generating : t.suggestWithAI}
                                    </Button>
                                </label>
                                <textarea
                                    placeholder={t.descriptionPlaceholder}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={4}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                />
                            </div>

                            <Input
                                label={t.requirements}
                                placeholder={t.requirementsPlaceholder}
                                value={form.requirements}
                                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label={t.minSalary}
                                    type="number"
                                    placeholder="45000"
                                    value={form.salary.min || ''}
                                    onChange={(e) =>
                                        setForm({ ...form, salary: { ...form.salary, min: parseInt(e.target.value) || 0 } })
                                    }
                                />
                                <Input
                                    label={t.maxSalary}
                                    type="number"
                                    placeholder="55000"
                                    value={form.salary.max || ''}
                                    onChange={(e) =>
                                        setForm({ ...form, salary: { ...form.salary, max: parseInt(e.target.value) || 0 } })
                                    }
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t.location}
                                </label>
                                <select
                                    value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                    aria-label={t.location}
                                >
                                    <option value="" disabled>{t.locationPlaceholder}</option>
                                    {Object.keys(iraqLocations).map((loc) => (
                                        <option key={loc} value={loc}>
                                            {language === 'ar' ? (iraqLocations as any)[loc].ar : loc}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t.employmentType}
                                </label>
                                <select
                                    value={form.employmentType}
                                    onChange={(e) => setForm({ ...form, employmentType: e.target.value as EmploymentType })}
                                    aria-label={t.employmentType}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="full_time">{t.fullTime}</option>
                                    <option value="part_time">{t.partTime}</option>
                                    <option value="contract">{t.contract}</option>
                                    <option value="temporary">{t.temporary}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t.gender}
                                </label>
                                <select
                                    value={form.gender}
                                    onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    aria-label={t.gender}
                                >
                                    <option value="any">{t.anyGender}</option>
                                    <option value="male">{t.male}</option>
                                    <option value="female">{t.female}</option>
                                </select>
                            </div>

                            {/* Working Hours - Below Employment Type */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t.workingHours}
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                            {t.from}
                                        </label>
                                        <input
                                            type="time"
                                            value={form.workingHours.start}
                                            onChange={(e) => setForm({
                                                ...form,
                                                workingHours: { ...form.workingHours, start: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            aria-label={`${t.workingHours} ${t.from}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                            {t.to}
                                        </label>
                                        <input
                                            type="time"
                                            value={form.workingHours.end}
                                            onChange={(e) => setForm({
                                                ...form,
                                                workingHours: { ...form.workingHours, end: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            aria-label={`${t.workingHours} ${t.to}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Input
                                label={t.requiredSkills}
                                placeholder={t.skillsPlaceholder}
                                value={form.skills}
                                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                            />

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
                                    {t.cancel}
                                </Button>
                                <Button type="submit" className="flex-1">
                                    {editingJob ? t.updateJob : t.postJob}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Jobs List */}
            <div className="space-y-4">
                {clinicJobs.map((job) => (
                    <Card key={job.id}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {job.title}
                                    </h3>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${job.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : job.status === 'closed'
                                                ? 'bg-gray-100 text-gray-700'
                                                : 'bg-amber-100 text-amber-700'
                                            }`}
                                    >
                                        {getStatusLabel(job.status)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <MapPin size={14} /> {job.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <DollarSign size={14} />
                                        {job.salary.min === 0 && job.salary.max === 0
                                            ? (language === 'ar' ? 'قابل للتفاوض' : 'Negotiable')
                                            : `${(job.salary.min < 1000 ? job.salary.min : (job.salary.min / 1000).toFixed(0))}-${(job.salary.max < 1000 ? job.salary.max : (job.salary.max / 1000).toFixed(0))} ألف د.ع`
                                        }
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} /> {getEmploymentTypeLabel(job.employmentType)}
                                    </span>
                                    {job.gender && job.gender !== 'any' && (
                                        <span className="flex items-center gap-1">
                                            <Users size={14} /> {job.gender === 'male' ? (language === 'ar' ? 'ذكر' : 'Male') : (language === 'ar' ? 'أنثى' : 'Female')}
                                        </span>
                                    )}
                                    {job.workingHours && (
                                        <span className="flex items-center gap-1" dir="ltr">
                                            <Clock size={14} /> {formatTime(job.workingHours.start, language)} - {formatTime(job.workingHours.end, language)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 mt-3">
                                    <span className="flex items-center gap-1 text-blue-600">
                                        <Users size={16} /> {job.applications} {t.applicants}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {t.posted} {formatRelativeTime(job.createdAt)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(job)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                    title={t.edit}
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(job)}
                                    className={`p-2 rounded-lg ${job.status === 'active'
                                        ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                        }`}
                                    title={job.status === 'active' ? t.pause : t.activate}
                                >
                                    {job.status === 'active' ? <Pause size={18} /> : <CheckCircle size={18} />}
                                </button>
                                <button
                                    onClick={() => deleteJob(job.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title={t.delete}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}

                {clinicJobs.length === 0 && (
                    <div className="text-center py-12">
                        <Plus size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">{t.noJobsYet}</p>
                        <Button className="mt-4" onClick={() => setShowForm(true)} disabled={loadingClinic}>
                            {t.postFirstJob}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
