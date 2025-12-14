'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@/lib/validations';
import { useAuthStore } from '@/store';
import { Button, Input } from '@/components/shared';
import {
    Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft,
    Briefcase, Building2, Users, ShoppingBag, AlertCircle,
    Stethoscope, UserCircle, Megaphone, Microscope, FlaskConical
} from 'lucide-react';
import { UserType } from '@/types';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { language } = useLanguage();

    const defaultRole = (searchParams.get('role') === 'clinic' ? 'clinic' : 'job_seeker') as 'job_seeker' | 'clinic';
    const hasRoleParam = searchParams.has('role');
    const defaultType = (searchParams.get('userType') as UserType) || (defaultRole === 'clinic' ? 'clinic' : 'dental_assistant');

    const { register: authRegister, isLoading, error, clearError, isAuthenticated, user } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            const role = user.role || 'job_seeker';
            const typeToDashboard: Record<string, string> = {
                dentist: 'dentist',
                dental_assistant: 'assistant',
                sales_rep: 'sales',
                secretary: 'secretary',
                media: 'media',
                dental_technician: 'technician',
            };

            if (role === 'clinic') {
                router.replace('/clinic/dashboard');
            } else if (role === 'admin') {
                router.replace('/admin/dashboard');
            } else {
                // Use typeToDashboard for job seeker routing
                const dashboard = typeToDashboard[user.userType] || 'job-seeker';
                router.replace(`/${dashboard}/dashboard`);
            }
        }
    }, [isAuthenticated, user, router]);
    const [step, setStep] = useState(hasRoleParam ? 3 : 1);
    const [selectedRole, setSelectedRole] = useState<'job_seeker' | 'clinic' | null>(hasRoleParam ? defaultRole : null);
    const [selectedType, setSelectedType] = useState<UserType>(defaultType);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            role: defaultRole,
            userType: defaultType,
            agreeToTerms: false,
        },
    });

    const onSubmit = async (data: RegisterInput) => {
        if (!selectedRole) return;

        clearError();
        const success = await authRegister({
            email: data.email,
            password: data.password,
            role: selectedRole,
            userType: selectedType,
            firstName: data.firstName,
            lastName: data.lastName,
        });

        if (success) {
            if (selectedRole === 'clinic') {
                // Employer Dashboards
                if (selectedType === 'company') router.push('/company/dashboard');
                else if (selectedType === 'lab') router.push('/lab/dashboard');
                else router.push('/clinic/dashboard'); // default clinic
            } else {
                // Job Seeker Dashboards
                const typeToDashboard: Record<string, string> = {
                    dentist: 'dentist',
                    dental_assistant: 'assistant',
                    sales_rep: 'sales',
                    secretary: 'secretary',
                    media: 'media',
                    dental_technician: 'technician',
                };
                const dashboard = typeToDashboard[selectedType] || 'job-seeker';
                router.push(`/${dashboard}/dashboard`);
            }
        }
    };

    const translations = {
        ar: {
            title: 'إنشاء حساب جديد',
            subtitle: 'انضم إلى DentalHire اليوم',
            mainQuestion: 'أنا أبحث عن',
            jobSeeker: 'عن وظيفة',
            jobSeekerDesc: 'أطباء، مساعدين، تقنيين، مندوبين، والمزيد',
            employer: 'عن موظفين',
            employerDesc: 'عيادات، شركات، ومختبرات تبحث عن كوادر',
            selectRole: 'اختر التخصص',
            selectEmployerType: 'هل أنت',
            // Seekers
            dentist: 'طبيب أسنان',
            dentistDesc: 'عام أو متخصص',
            assistant: 'مساعد طبيب',
            assistantDesc: 'مساعد، تعقيم، إدارة',
            sales: 'مندوب مبيعات',
            salesDesc: 'مبيعات لشركات طبية',
            secretary: 'سكرتير/موظف استقبال',
            secretaryDesc: 'إدارة مواعيد واستقبال',
            media: 'وجه إعلاني',
            mediaDesc: 'مودل أو مقدم محتوى',
            technician: 'تقني أسنان',
            technicianDesc: 'عمل في مختبرات الأسنان',
            // Employers
            clinic: 'عيادة أسنان',
            clinicDesc: 'أبحث عن أطباء ومساعدين',
            company: 'شركة تجارية',
            companyDesc: 'أبحث عن مندوبين ومسوقين',
            lab: 'مختبر أسنان',
            labDesc: 'أبحث عن تقنيين وحرفيين',

            continue: 'متابعة',
            back: 'رجوع',
            accountDetails: 'بيانات الحساب',
            firstName: 'الاسم الأول',
            lastName: 'اسم العائلة',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            confirmPassword: 'تأكيد كلمة المرور',
            agreeToTerms: 'أوافق على',
            terms: 'شروط الخدمة',
            and: 'و',
            privacy: 'سياسة الخصوصية',
            createAccount: 'إنشاء الحساب',
            haveAccount: 'لديك حساب بالفعل؟',
            signIn: 'تسجيل الدخول',
        },
        en: {
            title: 'Create New Account',
            subtitle: 'Join DentalHire Today',
            mainQuestion: 'I am looking for',
            jobSeeker: 'a Job',
            jobSeekerDesc: 'Dentists, Assistants, Techs, Sales, etc.',
            employer: 'Employees',
            employerDesc: 'Clinics, Companies, Labs looking to hire',
            selectRole: 'Select Role',
            selectEmployerType: 'Are you a',
            // Seekers
            dentist: 'Dentist',
            dentistDesc: 'General or Specialist',
            assistant: 'Dental Assistant',
            assistantDesc: 'Assisting, Sterilization, Admin',
            sales: 'Sales Representative',
            salesDesc: 'Medical Sales & Marketing',
            secretary: 'Secretary / Receptionist',
            secretaryDesc: 'Front desk management',
            media: 'Brand Face / Media',
            mediaDesc: 'Model or Content Creator',
            technician: 'Dental Technician',
            technicianDesc: 'Lab Work & Prosthetics',
            // Employers
            clinic: 'Dental Clinic',
            clinicDesc: 'Hiring Dentists & Staff',
            company: 'Medical Company',
            companyDesc: 'Hiring Sales & Marketing',
            lab: 'Dental Laboratory',
            labDesc: 'Hiring Technicians',

            continue: 'Continue',
            back: 'Back',
            accountDetails: 'Account Details',
            firstName: 'First Name',
            lastName: 'Last Name',
            email: 'Email',
            password: 'Password',
            confirmPassword: 'Confirm Password',
            agreeToTerms: 'I agree to the',
            terms: 'Terms of Service',
            and: 'and',
            privacy: 'Privacy Policy',
            createAccount: 'Create Account',
            haveAccount: 'Already have an account?',
            signIn: 'Sign in',
        },
    };

    const t = translations[language as keyof typeof translations];
    const isRTL = language === 'ar';

    const mainRoles = [
        {
            value: 'job_seeker',
            label: t.jobSeeker,
            description: t.jobSeekerDesc,
            icon: <Briefcase className="w-12 h-12" />,
            gradient: 'from-blue-500 to-cyan-500',
        },
        {
            value: 'clinic', // representing Employer
            label: t.employer,
            description: t.employerDesc,
            icon: <Building2 className="w-12 h-12" />,
            gradient: 'from-purple-500 to-pink-500',
        },
    ];

    const jobSeekerTypes = [
        { value: 'dentist', label: t.dentist, description: t.dentistDesc, icon: <Stethoscope className="w-8 h-8" />, color: 'blue' },
        { value: 'dental_assistant', label: t.assistant, description: t.assistantDesc, icon: <Users className="w-8 h-8" />, color: 'teal' },
        { value: 'dental_technician', label: t.technician, description: t.technicianDesc, icon: <Microscope className="w-8 h-8" />, color: 'indigo' },
        { value: 'secretary', label: t.secretary, description: t.secretaryDesc, icon: <UserCircle className="w-8 h-8" />, color: 'purple' },
        { value: 'sales_rep', label: t.sales, description: t.salesDesc, icon: <ShoppingBag className="w-8 h-8" />, color: 'green' },
        { value: 'media', label: t.media, description: t.mediaDesc, icon: <Megaphone className="w-8 h-8" />, color: 'pink' },
    ];

    const employerTypes = [
        { value: 'clinic', label: t.clinic, description: t.clinicDesc, icon: <Stethoscope className="w-8 h-8" />, color: 'blue' },
        { value: 'company', label: t.company, description: t.companyDesc, icon: <Building2 className="w-8 h-8" />, color: 'cyan' },
        { value: 'lab', label: t.lab, description: t.labDesc, icon: <FlaskConical className="w-8 h-8" />, color: 'indigo' },
    ];

    const getErrorMessage = (errorKey: string | null) => {
        if (!errorKey) return null;

        // Handle Supabase error messages that might not be caught by our store logic
        if (!errorKey.startsWith('auth.')) return errorKey;

        const errorMap: Record<string, { ar: string, en: string }> = {
            'auth.invalid_credentials': { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Invalid email or password' },
            'auth.email_not_confirmed': { ar: 'يرجى تأكيد البريد الإلكتروني الخاص بك', en: 'Please confirm your email address' },
            'auth.login_failed': { ar: 'فشل تسجيل الدخول', en: 'Login failed' },
            'auth.login_error': { ar: 'حدث خطأ أثناء تسجيل الدخول', en: 'An error occurred during login' },
            'auth.oauth_failed': { ar: 'فشل تسجيل الدخول عبر وسائل التواصل الاجتماعي', en: 'Social login failed' },
            'auth.rate_limit': { ar: 'يرجى الانتظار قليلاً قبل المحاولة مرة أخرى', en: 'Please wait a few seconds before trying again' },
            'auth.email_exists': { ar: 'هذا البريد الإلكتروني مسجل بالفعل. حاول تسجيل الدخول.', en: 'This email is already registered. Try logging in.' },
            'auth.registration_failed': { ar: 'فشل إنشاء الحساب', en: 'Registration failed' },
            'auth.registration_error': { ar: 'حدث خطأ أثناء إنشاء الحساب', en: 'An error occurred during registration' },
        };

        const translation = errorMap[errorKey];
        return translation ? (language === 'ar' ? translation.ar : translation.en) : errorKey;
    };

    return (
        <div className="w-full">
            <div className="w-full">
                {/* Language Toggle */}
                <LanguageSwitcher className="fixed top-6 end-6 z-50" />

                {/* Main Content Area */}
                <div className="bg-transparent pt-12">
                    <div className="p-4 md:p-8">
                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Registration failed</p>
                                    <p className="text-sm text-red-600 dark:text-red-300">{getErrorMessage(error)}</p>
                                </div>
                            </div>
                        )}

                        {/* Step 1: Main Role Selection */}
                        {step === 1 && (
                            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
                                    {t.mainQuestion}
                                </h2>

                                <div className="flex flex-col md:flex-row gap-6 justify-center items-stretch">
                                    {mainRoles.map((role) => (
                                        <button
                                            key={role.value}
                                            onClick={() => {
                                                setSelectedRole(role.value as 'job_seeker' | 'clinic');
                                                setStep(2);
                                            }}
                                            className="group relative flex-1 w-full md:w-auto md:min-w-[300px] min-h-[220px] md:min-h-[320px] p-6 md:p-10 rounded-[2rem] border-2 border-gray-100 dark:border-gray-700 hover:border-transparent transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-2xl flex flex-col items-center justify-center transform hover:-translate-y-2"
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                                            <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                                                <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${role.gradient} flex items-center justify-center text-white shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                                    <div className="scale-150">
                                                        {role.icon}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                                        {role.label}
                                                    </h3>
                                                    <p className="text-lg font-medium text-gray-600 dark:text-gray-200 leading-relaxed max-w-[200px] mx-auto">
                                                        {role.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Specific Type Selection */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => {
                                            setStep(1);
                                            setSelectedRole(null);
                                        }}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm group"
                                    >
                                        <div className="group-hover:-translate-x-1 transition-transform rtl:group-hover:translate-x-1">
                                            {isRTL ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                                        </div>
                                        <span className="text-sm tracking-wide">{t.back}</span>
                                    </button>
                                </div>

                                <div className="text-center space-y-4 mb-8">
                                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                                        {selectedRole === 'clinic' ? t.selectEmployerType : t.selectRole}
                                    </h2>
                                    <p className="text-xl font-medium text-gray-600 dark:text-gray-300">
                                        {selectedRole === 'clinic' ? t.employerDesc : t.jobSeekerDesc}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto py-8">
                                    {(selectedRole === 'clinic' ? employerTypes : jobSeekerTypes).map((type) => {
                                        const colorVariants: Record<string, {
                                            border: string;
                                            bg: string;
                                            iconBg: string;
                                            text: string;
                                        }> = {
                                            blue: { border: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10', iconBg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
                                            teal: { border: 'border-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/10', iconBg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400' },
                                            cyan: { border: 'border-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/10', iconBg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
                                            green: { border: 'border-green-500', bg: 'bg-green-50 dark:bg-green-900/10', iconBg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
                                            purple: { border: 'border-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10', iconBg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
                                            pink: { border: 'border-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/10', iconBg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
                                            indigo: { border: 'border-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
                                        };

                                        const styles = colorVariants[type.color || 'blue'];
                                        const isSelected = selectedType === type.value;

                                        return (
                                            <button
                                                key={type.value}
                                                onClick={() => {
                                                    setSelectedType(type.value as UserType);
                                                    setStep(3);
                                                }}
                                                className={`group relative flex flex-col items-center justify-center h-full min-h-[220px] p-6 rounded-[2rem] border-2 transition-all duration-300 ${isSelected
                                                    ? `${styles.border} ${styles.bg} shadow-xl scale-105`
                                                    : 'border-transparent bg-white/5 dark:bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 hover:shadow-2xl hover:-translate-y-2'
                                                    }`}
                                            >
                                                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg ${styles.iconBg} ${styles.text}`}>
                                                    <div className="scale-125">
                                                        {type.icon}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                        {type.label}
                                                    </h3>
                                                    <p className="text-base font-medium text-gray-600 dark:text-gray-300 line-clamp-2">
                                                        {type.description}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Account Details */}
                        {step === 3 && (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="flex items-center justify-between mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm group"
                                    >
                                        <div className="group-hover:-translate-x-1 transition-transform rtl:group-hover:translate-x-1">
                                            {isRTL ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                                        </div>
                                        <span className="text-sm tracking-wide">{t.back}</span>
                                    </button>
                                </div>

                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        {t.createAccount} – {(selectedRole === 'clinic' ? employerTypes : jobSeekerTypes).find(t => t.value === selectedType)?.label}
                                    </h2>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <Input
                                        label={t.firstName}
                                        placeholder="John"
                                        leftIcon={<User size={18} />}
                                        error={errors.firstName?.message}
                                        {...register('firstName')}
                                    />
                                    <Input
                                        label={t.lastName}
                                        placeholder="Doe"
                                        error={errors.lastName?.message}
                                        {...register('lastName')}
                                    />
                                </div>

                                <Input
                                    label={t.email}
                                    type="email"
                                    placeholder="you@example.com"
                                    leftIcon={<Mail size={18} />}
                                    error={errors.email?.message}
                                    {...register('email')}
                                />

                                <div className="relative">
                                    <Input
                                        label={t.password}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        leftIcon={<Lock size={18} />}
                                        error={errors.password?.message}
                                        {...register('password')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-9 text-gray-400 hover:text-gray-600`}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                <Input
                                    label={t.confirmPassword}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    leftIcon={<Lock size={18} />}
                                    error={errors.confirmPassword?.message}
                                    {...register('confirmPassword')}
                                />

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                                        {...register('agreeToTerms')}
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {t.agreeToTerms}{' '}
                                        <Link href="/terms" className="text-blue-600 hover:underline">{t.terms}</Link>
                                        {' '}{t.and}{' '}
                                        <Link href="/privacy" className="text-blue-600 hover:underline">{t.privacy}</Link>
                                    </span>
                                </label>
                                {errors.agreeToTerms && (
                                    <p className="text-sm text-red-500">{errors.agreeToTerms.message}</p>
                                )}

                                <Button
                                    type="submit"
                                    loading={isLoading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                                    rightIcon={isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                                >
                                    {t.createAccount}
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t.haveAccount}{' '}
                            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                {t.signIn}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <RegisterContent />
        </Suspense>
    );
}
