'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/shared';
import { Mail, ArrowRight, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const { t, language } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordInput) => {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = getSupabaseClient();
            const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dentalhire.vercel.app';
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${origin}/auth/callback?next=/update-password`,
            });

            if (error) throw error;
            setIsSuccess(true);
        } catch (err: any) {
            console.error('Reset password error:', err);
            // Handle specific Supabase errors if needed
            if (err.message.includes('rate limit')) {
                setError(language === 'ar' ? 'يرجى الانتظار قليلاً قبل المحاولة مرة أخرى' : 'Please wait a moment before trying again');
                // Show the actual error message for better debugging
                const rawError = err.message || 'Unknown error';
                setError(rawError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Logo / Header */}
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                        DH
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                        Dental<span className="text-blue-600">Hire</span>
                    </span>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
                    {language === 'ar'
                        ? 'لا تقلق! أدخل بريدك الإلكتروني وسنرسل لك تعليمات استعادة كلمة المرور.'
                        : 'Don\'t worry! Enter your email and we\'ll send you instructions to reset your password.'}
                </p>
            </div>

            {isSuccess ? (
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {language === 'ar' ? 'تم إرسال الرابط' : 'Link Sent'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                        {language === 'ar'
                            ? 'تحقق من بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور.'
                            : 'Check your email for the password reset link.'}
                    </p>
                    <Link href="/login">
                        <Button className="w-full" variant="outline">
                            {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                        </Button>
                    </Link>
                </div>
            ) : (
                <>
                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in slide-in-from-top-2">
                            <AlertCircle size={20} className="shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input
                            label={language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                            type="email"
                            placeholder="you@example.com"
                            leftIcon={<Mail size={18} />}
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            loading={isLoading}
                            rightIcon={<ArrowRight size={18} className={language === 'ar' ? 'rotate-180' : ''} />}
                        >
                            {language === 'ar' ? 'إرسال رابط استعادة كلمة المرور' : 'Send Reset Link'}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft size={16} className={language === 'ar' ? 'rotate-180' : ''} />
                            {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}
