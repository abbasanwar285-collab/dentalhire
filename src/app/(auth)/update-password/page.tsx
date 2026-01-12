'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/shared';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

const updatePasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordPage() {
    const { language } = useLanguage();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [hasValidSession, setHasValidSession] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UpdatePasswordInput>({
        resolver: zodResolver(updatePasswordSchema),
    });

    // Check for valid session on mount
    // Supabase will automatically pick up the session from URL hash
    useEffect(() => {
        const checkSession = async () => {
            try {
                const supabase = getSupabaseClient();

                // Give Supabase a moment to process the URL hash
                await new Promise(resolve => setTimeout(resolve, 500));

                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Session check error:', error);
                    setError(language === 'ar'
                        ? 'انتهت صلاحية الرابط. يرجى طلب رابط جديد.'
                        : 'Link expired. Please request a new one.');
                    setHasValidSession(false);
                } else if (session) {
                    setHasValidSession(true);
                } else {
                    setError(language === 'ar'
                        ? 'الرابط غير صالح. يرجى طلب رابط جديد من صفحة نسيت كلمة المرور.'
                        : 'Invalid link. Please request a new one from the forgot password page.');
                    setHasValidSession(false);
                }
            } catch (err) {
                console.error('Session check failed:', err);
                setError(language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
            } finally {
                setIsCheckingSession(false);
            }
        };

        checkSession();
    }, [language]);

    const onSubmit = async (data: UpdatePasswordInput) => {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = getSupabaseClient();

            const { error } = await supabase.auth.updateUser({
                password: data.password
            });

            if (error) throw error;

            setIsSuccess(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login?message=password-updated');
            }, 2000);
        } catch (err: any) {
            console.error('Update password error:', err);
            setError(err.message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state while checking session
    if (isCheckingSession) {
        return (
            <div className="animate-fade-in text-center py-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                    {language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}
                </p>
            </div>
        );
    }

    // Success state
    if (isSuccess) {
        return (
            <div className="animate-fade-in text-center p-6 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {language === 'ar' ? 'تم تحديث كلمة المرور' : 'Password Updated'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {language === 'ar' ? 'جاري توجيهك لتسجيل الدخول...' : 'Redirecting to login...'}
                </p>
            </div>
        );
    }

    // Error state (no valid session)
    if (!hasValidSession) {
        return (
            <div className="animate-fade-in text-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 mb-6">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {language === 'ar' ? 'رابط غير صالح' : 'Invalid Link'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                        {error}
                    </p>
                </div>
                <Link href="/forgot-password">
                    <Button className="w-full">
                        {language === 'ar' ? 'طلب رابط جديد' : 'Request New Link'}
                    </Button>
                </Link>
            </div>
        );
    }

    // Main form
    return (
        <div className="animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Set New Password'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    {language === 'ar' ? 'أدخل كلمة المرور الجديدة أدناه.' : 'Enter your new password below.'}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                    label={language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                    type={showPassword ? 'text' : 'password'}
                    leftIcon={<Lock size={18} />}
                    rightIcon={
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    }
                    error={errors.password?.message}
                    {...register('password')}
                />

                <Input
                    label={language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                    type={showPassword ? 'text' : 'password'}
                    leftIcon={<Lock size={18} />}
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                />

                <Button
                    type="submit"
                    className="w-full"
                    loading={isLoading}
                >
                    {language === 'ar' ? 'تعيين كلمة المرور' : 'Set New Password'}
                </Button>
            </form>
        </div>
    );
}
