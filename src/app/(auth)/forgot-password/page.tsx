'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store';
import { Button, Input } from '@/components/shared';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const { resetPassword, isLoading, error } = useAuthStore();
    const { t, language } = useLanguage();
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordInput) => {
        const success = await resetPassword(data.email);
        if (success) {
            setIsSuccess(true);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {language === 'ar' ? 'تم إرسال الرابط' : 'Check your email'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                    {language === 'ar'
                        ? 'لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
                        : 'We have sent a password reset link to your email address.'}
                </p>
                <Link href="/login">
                    <Button variant="outline" className="w-full">
                        {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    {language === 'ar'
                        ? 'لا تقلق، سنرسل لك تعليمات إعادة التعيين.'
                        : 'No worries, we\'ll send you reset instructions.'}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                    label={t('auth.email')}
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
                    rightIcon={language === 'ar' ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                >
                    {language === 'ar' ? 'إرسال رابط إعادة التعيين' : 'Send Reset Link'}
                </Button>

                <div className="text-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        {leadingIcon(language)}
                        <span>{language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}</span>
                    </Link>
                </div>
            </form>
        </div>
    );
}

function leadingIcon(language: string) {
    return language === 'ar' ? (
        <ArrowRight size={16} className="ml-2" />
    ) : (
        <ArrowLeft size={16} className="mr-2" />
    );
}
