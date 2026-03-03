'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/shared';
import { Send, CheckCircle, AlertCircle, Users, Mail } from 'lucide-react';
import { sendAnnouncement } from '@/app/actions/admin';
import { cn } from '@/lib/utils';

const schema = z.object({
    title: z.string().min(3, 'العنوان مطلوب (3 أحرف على الأقل)'),
    content: z.string().min(10, 'محتوى الرسالة مطلوب (10 أحرف على الأقل)'),
    targetRole: z.enum(['job_seeker', 'clinic', 'all']),
    sendEmail: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function AdminAnnouncementsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: '',
            content: '',
            targetRole: 'job_seeker',
            sendEmail: false
        }
    });

    const targetRole = watch('targetRole');
    const sendEmail = watch('sendEmail');

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await sendAnnouncement({
                title: data.title,
                content: data.content,
                targetRole: data.targetRole as 'job_seeker' | 'clinic' | 'all',
                sendEmail: data.sendEmail
            });

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
                    <p>هذا الإشعار سيظهر كرسالة منبثقة (Modal) عند فتح التطبيق، ويمكن إرساله أيضاً كبريد إلكتروني.</p>
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
                    {/* Target Audience Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                            لمن تريد إرسال الإشعار؟
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setValue('targetRole', 'job_seeker')}
                                className={cn(
                                    "p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                                    targetRole === 'job_seeker'
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600"
                                )}
                            >
                                <Users size={24} />
                                <span className="font-medium">الباحثين عن عمل</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setValue('targetRole', 'clinic')}
                                className={cn(
                                    "p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                                    targetRole === 'clinic'
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600"
                                )}
                            >
                                <Users size={24} />
                                <span className="font-medium">أصحاب العمل (العيادات)</span>
                            </button>
                        </div>
                    </div>

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

                    {/* Email Option */}
                    <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                id="sendEmail"
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-blue-500 checked:bg-blue-500"
                                {...register('sendEmail')}
                            />
                            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3.5 w-3.5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    stroke="currentColor"
                                    strokeWidth="1"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                            </div>
                        </div>
                        <label htmlFor="sendEmail" className="flex items-center gap-2 cursor-pointer select-none">
                            <Mail size={18} className="text-gray-500" />
                            <span className="font-medium text-gray-700 dark:text-gray-200">
                                إرسال نسخة عبر البريد الإلكتروني
                            </span>
                        </label>
                    </div>

                    <Button
                        type="submit"
                        loading={isLoading}
                        className="w-full flex items-center justify-center gap-2"
                        leftIcon={<Send size={18} />}
                    >
                        إرسال الإشعار {sendEmail && '(والإيميل)'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
