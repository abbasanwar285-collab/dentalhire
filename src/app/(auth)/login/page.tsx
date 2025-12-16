'use client';

// ============================================
// DentalHire - Login Page with Supabase Auth
// ============================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/validations';
import { useAuthStore } from '@/store';
import { Button, Input } from '@/components/shared';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading, error, clearError, isAuthenticated, user } = useAuthStore();
    const { t, language } = useLanguage();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(() => {
        // Check localStorage for saved preference
        if (typeof window !== 'undefined') {
            return localStorage.getItem('rememberMe') === 'true';
        }
        return false;
    });

    // Handle URL errors (e.g. from Auth Callback)
    const [urlError, setUrlError] = useState<{ code: string; details?: string } | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const err = params.get('error');
            const details = params.get('details');
            if (err) {
                setUrlError({ code: err, details: details ? decodeURIComponent(details) : undefined });
            }
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && user) {
            switch (user.role) {
                case 'job_seeker':
                    router.replace('/job-seeker/dashboard');
                    break;
                case 'clinic':
                    router.replace('/clinic/dashboard');
                    break;
                case 'admin':
                    router.replace('/admin/dashboard');
                    break;
                default:
                    router.replace('/');
            }
        }
    }, [isAuthenticated, user, router]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: typeof window !== 'undefined' ? localStorage.getItem('savedEmail') || '' : '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginInput) => {
        console.log('[LoginPage] Form submitted:', { email: data.email });
        clearError();
        const success = await login(data.email, data.password);
        console.log('[LoginPage] Login result:', success);

        if (success) {
            // Save email if Remember Me is checked
            if (rememberMe && typeof window !== 'undefined') {
                localStorage.setItem('savedEmail', data.email);
            }

            // The store will have the user's role, redirect based on that
            const { user } = useAuthStore.getState();
            console.log('[LoginPage] Redirecting user role:', user?.role);
            if (user) {
                switch (user.role) {
                    case 'job_seeker':
                        router.push('/job-seeker/dashboard');
                        break;
                    case 'clinic':
                        router.push('/clinic/dashboard');
                        break;
                    case 'admin':
                        router.push('/admin/dashboard');
                        break;
                    default:
                        router.push('/');
                }
            }
        }
    };

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
        <div className="animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-6">
                <Link href="/" className="inline-flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                        DH
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                        Dental<span className="text-blue-600">Hire</span>
                    </span>
                </Link>
            </div>

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('auth.welcome')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    {t('auth.signin.subtitle')}
                </p>
            </div>

            {/* Error Message - Beautiful & Friendly Design */}
            {(error || urlError) && (
                <div className="mb-6 p-4 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl shadow-sm backdrop-blur-sm animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 text-red-500 dark:text-red-400">
                            <AlertCircle size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-0.5">
                                {language === 'ar' ? 'عذراً، تعذر الدخول' : 'Access Denied'}
                            </h3>
                            <p className="text-sm text-red-600 dark:text-red-400/90">
                                {urlError ? (
                                    <>
                                        {getErrorMessage(urlError.code)}
                                        {urlError.details && (
                                            <span className="block text-xs mt-1 opacity-80" dir="ltr">
                                                Debug: {urlError.details}
                                            </span>
                                        )}
                                    </>
                                ) : getErrorMessage(error)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                    label={t('auth.email')}
                    type="email"
                    placeholder="you@example.com"
                    leftIcon={<Mail size={18} />}
                    error={errors.email?.message}
                    {...register('email')}
                />

                <div className="relative">
                    <Input
                        label={t('auth.password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        leftIcon={<Lock size={18} />}
                        error={errors.password?.message}
                        {...register('password')}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-9 text-gray-400 hover:text-gray-600"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => {
                                setRememberMe(e.target.checked);
                                if (typeof window !== 'undefined') {
                                    if (e.target.checked) {
                                        localStorage.setItem('rememberMe', 'true');
                                    } else {
                                        localStorage.removeItem('rememberMe');
                                        localStorage.removeItem('savedEmail');
                                    }
                                }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('auth.remember')}</span>
                    </label>
                    <Link
                        href="/forgot-password"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        {t('auth.forgot')}
                    </Link>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    loading={isLoading}
                    rightIcon={<ArrowRight size={18} className={language === 'ar' ? 'rotate-180' : ''} />}
                >
                    {t('auth.signin')}
                </Button>
            </form>


            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                {t('auth.noaccount')}{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                    {t('auth.createfree')}
                </Link>
            </p>
        </div>
    );
}

