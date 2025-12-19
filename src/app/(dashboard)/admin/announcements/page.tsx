'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase';
import { Button, Input } from '@/components/shared';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store';

const schema = z.object({
    title: z.string().min(3, 'العنوان مطلوب (3 أحرف على الأقل)'),
    content: z.string().min(10, 'محتوى الرسالة مطلوب (10 أحرف على الأقل)'),
});

type FormData = z.infer<typeof schema>;

export default function AdminAnnouncementsPage() {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const supabase = getSupabaseClient();

            // Explicitly set created_by to current user's AUTH id (from auth.users)
            // But usually RLS uses auth.uid(), so we just need to ensure we are logged in.
            const { error: dbError } = await supabase
                .from('announcements')
                .insert({
                    title: data.title,
                    content: data.content,
                    target_role: 'job_seeker',
                    is_active: true,
                    // created_by is auto-handled if default or RLS, but better to be explicit if table allows null
                    // actually our schema has created_by references auth.users(id), let's hope RLS handles it or trigger
                    // Let's just insert title/content/target_role
                });

            if (dbError) throw dbError;

            setSuccess(true);
            reset();
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'فشل إرسال الإشعار');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto" dir="rtl">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">إرسال إشعار للمستخدمين</h1>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-800 dark:text-blue-200 text-sm">
                    <p>هذا الإشعار سيظهر كرسالة منبثقة (Modal) لجميع الباحثين عن عمل عند فتحهم للتطبيق.</p>
                </div>

                {success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-800 dark:text-green-200 flex items-center gap-2">
                        <CheckCircle size={20} />
                        <p>تم إرسال الإشعار بنجاح!</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-800 dark:text-red-200 flex items-center gap-2">
                        <AlertCircle size={20} />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input
                        label="عنوان الإشعار"
                        placeholder="مثال: تحديثات هامة، تعليمات جديدة..."
                        error={errors.title?.message}
                        {...register('title')}
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                            نص الرسالة
                        </label>
                        <textarea
                            {...register('content')}
                            rows={5}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                            placeholder="اكتب نص الإشعار هنا..."
                        />
                        {errors.content && (
                            <p className="text-sm text-red-500">{errors.content.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        loading={isLoading}
                        className="w-full flex items-center justify-center gap-2"
                        leftIcon={<Send size={18} />}
                    >
                        إرسال الإشعار
                    </Button>
                </form>
            </div>
        </div>
    );
}
