'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/shared';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

const headerTitle = {
    en: 'Set New Password',
    ar: 'تعيين كلمة مرور جديدة'
};

const headerSubtitle = {
    en: 'Please enter your new password below.',
    ar: 'الرجاء إدخال كلمة المرور الجديدة أدناه.'
};

const updatePasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
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
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

            // Check if we have a session first
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error(language === 'ar' ? 'انتهت صلاحية الجلسة، يرجى المحاولة مرة أخرى' : 'Session expired, please start over');
            }

            const { error } = await supabase.auth.updateUser({
                password: data.password
            });

            if (error) throw error;

            // Redirect to dashboard or login
            router.push('/login?message=password-updated');
        } catch (err: any) {
            console.error('Update password error:', err);
            setError(err.message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'ar' ? headerTitle.ar : headerTitle.en}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    {language === 'ar' ? headerSubtitle.ar : headerSubtitle.en}
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
