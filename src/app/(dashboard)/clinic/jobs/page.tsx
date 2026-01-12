'use client';

// ============================================
// DentalHire - Clinic Job Postings Page (Bilingual)
// ============================================

import { useState, useEffect } from 'react';
import { useJobStore } from '@/store/useJobStore';
import { useAuthStore } from '@/store';
import { Card, Button, Input, TimeSelect } from '@/components/shared';
import { useSearchParams, useRouter } from 'next/navigation';
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
    const router = useRouter();

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
        locationProvince: '',
        locationDistrict: '',
        locationNeighborhood: '',
        employmentType: 'full_time' as EmploymentType,
        gender: 'any' as 'male' | 'female' | 'any',
        workingHours: { start: '09:00', end: '17:00' },
        skills: '',
    });

    const smartTemplates: Record<string, {
        ar: { description: string, requirements: string, salary: { min: number, max: number } },
        en: { description: string, requirements: string, salary: { min: number, max: number } },
        skills: { ar: string[], en: string[] }
    }> = {
        'dentist': {
            ar: {
                description: "نبحث عن طبيب أسنان ذو خبرة وكفاءة للانضمام إلى فريقنا. المرشح المثالي يجب أن يكون شغوفًا بتقديم رعاية ممتازة للمرضى ويمتلك مهارات تواصل قوية.",
                requirements: "بكالوريوس طب وفم أسنان, ممارسة المهنة لمدة لا تقل عن سنتين, ترخيص مزاولة مهنة ساري المفعول",
                salary: { min: 1500000, max: 3000000 }
            },
            en: {
                description: "We are looking for an experienced and skilled Dentist to join our team. The ideal candidate should be passionate about providing excellent patient care and possess strong communication skills.",
                requirements: "BDS or DMD degree, Minimum 2 years of practice, Valid license",
                salary: { min: 1500000, max: 3000000 }
            },
            skills: {
                ar: ['علاج جذور', 'حشوات تجميلية', 'قلع جراحي', 'تقويم أسنان', 'زراعة أسنان', 'تيجان وجسور'],
                en: ['Root Canal', 'Cosmetic Fillings', 'Surgical Extraction', 'Orthodontics', 'Implants', 'Crowns & Bridges']
            }
        },
        'dental_assistant': {
            ar: {
                description: "مطلوب مساعد/ة طبيب أسنان منظم ونشيط للمساعدة في العمليات اليومية للعيادة. ستشمل المسؤوليات تعقيم الأدوات، وتحضير المواد، ومساعدة الطبيب أثناء الإجراءات.",
                requirements: "خبرة سابقة في عيادات الأسنان, معرفة بأسماء الأدوات والمواد, مهارات تواصل جيدة",
                salary: { min: 500000, max: 800000 }
            },
            en: {
                description: "We require an organized and energetic Dental Assistant to help with daily clinic operations. Responsibilities include sterilization, material prep, and chairside assistance.",
                requirements: "Previous dental clinic experience, Knowledge of instruments/materials, Good communication skills",
                salary: { min: 500000, max: 800000 }
            },
            skills: {
                ar: ['تعقيم', 'مساعدة كرسي (4-handed)', 'إدارة مخزون', 'أشعة سينية', 'تحضير المواد', 'استقبال المرضى'],
                en: ['Sterilization', '4-Handed Dentistry', 'Inventory Management', 'X-Ray', 'Material Prep', 'Patient Reception']
            }
        },
        'secretary': {
            ar: {
                description: "نبحث عن سكرتير/ة لإدارة استقبال العيادة والمواعيد. الوجه البشوش والتعامل اللبق مع المرضى هو أولويتنا.",
                requirements: "لباقة في الحديث, استخدام الحاسوب (Word/Excel), القدرة على تنظيم المواعيد",
                salary: { min: 400000, max: 700000 }
            },
            en: {
                description: "Looking for a specialized Secretary to manage clinic reception and appointments. A welcoming attitude and polite interaction with patients is our priority.",
                requirements: "Polite communication, Computer literacy (Word/Excel), Scheduling ability",
                salary: { min: 400000, max: 700000 }
            },
            skills: {
                ar: ['إدارة مواعيد', 'إكسل و وورد', 'رد على الهاتف', 'حسابات بسيطة', 'لباقة في الكلام', 'تنظيم ملفات'],
                en: ['Scheduling', 'Excel & Word', 'Phone Etiquette', 'Basic Accounting', 'Communication', 'Filing']
            }
        },
        'dental_technician': {
            ar: {
                description: "مختبرنا بحاجة إلى فني أسنان ماهر لديه خبرة في صناعة التعويضات السنية بدقة واحترافية.",
                requirements: "دبلوم صناعة أسنان, دقة في العمل, خبرة في السيراميك أو الأكريلك",
                salary: { min: 800000, max: 1500000 }
            },
            en: {
                description: "Our lab needs a skilled Dental Technician experienced in crafting dental prosthetics with precision and professionalism.",
                requirements: "Dental Technology Diploma, Attention to detail, Experience in Ceramics or Acrylics",
                salary: { min: 800000, max: 1500000 }
            },
            skills: {
                ar: ['تشميع', 'صب قوالب', 'سيراميك', 'أكريلك', 'تصميم CAD/CAM'],
                en: ['Waxing', 'Casting', 'Ceramics', 'Acrylic', 'CAD/CAM Design']
            }
        },
        'sales_rep': {
            ar: {
                description: "مطلوب مندوب مبيعات لشركة مستلزمات طبية/سنية. العمل يتطلب زيارة العيادات وبناء علاقات مع الأطباء.",
                requirements: "سيارة خاصة, خبرة في المبيعات (يفضل في المجال الطبي), مهارات إقناع",
                salary: { min: 600000, max: 1200000 }
            },
            en: {
                description: "Sales Representative needed for a dental/medical supply company. Work involves visiting clinics and building relationships with doctors.",
                requirements: "Own car, Sales experience (medical preferred), Persuasion skills",
                salary: { min: 600000, max: 1200000 }
            },
            skills: {
                ar: ['تسويق ميداني', 'إغلاق صفقات', 'بناء علاقات', 'قيادة سيارة', 'تفاوض'],
                en: ['Field Marketing', 'Closing Deals', 'Relationship Building', 'Driving', 'Negotiation']
            }
        }
    };

    const applyTemplate = (roleId: string) => {
        const template = smartTemplates[roleId];
        if (!template) return;

        const langData = language === 'ar' ? template.ar : template.en;
        const skills = language === 'ar' ? template.skills.ar : template.skills.en;

        setForm(prev => ({
            ...prev,
            description: langData.description,
            requirements: langData.requirements,
            salary: langData.salary,
            skills: skills.join(', ')
        }));
    };

    const getSmartSkills = (roleId: string) => {
        const template = smartTemplates[roleId];
        if (!template) return [];
        return language === 'ar' ? template.skills.ar : template.skills.en;
    };

    const resetForm = () => {
        setForm({
            title: '',
            description: '',
            requirements: '',
            salary: { min: 0, max: 0 },
            location: '',
            locationProvince: '',
            locationDistrict: '',
            locationNeighborhood: '',
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
        if (!form.title || !form.locationProvince) {
            alert(t.enterTitleLocation);
            return;
        }

        setIsGenerating(true);
        try {
            const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
            const fullLocation = `${form.locationProvince} - ${form.locationDistrict} ${form.locationNeighborhood ? '- ' + form.locationNeighborhood : ''}`;
            const description = await generateJobDescription(form.title, skills, fullLocation);
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

        // Construct full location string
        let fullLocation = form.locationProvince;
        if (form.locationDistrict) fullLocation += ` - ${form.locationDistrict}`;
        if (form.locationNeighborhood) fullLocation += ` - ${form.locationNeighborhood}`;

        const jobData = {
            clinicId: clinicId,
            clinicName: clinicName || 'Unknown Clinic',
            title: form.title,
            description: form.description,
            requirements: form.requirements.split(',').map((r) => r.trim()).filter(Boolean),
            salary: { ...form.salary, currency: 'USD' },
            location: fullLocation,
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
        // Try to parse existing location string back to parts (heuristic)
        const parts = job.location.split(' - ');

        setForm({
            title: job.title,
            description: job.description,
            requirements: job.requirements.join(', '),
            salary: { min: job.salary.min, max: job.salary.max },
            location: job.location,
            locationProvince: parts[0] || '',
            locationDistrict: parts[1] || '',
            locationNeighborhood: parts[2] || '',
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
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                aria-label={t.searchJobs}
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
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {language === 'ar' ? 'نوع الوظيفة (قوالب جاهزة) ✨' : 'Job Type (Smart Templates) ✨'}
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {[
                                            { id: 'dentist', label: language === 'ar' ? 'طبيب أسنان' : 'Dentist', icon: '👨‍⚕️' },
                                            { id: 'dental_assistant', label: language === 'ar' ? 'مساعد طبيب' : 'Assistant', icon: '🦷' },
                                            { id: 'dental_technician', label: language === 'ar' ? 'فني أسنان' : 'Technician', icon: '🛠️' },
                                            { id: 'secretary', label: language === 'ar' ? 'سكرتارية' : 'Secretary', icon: '📝' },
                                            { id: 'sales_rep', label: language === 'ar' ? 'مندوب' : 'Sales', icon: '💼' },
                                            { id: 'custom', label: language === 'ar' ? 'آخر' : 'Other', icon: '✏️' },
                                        ].map((role) => (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => {
                                                    if (role.id === 'custom') {
                                                        setForm(prev => ({ ...prev, title: '' }));
                                                    } else {
                                                        setForm(prev => ({ ...prev, title: role.label }));
                                                        applyTemplate(role.id);
                                                    }
                                                }}
                                                className={`p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-2 ${(role.id === 'custom' && !Object.keys(smartTemplates).includes(Object.keys(smartTemplates).find(k => form.title.includes(smartTemplates[k].ar.description.split(' ')[0])) || '')) ||
                                                    (role.id !== 'custom' && form.title === role.label)
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                    }`}
                                            >
                                                <span className="text-xl">{role.icon}</span>
                                                {role.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Input
                                    label={t.jobTitle}
                                    placeholder={t.jobTitlePlaceholder}
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    required
                                />
                            </div>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {language === 'ar' ? 'المحافظة *' : 'Province *'}
                                    </label>
                                    <select
                                        value={form.locationProvince}
                                        onChange={(e) => {
                                            setForm({
                                                ...form,
                                                locationProvince: e.target.value,
                                                locationDistrict: '',
                                                locationNeighborhood: ''
                                            });
                                        }}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    >
                                        <option value="" disabled>{language === 'ar' ? 'اختر المحافظة' : 'Select Province'}</option>
                                        {Object.keys(iraqLocations).map((loc) => (
                                            <option key={loc} value={loc}>
                                                {language === 'ar' ? (iraqLocations as any)[loc].ar : loc}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {form.locationProvince && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                {language === 'ar' ? 'القضاء *' : 'District *'}
                                            </label>
                                            <select
                                                value={form.locationDistrict}
                                                onChange={(e) => {
                                                    setForm({
                                                        ...form,
                                                        locationDistrict: e.target.value,
                                                        locationNeighborhood: ''
                                                    });
                                                }}
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                required
                                            >
                                                <option value="" disabled>{language === 'ar' ? 'اختر القضاء' : 'Select District'}</option>
                                                {form.locationProvince && iraqLocations[form.locationProvince]?.districts.map((district) => (
                                                    <option key={district.en} value={district.en}>
                                                        {language === 'ar' ? district.ar : district.en}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                {language === 'ar' ? 'الحي / المنطقة' : 'Neighborhood'}
                                            </label>
                                            <select
                                                value={form.locationNeighborhood}
                                                onChange={(e) => setForm({ ...form, locationNeighborhood: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            >
                                                <option value="">{language === 'ar' ? 'اختر الحي (اختياري)' : 'Select Neighborhood (Optional)'}</option>
                                                {form.locationProvince && form.locationDistrict &&
                                                    iraqLocations[form.locationProvince]?.districts
                                                        .find(d => d.en === form.locationDistrict)?.neighborhoods?.map((neigh) => (
                                                            <option key={neigh.en} value={neigh.en}>
                                                                {language === 'ar' ? neigh.ar : neigh.en}
                                                            </option>
                                                        ))
                                                }
                                            </select>
                                        </div>
                                    </div>
                                )}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <TimeSelect
                                        label={t.from}
                                        value={form.workingHours.start}
                                        onChange={(val) => setForm({
                                            ...form,
                                            workingHours: { ...form.workingHours, start: val }
                                        })}
                                    />
                                    <TimeSelect
                                        label={t.to}
                                        value={form.workingHours.end}
                                        onChange={(val) => setForm({
                                            ...form,
                                            workingHours: { ...form.workingHours, end: val }
                                        })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Input
                                    label={t.requiredSkills}
                                    placeholder={t.skillsPlaceholder}
                                    value={form.skills}
                                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                                />
                                {/* Smart Skills Suggestions */}
                                {getSmartSkills(form.title).length > 0 && (
                                    <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                            <span className="text-amber-500">✨</span>
                                            {language === 'ar' ? 'مهارات مقترحة:' : 'Suggested Skills:'}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {/* Heuristic to find role ID from title for skills */}
                                            {(() => {
                                                const titleLower = form.title.toLowerCase();
                                                let roleId = 'custom';
                                                if (titleLower.includes('dentist') || titleLower.includes('طبيب')) roleId = 'dentist';
                                                else if (titleLower.includes('assistant') || titleLower.includes('مساعد')) roleId = 'dental_assistant';
                                                else if (titleLower.includes('technician') || titleLower.includes('فني')) roleId = 'dental_technician';
                                                else if (titleLower.includes('secretary') || titleLower.includes('سكرتير')) roleId = 'secretary';
                                                else if (titleLower.includes('sales') || titleLower.includes('مندوب')) roleId = 'sales_rep';

                                                return getSmartSkills(roleId).map((skill) => {
                                                    const currentSkills = form.skills.toLowerCase().split(',').map(s => s.trim());
                                                    const isSelected = currentSkills.includes(skill.toLowerCase());

                                                    if (isSelected) return null;

                                                    return (
                                                        <button
                                                            key={skill}
                                                            type="button"
                                                            onClick={() => {
                                                                const newSkills = form.skills
                                                                    ? `${form.skills}, ${skill}`
                                                                    : skill;
                                                                setForm({ ...form, skills: newSkills });
                                                            }}
                                                            className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors border border-blue-100 dark:border-blue-800"
                                                        >
                                                            + {skill}
                                                        </button>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>

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
                        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                            <div className="flex-1 w-full">
                                <div className="flex items-center gap-3 flex-wrap">
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
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
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
                                <div className="flex items-center gap-4 mt-3 flex-wrap">
                                    <span className="flex items-center gap-1 text-blue-600">
                                        <Users size={16} /> {job.applications} {t.applicants}
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                        onClick={() => {
                                            const lowerTitle = job.title.toLowerCase();
                                            let roleId = '';
                                            if (lowerTitle.includes('dentist') || lowerTitle.includes('طبيب')) roleId = 'dentist';
                                            else if (lowerTitle.includes('assistant') || lowerTitle.includes('مساعد')) roleId = 'dental_assistant';
                                            else if (lowerTitle.includes('technician') || lowerTitle.includes('فني')) roleId = 'dental_technician';
                                            else if (lowerTitle.includes('secretary') || lowerTitle.includes('سكرتير')) roleId = 'secretary';
                                            else if (lowerTitle.includes('sales') || lowerTitle.includes('مندوب')) roleId = 'sales_rep';

                                            const locParts = job.location.split(' - ');
                                            const province = locParts[0] || '';

                                            const params = new URLSearchParams();
                                            if (roleId) params.set('role', roleId);
                                            if (province) params.set('location', province);
                                            if (job.salary.min) params.set('minSalary', job.salary.min.toString());
                                            if (job.salary.max) params.set('maxSalary', job.salary.max.toString());

                                            router.push(`/clinic/search?${params.toString()}`);
                                        }}
                                    >
                                        <span className="text-lg">⚡</span>
                                        {language === 'ar' ? 'عرض المرشحين' : 'View Matches'}
                                    </Button>
                                    <span className="text-xs text-gray-400">
                                        {t.posted} {formatRelativeTime(job.createdAt)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto justify-end">
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
