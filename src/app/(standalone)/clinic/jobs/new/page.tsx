'use client';

// ============================================
// DentalHire - Create Hiring Request Page
// ============================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useJobCreationStore } from '@/store';

import { motion, AnimatePresence } from 'framer-motion';
import {
    Stethoscope,
    User,
    ClipboardList,
    Briefcase,
    Users,
    ArrowLeft,
    Check,
    MapPin,
    Sparkles,
    Building2,
    DollarSign,
    Calendar,
    Globe,
    Clock,
    ShoppingBag
} from 'lucide-react';
import { Button, Input } from '@/components/shared';

// --- Types ---
type JobType = 'full_time' | 'part_time' | 'contract';
type ExperienceLevel = '0-2' | '3-5' | '5+';

interface FormData {
    // Step A
    jobTitle: string;
    jobType: JobType;
    experience: ExperienceLevel;
    skills: string[];
    languages: string[];
    startDate: string;

    // Step B
    clinicName: string;
    country: string;
    city: string;
    location: string;
    specialization: string;

    // Step C
    salaryMin: number;
    salaryMax: number;
    workingHours: string;
    workingDays: number;
    description: string;
}

const initialFormData: FormData = {
    jobTitle: '',
    jobType: 'full_time',
    experience: '3-5',
    skills: [],
    languages: [],
    startDate: '',
    clinicName: '',
    country: '',
    city: '',
    location: '',
    specialization: '',
    salaryMin: 500000,
    salaryMax: 1500000,
    workingHours: '',
    workingDays: 5,
    description: '',
};

const jobRoles = [
    { id: 'dentist', label: 'طبيب أسنان', icon: Stethoscope, desc: 'تشخيص وعلاج مشاكل الأسنان' },
    { id: 'assistant', label: 'مساعد / مساعدة أسنان', icon: User, desc: 'مساعدة الطبيب وتجهيز الأدوات' },
    { id: 'technician', label: 'تقني أسنان', icon: ClipboardList, desc: 'تصنيع التعويضات السنية' },
    { id: 'sales_rep', label: 'مندوب مبيعات', icon: ShoppingBag, desc: 'تسويق وبيع المنتجات الطبية' },
    { id: 'receptionist', label: 'موظف استقبال', icon: Users, desc: 'إدارة المواعيد واستقبال المرضى' },
    { id: 'manager', label: 'مدير عيادة', icon: Building2, desc: 'الإشراف على تشغيل العيادة' },
];

