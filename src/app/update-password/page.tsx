'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/shared';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

const updatePasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordPage() {
    const { t, language } = useLanguage();
    const router = useRouter();
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

    const onSubmit = async (data: UpdatePasswordInput) => {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = getSupabaseClient();

            // 1. Verify we have a session first
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error(language === 'ar' ? 'انتهت صلاحية الجلسة. يرجى طلب رابط جديد.' : 'Session expired. Please request a new link.');
            }

            // 2. Attempt update with timeout race
            const updatePromise = supabase.auth.updateUser({
                password: data.password
            });

            // Timeout after 10 seconds to prevent infinite loading
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 10000)
            );

            const { error } = await Promise.race([updatePromise, timeoutPromise]) as any;

            if (error) throw error;

            setIsSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);

        } catch (err: any) {
            console.error('Update password error:', err);
            let msg = err.message || 'Unknown error';
            if (msg === 'Request timed out') {
                msg = language === 'ar' ? 'استغرق الطلب وقتاً طويلاً. تحقق من الاتصال.' : 'Request timed out. Check connection.';
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'ar' ? 'تعيين كلمة المرور الجديدة' : 'Set New Password'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    {language === 'ar'
                        ? 'الرجاء إدخال كلمة المرور الجديدة أدناه.'
                        : 'Please enter your new password below.'}
                </p>
            </div>

            {isSuccess ? (
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {language === 'ar' ? 'تم تحديث كلمة المرور' : 'Password Updated'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {language === 'ar'
                            ? 'جاري تحويلك إلى صفحة تسجيل الدخول...'
                            : 'Redirecting to login page...'}
                    </p>
                </div>
            ) : (
                <>
                    {error && (
                        <div className="mb-6 p-4 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in slide-in-from-top-2">
                            <AlertCircle size={20} className="shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
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
                                className="absolute end-3 top-9 text-gray-400 hover:text-gray-600"
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
                                className="absolute end-3 top-9 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            loading={isLoading}
                        >
                            {language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
                        </Button>
                    </form>
                </>
            )}
        </div>
    );
}
