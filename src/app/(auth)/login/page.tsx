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
            {error && (
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
                                {getErrorMessage(error)}
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

            {/* Divider */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">
                        {t('auth.or')}
                    </span>
                </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => login('google' as any, '' as any).catch(() => useAuthStore.getState().loginWithOAuth('google'))}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Google</span>
                </button>
                <button
                    type="button"
                    onClick={() => login('linkedin' as any, '' as any).catch(() => useAuthStore.getState().loginWithOAuth('linkedin'))}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn</span>
                </button>
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                {t('auth.noaccount')}{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                    {t('auth.createfree')}
                </Link>
            </p>
        </div>
    );
}

