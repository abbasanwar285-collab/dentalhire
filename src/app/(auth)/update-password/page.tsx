'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/shared';
import { Lock, ArrowRight, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSupabaseClient } from '@/lib/supabase';

const updatePasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordPage() {
    const router = useRouter();
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UpdatePasswordInput>({
        resolver: zodResolver(updatePasswordSchema),
    });

    // Check if we have a valid session from the reset link
    useEffect(() => {
        const checkSession = async () => {
            const supabase = getSupabaseClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // No session means the user didn't come from a valid reset link
                setError(language === 'ar'
                    ? 'الرابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.'
                    : 'Invalid or expired link. Please request a new password reset link.');
            }
        };

        checkSession();
    }, [language]);

    const onSubmit = async (data: UpdatePasswordInput) => {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = getSupabaseClient();

            const { error: updateError } = await supabase.auth.updateUser({
                password: data.password,
            });

            if (updateError) {
                let errorMessage = updateError.message;
                if (updateError.message.includes('same as')) {
                    errorMessage = language === 'ar'
                        ? 'كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة'
                        : 'New password must be different from the old one';
                }
                setError(errorMessage);
                setIsLoading(false);
                return;
            }

            setIsSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);

        } catch (err) {
            setError(language === 'ar'
                ? 'حدث خطأ. يرجى المحاولة مرة أخرى.'
                : 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {language === 'ar' ? 'تم تغيير كلمة المرور بنجاح!' : 'Password Updated Successfully!'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                    {language === 'ar'
                        ? 'سيتم توجيهك لصفحة تسجيل الدخول...'
                        : 'Redirecting you to the login page...'}
                </p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Set New Password'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    {language === 'ar'
                        ? 'أدخل كلمة المرور الجديدة أدناه.'
                        : 'Enter your new password below.'}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="relative">
                    <Input
                        label={language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        leftIcon={<Lock size={18} />}
                        error={errors.password?.message}
                        {...register('password')}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div className="relative">
                    <Input
                        label={language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        leftIcon={<Lock size={18} />}
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    loading={isLoading}
                    disabled={!!error && error.includes('expired')}
                    rightIcon={language === 'ar' ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                >
                    {language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
                </Button>
            </form>
        </div>
    );
}
