'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore, useAuthStore } from '@/store';
import { Bell } from 'lucide-react';
import { Button } from '@/components/shared';

export default function PushNotificationManager() {
    const { user } = useAuthStore();
    const { enablePushNotifications } = useNotificationStore();
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [showPrompt, setShowPrompt] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
            // Show prompt if user is logged in and permission is not granted
            if (user && Notification.permission !== 'granted') {
                setShowPrompt(true);
            }
        }
    }, [user]);

    const handleEnable = async () => {
        if (!user) return;
        setIsLoading(true);
        setErrorMsg('');

        const success = await enablePushNotifications(user.id);

        if (success) {
            setPermission('granted');
            setShowPrompt(false);
        } else {
            // Check if permission was denied during the process
            if (Notification.permission === 'denied') {
                setPermission('denied');
                setErrorMsg('تم حظر الإشعارات. يرجى تفعيلها من إعدادات المتصفح.');
            } else {
                setErrorMsg('فشل التفعيل. يرجى المحاولة مرة أخرى.');
            }
        }
        setIsLoading(false);
    };

    if (!showPrompt || permission === 'granted') return null;

    const isDenied = permission === 'denied';

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 max-w-sm bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5">
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isDenied ? 'bg-red-100 text-red-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
                    <Bell size={20} />
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                        {isDenied ? 'الإشعارات محظورة' : 'تفعيل الإشعارات'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {isDenied
                            ? 'لقد قمت بحظر الإشعارات سابقاً. لتلقي التنبيهات، يرجى السماح بالإشعارات من إعدادات المتصفح (بجوار شريط العنوان).'
                            : 'احصل على تنبيهات فورية عند وصول وظائف جديدة أو رسائل، حتى والتطبيق مغلق.'
                        }
                    </p>
                </div>
            </div>
            {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
            <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowPrompt(false)}>لاحقاً</Button>
                {!isDenied && (
                    <Button size="sm" onClick={handleEnable} disabled={isLoading}>
                        {isLoading ? 'جاري التفعيل...' : 'تفعيل'}
                    </Button>
                )}
            </div>
        </div>
    );
}