export default function CreateJobPage() {
    // State
    const [step, setStep] = useState(1); // 1: Roles, 2: Form, 3: Success
    const [formStep, setFormStep] = useState<'A' | 'B' | 'C' | 'D'>('A');
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Handlers
    const router = useRouter();
    const { setDraftId, setSelectedRole: setStoreRole, setClinicId, setUserId } = useJobCreationStore();
    const { user } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitDraft = async (roleId: string) => {
        if (!user) {
            console.error('User not logged in, cannot create draft');
            // Check if we can redirect to login or show alert
            alert('الرجاء تسجيل الدخول أولاً');
            router.push('/login');
            return;
        }

        console.log('Submitting draft for user:', user.id, 'Role:', roleId);

        setIsSubmitting(true);
        try {
            const clinicId = user.id;

            const response = await fetch('/api/job-draft/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: roleId,
                    userId: user.id || 'temp-id', // Ensure ID is sent
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error('API Error:', errData);
                throw new Error(errData.error || 'Failed to create draft');
            }

            const data = await response.json();
            console.log('Draft created:', data);

            setDraftId(data.id);
            setClinicId(clinicId);
            setUserId(user.id);

            router.push('/clinic/jobs/new/details');
        } catch (err) {
            console.error('Submit Error:', err);
            // Verify if error is simply "Clinic profile not found" and redirect to profile creation if needed?
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleRoleSelect = (roleId: string) => {
        setSelectedRole(roleId);
        setStoreRole(roleId);
        // Pre-fill job title based on role
        const role = jobRoles.find(r => r.id === roleId);
        if (role) {
            setFormData(prev => ({ ...prev, jobTitle: role.label }));
        }
        // Auto-navigate
        submitDraft(roleId);
    };

    const handleContinue = () => {
        if (selectedRole) submitDraft(selectedRole);
    };

    const handleInputChange = (field: keyof FormData, value: string | number | string[]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAiOptimize = () => {
        setIsAiLoading(true);
        // Mock AI delay
        setTimeout(() => {
            setFormData(prev => ({
                ...prev,
                description: `نبحث عن ${formData.jobTitle} مؤهل وذو خبرة للانضمام إلى فريقنا المتميز في ${formData.clinicName || 'عيادتنا'}. \n\nالمسؤوليات الرئيسية:\n- تقديم رعاية عالية الجودة للمرضى.\n- العمل ضمن فريق متعاون.\n- الالتزام بمعايير السلامة والتعقيم.\n\nنحن نقدم بيئة عمل داعمة وفرص للتطور المهني.`
            }));
            setIsAiLoading(false);
        }, 1500);
    };

    const nextFormStep = () => {
        const steps: Record<string, 'A' | 'B' | 'C' | 'D'> = { 'A': 'B', 'B': 'C', 'C': 'D' };
        if (formStep !== 'D') setFormStep(steps[formStep]);
    };

    const prevFormStep = () => {
        const steps: Record<string, 'A' | 'B' | 'C' | 'D'> = { 'B': 'A', 'C': 'B', 'D': 'C' };
        if (formStep !== 'A') setFormStep(steps[formStep]);
        else setStep(1);
    };

    const handleSubmit = () => {
        // Mock API call
        setTimeout(() => {
            setStep(3);
        }, 1000);
    };

    // --- Render Steps ---

    const renderRolesStep = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {jobRoles.map((role) => (
                    <motion.div
                        key={role.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRoleSelect(role.id)}
                        className={`
                            relative cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300
                            flex flex-col items-center text-center gap-4 group
                            ${selectedRole === role.id
                                ? 'scale-105 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-[0_0_20px_rgba(59,130,246,0.3)] dark:shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md'}
                        `}
                    >
                        <div className={`
                            w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                            ${selectedRole === role.id
                                ? 'bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-lg shadow-blue-500/40 scale-110'
                                : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600'}
                        `}>
                            <role.icon size={28} />
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg mb-1 ${selectedRole === role.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                {role.label}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                                {role.desc}
                            </p>
                        </div>

                        {selectedRole === role.id && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-sm animate-in fade-in zoom-in duration-300">
                                <Check size={14} strokeWidth={3} />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    size="lg"
                    disabled={!selectedRole || isSubmitting}
                    onClick={handleContinue}
                    rightIcon={isSubmitting ? undefined : <ArrowLeft className="mr-2" />}
                    className="w-full md:w-auto text-lg px-8"
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            جاري البدء...
                        </div>
                    ) : (
                        'متابعة'
                    )}
                </Button>
            </div>
        </div>
    );

    const renderFormStep = () => (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Progress Bar */}
            <div className="flex border-b border-gray-100 dark:border-gray-700">
                {['A', 'B', 'C', 'D'].map((s, i) => (
                    <div
                        key={s}
                        className={`flex-1 h-1.5 transition-colors duration-500 ${['A', 'B', 'C', 'D'].indexOf(formStep) >= i ? 'bg-blue-500' : 'bg-gray-100 dark:bg-gray-700'}`}
                    />
                ))}
            </div>

            <div className="p-6 md:p-8">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={formStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* --- Step A: Job Info --- */}
                        {formStep === 'A' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">معلومات الوظيفة</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المسمى الوظيفي</label>
                                        <Input
                                            value={formData.jobTitle}
                                            onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                                            placeholder="مثال: طبيب أسنان عام"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع الوظيفة</label>
                                            <select
                                                aria-label="نوع الوظيفة"
                                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white"
                                                value={formData.jobType}
                                                onChange={(e) => handleInputChange('jobType', e.target.value)}
                                            >
                                                <option value="full_time">دوام كامل</option>
                                                <option value="part_time">دوام جزئي</option>
                                                <option value="contract">عقد</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الخبرة المطلوبة</label>
                                            <select
                                                aria-label="الخبرة المطلوبة"
                                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white"
                                                value={formData.experience}
                                                onChange={(e) => handleInputChange('experience', e.target.value)}
                                            >
                                                <option value="0-2">0 - 2 سنوات</option>
                                                <option value="3-5">3 - 5 سنوات</option>
                                                <option value="5+">5+ سنوات</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المهارات المطلوبة</label>
                                        <Input
                                            placeholder="أضف مهارات (مثال: جراحة، زراعة، تجميل...)"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = e.currentTarget.value.trim();
                                                    if (val) {
                                                        handleInputChange('skills', [...formData.skills, val]);
                                                        e.currentTarget.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {formData.skills.map((skill, i) => (
                                                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm flex items-center gap-1">
                                                    {skill}
                                                    <button onClick={() => handleInputChange('skills', formData.skills.filter((_, idx) => idx !== i))} className="hover:text-red-500" aria-label="remove skill"><Check size={14} className="rotate-45" /></button> {/* Using Check rotated as X for now, or replace with X icon */}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- Step B: Clinic Info --- */}
                        {formStep === 'B' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">معلومات العيادة</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم العيادة</label>
                                        <Input
                                            value={formData.clinicName}
                                            onChange={(e) => handleInputChange('clinicName', e.target.value)}
                                            placeholder="اسم العيادة كما سيظهر للمرشحين"
                                            leftIcon={<Building2 size={18} className="text-gray-400" />}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الدولة</label>
                                            <Input
                                                value={formData.country}
                                                onChange={(e) => handleInputChange('country', e.target.value)}
                                                placeholder="العراق"
                                                leftIcon={<Globe size={18} className="text-gray-400" />}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدينة</label>
                                            <Input
                                                value={formData.city}
                                                onChange={(e) => handleInputChange('city', e.target.value)}
                                                placeholder="بغداد"
                                                leftIcon={<MapPin size={18} className="text-gray-400" />}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تخصص العيادة</label>
                                        <select
                                            aria-label="تخصص العيادة"
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white"
                                            value={formData.specialization}
                                            onChange={(e) => handleInputChange('specialization', e.target.value)}
                                        >
                                            <option value="">اختر التخصص...</option>
                                            <option value="general">طب أسنان عام</option>
                                            <option value="orthodontics">تقويم أسنان</option>
                                            <option value="cosmetic">تجميل أسنان</option>
                                            <option value="surgery">جراحة فم وفكين</option>
                                            <option value="kids">طب أسنان أطفال</option>
                                        </select>
                                    </div>

                                    {/* Map Placeholder */}
                                    <div className="h-40 bg-gray-50 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 gap-2">
                                        <MapPin size={32} />
                                        <span className="text-sm">تحديد الموقع على الخريطة (قريباً)</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- Step C: Salary & Conditions --- */}
                        {formStep === 'C' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">الراتب والشروط</h2>

                                <div className="space-y-6">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-4 flex justify-between">
                                            <span>نطاق الراتب المتوقع</span>
                                            <span className="text-blue-600 dark:text-blue-400 text-lg">
                                                {(formData.salaryMin / 1000).toFixed(0)}k - {(formData.salaryMax / 1000).toFixed(0)}k IQD
                                            </span>
                                        </label>

                                        {/* Simple Range Inputs for Demo */}
                                        <div className="flex gap-4 items-center">
                                            <input
                                                type="range"
                                                aria-label="Minimum Salary"
                                                min="200000" max="5000000" step="100000"
                                                value={formData.salaryMin}
                                                onChange={(e) => handleInputChange('salaryMin', parseInt(e.target.value))}
                                                className="w-1/2 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <input
                                                type="range"
                                                aria-label="Maximum Salary"
                                                min="200000" max="5000000" step="100000"
                                                value={formData.salaryMax}
                                                onChange={(e) => handleInputChange('salaryMax', parseInt(e.target.value))}
                                                className="w-1/2 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ساعات العمل</label>
                                            <Input
                                                value={formData.workingHours}
                                                onChange={(e) => handleInputChange('workingHours', e.target.value)}
                                                placeholder="مثال: 9:00 ص - 5:00 م"
                                                leftIcon={<Clock size={18} className="text-gray-400" />}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">أيام العمل</label>
                                            <Input
                                                type="number"
                                                value={formData.workingDays}
                                                onChange={(e) => handleInputChange('workingDays', e.target.value)}
                                                leftIcon={<Calendar size={18} className="text-gray-400" />}
                                            />
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            الوصف الوظيفي
                                            <button
                                                onClick={handleAiOptimize}
                                                disabled={isAiLoading}
                                                className="mr-2 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 inline-flex transition-colors"
                                            >
                                                <Sparkles size={12} />
                                                {isAiLoading ? 'جاري التحسين...' : 'تحسين بالذكاء الاصطناعي'}
                                            </button>
                                        </label>
                                        <textarea
                                            className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[150px] focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-shadow"
                                            placeholder="اكتب تفاصيل الوظيفة هنا..."
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- Step D: Review --- */}
                        {formStep === 'D' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">مراجعة وتأكيد</h2>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl space-y-3">
                                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-600">
                                            <span className="font-bold text-gray-900 dark:text-white text-lg">{formData.jobTitle}</span>
                                            <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-3 py-1 rounded-full text-sm">
                                                {formData.jobType === 'full_time' ? 'دوام كامل' : 'دوام جزئي'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-300 grid grid-cols-2 gap-2">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={16} className="text-gray-400" />
                                                {formData.clinicName}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-gray-400" />
                                                {formData.city}, {formData.country}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Briefcase size={16} className="text-gray-400" />
                                                خبرة {formData.experience}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <DollarSign size={16} className="text-gray-400" />
                                                {(formData.salaryMin / 1000).toFixed(0)}k - {(formData.salaryMax / 1000).toFixed(0)}k
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">المهارات</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.skills.length > 0 ? formData.skills.map(s => (
                                                <span key={s} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm">{s}</span>
                                            )) : <span className="text-gray-400 text-sm">لم يتم تحديد مهارات</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">الوصف</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/20 p-4 rounded-xl leading-relaxed whitespace-pre-line">
                                            {formData.description || 'لا يوجد وصف'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Form Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                <Button
                    variant="ghost"
                    onClick={prevFormStep}
                    className="text-gray-500 hover:text-gray-700"
                >
                    {formStep === 'A' ? 'رجوع لتحديد الدور' : 'السابق'}
                </Button>

                {formStep === 'D' ? (
                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        className="px-8 bg-green-600 hover:bg-green-700 text-white"
                        rightIcon={<Check size={18} className="mr-2" />}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                جاري النشر...
                            </div>
                        ) : (
                            'نشر طلب التوظيف'
                        )}
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        onClick={nextFormStep}
                        rightIcon={<ArrowLeft size={18} className="mr-2" />}
                    >
                        التالي
                    </Button>
                )}
            </div>
        </div>
    );

    const renderSuccessStep = () => (
        <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in zoom-in duration-500">
            {/* Success Animation & Message */}
            <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50 dark:ring-green-900/10">
                    <Check size={48} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">تم نشر طلب التوظيف بنجاح!</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        إعلانك الآن مباشر وسيظهر للمرشحين المناسبين.
                    </p>
                </div>

                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => { setStep(1); setFormStep('A'); setFormData(initialFormData); }}>
                        إنشاء إعلان جديد
                    </Button>
                    <Button onClick={() => window.location.href = '/clinic/candidates'}>
                        عرض المرشحين
                    </Button>
                </div>
            </div>

            {/* Smart Suggestions */}
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Sparkles className="text-yellow-500" />
                    مرشحون مقترحون لك
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start gap-4 hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                {/* Placeholder Avatar */}
                                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">د. سارة أحمد</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formData.jobTitle}</p>
                                    </div>
                                    <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                        9{i}% تطابق
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 flex gap-2">
                                    <span>5 سنوات خبرة</span>
                                    <span>•</span>
                                    <span>بغداد</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-20" dir="rtl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 mb-8">
                <div className="container-custom">
                    <h1 className="text-3xl font-bold mb-2">لنساعدك في العثور على الموظف المثالي لعيادتك</h1>
                    <p className="text-blue-100 text-lg opacity-90 max-w-2xl">
                        املأ التفاصيل التالية ليظهر إعلان التوظيف للمرشحين المتخصصين في المجال الطبي.
                    </p>
                </div>
            </div>

            <div className="container-custom">
                {step === 1 && renderRolesStep()}
                {step === 2 && (
                    <div className="max-w-4xl mx-auto">
                        {renderFormStep()}
                    </div>
                )}
                {step === 3 && renderSuccessStep()}
            </div>
        </div>
    );
}
